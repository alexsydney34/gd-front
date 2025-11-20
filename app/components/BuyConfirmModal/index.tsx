"use client";

import { useState, useEffect } from "react";
import { DuckFromAPI } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import { useTelegram } from "../../hooks/useTelegram";
import { getDuckNameKey, getDuckImage } from "../DuckCard/utils";
import Toast from "../Toast";
import { useToast } from "../../hooks/useToast";

interface BuyConfirmModalProps {
  duck: DuckFromAPI;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<{ ok: boolean; error?: string }>;
}

export default function BuyConfirmModal({ duck, isOpen, onClose, onConfirm }: BuyConfirmModalProps) {
  const { t } = useTranslation();
  const { hapticFeedback } = useTelegram();
  const [isLoading, setIsLoading] = useState(false);
  const { toast, showSuccess, showError, hideToast } = useToast();

  // Handle ESC key and prevent body scroll
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') {
      return;
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    document.body.classList.add('hide-navigation');

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
        document.body.classList.remove('hide-navigation');
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const duckImageSrc = getDuckImage(duck.key, duck.image);
  const duckNameKey = getDuckNameKey(duck.key) as keyof typeof t;

  const handleConfirm = async () => {
    setIsLoading(true);
    hapticFeedback.impactOccurred("medium");

    try {
      const result = await onConfirm();
      
      if (!result.ok) {
        const errorMessage = getErrorMessage(result.error);
        showError(errorMessage);
        hapticFeedback.notificationOccurred("error");
      } else {
        showSuccess("Успешно");
        hapticFeedback.notificationOccurred("success");
        // Закрываем модалку через небольшую задержку, чтобы пользователь увидел toast
        setTimeout(() => {
          onClose();
        }, 500);
      }
    } catch {
      showError("Не удалось купить утку");
      hapticFeedback.notificationOccurred("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    hapticFeedback.impactOccurred("light");
    onClose();
  };

  const getErrorMessage = (errorCode?: string | null): string => {
    if (!errorCode) return t.purchaseError;
    
    const errorMessages: Record<string, string> = {
      "not enough balance": t.insufficientBalance,
      "insufficient funds": t.insufficientBalance,
      "already owned": t.alreadyOwned,
      "not available": t.notAvailable,
      "duck not found": t.duckNotFound,
      "invalid duck": t.invalidDuck,
      "server error": t.serverError,
      "network error": t.networkError,
      "Failed to buy duck": t.failedToBuyDuck
    };
    
    // Если точное совпадение найдено
    if (errorMessages[errorCode]) {
      return errorMessages[errorCode];
    }
    
    // Если содержит ключевые слова
    const lowerError = errorCode.toLowerCase();
    if (lowerError.includes('balance') || lowerError.includes('funds')) {
      return t.insufficientBalance;
    }
    if (lowerError.includes('already') || lowerError.includes('owned')) {
      return t.alreadyOwned;
    }
    if (lowerError.includes('not found') || lowerError.includes('invalid')) {
      return t.duckNotFound;
    }
    if (lowerError.includes('server') || lowerError.includes('500')) {
      return t.serverError;
    }
    if (lowerError.includes('network') || lowerError.includes('connection')) {
      return t.networkError;
    }
    
    // Общая ошибка для всех остальных случаев
    return t.tryAgainLater;
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] animate-fadeIn"
        onClick={handleCancel}
      />
      
      {/* Bottom Sheet Modal */}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-0 z-[100000] flex flex-col items-start px-4 pb-12 pt-0 gap-10 w-full max-w-[375px] bg-white rounded-t-[20px] shadow-[0px_-2px_10px_rgba(0,0,0,0.1)] animate-slideUp">
        {/* Home Indicator */}
        <div className="w-full h-[34px] flex items-end justify-center pb-2">
          <div className="w-[134px] h-[5px] bg-[#C6CFD8] rounded-[10px]" />
        </div>

        {/* Content */}
        <div className="flex flex-col items-start gap-7 w-full">
          {/* Duck Info */}
          <div className="flex flex-col justify-center items-center gap-5 w-full">
            {/* Duck Image */}
            <div 
              className="w-[157px] h-[170px]"
              style={{ 
                backgroundImage: `url(${duckImageSrc})`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            />
          </div>

          {/* Text Info */}
          <div className="flex flex-col items-start gap-1.5 w-full">
            <h2 className="font-rubik font-medium text-4xl leading-[43px] text-center uppercase text-[#1F2937] w-full">
              {t[duckNameKey]}
            </h2>
            <p className="font-rubik font-medium text-lg leading-[22px] text-center text-[#1F2937] w-full">
              {duck.eggs_per_month} EGGS {t.perMonth}
            </p>
            <p className="font-rubik font-normal text-lg leading-[22px] text-center text-[#475569] w-full">
              {t.oneAttemptPerDay}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-row items-start gap-2.5 w-full">
            {/* Buy Button */}
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`flex-1 flex flex-row justify-center items-center px-4 py-2 gap-2.5 h-14 rounded-xl transition-all bg-gradient-to-b from-[#4CD964] to-[#34C759] border border-[#169E1C] ${isLoading ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
            >
              <span className="font-rubik font-bold text-base leading-[22px] text-center text-white [text-shadow:0px_1px_0px_#158941]">
                {isLoading ? 'Обработка...' : `Купить $${duck.price}`}
              </span>
            </button>

            {/* Cancel Button */}
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="flex flex-row justify-center items-center px-4 py-2 gap-2.5 w-[124px] h-14 bg-[#F3F4F6] border border-[#C6CFD8] rounded-xl transition-transform active:scale-95 disabled:opacity-50"
            >
              <span className="font-rubik font-medium text-base leading-[22px] text-center text-[#475569]">
                Отмена
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </>
  );
}

