"use client";

import { useEffect, useState } from "react";

interface PreloaderProps {
  onComplete?: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Симуляция загрузки
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onComplete?.();
          }, 300);
          return 100;
        }
        // Быстрая загрузка в начале, замедление к концу
        const increment = prev < 70 ? 10 : prev < 90 ? 5 : 2;
        return Math.min(prev + increment, 100);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between"
      style={{
        backgroundImage: "url(/bg.webp)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full px-4">
        {/* Golden Duck Logo - same as main page */}
        <div className="flex flex-col items-center" style={{ animation: "fadeIn 0.5s ease-out" }}>
          <h1 className="title-golden text-center text-[80px] leading-[95px]">
            GOLDEN
          </h1>
          <h1 className="title-golden text-center text-[80px] leading-[95px] -mt-[25px]">
            DUCK
          </h1>
        </div>
      </div>

      {/* Progress bar at bottom */}
      <div className="relative z-10 w-full px-4 pb-8">
        <div className="w-full max-w-[343px] mx-auto flex flex-col gap-3">
          {/* Progress bar container */}
          <div className="relative w-full h-[26px] rounded-full overflow-hidden"
            style={{
              background: "linear-gradient(180deg, #72888D 0%, #B7CBCF 27.88%, #DFF2F6 44.23%)",
              border: "1px solid #FFFFFF",
              boxShadow: "0px 1px 0px rgba(0, 0, 0, 0.25), 0px 2px 4px rgba(93, 93, 93, 0.2), inset 0px 2px 0px #BDD0D5",
            }}
          >
            {/* Progress fill */}
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(180deg, #FBD90A 0%, #FFD502 49.52%, #FEAD00 100%)",
                border: "1px solid #9F4D1A",
                boxShadow: "inset 0px 4px 4px #FFE591, inset 0px 2px 0px #FCFDC1",
              }}
            />
          </div>

          {/* Loading text */}
          <div className="text-center font-rubik font-semibold text-base leading-[19px] text-white">
            Подготавливаем полет...
          </div>
        </div>
      </div>
    </div>
  );
}

