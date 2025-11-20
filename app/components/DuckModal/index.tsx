"use client";

import { useEffect } from "react";
import Image from "next/image";
import { DuckFromAPI } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import { getDuckNameKey, getDuckImage, formatTime } from "../DuckCard/utils";

interface DuckModalProps {
  duck: DuckFromAPI;
  isOpen: boolean;
  onClose: () => void;
  isShopItem?: boolean;
  eggsPrice?: number;
}

export default function DuckModal({ duck, isOpen, onClose, isShopItem = false, eggsPrice }: DuckModalProps) {
  const { t } = useTranslation();

  // Handle ESC key and prevent body scroll
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

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

  const renderAvailabilityBadge = () => {
    if (isShopItem) return null;

    if (!duck.opened) {
      return (
        <div className="flex flex-row justify-center items-center px-5 py-1.5 gap-2.5 w-[233px] h-[34px] bg-[#FFF9E6] rounded-[100px]">
          <span className="font-rubik font-normal text-base leading-[22px] text-center text-[#FFB800]">
            {t.soonButton}
          </span>
        </div>
      );
    }

    if (duck.seconds_to_play > 0) {
      return (
        <div className="flex flex-row justify-center items-center px-5 py-1.5 gap-2.5 w-[233px] h-[34px] bg-[#FFF9E6] rounded-[100px]">
          <span className="font-rubik font-normal text-base leading-[22px] text-center text-[#FFB800]">
            {t.availableIn} {formatTime(duck.seconds_to_play)}
          </span>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[100000] flex flex-col items-end p-6 pb-[34px] gap-7 w-[343px] bg-white shadow-[0px_2px_0px_rgba(0,0,0,0.25)] rounded-[20px] animate-scaleIn">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center bg-[#E5E7EB] hover:bg-[#D1D5DB] rounded-full transition-colors"
          aria-label="Закрыть"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z" fill="#475569"/>
          </svg>
        </button>

        {/* Content */}
        <div className="flex flex-col items-center gap-[22px] w-full">
          {/* Duck Image - Large */}
          <div 
            className="w-[157px] h-[170px]"
            style={{ 
              backgroundImage: `url(${duckImageSrc})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />

          {/* Duck Name */}
          <h2 className="font-rubik font-medium text-4xl leading-[34px] text-center tracking-[-1px] uppercase text-[#1F2937] w-full">
            {t[duckNameKey]}
          </h2>
        </div>

        {/* Info Section */}
        <div className="flex flex-col items-start gap-3 w-full">
          <h3 className="font-rubik font-medium text-lg leading-[22px] text-[#475569] w-full">
            {t.indicators}
          </h3>

          <div className="flex flex-col items-start gap-2.5 w-full">
            {/* Income per month */}
            {isShopItem && (
              <p className="font-rubik font-normal text-base leading-[22px] text-[#475569] w-full">
                {t.profitability} ~ {duck.eggs_per_month.toLocaleString()} EGGS / мес
              </p>
            )}

            {/* Egg rate */}
            <div className="flex flex-row items-start gap-2.5 w-full">
              <span className="font-rubik font-normal text-base leading-[22px] text-[#475569]">
                {t.eggRate}
              </span>
              <div className="flex flex-row items-center gap-0.5 flex-1">
                <span className="font-rubik font-normal text-base leading-[22px] text-[#475569]">
                  1
                </span>
                <Image
                  src="/main/chose-duck-modal/egg.webp"
                  alt="egg"
                  width={10}
                  height={12}
                  className="scale-x-[-1]"
                />
                <span className="font-rubik font-normal text-base leading-[22px] text-[#475569]">
                  = {duck.eggs_per_one.toFixed(2)} EGGS
                </span>
              </div>
            </div>

            {/* Remaining days */}
            {!isShopItem && duck.curent_from && duck.curent_from.from > 0 && (
              <div className="flex flex-row items-start gap-1 w-full">
                <span className="font-rubik font-normal text-base leading-[22px] text-[#475569]">
                  {t.remainingTerm}
                </span>
                <span className="font-rubik font-normal text-base leading-[22px] text-[#475569]">
                  {duck.curent_from.curent}/{duck.curent_from.from} {t.days}
                </span>
              </div>
            )}

            {/* Availability badge */}
            {renderAvailabilityBadge()}
          </div>
        </div>
      </div>
    </>
  );
}

