import Image from "next/image";
import { EggsPriceCardProps } from "../types";

export default function EggsPriceCard({
  price,
  percentage,
  progress,
  minPrice,
  maxPrice,
  onInfoClick,
}: EggsPriceCardProps) {
  return (
    <div className="card mb-4 w-full max-w-[343px] p-2">
      <div className="px-3">
        <div className="flex items-center gap-1 mb-2">
          <Image 
            src="/main/duck.webp"
            alt="Duck"
            width={54}
            height={55}
            priority
          />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="font-rubik font-semibold text-base text-[#50260A]">
                EGGS Price
              </span>
              <button 
                onClick={onInfoClick} 
                className="cursor-pointer bg-transparent border-none p-0 hover:opacity-70 transition-opacity"
                aria-label="Information"
              >
                <Image 
                  src="/lucide_info.webp"
                  alt="Info"
                  width={16}
                  height={16}
                  style={{ width: 'auto', height: 'auto' }}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-rubik font-black text-[28px] leading-[33px] tracking-[0.02em] uppercase price-badge">
                {price}
              </span>
              <div className="percentage-badge flex items-center justify-center px-[7px] py-1">
                <span className="font-rubik font-semibold text-xs leading-[22px] text-center">
                  {percentage}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mb-2 w-full max-w-[319px] h-6">
          <div className="progress-container top-[7px]">
            <div className="progress-bar" style={{ width: `${progress}%` }}>
              <Image 
                src="/footer/noto-v1_egg.webp"
                alt="Egg"
                width={22}
                height={24}
                className="absolute -top-[7px] -right-[11px]"
                style={{ width: 'auto', height: 'auto' }}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <span className="font-rubik font-medium text-xs leading-[14px] text-center text-gray">
            {minPrice}
          </span>
          <span className="font-rubik font-medium text-xs leading-[14px] text-center text-gray">
            {maxPrice}
          </span>
        </div>
      </div>
    </div>
  );
}

