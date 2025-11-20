import Image from "next/image";
import { LeaderboardRowProps } from "../types";

export default function LeaderboardRow({ user }: LeaderboardRowProps) {
  // Определяем иконку для топ-3
  const getMedalIcon = (place: number) => {
    switch (place) {
      case 1:
        return "/rating/Gold.svg";
      case 2:
        return "/rating/Silver.svg";
      case 3:
        return "/rating/Bronze.svg";
      default:
        return null;
    }
  };

  const medalIcon = getMedalIcon(user.place);

  return (
    <div 
      className="flex flex-col items-center w-full rounded-xl bg-white"
      style={{
        padding: "7px 12px",
        gap: "10px",
        height: "50px",
        boxShadow: "0px 1px 0px rgba(0, 0, 0, 0.25)",
        boxSizing: "border-box"
      }}
    >
      <div 
        className="flex items-center justify-between"
        style={{ 
          width: "319px",
          height: "36px"
        }}
      >
        <div 
          className="flex items-center"
          style={{ 
            gap: "8px",
            width: "121px",
            height: "36px"
          }}
        >
          {medalIcon ? (
            <div 
              className="flex items-center justify-center"
              style={{ 
                width: "16px",
                height: "21px"
              }}
            >
              <Image
                src={medalIcon}
                alt={`Place ${user.place}`}
                width={16}
                height={18}
              />
            </div>
          ) : (
            <span 
              className="font-rubik font-medium text-sm leading-[150%] text-center text-[#1F2937]"
              style={{ 
                textShadow: "0px 0px 13px rgba(0, 0, 0, 0.25)",
                width: "16px",
                height: "21px"
              }}
            >
              {user.place}
            </span>
          )}
          
          <div 
            className="rounded-full overflow-hidden"
            style={{ 
              width: "32px",
              height: "32px",
              borderRadius: "50%"
            }}
          >
            <Image
              src={user.img || '/default-avatar.png'}
              alt={user.name}
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          </div>

          <div 
            className="flex flex-col justify-center items-start"
            style={{ 
              padding: "0px",
              height: "36px",
              minWidth: 0,
              flex: 1
            }}
          >
            <span 
              className="font-rubik font-medium text-base leading-[19px] text-[#1F2937]"
              style={{ 
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "block",
                width: "100%"
              }}
            >
              {user.name}
            </span>
            <div 
              className="flex items-center"
              style={{ 
                gap: "2px",
                height: "17px"
              }}
            >
              <Image
                src="/footer/noto-v1_egg.webp"
                alt="Egg"
                width={12}
                height={13}
              />
              <span 
                className="font-rubik font-medium text-sm leading-[17px] text-[#1F2937]"
                style={{ whiteSpace: "nowrap" }}
              >
                {user.eggs}
              </span>
            </div>
          </div>
        </div>

        <span 
          className="font-rubik font-medium text-base leading-[150%] text-right text-[#1F2937]"
          style={{ 
            width: "99px",
            height: "24px",
            whiteSpace: "nowrap"
          }}
        >
          {parseFloat(user.reward).toFixed(2)} USDT
        </span>
      </div>
    </div>
  );
}

