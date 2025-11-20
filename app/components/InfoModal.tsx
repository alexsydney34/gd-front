import Image from "next/image";
import { useEffect } from "react";
import { InfoModalProps } from "../types";
import { useTranslation } from "../hooks/useTranslation";

export default function InfoModal({ isOpen, onClose }: InfoModalProps) {
  const { t } = useTranslation();
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.classList.add('hide-navigation');
    } else {
      document.body.style.overflow = "unset";
      document.body.classList.remove('hide-navigation');
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = "unset";
        document.body.classList.remove('hide-navigation');
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex justify-center items-center animate-fadeIn" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white shadow-[0px_2px_0px_rgba(0,0,0,0.25)] rounded-[20px] p-6 pb-[34px] max-w-[343px] w-full animate-scaleIn z-[100000]" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-end gap-3">
          <button 
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center bg-[#E5E7EB] hover:bg-[#D1D5DB] rounded-full transition-colors"
            aria-label="Закрыть"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z" fill="#475569"/>
            </svg>
          </button>

          <div className="flex flex-col items-center gap-[22px] w-full">
            <h2 
              id="modal-title"
              className="font-rubik font-medium text-[32px] leading-[34px] text-center tracking-[-1px] text-[#50260A]"
            >
              {t.infoModalTitle}
            </h2>

            <div className="relative w-full max-w-[255px] h-[154.32px]">
              <Image 
                src="/main/angel-egg.webp"
                alt="Angel Egg"
                width={255}
                height={154}
                className="object-contain"
              />
            </div>

            <p className="font-rubik font-medium text-xl leading-[22px] text-center text-[#1F2937] max-w-[303px]">
              {t.infoModalDesc}
            </p>

            <ul className="flex flex-col gap-[10px] w-full list-none">
              <li className="font-rubik font-normal text-base leading-[22px] text-gray">
                {t.infoModalFeature1}
              </li>
              <li className="font-rubik font-normal text-base leading-[22px] text-gray">
                {t.infoModalFeature2}
              </li>
              <li className="font-rubik font-normal text-base leading-[22px] text-gray">
                {t.infoModalFeature3}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

