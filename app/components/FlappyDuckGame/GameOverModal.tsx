'use client';

import React from 'react';
import Image from 'next/image';
import { useTranslation } from '@/app/hooks/useTranslation';

interface GameOverModalProps {
  eggs: string; // Changed to string as per API response
  usdt: string; // Changed to string as per API response
  onRestart: () => void;
  onHome: () => void;
}

export default function GameOverModal({ eggs, usdt, onRestart, onHome }: GameOverModalProps) {
  const { t } = useTranslation();
  
  // Обрезаем СТРОКУ БЕЗ округления (не парсим в number!)
  const truncateString = (str: string, decimals: number = 2): string => {
    const dotIndex = str.indexOf('.');
    if (dotIndex === -1) return str;
    return str.substring(0, dotIndex + decimals + 1);
  };
  
  const usdtValue = truncateString(usdt || '0');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/46 backdrop-blur-[18px]" />
      
      {/* Modal */}
      <div className="relative w-[343px] bg-white rounded-[20px] shadow-[0px_2px_0px_rgba(0,0,0,0.25)] p-7 flex flex-col items-center gap-[60px]">
        <div className="flex flex-col items-center gap-12 w-full">
          {/* Title and Content */}
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="flex flex-col items-center gap-5 w-full">
              {/* Title */}
              <h1 
                className="text-[44px] font-black leading-[52px] tracking-[0.01em] uppercase text-center font-rubik"
                style={{
                  background: 'linear-gradient(177.87deg, #FFE721 23.99%, #FCC100 80.34%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  WebkitTextStroke: '2px #AC5700',
                  filter: 'drop-shadow(0px 2px 0px #AC5700)'
                }}
              >
                {t.finish}
              </h1>

              {/* Egg with Wings */}
              <div className="relative w-[271px] h-[164px] flex items-center justify-center">
                <Image
                  src="/game/finish-egg.png"
                  alt="Egg with wings"
                  width={271}
                  height={164}
                  className="object-contain"
                />
              </div>

              {/* Eggs Button */}
              <button className="w-full h-[58px] flex items-center justify-center gap-2.5 px-4 py-4 bg-gradient-to-b from-[#4CD964] to-[#34C759] border border-[#169E1C] rounded-2xl">
                <span 
                  className="text-[22px] font-medium leading-[22px] text-center uppercase text-white/80"
                  style={{
                    textShadow: '0px 1px 0px #2E7D32',
                    fontFamily: 'Rubik, sans-serif'
                  }}
                >
                  EGGS:
                </span>
                <div className="flex items-center gap-1.5">
                  <span 
                    className="text-[24px] font-bold leading-[22px] text-center uppercase text-white"
                    style={{
                      textShadow: '0px 1px 0px #2E7D32',
                      fontFamily: 'Rubik, sans-serif'
                    }}
                  >
                    +{eggs}
                  </span>
                  <Image
                    src="/game/egg.svg"
                    alt="Egg"
                    width={24}
                    height={26}
                    className="inline-block"
                  />
                </div>
              </button>
            </div>

            {/* USDT Value */}
            <p 
              className="text-2xl leading-7 text-center w-full"
              style={{ fontFamily: 'Rubik, sans-serif' }}
            >
              <span className="text-[#475569]">≈ {usdtValue}</span>{' '}
              <span className="text-[#A3AAB4]">USDT</span>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 w-full">
            {/* Play Button - Restart game */}
            <button
              onClick={onRestart}
              className="relative flex-1 h-20 flex items-center justify-center rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, #FFF382 0%, #FFD52C 48.76%, #FF9F0A 100%)',
                boxShadow: 'inset 0px -6px 0px #AC5700',
                border: '2px solid transparent',
                backgroundClip: 'padding-box',
              }}
            >
              {/* Border gradient effect */}
              <div 
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  padding: '1px',
                  background: 'linear-gradient(180deg, #C79D71 0%, #AC5700 100%)',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude'
                }}
              />
              
              {/* White oval highlight */}
              <svg className="absolute left-2 top-[7px]" style={{ filter: 'blur(1.5px)' }}>
                <ellipse cx="11" cy="9" rx="11" ry="9" fill="white" />
              </svg>
              
              {/* Play Icon */}
              <svg width="37" height="42" viewBox="0 0 37 42" fill="none" className="relative z-10">
                <path d="M33.5762 17.9233C35.5481 19.0833 35.5481 21.9353 33.5762 23.0952L5.52148 39.5981C3.52158 40.7746 0.999998 39.3325 0.999998 37.0122L1 4.00635C1 1.6861 3.52158 0.243997 5.52148 1.42041L33.5762 17.9233Z" fill="white" stroke="#AC5700" strokeWidth="2"/>
              </svg>
            </button>

            {/* Home Button - Go to main page */}
            <button
              onClick={onHome}
              className="relative flex-1 h-20 flex items-center justify-center rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, #FFF382 0%, #FFD52C 48.76%, #FF9F0A 100%)',
                boxShadow: 'inset 0px -6px 0px #AC5700',
                border: '2px solid transparent',
                backgroundClip: 'padding-box',
              }}
            >
              {/* Border gradient effect */}
              <div 
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  padding: '1px',
                  background: 'linear-gradient(180deg, #C79D71 0%, #AC5700 100%)',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude'
                }}
              />
              
              {/* White oval highlight */}
              <svg className="absolute left-2 top-[7px]" style={{ filter: 'blur(1.5px)' }}>
                <ellipse cx="11" cy="9" rx="11" ry="9" fill="white" />
              </svg>
              
              {/* Home Icon */}
              <svg width="49" height="44" viewBox="0 0 49 44" fill="none" className="relative z-10">
                <path d="M21.957 1.75C23.1402 0.750598 24.8871 0.750599 26.0703 1.75L45.9062 18.5049C48.1699 20.417 46.7341 23.9814 43.8496 23.9814H41.8594C41.3072 23.9815 40.8594 24.4293 40.8594 24.9814V39.8867C40.8594 41.6263 39.4245 43 37.7002 43H32.2217C30.5649 42.9999 29.2217 41.6568 29.2217 40V29.8496C29.2217 26.9211 26.79 24.51 23.7441 24.5098C20.6981 24.5098 18.2656 26.921 18.2656 29.8496V40C18.2656 41.6568 16.9225 43 15.2656 43H10.3271C8.60282 43 7.16797 41.6263 7.16797 39.8867V24.9814C7.16791 24.4293 6.72015 23.9815 6.16797 23.9814H4.17773C1.29319 23.9814 -0.142533 20.417 2.12109 18.5049L21.957 1.75Z" fill="white" stroke="#AC5700" strokeWidth="2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

