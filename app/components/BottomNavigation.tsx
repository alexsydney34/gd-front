"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Tab, TabConfig } from "../types";
import { TABS_CONFIG } from "../constants";
import { useTelegram } from "../hooks/useTelegram";
import { useTranslation } from "../hooks/useTranslation";

interface TabItemProps extends TabConfig {
  isActive: boolean;
  onClick: () => void;
}

interface TabItemInternalProps extends TabItemProps {
  translatedLabel: string;
}

function TabItem({ activeIcon, inactiveIcon, label, width, height, isActive, onClick, translatedLabel }: TabItemInternalProps) {
  return (
    <button 
      className={`tab-item ${isActive ? "active" : "inactive"} flex-1 max-w-[81.75px] transition-all duration-200`}
      onClick={onClick}
      aria-label={label}
      aria-pressed={isActive}
    >
      <Image 
        src={isActive ? activeIcon : inactiveIcon}
        alt=""
        width={width}
        height={height}
        className="transition-transform duration-200"
        style={{ width: 'auto', height: 'auto' }}
      />
      <span className="font-rubik font-normal text-xs leading-4 text-center text-[#50260A]">
        {translatedLabel}
      </span>
    </button>
  );
}

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { hapticFeedback, safeAreaInsets } = useTelegram();
  const { t } = useTranslation();
  
  const getActiveTab = (): Tab => {
    if (pathname === "/rating") return "rating";
    if (pathname === "/wallet") return "wallet";
    if (pathname === "/referral") return "referral";
    return "play";
  };

  const [activeTab, setActiveTab] = useState<Tab>(getActiveTab());

  const handleTabClick = (tabId: Tab) => {
    // Haptic feedback при переключении табов
    hapticFeedback.selectionChanged();
    
    setActiveTab(tabId);
    
    switch (tabId) {
      case "play":
        router.push("/");
        break;
      case "rating":
        router.push("/rating");
        break;
      case "referral":
        router.push("/referral");
        break;
      case "wallet":
        router.push("/wallet");
        break;
    }
  };

  return (
    <div 
      className="fixed left-0 right-0 bottom-0 flex justify-center z-50"
      style={{ paddingBottom: `max(16px, ${safeAreaInsets.bottom}px)` }}
    >
      <nav className="card w-full max-w-[343px] py-4 px-2 mx-4" aria-label="Main navigation">
        <div className="tab-nav w-full max-w-[327px] h-[47px]">
          {TABS_CONFIG.map((tab) => (
            <TabItem
              key={tab.id}
              {...tab}
              isActive={activeTab === tab.id}
              onClick={() => handleTabClick(tab.id)}
              translatedLabel={t[tab.id as keyof typeof t]}
            />
          ))}
        </div>
      </nav>
    </div>
  );
}

