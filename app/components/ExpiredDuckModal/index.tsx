"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTelegram } from "../../hooks/useTelegram";
import { useTranslation } from "../../hooks/useTranslation";

interface ExpiredDuckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExpiredDuckModal({ isOpen, onClose }: ExpiredDuckModalProps) {
  const router = useRouter();
  const { hapticFeedback } = useTelegram();
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

  const handleChooseDuck = () => {
    hapticFeedback.impactOccurred("medium");
    onClose();
    router.push('/choose-duck');
  };

  const handleClose = () => {
    hapticFeedback.impactOccurred("light");
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] animate-fadeIn"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[100000] flex flex-col items-end p-6 pb-[34px] gap-10 w-[343px] bg-white shadow-[0px_2px_0px_rgba(0,0,0,0.25)] rounded-[20px] animate-scaleIn">
        {/* Header with close button */}
        <div className="flex flex-col items-end gap-3 w-full">
          {/* Close button */}
          <button 
            onClick={handleClose}
            className="w-6 h-6 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity"
            aria-label="Закрыть"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="#475569"/>
            </svg>
          </button>

          {/* Content container */}
          <div className="flex flex-col items-center gap-[22px] w-full">
            {/* Duck Illustration */}
            <div className="relative w-[157px] h-[170px]">
              <svg width="157" height="170" viewBox="0 0 157 170" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Duck body - dark blue */}
                <ellipse cx="78.5" cy="95" rx="53" ry="56" fill="#091A35"/>
                
                {/* Duck body gradient - lighter blue */}
                <ellipse cx="78.5" cy="95" rx="48" ry="51" fill="url(#duckGradient)"/>
                
                {/* Left wing */}
                <ellipse cx="40" cy="110" rx="20" ry="28" fill="#091A35" transform="rotate(13.57 40 110)"/>
                <ellipse cx="42" cy="112" rx="18" ry="25" fill="#19304E" transform="rotate(13.57 42 112)"/>
                
                {/* Right eye white */}
                <circle cx="68" cy="80" r="12" fill="#F5F5EF"/>
                {/* Right eye outer border */}
                <circle cx="68" cy="80" r="12" fill="#091A35" fillOpacity="0.1"/>
                {/* Right pupil */}
                <circle cx="70" cy="82" r="6" fill="#2F2115"/>
                {/* Right eye shine */}
                <circle cx="72" cy="80" r="2" fill="#F5F5EF"/>
                
                {/* Left eye white */}
                <circle cx="92" cy="75" r="8" fill="#F5F5EF"/>
                {/* Left pupil */}
                <circle cx="93" cy="76" r="4" fill="#2F2115"/>
                {/* Left eye shine */}
                <circle cx="94" cy="75" r="1.5" fill="#F5F5EF"/>
                
                {/* Beak base */}
                <path d="M86 100 L104 108 L104 95 Z" fill="#B85A06"/>
                {/* Beak gradient layer */}
                <path d="M88 102 L102 109 L102 97 Z" fill="url(#beakGradient)"/>
                {/* Beak shine */}
                <ellipse cx="95" cy="100" rx="2" ry="1" fill="#FECC2A"/>
                
                {/* Head feather */}
                <ellipse cx="78" cy="55" rx="8" ry="12" fill="#617A93" transform="rotate(-15 78 55)"/>
                
                {/* Shadow under duck */}
                <ellipse cx="78" cy="145" rx="35" ry="8" fill="#355278" opacity="0.3" style={{filter: 'blur(6px)'}}/>
                
                {/* Gradient definitions */}
                <defs>
                  <radialGradient id="duckGradient" cx="0.42" cy="0.31" r="0.5">
                    <stop offset="0%" stopColor="rgba(66, 108, 225, 0)" />
                    <stop offset="75%" stopColor="rgba(31, 58, 90, 0.2)" />
                  </radialGradient>
                  <linearGradient id="beakGradient" x1="88" y1="97" x2="102" y2="109" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FFBC14" />
                    <stop offset="100%" stopColor="#F8870A" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Title */}
            <h2 className="font-rubik font-medium text-4xl leading-[34px] text-center tracking-[-1px] uppercase text-[#1F2937] w-full">
              {t.duckFlewAway}
            </h2>
          </div>
        </div>

        {/* Text info */}
        <div className="flex flex-col items-start gap-[10px] w-full">
          <div className="flex flex-col items-center gap-3 w-full">
            <p className="font-rubik font-medium text-lg leading-[22px] text-center text-[#475569] w-full">
              {t.expiredText}
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 w-full">
            <p className="font-rubik font-medium text-lg leading-[22px] text-center text-[#475569] w-full">
              {t.chooseNewDuck}
            </p>
          </div>
        </div>

        {/* Choose Duck Button */}
        <button
          onClick={handleChooseDuck}
          className="relative flex flex-row justify-center items-center px-[9px] py-[14px] gap-[31px] w-full h-20 rounded-2xl overflow-hidden transition-transform active:scale-95 isolate"
          style={{
            background: 'linear-gradient(180deg, #C4FF77 0%, #99ED2D 48.76%, #6FB525 100%)',
            boxShadow: 'inset 0px -6px 0px #4E8712',
            border: '1px solid #4D8811'
          }}
        >
          {/* Shine effect */}
          <div 
            className="absolute w-[22px] h-[18px] top-[7px] left-2 bg-white rounded-full z-[1]"
            style={{ filter: 'blur(1.5px)' }}
          />
          
          <span 
            className="relative z-0 font-nunito font-black text-[32px] leading-[44px] tracking-[0.02em] uppercase text-white"
            style={{ textShadow: '0px 2px 0px rgba(86, 172, 0, 0.6)' }}
          >
            {t.chooseDuckButton}
          </span>
        </button>
      </div>
    </>
  );
}

