export class AntiBanMiddleware {
  private static metrics = new Map<string, any>();
  private static readonly MAX_MESSAGES_PER_MINUTE = 15;
  private static readonly COOLDOWN_PERIOD_MS = 60000;

  static canSendMessage(userId: string): boolean {
    const metrics = this.getMetrics(userId);
    const now = Date.now();
    if (now - metrics.lastMessageTime > this.COOLDOWN_PERIOD_MS) {
      metrics.messageCount = 0;
    }
    return metrics.messageCount < this.MAX_MESSAGES_PER_MINUTE;
  }

  static recordMessage(userId: string): void {
    const metrics = this.getMetrics(userId);
    metrics.messageCount++;
    metrics.lastMessageTime = Date.now();
  }

  static async humanDelay(): Promise<void> {
    const delay = 1000 + Math.random() * 2000;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private static getMetrics(userId: string): any {
    if (!this.metrics.has(userId)) {
      this.metrics.set(userId, { lastMessageTime: 0, messageCount: 0 });
    }
    return this.metrics.get(userId);
  }
}
