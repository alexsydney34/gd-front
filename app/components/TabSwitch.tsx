"use client";

import { DuckTab } from "../types";
import { useTelegram } from "../hooks/useTelegram";

interface TabSwitchProps {
  activeTab: DuckTab;
  onTabChange: (tab: DuckTab) => void;
  myDucksCount: number;
  shopDucksCount: number;
  myDucksLabel: string;
  shopLabel: string;
}

export default function TabSwitch({
  activeTab,
  onTabChange,
  myDucksCount,
  shopDucksCount,
  myDucksLabel,
  shopLabel,
}: TabSwitchProps) {
  const { hapticFeedback } = useTelegram();

  const handleTabClick = (tab: DuckTab) => {
    if (tab !== activeTab) {
      hapticFeedback.selectionChanged();
      onTabChange(tab);
    }
  };

  return (
    <div className="w-full max-w-[343px] h-11 bg-[#E3F8FC] backdrop-blur-[30px] rounded-[100px] p-0.5">
      <div className="flex items-center w-full h-full">
        {/* My Ducks Tab */}
        <button
          onClick={() => handleTabClick("my")}
          className={`flex-1 h-10 rounded-[100px] transition-all duration-200 ${
            activeTab === "my"
              ? "bg-white shadow-[0px_1px_3px_rgba(0,0,0,0.08)]"
              : "bg-transparent"
          }`}
        >
          <span
            className={`font-rubik font-medium text-sm leading-[17px] ${
              activeTab === "my" ? "text-[#1F2937]" : "text-[#6B7280] opacity-60"
            }`}
          >
            {myDucksLabel} ({myDucksCount})
          </span>
        </button>

        {/* Shop Tab */}
        <button
          onClick={() => handleTabClick("shop")}
          className={`flex-1 h-10 rounded-[100px] transition-all duration-200 ${
            activeTab === "shop"
              ? "bg-white shadow-[0px_1px_3px_rgba(0,0,0,0.08)]"
              : "bg-transparent"
          }`}
        >
          <span
            className={`font-rubik font-medium text-[13px] leading-4 tracking-[-0.43px] ${
              activeTab === "shop" ? "text-[#1F2937]" : "text-[#6B7280] opacity-60"
            }`}
          >
            {shopLabel} ({shopDucksCount})
          </span>
        </button>
      </div>
    </div>
  );
}
