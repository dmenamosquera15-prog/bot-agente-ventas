import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  downloadMediaMessage,
  type WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import { mkdirSync, existsSync, writeFileSync, unlinkSync, createReadStream, rmSync } from "fs";
import { join } from "path";
import { handleMessage } from "../core/router.js";
import { logger } from "../lib/logger.js";
import OpenAI from "openai";
import { db } from "@workspace/db";
import { botConfigTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

async function transcribeAudio(buffer: Buffer): Promise<string> {
  const openai = new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  });

  const tmpFile = join(process.cwd(), `tmp_audio_${Date.now()}.ogg`);
  try {
    writeFileSync(tmpFile, buffer);
    const transcription = await openai.audio.transcriptions.create({
      file: createReadStream(tmpFile),
      model: "whisper-1",
    });
    return transcription.text;
  } catch (err) {
    logger.error({ err }, "Transcription error");
    return "";
  } finally {
    try { if (existsSync(tmpFile)) unlinkSync(tmpFile); } catch {}
  }
}

async function generateVoice(text: string): Promise<Buffer | null> {
  const openai = new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  });
  try {
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text,
    });
    return Buffer.from(await mp3.arrayBuffer());
  } catch (err) {
    logger.error({ err }, "TTS error");
    return null;
  }
}

const AUTH_DIR = join(process.cwd(), "whatsapp_auth");

export interface WhatsAppStatus {
  connected: boolean;
  qr: string | null;
  phone: string | null;
  connecting: boolean;
}

let sock: WASocket | null = null;
let qrCode: string | null = null;
let isConnected = false;
let isConnecting = false;
let connectedPhone: string | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let healthCheckTimer: NodeJS.Timeout | null = null;

function startHealthCheck() {
  if (healthCheckTimer) clearInterval(healthCheckTimer);
  healthCheckTimer = setInterval(() => {
    if (isConnected && (!sock || !sock.user)) {
      logger.warn("WhatsApp connection lost in health check, reconnecting...");
      isConnected = false;
      connect();
    }
  }, 30000);
}

export function getStatus(): WhatsAppStatus {
  return {
    connected: isConnected,
    qr: qrCode,
    phone: connectedPhone,
    connecting: isConnecting,
  };
}

export async function connect(): Promise<void> {
  if (isConnected || isConnecting) {
    logger.info("WhatsApp already connected or connecting, skipping...");
    return;
  }

  if (!existsSync(AUTH_DIR)) mkdirSync(AUTH_DIR, { recursive: true });

  isConnecting = true;
  qrCode = null;

  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger as never),
      },
      printQRInTerminal: false,
      logger: logger as never,
      browser: ["Bot Inteligente", "Chrome", "1.0.0"],
      generateHighQualityLinkPreview: false,
      syncFullHistory: false,
    });

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        qrCode = qr;
        isConnected = false;
        logger.info("WhatsApp QR generated");
      }

      if (connection === "open") {
        isConnected = true;
        isConnecting = false;
        qrCode = null;
        connectedPhone = sock?.user?.id?.split(":")[0] || null;
        logger.info({ phone: connectedPhone }, "WhatsApp connected");
        startHealthCheck();
      }

      if (connection === "close") {
        isConnected = false;
        connectedPhone = null;
        qrCode = null;
        
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        logger.warn({ shouldReconnect, statusCode }, "WhatsApp disconnected");

        if (shouldReconnect) {
          if (reconnectTimer) clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(() => connect(), 7000);
        } else {
          isConnecting = false;
          // Trigger a new connection attempt after a short delay to generate a new QR automatically
          logger.info("Logged out detected, requesting new QR in 3s...");
          setTimeout(() => {
            // Clear credentials before trying to get a new QR on logout
            try { 
              if (existsSync(AUTH_DIR)) {
                rmSync(AUTH_DIR, { recursive: true, force: true });
                mkdirSync(AUTH_DIR, { recursive: true });
              }
            } catch(e) {}
            connect(); 
          }, 3000);
        }
      }
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return;
      for (const msg of messages) {
        if (msg.key.fromMe) continue;
        const jid = msg.key.remoteJid;
        if (!jid || jid.endsWith("@g.us")) continue; // skip group messages

        const phone = jid.split("@")[0];
        const botConfig = await db.query.botConfigTable.findFirst();
        let text =
          msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text ||
          msg.message?.imageMessage?.caption ||
          "";

        // Handle Audio/Voice Notes
        if (!text && (msg.message?.audioMessage || msg.message?.videoMessage)) {
          try {
            const buffer = await downloadMediaMessage(
              msg, 
              "buffer", 
              {}, 
              { 
                logger: logger as never,
                reuploadRequest: sock!.updateMediaMessage 
              }
            ) as Buffer;
            if (buffer) {
              const transcription = await transcribeAudio(buffer);
              if (transcription) {
                text = transcription;
                logger.info({ phone, text }, "WhatsApp audio transcribed");
              }
            }
          } catch (err) {
            logger.error({ err, phone }, "Failed to process audio message");
          }
        }

        if (!text || !text.trim()) continue;

        logger.info({ phone, text }, "WhatsApp message received");

          try {
            const result = await handleMessage(phone, text, msg.pushName || undefined);
            if (result.response && sock) {
              const isAudioInput = msg.message?.audioMessage;
              if (isAudioInput) { 
                const voiceBuffer = await generateVoice(result.response);
                if (voiceBuffer) {
                  await sock.sendMessage(jid, { audio: voiceBuffer, mimetype: "audio/mp4", ptt: true });
                  logger.info({ phone }, "Voice response sent");
                } else {
                  await sock.sendMessage(jid, { text: result.response });
                }
              } else {
                await sock.sendMessage(jid, { text: result.response });
              }
              logger.info({ phone, agent: result.agent, intent: result.intent }, "Response sent");
            }
          } catch (err) {
            logger.error({ err, phone }, "Error processing WhatsApp message");
          }
      }
    });
  } catch (err) {
    logger.error({ err }, "Failed to connect WhatsApp");
    isConnecting = false;
  }
}

export async function disconnect(): Promise<void> {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (healthCheckTimer) clearInterval(healthCheckTimer);
  if (sock) {
    try { await sock.logout(); } catch { /* ignore */ }
    sock = null;
  }
  isConnected = false;
  isConnecting = false;
  qrCode = null;
  connectedPhone = null;
}

export async function sendMessage(phone: string, text: string): Promise<boolean> {
  if (!sock || !isConnected) return false;
  try {
    const jid = phone.includes("@") ? phone : `${phone}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text });
    return true;
  } catch (err) {
    logger.error({ err, phone }, "Failed to send message");
    return false;
  }
}
