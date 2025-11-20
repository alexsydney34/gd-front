import Image from "next/image";
import { formatTime, canPlayDuck } from "./utils";
import { DuckFromAPI } from "../../types";

interface DuckInfoProps {
  mode: 'shop' | 'myDucks';
  duck: DuckFromAPI;
  t: Record<string, string>;
  eggsPrice?: number;
}

export const DuckInfo = ({ mode, duck, t, eggsPrice }: DuckInfoProps) => {
  if (mode === 'shop') {
    return (
      <div className="flex flex-col gap-0.5">
        <p className="font-rubik font-normal text-xs leading-[14px] text-[#475569]">
          {duck.eggs_per_month.toLocaleString()} EGGS/мес
        </p>
        <div className="flex items-center gap-0.5">
          <div className="flex items-center gap-px">
            <span className="font-rubik font-medium text-xs leading-[14px] text-[#0E9F6E]">
              1
            </span>
            <Image
              src="/main/chose-duck-modal/egg.webp"
              alt="egg"
              width={7}
              height={8}
              className="scale-x-[-1]"
            />
          </div>
          <span className="font-rubik font-medium text-xs leading-[14px] text-[#0E9F6E]">
            = {duck.eggs_per_one.toFixed(2)} EGGS
          </span>
        </div>
      </div>
    );
  }

  // My Ducks mode
  if (!duck.opened) {
    return null;
  }

  // Check if duck can be played (considers lives and days)
  if (canPlayDuck(duck)) {
    return (
      <p className="font-rubik font-medium text-xs leading-4 text-[#0E9F6E]">
        {t.availableToPlay}
      </p>
    );
  }

  // If on cooldown, show time
  if (duck.seconds_to_play > 0) {
    return (
      <p className="font-rubik font-medium text-xs leading-4 text-[#475569]">
        {formatTime(duck.seconds_to_play)}
      </p>
    );
  }

  // Duck is dead (no lives, all days used)
  return (
    <p className="font-rubik font-medium text-xs leading-4 text-[#DC2626]">
      {t.unavailable}
    </p>
  );
};

