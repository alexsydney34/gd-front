"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTelegram } from "../hooks/useTelegram";
import { useTranslation } from "../hooks/useTranslation";
import { useToast } from "../hooks/useToast";
import Toast from "./Toast";

interface ConvertModalProps {
  isOpen: boolean;
  onClose: () => void;
  eggsBalance: number;
  usdtBalance: number;
  eggsPrice: number;
  onConvert: (amount: number) => Promise<{ ok: boolean; error?: string }>;
}

export default function ConvertModal({ isOpen, onClose, eggsBalance, usdtBalance, eggsPrice, onConvert }: ConvertModalProps) {
  const { hapticFeedback } = useTelegram();
  const { t } = useTranslation();
  const { toast, showError, hideToast } = useToast();
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const MIN_CONVERT_AMOUNT = 30;

  // Hide footer when modal is open
  useEffect(() => {
    if (isOpen && typeof document !== 'undefined') {
      document.body.classList.add('hide-navigation');
    } else if (typeof document !== 'undefined') {
      document.body.classList.remove('hide-navigation');
    }
    
    return () => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('hide-navigation');
      }
    };
  }, [isOpen]);

  // Форматирует цену с 3 знаками после точки, убирая незначащие нули
  const formatPrice = (price: number): string => {
    return price.toFixed(3).replace(/\.?0+$/, '');
  };

  if (!isOpen) return null;

  const exchangeRate = eggsPrice; // Use price from API
  const commission = 0; // 0 USDT
  const amountNum = parseFloat(amount.trim()) || 0;
  
  // Only EGGS -> USDT conversion
  const receiveAmount = amountNum * exchangeRate - commission;
  
  const isValidAmount = amountNum > 0 && amountNum <= eggsBalance + 0.01; // Add small epsilon for float comparison

  const handleMaxClick = () => {
    hapticFeedback.impactOccurred("light");
    // Используем Math.floor для округления вниз, чтобы избежать превышения баланса
    const maxAmount = Math.floor(eggsBalance * 100) / 100;
    setAmount(maxAmount.toFixed(2));
  };

  const handleConvert = async () => {
    if (!isValidAmount) {
      console.log('[ConvertModal] Invalid amount:', { amountNum, eggsBalance, isValidAmount });
      return;
    }

    // Check minimum convert amount
    if (amountNum < MIN_CONVERT_AMOUNT) {
      hapticFeedback.notificationOccurred("error");
      showError(t.minConvertAmount);
      return;
    }

    setIsLoading(true);
    hapticFeedback.impactOccurred("medium");

    console.log('[ConvertModal] Converting:', { amountNum, eggsBalance });

    try {
      const result = await onConvert(amountNum);
      if (result.ok) {
        hapticFeedback.notificationOccurred("success");
        onClose();
        setAmount("");
      } else {
        hapticFeedback.notificationOccurred("error");
        console.error('[ConvertModal] Convert failed:', result.error);
      }
    } catch (error) {
      hapticFeedback.notificationOccurred("error");
      console.error('[ConvertModal] Convert error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = () => {
    hapticFeedback.impactOccurred("light");
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] animate-fadeIn"
        onClick={handleBackdropClick}
      />

      {/* Bottom Sheet Modal */}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-0 z-[100000] flex flex-col items-start px-4 pb-12 pt-0 gap-10 w-full md:max-w-[375px] bg-white rounded-t-[20px] animate-slideUp">
        {/* Home Indicator */}
        <div className="w-full h-[34px] flex items-end justify-center">
          <div className="w-[135px] h-[5px] bg-[#C6CFD8] rounded-[10px]" />
        </div>

        {/* Content */}
        <div className="flex flex-col items-start gap-6 w-full max-w-[343px] mx-auto">
          {/* Title */}
          <h2 className="font-rubik font-medium text-4xl leading-[43px] text-center text-[#1F2937] w-full">
            {t.conversion}
          </h2>

          {/* Swap Form */}
          <div className="relative flex flex-col items-start gap-3 w-full">
            {/* From - EGGS */}
            <div className="flex flex-col items-start p-3 gap-2 w-full bg-white border border-[#E6EEF6] shadow-[0px_1px_3px_rgba(0,0,0,0.08)] rounded-2xl">
              <div className="flex flex-row justify-between items-center w-full">
                <span className="font-rubik font-normal text-sm leading-[17px] text-[#475569]">
                  {t.sending}
                </span>
                <div className="flex flex-row items-center gap-1.5">
                  <span className="font-rubik font-normal text-xs leading-[14px] text-[#1F2937]">
                    {t.availableBalance}
                  </span>
                  <div className="flex flex-row items-center gap-1">
                    <Image 
                      src="/wallet/egg.webp" 
                      alt="Egg" 
                      width={8} 
                      height={9} 
                    />
                    <span className="font-rubik font-normal text-xs leading-[14px] text-[#1F2937]">
                      {eggsBalance}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-row justify-between items-center w-full">
                <div className="flex flex-row items-center gap-1">
                  <Image 
                    src="/wallet/egg.webp" 
                    alt="Egg" 
                    width={20} 
                    height={21} 
                  />
                  <span className="font-rubik font-normal text-base leading-[19px] text-[#1F2937]">
                    EGGS
                  </span>
                </div>

                <div className="flex flex-row items-center gap-1">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="font-rubik font-normal text-lg leading-[21px] text-right text-[#475569] bg-transparent outline-none w-[80px] opacity-50 placeholder:text-[#475569] placeholder:opacity-50"
                  />
                  <span className="font-rubik font-normal text-base text-[#475569]">|</span>
                  <button
                    onClick={handleMaxClick}
                    className="font-rubik font-normal text-base leading-[19px] text-[#FFB800] transition-opacity active:opacity-70"
                  >
                    {t.max}
                  </button>
                </div>
              </div>
            </div>

            {/* Arrow Down */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-[#E6EEF6] shadow-[0px_1px_3px_rgba(0,0,0,0.08)] rounded-full flex items-center justify-center z-10">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 3V13M8 13L12 9M8 13L4 9" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* To - USDT */}
            <div className="flex flex-col items-start p-3 gap-2 w-full bg-white border border-[#E6EEF6] shadow-[0px_1px_3px_rgba(0,0,0,0.08)] rounded-2xl">
              <span className="font-rubik font-normal text-sm leading-[17px] text-[#475569]">
                {t.receiving}
              </span>

              <div className="flex flex-row justify-between items-center w-full">
                <div className="flex flex-row items-center gap-1">
                  <Image 
                    src="/wallet/tether.webp" 
                    alt="USDT" 
                    width={21} 
                    height={21} 
                  />
                  <span className="font-rubik font-normal text-base leading-[19px] text-[#1F2937]">
                    USDT
                  </span>
                </div>

                <span className="font-rubik font-normal text-2xl leading-7 text-[#1F2937]">
                  {receiveAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Exchange Rate */}
          <div className="flex flex-row items-center gap-3 w-full">
            <div className="flex-1 h-px bg-[#D9D9D9]" />
            <span className="font-rubik font-normal text-base leading-[19px] text-[#1F2937]">
              1 EGG = ${formatPrice(eggsPrice)} USDT
            </span>
            <div className="flex-1 h-px bg-[#D9D9D9]" />
          </div>

          {/* Summary */}
          <div className="flex flex-col items-start gap-2.5 w-full">
            <div className="flex flex-row justify-between items-center w-full">
              <span className="font-rubik font-normal text-sm leading-[17px] text-[#475569]">
                {t.fee}
              </span>
              <span className="font-rubik font-medium text-sm leading-[17px] text-[#1F2937]">
                {commission} USDT
              </span>
            </div>
            <div className="flex flex-row justify-between items-center w-full">
              <span className="font-rubik font-normal text-sm leading-[17px] text-[#475569]">
                {t.toReceive}
              </span>
              <span className="font-rubik font-medium text-sm leading-[17px] text-[#1F2937]">
                {receiveAmount.toFixed(2)} USDT
              </span>
            </div>
          </div>

          {/* Convert Button */}
          <button
            onClick={handleConvert}
            disabled={isLoading || !isValidAmount}
            className="flex flex-row justify-center items-center px-4 py-2 gap-2.5 w-full h-14 bg-gradient-to-b from-[#4CD964] to-[#34C759] border border-[#169E1C] rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            <span className="font-rubik font-medium text-base leading-[22px] text-center text-white [text-shadow:0px_1px_0px_#158941]">
              {isLoading ? t.processing : t.convertButton}
            </span>
          </button>
        </div>
      </div>

      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </>
  );
}

