/**
 * Rate Limiting y Anti-Spam para WhatsApp
 * Previene abuso y mensajes masivos
 */

const MESSAGE_WINDOW = new Map<string, { timestamps: number[] }>();
const WINDOW_MS = 60000; // 1 minuto
const MAX_MESSAGES = 10; // Max 10 mensajes por minuto

const SPAM_PATTERNS = [
  /https?:\/\/\S+/i, // URLs
  /\b(09[0-9]{8}|[0-9]{10})\b/, // Números de teléfono
  /crypto|bitcoin|inversion|gana dinero/i,
  /repetido.*repetido/i,
];

export function isSpamMessage(text: string): { isSpam: boolean; reason?: string } {
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) {
      return { isSpam: true, reason: "Pattern detected" };
    }
  }

  // Check for repeated messages
  if (text.length > 50 && /(.)\1{4,}/.test(text)) {
    return { isSpam: true, reason: "Repeated characters" };
  }

  return { isSpam: false };
}

export function shouldProcessWhatsAppMessage(phone: string): { allowed: boolean; reason?: string; retryAfter?: number } {
  const now = Date.now();
  const record = MESSAGE_WINDOW.get(phone);

  if (!record) {
    MESSAGE_WINDOW.set(phone, { timestamps: [now] });
    return { allowed: true };
  }

  // Filter timestamps within window
  record.timestamps = record.timestamps.filter(ts => now - ts < WINDOW_MS);

  if (record.timestamps.length >= MAX_MESSAGES) {
    const oldestInWindow = Math.min(...record.timestamps);
    const retryAfter = Math.ceil((oldestInWindow + WINDOW_MS - now) / 1000);
    return { allowed: false, reason: "Rate limit exceeded", retryAfter };
  }

  record.timestamps.push(now);
  return { allowed: true };
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [phone, record] of MESSAGE_WINDOW.entries()) {
    record.timestamps = record.timestamps.filter(ts => now - ts < WINDOW_MS);
    if (record.timestamps.length === 0) {
      MESSAGE_WINDOW.delete(phone);
    }
  }
}, 300000);
