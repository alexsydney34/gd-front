"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import DuckCard from "../components/DuckCard";
import TabSwitch from "../components/TabSwitch";
import { DuckTab, DuckFromAPI } from "../types";
import { useTranslation } from "../hooks/useTranslation";
import { useTelegram } from "../hooks/useTelegram";
import { apiClient } from "../lib/api";
import { USE_DEV_TOKEN, DEV_TOKEN } from "../lib/devToken";
import { normalizeDuckKey } from "../utils/duckMapper";
import { canPlayDuck } from "../components/DuckCard/utils";

export default function ChooseDuckPage() {
  const [activeTab, setActiveTab] = useState<DuckTab>("my");
  const [myDucks, setMyDucks] = useState<DuckFromAPI[]>([]);
  const [shopDucks, setShopDucks] = useState<DuckFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eggsPrice, setEggsPrice] = useState<number>(1.00);
  
  const { t } = useTranslation();
  const { safeAreaInsets, hapticFeedback } = useTelegram();
  const router = useRouter();

  useEffect(() => {
    // Auto-set dev token if enabled
    if (USE_DEV_TOKEN && typeof window !== "undefined") {
      apiClient.setToken(DEV_TOKEN);
      console.log("🔧 Using DEV_TOKEN for testing");
    }
    
    fetchDucks();
  }, []);

  const fetchDucks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch ducks and wallet data in parallel
      const [ducksResponse, walletResponse] = await Promise.all([
        apiClient.getDucks(),
        apiClient.getWallet(1, 0)
      ]);
      
      if (ducksResponse.error) {
        setError(ducksResponse.error);
        return;
      }

      if (ducksResponse.data) {
        setMyDucks(ducksResponse.data.buyed || []);
        setShopDucks(ducksResponse.data.ducks || []);
      }
      
      // Update eggs price from wallet response
      if (walletResponse.data?.eggs_price) {
        setEggsPrice(walletResponse.data.eggs_price);
      }
    } catch (err) {
      setError("Failed to load ducks");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayClick = (duckId: number) => {
    console.log("Play clicked:", duckId);
    hapticFeedback.notificationOccurred("success");
    
    // Find the duck to get its color/type
    const selectedDuck = myDucks.find(d => d.id === duckId);
    if (selectedDuck) {
      // Normalize duck key using utility function
      const normalizedKey = normalizeDuckKey(selectedDuck.key);
      
      console.log('Saving duck to localStorage:', { 
        id: selectedDuck.id,
        original: selectedDuck.key, 
        normalized: normalizedKey 
      });
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedDuck', normalizedKey);
        localStorage.setItem('selectedDuckId', selectedDuck.id.toString()); // Save ID for WebSocket
      }
      // Navigate to game page
      router.push('/play');
    } else {
      console.warn('Duck not found with id:', duckId);
    }
  };

  const handleBuyClick = async (duckId: number): Promise<{ ok: boolean; error?: string }> => {
    try {
      const response = await apiClient.buyDuck(duckId);
      
      if (response.error) {
        return { ok: false, error: response.error };
      }

      // Refresh ducks list
      await fetchDucks();
      return { ok: true };
    } catch (err) {
      console.error("Buy error:", err);
      return { ok: false, error: "Failed to buy duck" };
    }
  };

  // Get unique shop ducks count (показываем только уникальные из ducks)
  const uniqueShopDucksCount = useMemo(() => {
    // Считаем уникальные типы в ducks (убираем только дубликаты внутри ducks)
    const uniqueMap = new Map<string, DuckFromAPI>();
    
    for (const duck of shopDucks) {
      const normalizedKey = normalizeDuckKey(duck.key);
      // Пропускаем только дубликаты
      if (!uniqueMap.has(normalizedKey)) {
        uniqueMap.set(normalizedKey, duck);
      }
    }

    return uniqueMap.size;
  }, [shopDucks]);

  // Sort and filter ducks
  const sortedAndFilteredDucks = useMemo(() => {
    if (activeTab === "my") {
      // Sort "My Ducks" tab - показываем ВСЕ купленные утки (даже дубликаты)
      const sorted = [...myDucks].sort((a, b) => {
        const aCanPlay = canPlayDuck(a);
        const bCanPlay = canPlayDuck(b);

        // Active ducks (can play) first
        if (aCanPlay && !bCanPlay) return -1;
        if (!aCanPlay && bCanPlay) return 1;

        if (aCanPlay && bCanPlay) {
          // Both active: sort by price (rarity) - lower price (less rare) first
          return a.price - b.price;
        } else {
          // Both inactive: sort by seconds_to_play (lesser time first)
          return a.seconds_to_play - b.seconds_to_play;
        }
      });

      return sorted;
    } else {
      // Filter "Shop" tab - показываем ВСЕ уникальные утки из ducks
      // Убираем только дубликаты внутри массива ducks
      
      const uniqueMap = new Map<string, DuckFromAPI>();
      
      for (const duck of shopDucks) {
        const normalizedKey = normalizeDuckKey(duck.key);
        
        // Берем только первую утку каждого типа (убираем дубликаты)
        if (!uniqueMap.has(normalizedKey)) {
          uniqueMap.set(normalizedKey, duck);
          console.log(`[SHOP] Add ${duck.key} (${normalizedKey})`);
        }
      }

      console.log(`[SHOP] Total from API: ${shopDucks.length}, unique types: ${uniqueMap.size}`);
      
      // Возвращаем все уникальные утки из ducks, отсортированные по цене
      const shopDucksFiltered = Array.from(uniqueMap.values()).sort((a, b) => a.price - b.price);
      return shopDucksFiltered;
    }
  }, [activeTab, myDucks, shopDucks]);

  const currentDucks = sortedAndFilteredDucks;

  if (loading) {
    return (
      <div
        className="mobile-container flex items-center justify-center"
        style={{
          paddingTop: `${Math.max(76, safeAreaInsets.top + 60)}px`,
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD52C] mx-auto"></div>
          <p className="mt-4 font-rubik text-[#1C1C1E]">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="mobile-container flex items-center justify-center"
        style={{
          paddingTop: `${Math.max(76, safeAreaInsets.top + 60)}px`,
        }}
      >
        <div className="text-center px-4">
          <p className="font-rubik text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchDucks}
            className="px-6 py-3 bg-gradient-to-b from-[#FFF382] via-[#FFD52C] to-[#FF9F0A] border border-[rgba(172,87,0,0.6)] rounded-2xl font-rubik font-bold text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      <div className="relative flex flex-col items-center w-full min-h-screen px-4" style={{ 
        paddingTop: `${Math.max(76, safeAreaInsets.top + 60)}px`,
        paddingBottom: `${100 + safeAreaInsets.bottom}px` 
      }}>
        {/* Title */}
        <div className="flex flex-col items-center gap-1 w-full max-w-[343px] pt-4 mb-7">
          <h1 className="font-rubik font-semibold text-[22px] leading-[26px] text-center text-[#1C1C1E]">
            {t.chooseDuck}
          </h1>
          <p className="font-rubik font-normal text-sm leading-[22px] text-center text-[#6E6E73]">
            {t.eachDuckOneAttempt}
          </p>
        </div>

        {/* Tab Switch */}
        <div className="w-full max-w-[343px] mb-7">
          <TabSwitch
            activeTab={activeTab}
            onTabChange={setActiveTab}
            myDucksCount={myDucks.length}
            shopDucksCount={uniqueShopDucksCount}
            myDucksLabel={t.myDucks}
            shopLabel={t.buyDucks}
          />
        </div>

        {/* Duck Cards List */}
        <div className="flex flex-col gap-[22px] w-full max-w-[343px]">
          {currentDucks.length === 0 ? (
            <div className="text-center py-8">
              <p className="font-rubik text-[#6E6E73]">
                {activeTab === "my" ? "No ducks yet" : "No ducks available"}
              </p>
            </div>
          ) : (
            currentDucks.map((duck, index) => (
              <DuckCard
                key={`${activeTab}-${duck.id}-${index}`}
                duck={duck}
                onPlayClick={handlePlayClick}
                onBuyClick={handleBuyClick}
                isShopItem={activeTab === "shop"}
                eggsPrice={eggsPrice}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
