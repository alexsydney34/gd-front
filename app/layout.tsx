"use client";

import { Nunito, Rubik } from "next/font/google";
import "./globals.css";
import TelegramProvider from "./components/TelegramProvider";
import TonConnectProvider from "./components/TonConnectProvider";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import BottomNavigation from "./components/BottomNavigation";
import BackButtonHandler from "./components/BackButtonHandler";
import Preloader from "./components/Preloader";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
});

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Hide bottom navigation on these pages
  const hideNavigation = pathname?.includes('/wallet/deposit') || pathname?.includes('/wallet/withdraw');

  // Hide background on pages with custom backgrounds
  const hideBackground = pathname === '/play' || pathname === '/referral/pdf';

  return (
    <>
      {/* Fixed background layer - doesn't scroll */}
      {!hideBackground && (
        <div 
          className="fixed inset-0 w-full h-full -z-10"
          style={{
            backgroundImage: "url(/bg.webp)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
      )}
      <BackButtonHandler />
      {children}
      {!hideNavigation && <BottomNavigation />}
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script 
          src="https://telegram.org/js/telegram-web-app.js" 
          strategy="beforeInteractive"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <title>Golden Duck</title>
        <meta name="description" content="Collect golden eggs and receive EGGS tokens!" />
        
        {/* Preload критичных game ассетов для быстрой загрузки */}
        <link rel="preload" as="image" href="/game/egg.svg" />
        <link rel="preload" as="image" href="/game/pipes/sliced pipes/1_level_top.png" />
        <link rel="preload" as="image" href="/game/pipes/sliced pipes/1_level_bottom.png" />
        <link rel="preload" as="image" href="/game/day_sprites/ground.svg" />
        <link rel="preload" as="image" href="/game/night_sprites/Ground.svg" />
        
        {/* DNS prefetch для внешних ресурсов */}
        <link rel="dns-prefetch" href="https://telegram.org" />
      </head>
      <body
        className={`${nunito.variable} ${rubik.variable} antialiased`}
      >
        {isLoading && <Preloader onComplete={() => setIsLoading(false)} />}
        <TonConnectProvider>
          <TelegramProvider>
            <AuthProvider>
              <LanguageProvider>
                <LayoutContent>{children}</LayoutContent>
              </LanguageProvider>
            </AuthProvider>
          </TelegramProvider>
        </TonConnectProvider>
      </body>
    </html>
  );
}
