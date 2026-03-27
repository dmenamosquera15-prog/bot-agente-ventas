import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  downloadMediaMessage,
  S_WHATSAPP_NET,
  Browsers,
  type WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import {
  mkdirSync,
  existsSync,
  writeFileSync,
  unlinkSync,
  createReadStream,
  rmSync,
} from "fs";
import { join } from "path";
import { handleMessage } from "../core/router.js";
import { logger } from "../lib/logger.js";
import { SafeReconnectManager } from "./safeReconnectManager.js";
import { SafeBaileysSender } from "./safeBaileysSender.js";
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
    try {
      if (existsSync(tmpFile)) unlinkSync(tmpFile);
    } catch {}
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
  pairingCode: string | null;
}

let sock: WASocket | null = null;
let qrCode: string | null = null;
let pairingCode: string | null = null;
let isConnected = false;
let isConnecting = false;
let connectedPhone: string | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let healthCheckTimer: NodeJS.Timeout | null = null;
let lastErrorTime = 0;
let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 3;
const ERROR_RESET_WINDOW = 30000; // 30 seconds

function startHealthCheck() {
  if (healthCheckTimer) clearInterval(healthCheckTimer);
  healthCheckTimer = setInterval(async () => {
    if (isConnected && sock) {
      try {
        // Try to fetch a simple thing to verify the socket is actually alive
        // If it throws or times out, it's a zombie connection
        await sock.query({
          tag: "iq",
          attrs: { to: S_WHATSAPP_NET, type: "get", xmlns: "w:p", id: "ping" },
        });
      } catch (err) {
        logger.warn("WhatsApp heartbeat failed, reconnecting...");
        isConnected = false;
        connect();
      }
    } else if (isConnected && !sock) {
      logger.warn("WhatsApp socket missing, reconnecting...");
      isConnected = false;
      connect();
    }
  }, 60000); // Check every minute
}

export function getStatus(): WhatsAppStatus {
  return {
    connected: isConnected,
    qr: qrCode,
    phone: connectedPhone,
    connecting: isConnecting,
    pairingCode,
  };
}

export async function connectWithPhone(
  phoneNumber: string,
): Promise<string | null> {
  if (!sock || isConnected) return null;
  try {
    pairingCode = await sock.requestPairingCode(
      phoneNumber.replace(/[^0-9]/g, ""),
    );
    logger.info({ pairingCode, phoneNumber }, "Pairing code generated");
    return pairingCode;
  } catch (err) {
    logger.error({ err }, "Failed to generate pairing code");
    return null;
  }
}

let currentSocketId = 0;

export async function connect(phoneForPairing?: string): Promise<void> {
  const thisSocketId = ++currentSocketId;

  if (isConnected) {
    logger.info("WhatsApp already connected, skipping...");
    return;
  }

  if (phoneForPairing && sock && !isConnected) {
    logger.info("Forcing reconnection for pairing code...");
    try {
      sock.end(undefined);
    } catch {}
    sock = null;
  }

  if (sock) {
    try {
      sock.end(undefined);
    } catch {}
    sock = null;
  }

  if (!existsSync(AUTH_DIR)) mkdirSync(AUTH_DIR, { recursive: true });

  isConnecting = true;
  qrCode = null;
  pairingCode = null;

  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger as never),
      },
      printQRInTerminal: true,
      logger: logger as never,
      browser: ["Chrome", "Chrome", "115.0.0"],
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      qrTimeout: 60000,
    });

    if (thisSocketId !== currentSocketId) {
      logger.info("Socket superseded, ignoring events");
      return;
    }

    if (phoneForPairing && !state.creds.registered) {
      setTimeout(async () => {
        try {
          if (sock) {
            pairingCode = await sock.requestPairingCode(
              phoneForPairing.replace(/[^0-9]/g, ""),
            );
            logger.info(
              { pairingCode, phoneForPairing },
              "Pairing code generated automatically",
            );
          }
        } catch (err) {
          logger.error({ err }, "Failed to generate pairing code in connect()");
        }
      }, 3000);
    }

    sock.ev.on("connection.update", async (update) => {
      if (thisSocketId !== currentSocketId) {
        logger.info("Ignoring event from old socket");
        return;
      }

      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        qrCode = qr;
        pairingCode = null;
        isConnected = false;
        logger.info("WhatsApp QR generated");
      }

      if (connection === "open") {
        isConnected = true;
        isConnecting = false;
        qrCode = null;
        pairingCode = null;
        connectedPhone = sock?.user?.id?.split(":")[0] || null;
        logger.info({ phone: connectedPhone }, "WhatsApp connected");
        startHealthCheck();
      }

      if (connection === "close") {
        isConnected = false;
        connectedPhone = null;
        qrCode = null;

        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const errorMessage = (lastDisconnect?.error as any)?.message || "";

        const isLoggedOut = statusCode === DisconnectReason.loggedOut;
        const isBadSession = statusCode === DisconnectReason.badSession;
        const isRestartRequired =
          statusCode === DisconnectReason.restartRequired;
        const isTimedOut =
          statusCode === DisconnectReason.timedOut ||
          statusCode === DisconnectReason.connectionLost;
        const isConflict =
          errorMessage.includes("conflict") ||
          errorMessage.includes("Stream Errored");

        logger.warn(
          {
            statusCode,
            isLoggedOut,
            isBadSession,
            isRestartRequired,
            isConflict,
            errorMessage,
          },
          "WhatsApp disconnected",
        );

        if (isLoggedOut || isBadSession) {
          isConnecting = false;
          logger.info(
            "Logged out or bad session, cleaning auth and requesting new QR...",
          );
          try {
            if (existsSync(AUTH_DIR)) {
              rmSync(AUTH_DIR, { recursive: true, force: true });
              mkdirSync(AUTH_DIR, { recursive: true });
            }
          } catch (e) {}
          await connect();
        } else if (isConflict) {
          const now = Date.now();
          if (now - lastErrorTime < ERROR_RESET_WINDOW) {
            consecutiveErrors++;
          } else {
            consecutiveErrors = 1;
          }
          lastErrorTime = now;

          logger.warn(
            { consecutiveErrors, errorMessage },
            "WhatsApp conflict error, attempting recovery",
          );

          if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            logger.error("Too many consecutive conflicts, forcing full reset");
            isConnecting = false;
            consecutiveErrors = 0;
            SafeReconnectManager.resetState("default");
            setTimeout(() => {
              forceReset().catch((err) =>
                logger.error({ err }, "Force reset failed"),
              );
            }, 3000);
          } else {
            SafeReconnectManager.recordDisconnect();
            if (SafeReconnectManager.canReconnect()) {
              SafeReconnectManager.startReconnect("default", async () => {
                await connect();
              });
            }
          }
        } else if (isRestartRequired || isTimedOut) {
          SafeReconnectManager.recordDisconnect();
          if (SafeReconnectManager.canReconnect()) {
            SafeReconnectManager.startReconnect("default", async () => {
              await connect();
            });
          } else {
            logger.warn(
              "Maximum reconnection attempts reached. Please Hard Reset if needed.",
            );
            isConnecting = false;
          }
        } else {
          SafeReconnectManager.recordDisconnect();
          if (SafeReconnectManager.canReconnect()) {
            SafeReconnectManager.startReconnect("default", async () => {
              await connect();
            });
          } else {
            logger.warn(
              "Maximum reconnection attempts reached. Please Hard Reset if needed.",
            );
            isConnecting = false;
          }
        }
      }
    });

    sock.ev.on("creds.update", async (data) => {
      try {
        await saveCreds();
      } catch (err) {
        logger.error(
          { err },
          "Failed to save credentials, will retry on next update",
        );
        // Don't throw, let it continue - credentials will be saved on next update
      }
    });

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
            const buffer = (await downloadMediaMessage(
              msg,
              "buffer",
              {},
              {
                logger: logger as never,
                reuploadRequest: sock!.updateMediaMessage,
              },
            )) as Buffer;
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
          const result = await handleMessage(
            phone,
            text,
            msg.pushName || undefined,
          );
          if (result.response && sock) {
            const isAudioInput = msg.message?.audioMessage;
            if (isAudioInput) {
              const voiceBuffer = await generateVoice(result.response);
              if (voiceBuffer) {
                await sock.sendMessage(jid, {
                  audio: voiceBuffer,
                  mimetype: "audio/mp4",
                  ptt: true,
                });
                logger.info({ phone }, "Voice response sent");
              } else {
                await sock.sendMessage(jid, { text: result.response });
              }
            } else {
              await SafeBaileysSender.sendText(
                sock,
                "default",
                jid,
                result.response,
              );
            }
            logger.info(
              { phone, agent: result.agent, intent: result.intent },
              "Response sent",
            );
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
    try {
      await sock.logout();
    } catch {
      /* ignore */
    }
    sock = null;
  }
  isConnected = false;
  isConnecting = false;
  qrCode = null;
  connectedPhone = null;
}

export async function forceReset(): Promise<void> {
  logger.warn("Forcing WhatsApp reset and clearing auth cache...");
  await disconnect();
  try {
    if (existsSync(AUTH_DIR)) {
      rmSync(AUTH_DIR, { recursive: true, force: true });
      mkdirSync(AUTH_DIR, { recursive: true });
    }
    // Also check root auth dir
    const rootAuth = join(process.cwd(), "whatsapp_auth");
    if (existsSync(rootAuth)) {
      rmSync(rootAuth, { recursive: true, force: true });
    }
  } catch (err) {
    logger.error({ err }, "Failed to clear auth directory during reset");
  }
  await connect();
}

export async function sendMessage(
  phone: string,
  text: string,
): Promise<boolean> {
  if (!sock || !isConnected) return false;
  const jid = phone.includes("@") ? phone : `${phone}@s.whatsapp.net`;
  return await SafeBaileysSender.sendText(sock, "default", jid, text);
}

// Auto-connect on startup
connect().catch((err) =>
  logger.error({ err }, "Initial WhatsApp connection failed"),
);
