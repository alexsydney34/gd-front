"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function BackButtonHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const WebApp = window.Telegram?.WebApp;
    if (!WebApp?.BackButton) return;

    // Главная страница - скрываем кнопку
    const isMainPage = pathname === "/" || pathname === "/main";

    if (isMainPage) {
      WebApp.BackButton.hide();
    } else {
      // На всех остальных страницах показываем кнопку
      WebApp.BackButton.show();

      // Обработчик клика - всегда возвращаем на главную
      const handleBackClick = () => {
        console.log('[BackButton] Navigating to home from:', pathname);
        router.push('/');
      };

      WebApp.BackButton.onClick(handleBackClick);

      // Cleanup при размонтировании
      return () => {
        WebApp.BackButton.offClick(handleBackClick);
        WebApp.BackButton.hide();
      };
    }
  }, [pathname, router]);

  return null;
}

