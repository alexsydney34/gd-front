"use client";

import { useEffect, useState } from "react";

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

import { TelegramWebApp } from "../types/telegram";

// Безопасная обертка для WebApp с проверкой на клиента
const getWebApp = (): TelegramWebApp | null => {
  if (typeof window !== "undefined") {
    return window.Telegram?.WebApp || null;
  }
  return null;
};

export function useTelegram() {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [safeAreaInsets, setSafeAreaInsets] = useState<SafeAreaInsets>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const WebApp = getWebApp();
      if (!WebApp) return;

      // Развернуть приложение на весь экран
      WebApp.ready();
      WebApp.expand();
      
      // Настройка цветов и стилей
      WebApp.setHeaderColor('#87CEEB');
      WebApp.setBackgroundColor('#87CEEB');
      
      // Отключить вертикальные свайпы (чтобы не закрывать приложение случайно)
      WebApp.disableVerticalSwipes();

      // Получаем данные пользователя
      const tgUser = WebApp.initDataUnsafe?.user;
      if (tgUser) {
        setUser({
          id: tgUser.id,
          first_name: tgUser.first_name,
          last_name: tgUser.last_name,
          username: tgUser.username,
          language_code: tgUser.language_code,
          is_premium: tgUser.is_premium,
          photo_url: tgUser.photo_url,
        });
      }

      // Функция для обновления safe area insets
      const updateSafeAreaInsets = () => {
        // Используем viewportStableHeight для корректного расчета
        const viewportHeight = WebApp.viewportStableHeight || WebApp.viewportHeight;
        
        // Получаем safe area insets
        const safeArea = WebApp.safeAreaInset || { top: 0, bottom: 0, left: 0, right: 0 };
        const contentSafeArea = WebApp.contentSafeAreaInset || safeArea;
        
        console.log('Safe Area Insets:', contentSafeArea);
        console.log('Viewport Height:', viewportHeight);
        
        setSafeAreaInsets({
          top: contentSafeArea.top || 0,
          bottom: contentSafeArea.bottom || 0,
          left: contentSafeArea.left || 0,
          right: contentSafeArea.right || 0,
        });
      };

      // Обновляем safe area сразу и после изменения viewport
      updateSafeAreaInsets();
      
      // Слушаем изменения viewport
      WebApp.onEvent('viewportChanged', updateSafeAreaInsets);

      setIsReady(true);
      
      // Cleanup
      return () => {
        WebApp.offEvent('viewportChanged', updateSafeAreaInsets);
      };
    }
  }, []);

  const WebApp = getWebApp();

  return {
    user,
    isReady,
    safeAreaInsets,
    webApp: WebApp,
    // Полезные методы с проверкой
    close: () => WebApp?.close(),
    showAlert: (message: string) => WebApp?.showAlert(message),
    showConfirm: (message: string) => WebApp?.showConfirm(message),
    // Метод копирования для Telegram Web App
    copyToClipboard: (text: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (typeof document === 'undefined') {
          reject(new Error("Document is not available"));
          return;
        }
        
        try {
          // Создаем временный input для копирования
          const textArea = document.createElement("textarea");
          textArea.value = text;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          textArea.style.top = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          
          try {
            const successful = document.execCommand("copy");
            textArea.remove();
            
            if (successful) {
              resolve();
            } else {
              reject(new Error("Copy command failed"));
            }
          } catch (err) {
            textArea.remove();
            reject(err);
          }
        } catch (err) {
          reject(err);
        }
      });
    },
    hapticFeedback: {
      impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => {
        if (WebApp?.HapticFeedback) {
          WebApp.HapticFeedback.impactOccurred(style);
        }
      },
      notificationOccurred: (type: "error" | "success" | "warning") => {
        if (WebApp?.HapticFeedback) {
          WebApp.HapticFeedback.notificationOccurred(type);
        }
      },
      selectionChanged: () => {
        if (WebApp?.HapticFeedback) {
          WebApp.HapticFeedback.selectionChanged();
        }
      },
    },
  };
}

