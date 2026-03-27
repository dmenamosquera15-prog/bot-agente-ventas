import type { WASocket } from "@whiskeysockets/baileys";
import { AntiBanMiddleware } from "./antiBanMiddleware.js";

export class SafeBaileysSender {
  static async sendText(sock: WASocket, userId: string, recipient: string, message: string): Promise<boolean> {
    try {
      if (!AntiBanMiddleware.canSendMessage(userId)) {
        console.warn(`[SafeSender] Rate limit reached for ${userId}`);
        return false;
      }

      // Simulate typing
      await sock.sendPresenceUpdate("composing", recipient);
      await AntiBanMiddleware.humanDelay();
      await sock.sendPresenceUpdate("paused", recipient);

      await sock.sendMessage(recipient, { text: message });
      AntiBanMiddleware.recordMessage(userId);
      return true;
    } catch (error) {
      console.error(`[SafeSender] Error sending message to ${recipient}:`, error);
      return false;
    }
  }

  static async sendMedia(sock: WASocket, userId: string, recipient: string, caption: string, mediaUrl: string): Promise<boolean> {
    try {
       if (!AntiBanMiddleware.canSendMessage(userId)) return false;
       
       await sock.sendPresenceUpdate("composing", recipient);
       await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));
       await sock.sendPresenceUpdate("paused", recipient);

       await sock.sendMessage(recipient, { image: { url: mediaUrl }, caption });
       AntiBanMiddleware.recordMessage(userId);
       return true;
    } catch (error) {
       return false;
    }
  }
}
