const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.golden-duck.lol";

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface RefLevel {
  deposit: number;
  duck_name: string;
  level: number;
  opened: boolean;
  percent: number;
}

export interface RefLineUser {
  img: string;
  name: string;
  profit: number;
  volume: number;
}

export interface RefLine {
  active_partners_count: number;
  line: number;
  partners_count: number;
  profit: number;
  total_ducks: number;
  users: RefLineUser[];
  volume: number;
}

export interface RefsResponse {
  levels: RefLevel[];
  lines: RefLine[];
  my_link: string;
  pdf_link: string;
  team_turnover: string;
  your_income: string;
}

export interface WalletHistory {
  amount: string;
  minus: boolean;
  status: string;
  time: string;
  type: string;
  eggs?: boolean;
}

export interface WalletResponse {
  balance_eggs: string;
  balance_usdt: string;
  bnb_wallet: string;
  eggs_price: number;
  eggs_percent: number;
  eggs_max: number;
  add_percent: number; // deprecated, use eggs_percent
  history: WalletHistory[];
  min_withdraw: number;
  my_ton_wallet: string;
  ton_wallet: string;
  ton_comment: string;
  total_transactions: number;
  lang?: string; // Language from API (ru/en)
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token);
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token");
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false
  ): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const token = this.getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...(options.headers as Record<string, string>),
        },
      });

      // Обработка 401 - токен истёк или невалиден
      if (response.status === 401 && !isRetry) {
        console.log("401 Unauthorized - attempting login...");
        
        // Получаем initData из Telegram
        if (typeof window !== "undefined" && window.Telegram?.WebApp) {
          const initData = window.Telegram.WebApp.initData;
          if (initData) {
            // Очищаем старый токен
            this.clearToken();
            
            // Делаем логин через /auth/login
            const loginResponse = await this.login(initData);
            if (loginResponse.data?.token) {
              console.log("Login successful after 401, retrying request...");
              // Повторяем запрос с новым токеном
              return this.request<T>(endpoint, options, true);
            } else {
              console.error("Login failed after 401:", loginResponse.error);
            }
          } else {
            console.error("No initData available for login");
          }
        }
        
        return { error: "Authorization failed. Please refresh the page." };
      }

      if (!response.ok) {
        const errorText = await response.text();
        return { error: errorText || "Request failed" };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error("API request error:", error);
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  // Авторизация
  async login(initData: string): Promise<ApiResponse<{ token: string; show_subs: boolean }>> {
    const response = await this.request<{ token: string; show_subs: boolean }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ init_data: initData }),
    });

    if (response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  // Получить данные рефералки
  async getRefs(limit = 10, offset = 0): Promise<ApiResponse<RefsResponse>> {
    return this.request<RefsResponse>(
      `/user/refs?limit=${limit}&offset=${offset}`
    );
  }

  // Получить данные кошелька
  async getWallet(limit = 10, offset = 0): Promise<ApiResponse<WalletResponse>> {
    return this.request<WalletResponse>(
      `/wallet/wallet?limit=${limit}&offset=${offset}`
    );
  }

  // Подключить кошелек
  async connectWallet(wallet: string): Promise<ApiResponse<string>> {
    return this.request<string>("/wallet/connect", {
      method: "POST",
      body: JSON.stringify({ wallet }),
    });
  }

  // Конвертация EGGS <-> USDT
  async convertCurrency(eggs?: number, usdt?: number): Promise<ApiResponse<string>> {
    const body: { eggs?: number; usdt?: number } = {};
    if (eggs !== undefined) body.eggs = eggs;
    if (usdt !== undefined) body.usdt = usdt;
    
    return this.request<string>("/wallet/convert", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  // Вывод средств
  async withdraw(address: string, amount: number, coin: string): Promise<ApiResponse<string>> {
    return this.request<string>("/wallet/withdraw", {
      method: "POST",
      body: JSON.stringify({ address, amount, coin }),
    });
  }

  // Получить уток
  async getDucks(): Promise<ApiResponse<import("../types").DucksResponse>> {
    return this.request<import("../types").DucksResponse>("/user/ducks");
  }

  // Купить утку
  async buyDuck(id: number): Promise<ApiResponse<string>> {
    return this.request<string>(`/user/ducks/buy?id=${id}`, {
      method: "GET",
    });
  }

  // Получить лидерборд
  async getLeaderboard(): Promise<ApiResponse<import("../types").LeaderboardResponse>> {
    return this.request<import("../types").LeaderboardResponse>("/user/leaderboard");
  }

  // Проверить подписку
  async checkSubscription(): Promise<{ ok: boolean; error?: string }> {
    try {
      const token = this.getToken();
      if (!token) {
        return { ok: false, error: 'Not authenticated' };
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      };

      const response = await fetch(`${API_BASE_URL}/user/subs`, {
        method: "GET",
        headers,
      });

      const data = await response.json();
      
      // Статус 400 с ok: false означает что не подписан (это не ошибка)
      if (response.status === 400 && data.ok === false) {
        return { ok: false, error: data.error };
      }

      // Статус 200 с ok: true означает подписан
      if (response.ok && data.ok === true) {
        return { ok: true };
      }

      return { ok: false, error: data.error || 'Unknown error' };
    } catch (error) {
      console.error('Subscription check error:', error);
      return { ok: false, error: 'Network error' };
    }
  }

  // Запросить PDF презентацию в боте
  async requestPDF(): Promise<{ ok: boolean; error?: string }> {
    try {
      const token = this.getToken();
      if (!token) {
        return { ok: false, error: 'Not authenticated' };
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      };

      const response = await fetch(`${API_BASE_URL}/user/pdf`, {
        method: "GET",
        headers,
      });

      if (response.ok) {
        return { ok: true };
      }

      const data = await response.json();
      return { ok: false, error: data.error || 'Unknown error' };
    } catch (error) {
      console.error('PDF request error:', error);
      return { ok: false, error: 'Network error' };
    }
  }
}

export const apiClient = new ApiClient();

