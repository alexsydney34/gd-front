import { TabConfig } from "../types";

// Safe Area Insets from Telegram Web App
export const SAFE_AREA_INSETS = {
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
};

// Функция для обновления safe area insets
export function updateSafeAreaInsets(insets: {
  top: number;
  bottom: number;
  left: number;
  right: number;
}) {
  SAFE_AREA_INSETS.top = insets.top;
  SAFE_AREA_INSETS.bottom = insets.bottom;
  SAFE_AREA_INSETS.left = insets.left;
  SAFE_AREA_INSETS.right = insets.right;
}

export const TABS_CONFIG: TabConfig[] = [
  { 
    id: "play", 
    activeIcon: "/footer/noto-v1_egg.webp", 
    inactiveIcon: "/footer/noto-v1-nofill_egg.webp", 
    label: "Play",
    width: 24,
    height: 24
  },
  { 
    id: "wallet", 
    activeIcon: "/footer/iconoir_wallet-solid.webp", 
    inactiveIcon: "/footer/iconoir_wallet-solid-1.webp", 
    label: "Wallet",
    width: 27,
    height: 27
  },
  { 
    id: "rating", 
    activeIcon: "/footer/solar_cup-bold.webp", 
    inactiveIcon: "/footer/solar_cup-bold-1.webp", 
    label: "Rating",
    width: 27,
    height: 27
  },
  { 
    id: "referral", 
    activeIcon: "/footer/bi_people-fill.webp", 
    inactiveIcon: "/footer/bi_people-fill-1.webp", 
    label: "Referral",
    width: 32,
    height: 27
  },
];

export const MODAL_FEATURES = [
  "1 attempt per day for a duck",
  "Egg in the game = EGGS token",
  "10% from boosts — into liquidity"
] as const;

// Mock data is no longer needed - we use real API data
