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
  readFileSync,
} from "fs";
import { join } from "path";
import { handleMessage } from "../core/router.js";
import { logger } from "../lib/logger.js";
import { SafeReconnectManager } from "./safeReconnectManager.js";
import { SafeBaileysSender } from "./safeBaileysSender.js";
import {
  shouldProcessWhatsAppMessage,
  isSpamMessage,
} from "../middlewares/rateLimit.js";
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
let isConnectingSocket = false;

let qrGeneratedTime = 0;
const QR_EXPIRE_MS = 180000; // 3 minutos para escanear
let wasConnectedOnce = false;
let reconnectWithFreshAuth = false;

export async function connect(phoneForPairing?: string): Promise<void> {
  const thisSocketId = ++currentSocketId;

  // Limpiar socket anterior si existe
  if (sock) {
    try {
      sock.ev.removeAllListeners("connection.update");
      sock.ev.removeAllListeners("creds.update");
      sock.ev.removeAllListeners("messages.upsert");
      await sock.end(undefined);
    } catch (err) {
      logger.warn({ err }, "Error closing previous socket");
    }
    sock = null;
  }

  // Limpiar auth si hay conflicto o si reconnectWithFreshAuth está activo
  const authExists = existsSync(AUTH_DIR);
  if (authExists) {
    try {
      const credsPath = join(AUTH_DIR, "creds.json");
      if (existsSync(credsPath)) {
        const credsContent = JSON.parse(readFileSync(credsPath, "utf-8"));
        if (
          !credsContent.me ||
          !credsContent.account ||
          reconnectWithFreshAuth
        ) {
          logger.warn("Creds corruptos o reinicio forzado, limpiando...");
          rmSync(AUTH_DIR, { recursive: true, force: true });
          reconnectWithFreshAuth = false;
        }
      }
    } catch (err) {
      logger.warn({ err }, "Error verificando creds, limpiando auth");
      rmSync(AUTH_DIR, { recursive: true, force: true });
    }
  }

  if (!existsSync(AUTH_DIR)) mkdirSync(AUTH_DIR, { recursive: true });

  isConnecting = true;
  isConnectingSocket = true;
  qrCode = null;
  pairingCode = null;
  qrGeneratedTime = 0;

  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    logger.info(
      { registered: state.creds.registered, hasMe: !!state.creds.me },
      "Auth state loaded",
    );

    // Usar browser específico para evitar rechazo
    const browserConfig = Browsers.ubuntu("Chrome");

    sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger as never),
      },
      logger: logger as never,
      browser: browserConfig,
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      qrTimeout: 180000, // 3 minutos para escanear
      printQRInTerminal: false,
      connectTimeoutMs: 60000,
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
        qrGeneratedTime = Date.now();
        logger.info("WhatsApp QR generated - esperando escaneo...");
      }

      // Timeout: si pasan 90 segundos sin conectar, generar nuevo QR
      if (
        qrCode &&
        qrGeneratedTime > 0 &&
        Date.now() - qrGeneratedTime > QR_EXPIRE_MS
      ) {
        logger.warn("QR expirado sin conexión, generando nuevo QR...");
        qrGeneratedTime = 0;
        qrCode = null;
        // Forzar reconexión
        setTimeout(() => {
          if (thisSocketId === currentSocketId) {
            connect().catch(() => {});
          }
        }, 1000);
      }

      if (connection === "open") {
        isConnected = true;
        isConnecting = false;
        isConnectingSocket = false;
        wasConnectedOnce = true; // Marcar que ya se conectó exitosamente
        qrCode = null;
        pairingCode = null;
        qrGeneratedTime = 0;
        connectedPhone = sock?.user?.id?.split(":")[0] || null;
        logger.info(
          { phone: connectedPhone },
          "WhatsApp connected - ESCANEADO EXITOSO",
        );
        logger.info("=== SESSION GUARDADA CORRECTAMENTE ===");
        startHealthCheck();
      }

      if (connection === "close") {
        const wasConnected = isConnected;
        isConnected = false;
        connectedPhone = null;
        isConnectingSocket = false;

        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const errorMessage = (lastDisconnect?.error as any)?.message || "";

        // Si ya se conectó antes y se desconecta, NO limpiar auth automáticamente
        // Esto previene que se borre la sesión después de escanear exitosamente
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
        const isCloseAfterConnect = wasConnected && wasConnectedOnce;

        logger.warn(
          {
            statusCode,
            isLoggedOut,
            isBadSession,
            isRestartRequired,
            isConflict,
            isCloseAfterConnect,
            wasConnected,
            wasConnectedOnce,
            errorMessage,
          },
          "WhatsApp disconnected",
        );

        // Solo limpiar auth si es logged out o bad session REAL (no después de conectar exitosamente)
        if ((isLoggedOut || isBadSession) && !isCloseAfterConnect) {
          isConnecting = false;
          logger.info("Cleaning auth - session invalid");
          try {
            if (existsSync(AUTH_DIR)) {
              rmSync(AUTH_DIR, { recursive: true, force: true });
              mkdirSync(AUTH_DIR, { recursive: true });
            }
          } catch (e) {}
          await connect();
        } else if (isCloseAfterConnect) {
          // Reconectar sin limpiar auth - fue una desconexión normal
          logger.info("Reconnecting after normal disconnect...");
          isConnecting = false;
          setTimeout(() => connect(), 3000);
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
            "WhatsApp conflict detected - another session is active. Waiting and retrying...",
          );

          if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            logger.error("Too many consecutive conflicts, forcing full reset");
            isConnecting = false;
            consecutiveErrors = 0;
            SafeReconnectManager.resetState("default");
            reconnectWithFreshAuth = true;
            setTimeout(() => {
              forceReset().catch((err) =>
                logger.error({ err }, "Force reset failed"),
              );
            }, 5000);
          } else {
            SafeReconnectManager.recordDisconnect();
            // En caso de conflicto, simplemente esperar más tiempo antes de reintentar
            // Esto permite que el usuario cierre la otra sesión
            const conflictDelay = Math.min(
              10000 + consecutiveErrors * 5000,
              60000,
            );
            logger.info(`Waiting ${conflictDelay / 1000}s before retry...`);
            setTimeout(async () => {
              if (SafeReconnectManager.canReconnect()) {
                await connect();
              }
            }, conflictDelay);
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

        // === RATE LIMITING Y ANTI-SPAM ===
        const spamCheck = isSpamMessage(text);
        if (spamCheck.isSpam) {
          logger.warn(
            { phone, text: text.slice(0, 50), reason: spamCheck.reason },
            "Spam detected, ignoring",
          );
          continue;
        }

        const rateLimitCheck = shouldProcessWhatsAppMessage(phone);
        if (!rateLimitCheck.allowed) {
          logger.warn(
            {
              phone,
              reason: rateLimitCheck.reason,
              retryAfter: rateLimitCheck.retryAfter,
            },
            "Rate limit exceeded",
          );
          if (sock) {
            await SafeBaileysSender.sendText(
              sock,
              "default",
              jid,
              "⏳ Has enviado demasiados mensajes. Espera un momento.",
            );
          }
          continue;
        }

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
  reconnectWithFreshAuth = true;
  consecutiveErrors = 0;
  SafeReconnectManager.resetState("default");
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
