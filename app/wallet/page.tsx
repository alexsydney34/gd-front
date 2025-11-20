"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { useTelegram } from "../hooks/useTelegram";
import { useTranslation } from "../hooks/useTranslation";
import { apiClient, WalletResponse } from "../lib/api";
import { USE_DEV_TOKEN, DEV_TOKEN } from "../lib/devToken";
import ConvertModal from "../components/ConvertModal";
import { useToast } from "../hooks/useToast";
import Toast from "../components/Toast";
import { formatBalance } from "../utils/formatNumber";

export default function WalletPage() {
  const router = useRouter();
  const { safeAreaInsets, hapticFeedback } = useTelegram();
  const { t } = useTranslation();
  const [tonConnectUI] = useTonConnectUI();
  const tonWallet = useTonWallet();
  const { toast, showToast, hideToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [walletData, setWalletData] = useState<WalletResponse | null>(null);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [historyLimit, setHistoryLimit] = useState(50); // Увеличенный лимит транзакций
  const [loadingMore, setLoadingMore] = useState(false);
  const [eggsPrice, setEggsPrice] = useState<number>(1.0); // Курс из главной страницы

  const fetchWalletData = useCallback(async (limit?: number) => {
    try {
      setLoading(true);
      
      const response = await apiClient.getWallet(limit || historyLimit, 0);

      if (response.error) {
        console.error("Wallet error:", response.error);
        return;
      }

      if (response.data) {
        setWalletData(response.data);
        // Используем курс из ответа кошелька
        setEggsPrice(response.data.eggs_price);
      }
    } catch (err) {
      console.error("Failed to load wallet data:", err);
    } finally {
      setLoading(false);
    }
  }, [historyLimit]);

  const loadMoreHistory = useCallback(async () => {
    try {
      setLoadingMore(true);
      const newLimit = historyLimit + 20;
      setHistoryLimit(newLimit);
      await fetchWalletData(newLimit);
    } catch (err) {
      console.error("Failed to load more history:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [historyLimit, fetchWalletData]);

  useEffect(() => {
    if (USE_DEV_TOKEN && typeof window !== "undefined") {
      apiClient.setToken(DEV_TOKEN);
    }

    fetchWalletData();

    // Обновление при возврате на страницу
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchWalletData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchWalletData]);

  const handleConnectWallet = async () => {
    hapticFeedback.impactOccurred("medium");
    
    try {
      // Open TON Connect modal
      await tonConnectUI.openModal();
      
      // Wait for wallet to connect
      const unsubscribe = tonConnectUI.onStatusChange(async (wallet) => {
        if (wallet) {
          console.log("🔗 TON Wallet connected:", wallet.account.address);
          
          // Send wallet address to backend
          const response = await apiClient.connectWallet(wallet.account.address);
          
          console.log("📡 Backend response:", response);
          
          if (response.error) {
            showToast(response.error, "error");
            console.error("❌ Connect wallet error:", response.error);
          } else if (response.data) {
            showToast("Кошелек успешно подключён", "success");
            console.log("✅ Wallet connected successfully");
            // Обновляем данные чтобы получить my_ton_wallet
            await fetchWalletData();
          }
          
          unsubscribe();
        }
      });
    } catch (error) {
      console.error("Wallet connection error:", error);
      showToast("Ошибка подключения кошелька", "error");
    }
  };

  const handleDisconnectWallet = async () => {
    hapticFeedback.impactOccurred("medium");
    
    try {
      // Disconnect wallet via TON Connect
      await tonConnectUI.disconnect();
      showToast("Кошелек отключён", "success");
      
      // Refresh wallet data to update UI
      await fetchWalletData();
    } catch (error) {
      console.error("Wallet disconnect error:", error);
      showToast("Ошибка отключения кошелька", "error");
    }
  };

  const handleDeposit = () => {
    hapticFeedback.impactOccurred("medium");
    router.push("/wallet/deposit");
  };

  const handleWithdraw = () => {
    hapticFeedback.impactOccurred("medium");
    router.push("/wallet/withdraw");
  };

  const handleConvert = () => {
    hapticFeedback.impactOccurred("light");
    setIsConvertModalOpen(true);
  };

  const handleConvertConfirm = async (amount: number): Promise<{ ok: boolean; error?: string }> => {
    try {
      // Convert EGGS to USDT
      const response = await apiClient.convertCurrency(amount, undefined);
      
      if (response.error) {
        return { ok: false, error: response.error };
      }
      
      // Refresh wallet data after successful conversion
      await fetchWalletData();
      showToast("Конвертация успешна", "success");
      
      return { ok: true };
    } catch (err) {
      console.error("Convert error:", err);
      return { ok: false, error: "Ошибка конвертации" };
    }
  };

  const formatDate = (dateString: string) => {
    try {
      // Handle format like "2025-11-03 18:18:18.979553 +0000 UTC"
      let cleanDate = dateString;
      
      // If the format has microseconds and UTC timezone info
      if (dateString.includes('.') && dateString.includes('UTC')) {
        // Extract date and time, remove microseconds: "2025-11-03 18:18:18"
        cleanDate = dateString.split('.')[0];
        // Add 'Z' to indicate UTC timezone for proper parsing
        cleanDate = cleanDate + 'Z';
      } else if (dateString.includes('+0000') || dateString.includes('UTC')) {
        // If it has +0000 or UTC but no microseconds, still treat as UTC
        cleanDate = dateString.split(' +')[0].split(' UTC')[0] + 'Z';
      }
      
      // Parse the date - now with proper UTC timezone handling
      const date = new Date(cleanDate);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      // Format to user's local time in readable format: DD.MM.YYYY HH:MM
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${day}.${month}.${year} ${hours}:${minutes}`;
    } catch (error) {
      return dateString;
    }
  };

  const formatAmount = (amount: string): string => {
    // Используем форматирование с K, M для больших чисел
    const num = parseFloat(amount);
    if (isNaN(num)) return amount;
    
    return formatBalance(num);
  };

  const getHistoryIcon = (type: string, minus: boolean) => {
    if (type === "withdraw" || minus) {
      return "/wallet/push.webp"; // Yellow arrow up
    }
    return "/wallet/pull.webp"; // Green arrow down
  };

  const getHistoryTitle = (type: string) => {
    switch (type) {
      case "deposit":
        return t.incomeType;
      case "referral":
        return t.referralBonus;
      case "withdraw":
        return t.withdrawType;
      default:
        return type;
    }
  };

  const getAmountColor = (minus: boolean) => {
    return minus ? "text-[#FFB800]" : "text-[#0E9F6E]";
  };

  if (loading) {
    return (
      <div
        className="mobile-container flex items-center justify-center"
        style={{
          backgroundImage: "url(/bg.webp)",
          paddingTop: `${safeAreaInsets.top}px`,
          paddingBottom: `${safeAreaInsets.bottom}px`,
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD52C] mx-auto"></div>
          <p className="mt-4 font-rubik text-[#1C1C1E]">{t.loading}</p>
        </div>
      </div>
    );
  }

  const isWalletConnected = (walletData?.my_ton_wallet && walletData.my_ton_wallet !== "") || tonWallet;
  const usdtBalance = parseFloat(walletData?.balance_usdt || "0");
  const eggsBalance = parseFloat(walletData?.balance_eggs || "0");

  return (
    <div className="mobile-container">
      <div 
        className="relative flex flex-col items-center w-full h-full gap-5" 
        style={{ 
          minHeight: '100vh',
          paddingTop: `${Math.max(76, safeAreaInsets.top + 60)}px`,
          paddingBottom: `${100 + safeAreaInsets.bottom}px`, 
          paddingLeft: '16px',
          paddingRight: '16px'
        }}
      >
        {/* Wallet Card - Combined */}
        <div className="flex flex-col items-start p-3 gap-2.5 w-full max-w-[343px] bg-white shadow-[0px_2px_0px_rgba(0,0,0,0.25)] rounded-2xl">
          {/* Wallet Connection */}
          <div className="flex flex-row justify-between items-center w-full">
            <div className="flex flex-row items-center gap-2">
              <div className="w-[38px] h-[38px] bg-[#F6FAFF] border border-[#E6EEF6] shadow-[0px_1px_6px_rgba(137,137,137,0.06)] rounded-md flex items-center justify-center">
                <Image
                  src="/wallet/wallet.webp"
                  alt="Wallet"
                  width={17}
                  height={15}
                />
              </div>
              <span className="font-rubik font-normal text-base leading-4 text-[#1F2937]">
                {isWalletConnected ? t.walletConnected : t.walletNotConnected}
              </span>
            </div>
            {!isWalletConnected ? (
              <button
                onClick={handleConnectWallet}
                className="flex flex-row justify-center items-center px-4 py-2 gap-2.5 h-11 bg-gradient-to-b from-[#4CD964] to-[#34C759] border border-[#169E1C] rounded-xl transition-transform active:scale-95"
              >
                <span className="font-rubik font-medium text-base leading-[22px] text-white [text-shadow:0px_1px_0px_#158941]">
                  {t.connectButton}
                </span>
              </button>
            ) : (
              <button
                onClick={handleDisconnectWallet}
                className="flex flex-row justify-center items-center px-4 py-2 gap-2.5 h-11 bg-gradient-to-b from-[#FF6B6B] to-[#FF5252] border border-[#C62828] rounded-xl transition-transform active:scale-95"
              >
                <span className="font-rubik font-medium text-base leading-[22px] text-white [text-shadow:0px_1px_0px_#8B0000]">
                  {t.disconnectButton}
                </span>
              </button>
            )}
          </div>

          {/* Balance Section */}
          <div className="flex flex-col items-start p-3 gap-2.5 w-full bg-white border border-[#E6EEF6] shadow-[0px_1px_3px_rgba(0,0,0,0.08)] rounded-xl">
            <div className="flex flex-row justify-center items-center gap-7 w-full">
              {/* EGGS Balance */}
              <div className="flex flex-col items-start gap-0">
                <span className="font-rubik font-normal text-base leading-[19px] text-[#1F2937]">
                  EGGS
                </span>
                <div className="flex flex-row items-center gap-1">
                  <Image
                    src="/wallet/egg.webp"
                    alt="Egg"
                    width={20}
                    height={21}
                  />
                  <span className="font-rubik font-medium text-[28px] leading-[33px] text-[#1F2937]">
                    {formatBalance(eggsBalance)}
                  </span>
                </div>
              </div>

              {/* Convert Button */}
              <button
                onClick={handleConvert}
                className="relative flex-none w-10 h-10 bg-white border border-[#E6EEF6] shadow-[0px_1px_3px_rgba(0,0,0,0.08)] rounded-full flex items-center justify-center transition-transform active:scale-95 overflow-hidden group"
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-blue-200/50 to-transparent group-hover:translate-x-full transition-transform duration-1000 animate-shimmer-button" />
                <Image
                  src="/wallet/swap.webp"
                  alt="Convert"
                  width={16}
                  height={16}
                  className="relative z-10"
                />
              </button>

              {/* USDT Balance */}
              <div className="flex flex-col items-start gap-0">
                <span className="font-rubik font-normal text-base leading-[19px] text-[#1F2937]">
                  USDT
                </span>
                <div className="flex flex-row items-center gap-1">
                  <Image
                    src="/wallet/tether.webp"
                    alt="USDT"
                    width={21}
                    height={21}
                  />
                  <span className="font-rubik font-medium text-[28px] leading-[33px] text-[#1F2937]">
                    {formatBalance(usdtBalance)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row items-center gap-2.5 w-full max-w-[343px]">
          {/* Deposit Button */}
          <button
            onClick={handleDeposit}
            className="flex-1 flex flex-row items-center py-3 pl-[2px] pr-[18px] gap-2 h-11 bg-white shadow-[0px_2px_0px_rgba(0,0,0,0.25)] rounded-full transition-transform active:scale-95"
          >
            <div className="w-10 h-10 bg-gradient-to-b from-[#4CD964] to-[#34C759] rounded-full flex items-center justify-center shadow-[0px_1px_3px_rgba(0,0,0,0.08)]">
              <Image
                src="/wallet/deposit-icon.webp"
                alt="Deposit"
                width={12}
                height={15}
              />
            </div>
            <span className="flex-1 font-sf-pro font-semibold text-sm leading-[17px] text-center text-[#1F2937]">
              {t.depositButton}
            </span>
          </button>

          {/* Withdraw Button */}
          <button
            onClick={handleWithdraw}
            className="flex-1 flex flex-row items-center py-3 pl-[2px] pr-[18px] gap-2 h-11 bg-white shadow-[0px_2px_0px_rgba(0,0,0,0.25)] rounded-full transition-transform active:scale-95"
          >
            <div className="w-10 h-10 bg-gradient-to-b from-[#FFF382] via-[#FFD52C] to-[#FF9F0A] rounded-full flex items-center justify-center shadow-[0px_1px_3px_rgba(0,0,0,0.08)]">
              <Image
                src="/wallet/send.webp"
                alt="Withdraw"
                width={15}
                height={17}
              />
            </div>
            <span className="flex-1 font-sf-pro font-semibold text-sm leading-[17px] text-center text-[#1F2937]">
              {t.withdrawButton2}
            </span>
          </button>
        </div>

        {/* History Section */}
        <div className="flex flex-col items-start gap-2.5 w-full max-w-[343px]">
          <h2 className="font-rubik font-semibold text-lg leading-[21px] text-[#1F2937]">
            История
          </h2>

          {/* History List */}
          <div className="flex flex-col items-start gap-2 w-full">
            {walletData?.history && Array.isArray(walletData.history) && walletData.history.length > 0 ? (
              walletData.history.map((item, index) => {
                // Безопасная проверка всех полей
                if (!item || typeof item.amount === 'undefined') {
                  return null;
                }
                
                const currency = item.eggs === true ? "EGGS" : "USDT";
                const itemKey = `${item.type || 'unknown'}-${item.time || Date.now()}-${item.amount}-${index}`;
                return (
                <div
                  key={itemKey}
                  className="flex flex-row justify-between items-center px-3 py-2.5 gap-0.5 w-full bg-white shadow-[0px_2px_0px_rgba(0,0,0,0.25)] rounded-2xl"
                >
                  <div className="flex flex-row items-center gap-3">
                    <div className="w-[38px] h-[38px] bg-[#F6FAFF] border border-[#E6EEF6] shadow-[0px_1px_3px_rgba(0,0,0,0.08)] rounded-full flex items-center justify-center">
                      <Image
                        src={getHistoryIcon(item.type, item.minus)}
                        alt={item.type}
                        width={10}
                        height={12}
                      />
                    </div>
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="font-rubik font-medium text-base leading-[19px] text-[#1F2937]">
                        {getHistoryTitle(item.type)}
                      </span>
                      <span className="font-rubik font-normal text-xs leading-[14px] text-[#475569]">
                        {formatDate(item.time)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className={`font-rubik font-semibold text-base leading-[19px] text-right ${getAmountColor(item.minus)}`}>
                      {item.minus ? "-" : "+"}{formatAmount(item.amount)} {currency}
                  </span>
                  </div>
                </div>
              );
              })
            ) : (
              <div className="flex flex-row justify-center items-center px-3 py-2.5 gap-0.5 w-full h-[58px] bg-white shadow-[0px_2px_0px_rgba(0,0,0,0.25)] rounded-2xl">
                <span className="font-rubik font-normal text-base leading-[19px] text-center text-[#475569]">
                  Пока операций нет
                </span>
              </div>
            )}
          </div>

          {/* Load More Button */}
          {walletData?.history && walletData.history.length >= historyLimit && (
            <button
              onClick={loadMoreHistory}
              disabled={loadingMore}
              className="flex items-center justify-center w-full py-3 bg-[#F6FAFF] border border-[#E6EEF6] rounded-2xl transition-all active:scale-95 disabled:opacity-50"
            >
              <span className="font-rubik font-medium text-sm text-[#475569]">
                {loadingMore ? 'Загрузка...' : 'Показать ещё'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Convert Modal */}
      <ConvertModal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        eggsBalance={eggsBalance}
        usdtBalance={usdtBalance}
        eggsPrice={eggsPrice}
        onConvert={handleConvertConfirm}
      />

      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
}

