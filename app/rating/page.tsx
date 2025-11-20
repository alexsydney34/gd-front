"use client";

import { useState, useEffect } from "react";
import LeaderboardRow from "../components/LeaderboardRow";
import LeaderboardHeader from "../components/LeaderboardHeader";
import PageLock from "../components/PageLock";
import { useTelegram } from "../hooks/useTelegram";
import { apiClient } from "../lib/api";
import { LeaderboardUser } from "../types";
import { USE_DEV_TOKEN, DEV_TOKEN } from "../lib/devToken";
import { useTranslation } from "../hooks/useTranslation";

export default function RatingPage() {
  const { safeAreaInsets } = useTelegram();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prizePool, setPrizePool] = useState(500);
  const [endsIn, setEndsIn] = useState(0);
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [me, setMe] = useState<LeaderboardUser | null>(null);

  useEffect(() => {
    // Auto-set dev token if enabled
    if (USE_DEV_TOKEN && typeof window !== "undefined") {
      apiClient.setToken(DEV_TOKEN);
    }
    
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getLeaderboard();
      
      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.data) {
        setPrizePool(response.data.pool);
        setEndsIn(response.data.end);
        setUsers(response.data.users);
        setMe(response.data.me);
      }
    } catch (err) {
      setError("Failed to load leaderboard");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className="mobile-container flex items-center justify-center"
        style={{
          paddingTop: `${Math.max(76, safeAreaInsets.top + 60)}px`,
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD52C] mx-auto"></div>
          <p className="mt-4 font-rubik text-[#1C1C1E]">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="mobile-container flex items-center justify-center"
        style={{
          paddingTop: `${Math.max(76, safeAreaInsets.top + 60)}px`,
        }}
      >
        <div className="text-center px-4">
          <p className="font-rubik text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchLeaderboard}
            className="px-6 py-3 bg-gradient-to-b from-[#FFF382] via-[#FFD52C] to-[#FF9F0A] border border-[rgba(172,87,0,0.6)] rounded-2xl font-rubik font-bold text-white"
          >
            {t.retry || "Retry"}
          </button>
        </div>
      </div>
    );
  }

  const content = (
    <div className="mobile-container">
      <div className="relative flex flex-col items-center w-full h-full gap-6" style={{ 
        minHeight: '100vh',
        paddingTop: `${Math.max(76, safeAreaInsets.top + 60)}px`,
        paddingBottom: `${100 + safeAreaInsets.bottom}px` 
      }}>
        {/* Leaderboard Header */}
        <LeaderboardHeader prizePool={prizePool} endsIn={endsIn} />

        {/* Leaderboard List - Scrollable */}
        <div 
          className="flex flex-col gap-1.5 w-full max-w-[343px] px-0 overflow-y-scroll rounded-2xl"
          style={{ 
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            flex: '1 1 auto',
            minHeight: 0,
            paddingBottom: '20px'
          }}
        >
          {users && users.length > 0 ? (
            users.map((user) => (
              <LeaderboardRow key={user.tg_id} user={user} />
            ))
          ) : (
            <div className="flex items-center justify-center w-full py-10">
              <p className="font-rubik font-medium text-lg text-[#6E6E73]">
                {t.noPlayers || "Никого нет"}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );

  // Временно блокируем страницу рейтинга
  return <PageLock isLocked={false}>{content}</PageLock>;
}

