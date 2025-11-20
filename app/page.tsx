"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import EggsPriceCard from "./components/EggsPriceCard";
import GoldenDuckTitle from "./components/GoldenDuckTitle";
import PlayButton from "./components/PlayButton";
import InfoModal from "./components/InfoModal";
import WelcomeModal from "./components/WelcomeModal";
import SubscribeModal from "./components/SubscribeModal";
import Toast from "./components/Toast";
import PageLock from "./components/PageLock";
import { useTelegram } from "./hooks/useTelegram";
import { apiClient } from "./lib/api";
import { USE_DEV_TOKEN, DEV_TOKEN } from "./lib/devToken";
import { useTranslation } from "./hooks/useTranslation";
import { useToast } from "./hooks/useToast";

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [eggsPrice, setEggsPrice] = useState<number>(1.62);
  const [eggsPercent, setEggsPercent] = useState<number>(0);
  const [eggsMax, setEggsMax] = useState<number>(2.00);
  const [loading, setLoading] = useState(true);
  const { safeAreaInsets } = useTelegram();
  const router = useRouter();
  const { t, isLoading: isLanguageLoading } = useTranslation();
  const { toast, hideToast } = useToast();

  useEffect(() => {
    // Auto-set dev token if enabled
    if (USE_DEV_TOKEN && typeof window !== "undefined") {
      apiClient.setToken(DEV_TOKEN);
      console.log("🔧 Using DEV_TOKEN for testing");
    }
    
    fetchMainData();
  }, []);

  // Проверяем начальное состояние после загрузки языка
  useEffect(() => {
    if (!isLanguageLoading) {
      checkInitialState();
    }
  }, [isLanguageLoading]);

  const checkInitialState = async () => {
    if (typeof window === "undefined") return;
    
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
    const isSubscribed = localStorage.getItem("isSubscribed");
    
    if (!hasSeenWelcome) {
      // Новый пользователь - показываем welcome
      setShowWelcome(true);
      return;
    }
    
    // Если пользователь уже подписан, не проверяем снова
    if (isSubscribed === "true") {
      return;
    }
    
    // Проверяем подписку через API только если еще не подписан
    try {
      const result = await apiClient.checkSubscription();
      
      if (!result.ok) {
        // Пользователь не подписан - показываем модалку подписки
        localStorage.setItem("needsSubscribe", "true");
        setShowSubscribe(true);
      } else {
        // Пользователь подписан - сохраняем статус и убираем флаг
        localStorage.setItem("isSubscribed", "true");
        localStorage.removeItem("needsSubscribe");
      }
    } catch (err) {
      console.error("Failed to check subscription:", err);
    }
  };

  // Hide bottom navigation when welcome or subscribe modals are open
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (showWelcome || showSubscribe) {
        document.body.classList.add("hide-navigation");
      } else {
        document.body.classList.remove("hide-navigation");
      }
    }

    // Cleanup on unmount
    return () => {
      if (typeof window !== "undefined") {
        document.body.classList.remove("hide-navigation");
      }
    };
  }, [showWelcome, showSubscribe]);

  const handleWelcomeClose = async () => {
    setShowWelcome(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("hasSeenWelcome", "true");
      
      // Проверяем подписку перед показом модалки
      try {
        const result = await apiClient.checkSubscription();
        if (!result.ok) {
          // Не подписан - показываем модалку
          setShowSubscribe(true);
        } else {
          // Подписан - сохраняем статус
          localStorage.setItem("isSubscribed", "true");
        }
      } catch (err) {
        console.error("Failed to check subscription:", err);
        // В случае ошибки показываем модалку
        setShowSubscribe(true);
      }
    }
  };

  const handleWelcomeSkip = () => {
    setShowWelcome(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("hasSeenWelcome", "true");
      localStorage.setItem("needsSubscribe", "true");
    }
    setShowSubscribe(true);
  };

  const handleSubscribeClose = async () => {
    // Проверяем подписку при закрытии модалки
    try {
      const result = await apiClient.checkSubscription();
      
      if (result.ok) {
        // Пользователь подписан - закрываем модалку и сохраняем статус
        setShowSubscribe(false);
        if (typeof window !== "undefined") {
          localStorage.setItem("isSubscribed", "true");
          localStorage.removeItem("needsSubscribe");
        }
      } else {
        // Пользователь всё ещё не подписан - модалка остаётся открытой
        console.log("User is not subscribed yet");
      }
    } catch (err) {
      console.error("Failed to verify subscription:", err);
      // В случае ошибки закрываем модалку
      setShowSubscribe(false);
    }
  };

  const fetchMainData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getWallet(1, 0);
      
      if (response.data) {
        setEggsPrice(response.data.eggs_price);
        setEggsPercent(response.data.eggs_percent || 0);
        setEggsMax(response.data.eggs_max || 2.00);
      }
    } catch (err) {
      console.error("Failed to load main page data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress (using data from backend)
  const minPrice = eggsPrice; // Use current eggs_price from API
  const maxPrice = eggsMax; // Use eggs_max from API
  const progress = ((eggsPrice - 1.00) / (maxPrice - 1.00) * 100);
  
  // Use eggs_percent * 100 from backend
  const percentageValue = eggsPercent * 100;
  const percentageStr = percentageValue.toFixed(1);

  // Форматирует цену с 3 знаками после точки, убирая незначащие нули
  const formatPrice = (price: number): string => {
    return `$${price.toFixed(3).replace(/\.?0+$/, '')}`;
  };

  const content = (
    <div className="mobile-container">
      {/* Main content */}
      <div className="relative flex flex-col items-center w-full" style={{ 
        minHeight: '100vh', 
        paddingTop: `${Math.max(76, safeAreaInsets.top + 60)}px`,
        paddingBottom: `${100 + safeAreaInsets.bottom}px` 
      }}>
        {/* EggsPriceCard - фиксированная высота чтобы не сдвигать контент */}
        <div className="w-full flex justify-center mb-24">
          {loading ? (
            <div className="flex items-center justify-center w-full h-[200px]">
              <p className="font-rubik text-[#6E6E73]">{t.loading}</p>
            </div>
          ) : (
            <EggsPriceCard
              price={formatPrice(eggsPrice)}
              percentage={`${percentageValue >= 0 ? '+' : ''}${percentageStr}%`}
              progress={progress}
              minPrice={formatPrice(minPrice)}
              maxPrice={formatPrice(maxPrice)}
              onInfoClick={() => setShowModal(true)}
            />
          )}
        </div>

        <GoldenDuckTitle />

        {/* Spacer to push button down */}
        <div className="flex-1"></div>

        <PlayButton onClick={() => router.push("/choose-duck")} />
      </div>

      <InfoModal isOpen={showModal} onClose={() => setShowModal(false)} />
      <WelcomeModal isOpen={showWelcome} onClose={handleWelcomeClose} onSkip={handleWelcomeSkip} />
      <SubscribeModal isOpen={showSubscribe} onClose={handleSubscribeClose} />
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );

  // Временно блокируем главную страницу
  return <PageLock isLocked={false}>{content}</PageLock>;
}
