// Типы для Telegram Web App API
export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      is_premium?: boolean;
      photo_url?: string;
    };
  };
  platform: string;
  version: string;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  safeAreaInset: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  contentSafeAreaInset?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  HapticFeedback: {
    impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
    selectionChanged: () => void;
  };
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  expand: () => void;
  close: () => void;
  ready: () => void;
  requestFullscreen: () => void;
  exitFullscreen: () => void;
  lockOrientation: () => void;
  unlockOrientation: () => void;
  enableClosingConfirmation: () => void;
  disableVerticalSwipes: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  showAlert: (message: string) => Promise<void>;
  showConfirm: (message: string) => Promise<boolean>;
  openTelegramLink: (url: string) => void;
  onEvent: (eventName: string, callback: () => void) => void;
  offEvent: (eventName: string, callback: () => void) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export {};

