"use client";

import { useRouter } from "next/navigation";

interface PageLockProps {
  children: React.ReactNode;
  isLocked?: boolean;
}

export default function PageLock({ children, isLocked = true }: PageLockProps) {
  const router = useRouter();

  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <div className="relative w-full h-full">
      {/* Content БЕЗ размытия, он будет показываться */}
      <div className="relative w-full h-full">
        {children}
      </div>

      {/* Overlay с backdrop-filter blur и контентом - поверх основного контента но ПОД футером */}
      <div 
        className="fixed inset-0 z-[40] flex flex-col items-center justify-center"
        style={{ 
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          WebkitBackdropFilter: 'blur(8px)',
          paddingBottom: '100px'
        }}
      >
        <div className="flex flex-col items-center gap-10 px-6">
          {/* Lock icon */}
          <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center shadow-2xl">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M17 11H7C5.89543 11 5 11.8954 5 13V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V13C19 11.8954 18.1046 11 17 11Z"
                stroke="#1C1C1E"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 17C12.5523 17 13 16.5523 13 16C13 15.4477 12.5523 15 12 15C11.4477 15 11 15.4477 11 16C11 16.5523 11.4477 17 12 17Z"
                fill="#1C1C1E"
              />
              <path
                d="M8 11V7C8 5.93913 8.42143 4.92172 9.17157 4.17157C9.92172 3.42143 10.9391 3 12 3C13.0609 3 14.0783 3.42143 14.8284 4.17157C15.5786 4.92172 16 5.93913 16 7V11"
                stroke="#1C1C1E"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Text with better contrast */}
          <div className="flex flex-col items-center gap-4">
            <h2 className="font-rubik font-bold text-[32px] text-white text-center drop-shadow-2xl" style={{ textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
              Скоро старт
            </h2>
            <p className="font-nunito text-[17px] text-white text-center max-w-[280px] leading-relaxed drop-shadow-xl" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
              Приглашайте друзей, чтобы первыми узнать о запуске!
            </p>
          </div>

          {/* Красивая кнопка */}
          <button
            onClick={() => router.push("/referral")}
            className="relative overflow-hidden px-14 py-5 bg-gradient-to-r from-[#FFD700] via-[#FFC700] to-[#FFD700] rounded-[20px] font-rubik font-bold text-[18px] text-[#1C1C1E] shadow-2xl hover:shadow-3xl transition-all duration-300 active:scale-95 min-w-[260px]"
            style={{
              boxShadow: '0 8px 24px rgba(255, 215, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.2)',
            }}
          >
            <span className="relative z-10">Пригласить друзей</span>
            <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent opacity-50"></div>
          </button>
        </div>
      </div>
    </div>
  );
}

