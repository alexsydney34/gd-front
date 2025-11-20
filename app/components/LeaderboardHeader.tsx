import { useState, useEffect } from "react";
import { useTranslation } from "../hooks/useTranslation";

interface LeaderboardHeaderProps {
  prizePool: number;
  endsIn: number; // секунды до конца
}

export default function LeaderboardHeader({ prizePool, endsIn }: LeaderboardHeaderProps) {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(endsIn);

  useEffect(() => {
    setTimeLeft(endsIn);
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [endsIn]);

  const formatTimeLeft = (seconds: number): string => {
    if (seconds <= 0) return "0d 0h 0m";
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${days.toString().padStart(2, '0')}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
  };

  return (
    <div className="flex flex-col items-center px-3 py-3 gap-2.5 w-full max-w-[343px] bg-white shadow-[0px_2px_0px_rgba(0,0,0,0.25)] rounded-xl">
      {/* Title and Description */}
      <div className="flex flex-col items-center gap-1 w-full">
        <h2 className="font-rubik font-semibold text-[22px] leading-[26px] text-center text-[#1C1C1E] w-full">
          {t.ratingTitle} TOP 15
        </h2>
        <p className="font-rubik font-normal text-sm leading-5 text-center text-[#6E6E73] max-w-[318px]">
          {t.ratingDesc}
        </p>
      </div>

      {/* Prize Pool and Timer */}
      <div className="flex flex-row justify-center items-center px-3 py-2.5 gap-10 w-full bg-white border border-[#E6EEF6] shadow-[0px_1px_3px_rgba(0,0,0,0.08)] rounded-xl">
        {/* Prize Pool */}
        <div className="flex flex-col items-start gap-0.5">
          <span className="font-rubik font-medium text-sm leading-[17px] text-[#1F2937]">
            {t.prizePool}
          </span>
          <span className="font-rubik font-semibold text-base leading-[19px] text-center capitalize text-[#0E9F6E]">
            +{prizePool.toFixed(2)} USDT
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-[39px] bg-[#E6EEF6]" />

        {/* Ends In */}
        <div className="flex flex-col items-start gap-0.5">
          <span className="font-rubik font-medium text-sm leading-[17px] text-[#1F2937]">
            {t.competitionEnds}
          </span>
          <span className="font-rubik font-medium text-base leading-[19px] text-center capitalize text-[#1F2937]">
            {formatTimeLeft(timeLeft)}
          </span>
        </div>
      </div>
    </div>
  );
}

