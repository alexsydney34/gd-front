"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslation } from "../hooks/useTranslation";
import { useTelegram } from "../hooks/useTelegram";
import { apiClient } from "../lib/api";
import Toast from "./Toast";

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubscribeModal({ isOpen, onClose }: SubscribeModalProps) {
  const { t } = useTranslation();
  const { hapticFeedback, webApp } = useTelegram();
  const [isChecking, setIsChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [hasClickedSubscribe, setHasClickedSubscribe] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  if (!isOpen) return null;

  const handleButtonClick = async () => {
    if (!hasClickedSubscribe) {
      // Первый клик - открыть канал
      hapticFeedback.impactOccurred("medium");
      const channelUrl = "https://t.me/GoldenDuckru";
      
      // Используем Telegram WebApp API для открытия ссылки без закрытия приложения
      if (webApp?.openTelegramLink) {
        webApp.openTelegramLink(channelUrl);
      } else {
        // Fallback для desktop или если метод не поддерживается
        window.open(channelUrl, "_blank");
      }
      
      setHasClickedSubscribe(true);
      setErrorMessage("");
    } else {
      // Второй клик - проверить подписку
      setIsChecking(true);
      setErrorMessage("");
      hapticFeedback.impactOccurred("light");
      
      try {
        const response = await apiClient.checkSubscription();
        
        if (response.ok) {
          // Subscribed successfully
          hapticFeedback.notificationOccurred("success");
          setShowSuccessToast(true);
          setTimeout(() => {
            onClose();
          }, 2000); // Закрываем модалку через 2 секунды после показа Toast
        } else {
          // Not subscribed yet
          hapticFeedback.notificationOccurred("error");
          setErrorMessage(t.notSubscribed);
        }
      } catch (error) {
        console.error("Subscription check error:", error);
        hapticFeedback.notificationOccurred("error");
        setErrorMessage(t.notSubscribed);
      } finally {
        setIsChecking(false);
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center animate-fadeIn"
      style={{
        backgroundImage: "url(/bg.webp)",
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      {/* Content */}
      <div className="flex flex-col items-center w-full max-w-[375px] px-4 pt-[100px]">
        {/* Title */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <h1 className="font-rubik font-black text-[40px] leading-[47px] text-center uppercase tracking-[0.01em]"
            style={{
              background: 'linear-gradient(177.87deg, #FFE721 23.99%, #FCC100 80.34%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              WebkitTextStroke: '2px #AC5700',
              filter: 'drop-shadow(0px 2px 0px #AC5700)'
            }}
          >
            {t.subscribeTitle1}
          </h1>
          <h1 className="font-rubik font-black text-[40px] leading-[47px] text-center uppercase tracking-[0.01em] -mt-2"
            style={{
              background: 'linear-gradient(177.87deg, #FFE721 23.99%, #FCC100 80.34%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              WebkitTextStroke: '2px #AC5700',
              filter: 'drop-shadow(0px 2px 0px #AC5700)'
            }}
          >
            {t.subscribeTitle2}
          </h1>
          <p className="font-rubik font-medium text-base leading-[19px] text-center text-[#475569]">
            {t.subscribeSubtitle}
          </p>
        </div>

        {/* Duck Icon */}
        <div className="w-[360px] h-[338px] mb-6 flex flex-col items-center justify-center">
          <div className="relative w-[200px] h-[200px]">
            <Image
              src="/game/duckbody/gray.svg"
              alt="Gray Duck"
              width={200}
              height={200}
              className="object-contain"
            />
          </div>
        </div>

        {/* Single Button */}
        <div className="w-full max-w-[343px] flex flex-col gap-4">
          <button
            onClick={handleButtonClick}
            disabled={isChecking}
            className="relative flex items-center justify-center w-full h-20 rounded-2xl overflow-hidden transition-all active:scale-95 disabled:opacity-70"
            style={{
              background: hasClickedSubscribe 
                ? 'linear-gradient(180deg, #4CD964 0%, #34C759 100%)'
                : 'linear-gradient(180deg, #FFF382 0%, #FFD52C 48.76%, #FF9F0A 100%)',
              boxShadow: hasClickedSubscribe
                ? 'inset 0px -6px 0px #169E1C'
                : 'inset 0px -6px 0px #AC5700',
              border: hasClickedSubscribe
                ? '1px solid #169E1C'
                : '1px solid #AC5700'
            }}
          >
            {/* Shine effect */}
            <div 
              className="absolute w-[22px] h-[18px] top-[7px] left-2 bg-white rounded-full"
              style={{ filter: 'blur(1.5px)' }}
            />
            
            <span 
              className="relative z-10 font-nunito font-black text-[34px] leading-[46px] tracking-[0.02em] uppercase text-white"
              style={{ 
                textShadow: hasClickedSubscribe
                  ? '0px 2px 0px rgba(21, 128, 61, 0.6)'
                  : '0px 2px 0px rgba(172, 87, 0, 0.6)'
              }}
            >
              {isChecking 
                ? t.checkingSubscription 
                : hasClickedSubscribe 
                  ? t.checkSubscription 
                  : t.subscribeButton}
            </span>
          </button>

          {/* Error message */}
          {errorMessage && (
            <p className="font-rubik font-black text-lg leading-[21px] uppercase text-red-500 text-center">
              {errorMessage}
            </p>
          )}
        </div>
      </div>

      {/* Success Toast */}
      <Toast
        message={t.duckReceived}
        type="success"
        isVisible={showSuccessToast}
        onClose={() => setShowSuccessToast(false)}
        duration={2000}
      />
    </div>
  );
}

