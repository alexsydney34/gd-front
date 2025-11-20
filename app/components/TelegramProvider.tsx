"use client";

import { useEffect } from "react";
import { updateSafeAreaInsets } from "../constants";

export default function TelegramProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Инициализация Telegram Web App
    if (typeof window !== "undefined") {
      const WebApp = window.Telegram?.WebApp;
      
      if (WebApp) {
        // Запрашиваем fullscreen режим только на мобильных устройствах
        const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (WebApp.requestFullscreen && isMobile) {
          try {
            WebApp.requestFullscreen();
          } catch (error) {
            // Игнорируем ошибку если метод не поддерживается
          }
        }
        
        // Расширяем viewport
        WebApp.expand();
        
        // Блокируем переворот экрана (portrait mode only)
        if (WebApp.lockOrientation) {
          try {
            WebApp.lockOrientation();
          } catch (error) {
            // Игнорируем ошибку если метод не поддерживается
          }
        }
        
        // Включаем вертикальные свайпы
        WebApp.enableClosingConfirmation();
        
        // Устанавливаем цвет хедера
        WebApp.setHeaderColor("#87CEEB");
        
        // Устанавливаем цвет бэкграунда
        WebApp.setBackgroundColor("#87CEEB");
        
        // Получаем и сохраняем safe area insets
        if (WebApp.safeAreaInset) {
          updateSafeAreaInsets({
            top: WebApp.safeAreaInset.top || 0,
            bottom: WebApp.safeAreaInset.bottom || 0,
            left: WebApp.safeAreaInset.left || 0,
            right: WebApp.safeAreaInset.right || 0,
          });
        }
        
        // Говорим что приложение готово
        WebApp.ready();
        
        console.log("Telegram Web App initialized:", {
          platform: WebApp.platform,
          version: WebApp.version,
          isExpanded: WebApp.isExpanded,
          viewportHeight: WebApp.viewportHeight,
          viewportStableHeight: WebApp.viewportStableHeight,
          safeAreaInset: WebApp.safeAreaInset ? {
            top: WebApp.safeAreaInset.top,
            bottom: WebApp.safeAreaInset.bottom,
            left: WebApp.safeAreaInset.left,
            right: WebApp.safeAreaInset.right,
          } : null,
        });
      }
    }
  }, []);

  return <>{children}</>;
}

