export interface ReconnectState {
  disconnectCount: number;
  lastDisconnectTime: number;
  isReconnecting: boolean;
  reconnectAttempts: number;
}

const states = new Map<string, ReconnectState>();
const MAX_RECONNECT_ATTEMPTS = 5;
const RESET_PERIOD_MS = 300000; // 5 minutes

export const SafeReconnectManager = {
  canReconnect(id: string = "default"): boolean {
    const state = this.getState(id);
    const now = Date.now();

    if (now - state.lastDisconnectTime > RESET_PERIOD_MS) {
      state.disconnectCount = 0;
      state.reconnectAttempts = 0;
    }

    if (state.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.warn(`[SafeReconnect] Max attempts reached for ${id}`);
      return false;
    }

    if (state.isReconnecting) {
      console.warn(`[SafeReconnect] Already reconnecting for ${id}`);
      return false;
    }

    return true;
  },

  recordDisconnect(id: string = "default"): void {
    const state = this.getState(id);
    state.disconnectCount++;
    state.lastDisconnectTime = Date.now();
    console.log(`[SafeReconnect] Disconnect count for ${id}: ${state.disconnectCount}`);
  },

  getReconnectDelay(id: string = "default"): number {
    const state = this.getState(id);
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 60s
    const delay = Math.min(1000 * Math.pow(2, state.disconnectCount), 60000);
    return delay + Math.random() * 1000;
  },

  async startReconnect(id: string = "default", reconnectFn: () => Promise<void>): Promise<boolean> {
    if (!this.canReconnect(id)) return false;

    const state = this.getState(id);
    state.isReconnecting = true;
    state.reconnectAttempts++;

    const delay = this.getReconnectDelay(id);
    console.log(`[SafeReconnect] Waiting ${Math.round(delay/1000)}s before reconnecting ${id}...`);
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      await reconnectFn();
      state.isReconnecting = false;
      return true;
    } catch (error) {
      state.isReconnecting = false;
      console.error(`[SafeReconnect] Reconnect failed for ${id}:`, error);
      return false;
    }
  },

  resetState(id: string = "default"): void {
    states.delete(id);
  },

  getState(id: string): ReconnectState {
    if (!states.has(id)) {
      states.set(id, {
        disconnectCount: 0,
        lastDisconnectTime: 0,
        isReconnecting: false,
        reconnectAttempts: 0
      });
    }
    return states.get(id)!;
  }
};
