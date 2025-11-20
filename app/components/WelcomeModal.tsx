"use client";

import { useState, useRef } from "react";
import { useTranslation } from "../hooks/useTranslation";
import { useTelegram } from "../hooks/useTelegram";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSkip?: () => void;
}

export default function WelcomeModal({ isOpen, onClose, onSkip }: WelcomeModalProps) {
  const { t } = useTranslation();
  const { hapticFeedback } = useTelegram();
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!isOpen) return null;

  const handlePlay = () => {
    hapticFeedback.impactOccurred("medium");
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSkip = () => {
    hapticFeedback.impactOccurred("light");
    if (onSkip) {
      onSkip();
    } else {
      onClose();
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    onClose();
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
            {t.welcomeTitle1}
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
            {t.welcomeTitle2}
          </h1>
          <p className="font-rubik font-medium text-base leading-[19px] text-center text-[#475569]">
            {t.welcomeSubtitle}
          </p>
        </div>

        {/* Video Container */}
        <div className="relative w-full max-w-[343px] bg-white p-2 rounded-2xl shadow-[0px_2px_0px_rgba(0,0,0,0.25)] mb-0">
          <div className="relative w-full aspect-[327/371] rounded-[10px] overflow-hidden flex items-center justify-center">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              onEnded={handleVideoEnd}
              playsInline
              controls={isPlaying}
              preload="auto"
              poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='327' height='371'%3E%3Crect width='327' height='371' fill='%23000'/%3E%3C/svg%3E"
            >
              <source src="/start-movie.mp4" type="video/mp4" />
            </video>
            
            {!isPlaying && (
              <button
                onClick={handlePlay}
                className="relative z-10 w-10 h-[34px] transition-transform active:scale-95"
              >
                <svg width="40" height="42" viewBox="0 0 37 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M33.5762 17.9233C35.5481 19.0833 35.5481 21.9353 33.5762 23.0952L5.52148 39.5981C3.52158 40.7746 0.999998 39.3325 0.999998 37.0122L1 4.00635C1 1.6861 3.52158 0.243997 5.52148 1.42041L33.5762 17.9233Z" fill="white" stroke="#475569" strokeWidth="2"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Watch Button */}
        <button
          onClick={handlePlay}
          className="relative flex items-center justify-center w-[236px] h-20 rounded-2xl overflow-hidden transition-transform active:scale-95 -top-[50px] -mb-2"
          style={{
            background: 'linear-gradient(180deg, #FFF382 0%, #FFD52C 48.76%, #FF9F0A 100%)',
            boxShadow: 'inset 0px -6px 0px #AC5700',
            border: '1px solid #AC5700'
          }}
        >
          {/* Shine effect */}
          <div
            className="absolute w-[22px] h-[18px] top-[7px] left-2 bg-white rounded-full"
            style={{ filter: 'blur(1.5px)' }}
          />

          <span
            className="relative z-10 font-nunito font-black text-[34px] leading-[46px] tracking-[0.02em] uppercase text-white"
            style={{ textShadow: '0px 2px 0px rgba(172, 87, 0, 0.6)' }}
          >
            {t.watchButton}
          </span>
          
        </button>
        {/* Skip Button */}
        <button
          onClick={handleSkip}
          className="-mt-2 relative flex flex-col items-center gap-0.5 opacity-64 transition-opacity hover:opacity-100 -top-[55px]"
        >
          <span className="font-rubik text-base leading-[19px] text-white">
            {t.skip}
          </span>
          <div className="w-full h-px bg-white rounded-full" />
        </button>
       
      </div>
    </div>
  );
}

