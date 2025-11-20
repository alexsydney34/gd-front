import Image from "next/image";
import { TopWinnerProps } from "../types";

export default function TopWinner({ user, medalIcon }: TopWinnerProps) {
  // Позиции для аватарок: подняли выше чтобы убрать отступ снизу
  const sizes = {
    1: { width: 111, height: 161, avatarPos: { top: 6, left: 4.5 }, avatarSize: 102 },
    2: { width: 94, height: 126, avatarPos: { top: 0, left: 5.5 }, avatarSize: 83 },
    3: { width: 87, height: 117, avatarPos: { top: 0, left: 7 }, avatarSize: 73 }
  };

  const size = sizes[user.place as 1 | 2 | 3];

  return (
    <div 
      className="flex flex-col items-center gap-[7px]" 
      style={{ width: `${size.width}px`, minHeight: `${size.height}px` }}
    >
      <div className="flex flex-col items-center gap-1">
        <div className="relative">
          <div 
            className="absolute rounded-full overflow-hidden"
            style={{ 
              top: `${size.avatarPos.top}px`, 
              left: `${size.avatarPos.left}px`,
              width: `${size.avatarSize}px`,
              height: `${size.avatarSize}px`
            }}
          >
            <Image
              src={user.img || '/default-avatar.png'}
              alt={user.name}
              width={size.avatarSize}
              height={size.avatarSize}
              className="w-full h-full object-cover"
            />
          </div>
          
          <img
            src={medalIcon}
            alt={`Rank ${user.place}`}
            className="relative z-10 drop-shadow-md"
          />
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <span className="font-medium text-sm leading-4 text-[#1F2937]">
            {user.name}
          </span>
          <div className="flex items-center gap-0.5">
            <Image
              src="/footer/noto-v1_egg.webp"
              alt="Egg"
              width={12}
              height={13}
            />
            <span className="font-medium text-xs leading-4 text-[#1F2937]">
              {user.eggs}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

