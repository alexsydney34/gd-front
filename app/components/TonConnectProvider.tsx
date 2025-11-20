"use client";

import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { ReactNode } from "react";

interface TonConnectProviderProps {
  children: ReactNode;
}

export default function TonConnectProvider({ children }: TonConnectProviderProps) {
  // Always use absolute URL for Telegram WebApp compatibility
  const manifestUrl = 'https://app.golden-duck.lol/tonconnect-manifest.json';

  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      {children}
    </TonConnectUIProvider>
  );
}

