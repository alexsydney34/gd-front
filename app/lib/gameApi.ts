const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.golden-duck.lol";

export interface GameStartResponse {
  session_id: number;
  win_next: boolean;
  eggs?: string;
  usdt?: string;
  status?: string;
}

export interface GameActionResponse {
  eggs?: string;
  usdt?: string;
  session_id?: number;
  win_next?: boolean;
  status?: string;
  ok?: boolean;
  message?: string;
}

export class GameApiClient {
  private sessionId: number | null = null;
  private winNext: boolean = true;

  constructor(private token: string) {}

  // Начать игру
  async startGame(skinId: number): Promise<GameStartResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/game/start?skin=${skinId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to start game');
      }

      const data: GameStartResponse = await response.json();
      this.sessionId = data.session_id;
      this.winNext = data.win_next;
      
      console.log('[GameAPI] Game started:', data);
      return data;
    } catch (error) {
      console.error('[GameAPI] Start game error:', error);
      throw error;
    }
  }

  // Отправить действие в игре (coin/end)
  // GET /game/check?action=coin или action=end
  async sendAction(action: 'coin' | 'end'): Promise<GameActionResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/game/check?action=${action}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[GameAPI] Action error:', errorText);
        return { ok: false, message: errorText };
      }

      const result: GameActionResponse = await response.json();
      console.log('[GameAPI] Action result:', result);
      return result;
    } catch (error) {
      console.error('[GameAPI] Send action error:', error);
      return { ok: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Собрать монету
  async collectCoin(): Promise<GameActionResponse> {
    return this.sendAction('coin');
  }

  // Завершить игру
  async endGame(): Promise<GameActionResponse> {
    return this.sendAction('end');
  }

  // Получить параметры текущей сессии
  getSessionId(): number | null {
    return this.sessionId;
  }

  shouldWinNext(): boolean {
    return this.winNext;
  }

  // Сбросить сессию
  reset() {
    this.sessionId = null;
    this.winNext = true;
  }
}

