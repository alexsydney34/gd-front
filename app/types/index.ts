export type Tab = "play" | "wallet" | "rating" | "referral";

export interface TabConfig {
  id: Tab;
  activeIcon: string;
  inactiveIcon: string;
  label: string;
  width: number;
  height: number;
}

export interface EggsPriceCardProps {
  price: string;
  percentage: string;
  progress: number;
  minPrice: string;
  maxPrice: string;
  onInfoClick: () => void;
}

export interface PlayButtonProps {
  onClick?: () => void;
}

export interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface LeaderboardUser {
  tg_id: number;
  name: string;
  img: string;
  eggs: string; // Changed to string as per API response
  place: number;
  reward: string; // Changed to string as per API response
}

export interface LeaderboardResponse {
  pool: number;
  end: number;
  users: LeaderboardUser[];
  me: LeaderboardUser;
}

export interface TopWinnerProps {
  user: LeaderboardUser;
  medalIcon: string;
}

export interface LeaderboardRowProps {
  user: LeaderboardUser;
}

// Duck types from API
export interface DuckFromAPI {
  id: number;
  key: string; // duck color/type key
  image: string;
  lives: number;
  opened: boolean; // can play or not
  seconds_to_play: number; // cooldown in seconds
  eggs_per_month: number;
  eggs_per_one: number;
  price: number;
  pcs: number; // available quantity in shop
  curent_from: {
    curent: number;
    from: number;
  };
}

export interface DucksResponse {
  buyed: DuckFromAPI[]; // My ducks
  ducks: DuckFromAPI[]; // Shop ducks
}

export interface DuckCardProps {
  duck: DuckFromAPI;
  onPlayClick?: (duckId: number) => void;
  onBuyClick?: (duckId: number) => Promise<{ ok: boolean; error?: string }>;
  isShopItem?: boolean;
  eggsPrice?: number;
}

export type DuckTab = "my" | "shop";
