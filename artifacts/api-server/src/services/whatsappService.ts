import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  type WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import { mkdirSync, existsSync } from "fs";
import { join } from "path";
import { handleMessage } from "../core/router.js";
import { logger } from "../lib/logger.js";

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

export function getStatus(): WhatsAppStatus {
  return {
    connected: isConnected,
    qr: qrCode,
    phone: connectedPhone,
    connecting: isConnecting,
  };
}

export async function connect(): Promise<void> {
  if (isConnecting && isConnected) return;

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
      }

      if (connection === "close") {
        isConnected = false;
        connectedPhone = null;
        const shouldReconnect =
          (lastDisconnect?.error as Boom)?.output?.statusCode !==
          DisconnectReason.loggedOut;

        logger.warn({ shouldReconnect }, "WhatsApp disconnected");

        if (shouldReconnect) {
          if (reconnectTimer) clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(() => connect(), 5000);
        } else {
          isConnecting = false;
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
        const text =
          msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text ||
          msg.message?.imageMessage?.caption ||
          "";

        if (!text.trim()) continue;

        logger.info({ phone, text }, "WhatsApp message received");

        try {
          const result = await handleMessage(phone, text);
          if (result.response && sock) {
            await sock.sendMessage(jid, { text: result.response });
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
  if (sock) {
    await sock.logout();
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
