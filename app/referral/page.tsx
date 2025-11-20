"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient, RefsResponse } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useTelegram } from "../hooks/useTelegram";
import { useTranslation } from "../hooks/useTranslation";
import Image from "next/image";
import Preloader from "../components/Preloader";
import { DUCK_NAME_TO_KEY } from "../components/DuckCard/constants";

export default function ReferralPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { safeAreaInsets, hapticFeedback, copyToClipboard } = useTelegram();
  const { t } = useTranslation();
  const [refsData, setRefsData] = useState<RefsResponse | null>(null);

  // Функция для перевода названия утки
  const translateDuckName = (duckName: string): string => {
    const key = DUCK_NAME_TO_KEY[duckName];
    if (key && t[key as keyof typeof t]) {
      return t[key as keyof typeof t] as string;
    }
    return duckName; // Возвращаем оригинал, если перевод не найден
  };
  const [loading, setLoading] = useState(true);
  const [activeLine, setActiveLine] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchRefs = async () => {
      // Для тестирования - моковые данные
      if (!isAuthenticated) {
        const mockData: RefsResponse = {
          levels: [
            {
              level: 1,
              duck_name: "Красная утка",
              percent: 10,
              deposit: 50,
              opened: true,
            },
            {
              level: 2,
              duck_name: "Синяя утка",
              percent: 10,
              deposit: 175,
              opened: false,
            },
            {
              level: 3,
              duck_name: "Розовая утка",
              percent: 10,
              deposit: 400,
              opened: false,
            },
            {
              level: 4,
              duck_name: "Оранжевая утка",
              percent: 10,
              deposit: 800,
              opened: false,
            },
          ],
          lines: [
            {
              line: 1,
              partners_count: 3,
              active_partners_count: 3,
              total_ducks: 3,
              profit: 100,
              volume: 150,
              users: [
                { name: "Marsha Fisher", profit: 100, volume: 100, img: "" },
                { name: "John Doe", profit: 100, volume: 100, img: "" },
                { name: "Jane Smith", profit: 100, volume: 100, img: "" },
              ],
            },
            {
              line: 2,
              partners_count: 0,
              active_partners_count: 0,
              total_ducks: 0,
              profit: 0,
              volume: 0,
              users: [],
            },
            {
              line: 3,
              partners_count: 0,
              active_partners_count: 0,
              total_ducks: 0,
              profit: 0,
              volume: 0,
              users: [],
            },
            {
              line: 4,
              partners_count: 0,
              active_partners_count: 0,
              total_ducks: 0,
              profit: 0,
              volume: 0,
              users: [],
            },
          ],
          my_link: "https://t.me/GoldenDuckgamebot?start=ref123",
          pdf_link: "/team/GOLDEN DACK (2).pdf",
          your_income: "100.00",
          team_turnover: "150.00",
        };
        setRefsData(mockData);
        setLoading(false);
        return;
      }

      const response = await apiClient.getRefs();
      if (response.data) {
        setRefsData(response.data);
      }
      setLoading(false);
    };

    if (!isLoading) {
      fetchRefs();
    }
  }, [isAuthenticated, isLoading]);

  const copyLink = async () => {
    if (refsData?.my_link) {
      try {
        await copyToClipboard(refsData.my_link);
        hapticFeedback.notificationOccurred("success");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
        hapticFeedback.notificationOccurred("error");
      }
    }
  };

  const shareLink = () => {
    if (refsData?.my_link) {
      hapticFeedback.impactOccurred("medium");
      const text = `Присоединяйся к Golden Duck! 🦆`;
      const url = `https://t.me/share/url?url=${encodeURIComponent(refsData.my_link)}&text=${encodeURIComponent(text)}`;
      window.open(url, "_blank");
    }
  };

  
  const downloadPDF = async () => {
    hapticFeedback.impactOccurred("medium");
    try {
      const response = await apiClient.requestPDF();
      if (response.ok) {
        hapticFeedback.notificationOccurred("success");
      } else {
        hapticFeedback.notificationOccurred("error");
        console.error("PDF request failed:", response.error);
      }
    } catch (error) {
      hapticFeedback.notificationOccurred("error");
      console.error("PDF request error:", error);
    }
  };

  if (loading || isLoading) {
    return <Preloader />;
  }

  const currentLine = refsData?.lines?.[activeLine];
  const hasUsers = currentLine?.users && currentLine.users.length > 0;

  return (
    <div className="relative w-full min-h-screen">
      {/* Scrollable Content */}
      <div 
        className="flex flex-col items-center w-full"
        style={{ 
          paddingTop: `${Math.max(76, safeAreaInsets.top + 60)}px`,
          paddingBottom: `${100 + safeAreaInsets.bottom}px`,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Header */}
        <h1 className="font-rubik font-semibold text-[22px] leading-[26px] text-center text-[#1F2937] mb-5 px-4">
          {t.myTeam}
        </h1>

        {/* Main Content */}
        <div className="w-full flex flex-col items-center gap-5" style={{ paddingBottom: `${100 + safeAreaInsets.bottom}px` }}>
          
          {/* Income Card */}
          <div className="w-full max-w-[343px] px-4">
            <div className="w-full bg-white border-b-[1px] border-[#63A9B8] shadow-[0px_2px_0px_rgba(0,0,0,0.25)] rounded-2xl p-4 flex flex-col gap-[10px] transition-all duration-300 hover:shadow-[0px_4px_0px_rgba(0,0,0,0.25)]">
              <h2 className="font-rubik font-semibold text-lg leading-[21px] text-[#1F2937]">{t.referralIncome}</h2>
              <div className="flex gap-[10px]">
                <div className="flex-1 flex flex-col gap-1 justify-center">
                  <div className="font-rubik text-base leading-[19px] text-[#0E9F6E]">{t.yourIncome}</div>
                  <div className="font-rubik font-medium text-[28px] leading-[33px] text-[#1F2937]">
                    ${refsData?.your_income || "0.00"}
                  </div>
                </div>
                <div className="w-px bg-[#E6EEF6] self-stretch"></div>
                <div className="flex-1 flex flex-col gap-1 justify-center">
                  <div className="font-rubik text-base leading-[19px] text-[#475569]">{t.teamTurnover}</div>
                  <div className="font-rubik font-medium text-[28px] leading-[33px] text-[#1F2937]">
                    ${refsData?.team_turnover || "0.00"}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Level Cards - Dynamic - Full width horizontal scroll */}
          <div className="w-full md:flex md:justify-center">
            <div className="flex gap-3 overflow-x-auto pb-2 pl-4 pr-4 md:max-w-[314px]" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {refsData?.levels?.map((level, index) => (
              <div
                key={level.level}
                className={`w-[271px] flex-shrink-0 bg-white shadow-[0px_2px_0px_rgba(0,0,0,0.25)] rounded-2xl p-3 flex flex-col gap-[14px] transition-all duration-300 ${
                  level.opened ? 'border border-[#0E9F6E]' : ''
                }`}
                style={{ 
                  animation: `slideInRight 0.3s ease-out ${index * 0.1}s both`
                }}
              >
                <div className={`flex items-center justify-between ${!level.opened ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-1.5">
                    <h3 className={`font-rubik font-semibold text-lg leading-[21px] ${level.opened ? 'text-[#1F2937]' : 'text-[#475569]'}`}>
                      {t.line} {level.level}
                    </h3>
                    <div className={`px-2.5 py-1 rounded-[100px] font-rubik text-sm leading-[22px] transition-all duration-200 ${
                      level.opened ? 'bg-[#FFB800] text-[#1F2937]' : 'bg-[#F3F4F6] text-[#475569]'
                    }`}>
                      {level.percent}%
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-[100px] font-rubik text-sm leading-[22px] transition-all duration-200 ${
                    level.opened 
                      ? 'bg-[#DCFCE7] text-[#166534]' 
                      : 'bg-[#F1F5F9] text-[#475569]'
                  }`}>
                    {level.opened ? t.active : t.inactive}
                  </div>
                </div>
                <div className={`flex flex-col gap-1 ${!level.opened ? 'opacity-50' : ''}`}>
                  <div className={`font-rubik text-base leading-[19px] ${level.opened ? 'text-[#475569]' : 'text-[#475569]'}`}>{t.activationConditions}</div>
                  <div className="flex items-center gap-1.5">
                    {level.opened ? (
                      <>
                        <Image src="/team/material-symbols_check-rounded.webp" width={20} height={20} alt="check" className="transition-transform duration-200 hover:scale-110" />
                        <div className="font-rubik font-medium text-base leading-[19px] text-[#0E9F6E]">
                          {translateDuckName(level.duck_name)} — ${level.deposit}
                        </div>
                      </>
                    ) : (
                      <>
                        <Image src="/team/material-symbols_lock.webp" width={20} height={20} alt="lock" />
                        <div className="font-rubik font-medium text-base leading-[19px] text-[#475569]">
                          {translateDuckName(level.duck_name)} — ${level.deposit}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              ))}
            </div>
          </div>

          {/* Invite Buttons and Team Section */}
          <div className="w-full max-w-[343px] px-4 flex flex-col gap-5">
            
          {/* Invite Buttons */}
          <div className="flex flex-col gap-[14px]">
            <div className="bg-white shadow-[0px_2px_0px_rgba(0,0,0,0.25)] rounded-2xl p-4 flex gap-[10px] transition-all duration-300">
              <button
                onClick={shareLink}
                className="flex-1 h-12 flex items-center justify-center gap-2.5 bg-gradient-to-b from-[#4CD964] to-[#34C759] border border-[#169E1C] rounded-xl text-white font-rubik font-medium text-base leading-[22px] shadow-[inset_0px_1px_0px_rgba(255,255,255,0.3)] active:scale-95 transition-transform duration-150 whitespace-nowrap"
                style={{ textShadow: '0px 1px 0px #158941' }}
              >
                {t.inviteFriend}
              </button>
              <button
                onClick={copyLink}
                className="w-12 h-12 flex items-center justify-center bg-gradient-to-b from-[#4CD964] to-[#34C759] border border-[#169E1C] rounded-xl shadow-[inset_0px_1px_0px_rgba(255,255,255,0.3)] transition-all duration-300 relative overflow-hidden"
              >
                <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                  copied ? 'opacity-0 scale-50' : 'opacity-100 scale-100'
                }`}>
                  <Image src="/team/solar_copy-bold.webp" width={24} height={24} alt="copy" />
                </div>
                <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                  copied ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                }`}>
                  <Image src="/team/material-symbols_check-rounded.webp" width={24} height={24} alt="copied" />
                </div>
              </button>
            </div>

            <button 
              onClick={downloadPDF}
              className="flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
            >
              <Image src="/team/solar_document-linear.webp" width={18} height={18} alt="pdf" />
              <span className="font-rubik text-base leading-[19px] text-[#475569]">{t.downloadPDF}</span>
            </button>
          </div>

          {/* Team Section */}
          <div className="w-full bg-white shadow-[0px_2px_0px_rgba(0,0,0,0.25)] rounded-[24px_24px_12px_12px] flex flex-col">
            
            {/* Tabs */}
            <div className="flex items-center p-0.5 m-3 bg-[#F1F5F9] border border-[#E6EEF6] rounded-[100px]">
              {refsData?.lines?.slice(0, 4).map((line, index) => {
                return (
                  <div key={line.line} className="flex items-center flex-1">
                    {index > 0 && <div className="w-px h-6 bg-[#E6EEF6]"></div>}
                    <button
                      onClick={() => {
                        hapticFeedback.selectionChanged();
                        setActiveLine(index);
                      }}
                      className={`flex-1 h-10 flex items-center justify-center font-rubik font-medium text-sm leading-[17px] transition-all duration-200 cursor-pointer ${
                        activeLine === index
                          ? 'bg-white shadow-[0px_1px_3px_rgba(0,0,0,0.08)] rounded-[100px] text-[#1F2937]'
                          : 'opacity-60 text-[#475569]'
                      }`}
                    >
                      {`${line.line} ${t.line}`}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Stats */}
            <div className="px-4 pt-2 flex flex-col gap-1">
              <div className="flex justify-between transition-all duration-200">
                <span className="font-rubik text-sm leading-[19px] text-[#475569]">{t.totalPartners}</span>
                <span className="font-rubik font-medium text-sm leading-[150%] text-[#1F2937]">{currentLine?.partners_count || 0}</span>
              </div>
              <div className="flex justify-between transition-all duration-200">
                <span className="font-rubik text-sm leading-[19px] text-[#475569]">{t.activePartners}</span>
                <span className="font-rubik font-medium text-sm leading-[150%] text-[#1F2937]">{currentLine?.active_partners_count || 0}</span>
              </div>
              <div className="flex justify-between transition-all duration-200">
                <span className="font-rubik text-sm leading-[19px] text-[#475569]">{t.totalDucks}</span>
                <span className="font-rubik font-medium text-sm leading-[150%] text-[#1F2937]">{currentLine?.total_ducks || 0}</span>
              </div>
              <div className="flex justify-between transition-all duration-200">
                <span className="font-rubik text-sm leading-[19px] text-[#475569]">{t.totalEarned}</span>
                <span className="font-rubik font-medium text-sm leading-[150%] text-[#1F2937]">{currentLine?.profit ? `${currentLine.profit} USDT` : "0 USDT"}</span>
              </div>
              <div className="flex justify-between transition-all duration-200">
                <span className="font-rubik text-sm leading-[19px] text-[#475569]">{t.yourEarnings}</span>
                <span className="font-rubik font-medium text-sm leading-[150%] text-[#1F2937]">{currentLine?.profit ? `${currentLine.profit} USDT` : "0 USDT"}</span>
              </div>
            </div>

            {/* Table Header + Content Container */}
            <div className="relative">
              {/* Table Header */}
              <div className="h-[34px] bg-[#FFB800] flex items-center px-3 mt-4">
                <span className="font-rubik text-sm leading-[150%] text-[#1F2937] flex-1">{t.name}</span>
                <span className="font-rubik text-sm leading-[16px] text-[#1F2937] text-right w-[97px]">{t.purchased}</span>
                <span className="font-rubik text-sm leading-[150%] text-[#1F2937] text-right w-[82px]">{t.income}</span>
              </div>

              {/* Table Content */}
              <div className="flex flex-col">
                {hasUsers ? (
                  currentLine.users.map((user, index) => (
                    <div 
                      key={index}
                      style={{
                        animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`
                      }}
                    >
                      <div className="h-[34px] flex items-center px-3 transition-colors duration-200 hover:bg-gray-50">
                        <div className="flex items-center gap-1.5 flex-1">
                          {user.img ? (
                            <img 
                              src={user.img} 
                              alt={user.name}
                              className="w-[22px] h-[22px] rounded-full object-cover"
                              onError={(e) => {
                                // Fallback to gradient circle if image fails to load
                                e.currentTarget.style.display = 'none';
                                if (e.currentTarget.nextElementSibling) {
                                  (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                                }
                              }}
                            />
                          ) : null}
                          <div className="w-[22px] h-[22px] rounded-full bg-gradient-to-br from-[#FFB800] to-[#FFA500]" style={{ display: user.img ? 'none' : 'block' }}></div>
                          <span className="font-rubik text-sm leading-[150%] text-[#1F2937]">{user.name}</span>
                        </div>
                        <span className="font-rubik font-medium text-sm leading-[16px] text-[#1F2937] text-right w-[97px]">${user.volume.toFixed(0)}</span>
                        <span className="font-rubik font-medium text-sm leading-[150%] text-[#0E9F6E] text-right w-[82px]">${user.profit.toFixed(0)}</span>
                      </div>
                      {index < currentLine.users.length - 1 && <div className="h-px bg-[#E6EEF6]"></div>}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-10 text-center">
                    <span className="font-rubik text-sm leading-[17px] text-[#475569] opacity-50">
                      {t.noReferrals}
                    </span>
                  </div>
                )}
              </div>

              {/* Lock Overlay - показываем если линия заблокирована */}
              {refsData?.levels?.[activeLine] && !refsData.levels[activeLine].opened && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ 
                  background: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(2px)',
                  borderRadius: '0px 0px 12px 12px'
                }}>
                  <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g filter="url(#filter0_d_lock)">
                      <path d="M38.2639 33.4551C36.8896 33.4551 35.7756 32.3411 35.7756 30.9668V16.4774C35.7756 11.594 31.8026 7.62085 26.9191 7.62085C22.0356 7.62085 18.0625 11.5939 18.0625 16.4774V24.9048C18.0625 26.279 16.9485 27.393 15.5742 27.393C14.2 27.393 13.0859 26.279 13.0859 24.9048V16.4774C13.0859 8.84976 19.2914 2.64429 26.9191 2.64429C34.5467 2.64429 40.7522 8.84976 40.7522 16.4774V30.9668C40.7522 32.3411 39.6381 33.4551 38.2639 33.4551Z" fill="#B1B4B5"/>
                    </g>
                    <g filter="url(#filter1_d_lock)">
                      <path d="M42.0585 48.5232H11.7789C8.95191 48.5232 6.66016 46.2314 6.66016 43.4044V25.8983C6.66016 23.0713 8.95191 20.7795 11.7789 20.7795H42.0585C44.8855 20.7795 47.1773 23.0713 47.1773 25.8983V43.4043C47.1773 46.2314 44.8855 48.5232 42.0585 48.5232Z" fill="#FFB636"/>
                    </g>
                    <path d="M29 35.5C29 35.8978 28.842 36.2794 28.5607 36.5607C28.2794 36.842 27.8978 37 27.5 37C27.1022 37 26.7206 36.842 26.4393 36.5607C26.158 36.2794 26 35.8978 26 35.5C26 35.1022 26.158 34.7206 26.4393 34.4393C26.7206 34.158 27.1022 34 27.5 34C27.8978 34 28.2794 34.158 28.5607 34.4393C28.842 34.7206 29 35.1022 29 35.5Z" fill="url(#paint0_radial_lock)"/>
                    <path d="M11.1018 46.3979H10.8453C10.0376 46.3979 9.38281 45.7431 9.38281 44.9354V28.3673C9.38281 27.5596 10.0376 26.9048 10.8453 26.9048H11.1018C11.9095 26.9048 12.5643 27.5596 12.5643 28.3673V44.9354C12.5643 45.7431 11.9095 46.3979 11.1018 46.3979Z" fill="#FFD469"/>
                    <defs>
                      <filter id="filter0_d_lock" x="13.0859" y="2.64429" width="27.666" height="32.8108" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                        <feOffset dy="2"/>
                        <feComposite in2="hardAlpha" operator="out"/>
                        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
                        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_lock"/>
                        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_lock" result="shape"/>
                      </filter>
                      <filter id="filter1_d_lock" x="6.66016" y="20.7795" width="40.5176" height="29.7437" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                        <feOffset dy="2"/>
                        <feComposite in2="hardAlpha" operator="out"/>
                        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
                        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_lock"/>
                        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_lock" result="shape"/>
                      </filter>
                      <radialGradient id="paint0_radial_lock" cx="0" cy="0" r="1" gradientTransform="matrix(-1.49995 -5.25 7.28439 -2.0812 28.25 37)" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#944600"/>
                        <stop offset="1" stopColor="#CD8E02"/>
                      </radialGradient>
                    </defs>
                  </svg>
                </div>
              )}
            </div>

          </div>
          
          </div>
        </div>
      </div>

    </div>
  );
}

