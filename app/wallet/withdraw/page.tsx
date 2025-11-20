"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTonWallet } from "@tonconnect/ui-react";
import { Address } from "@ton/core";
import { useTelegram } from "../../hooks/useTelegram";
import { apiClient } from "../../lib/api";
import { USE_DEV_TOKEN, DEV_TOKEN } from "../../lib/devToken";
import { useToast } from "../../hooks/useToast";
import { useTranslation } from "../../hooks/useTranslation";
import Toast from "../../components/Toast";

type Network = "TON" | "BEP20";

export default function WithdrawPage() {
  const router = useRouter();
  const { safeAreaInsets, hapticFeedback } = useTelegram();
  const { t } = useTranslation();
  
  const tonWallet = useTonWallet();
  const { toast, showToast, hideToast } = useToast();
  
  const [quickAmount, setQuickAmount] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<Network>("TON");
  const [manualAddress, setManualAddress] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [walletData, setWalletData] = useState<{
    balance_usdt: string;
    my_ton_wallet: string;
    min_withdraw: number;
  } | null>(null);

  useEffect(() => {
    if (USE_DEV_TOKEN && typeof window !== "undefined") {
      apiClient.setToken(DEV_TOKEN);
    }
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const response = await apiClient.getWallet();
      if (response.data) {
        setWalletData({
          balance_usdt: response.data.balance_usdt,
          my_ton_wallet: response.data.my_ton_wallet,
          min_withdraw: response.data.min_withdraw
        });
      }
    } catch (error) {
      console.error("Failed to fetch wallet data:", error);
    }
  };

  const linkedWallet = walletData?.my_ton_wallet || tonWallet?.account.address || t.notConnected;
  const maxBalance = parseFloat(walletData?.balance_usdt || "0");

  const networkData = {
    TON: { label: "TON" },
    BEP20: { label: "BEP20" }
  };
  
  // Функция для нормализации TON адреса из raw формата в user-friendly
  const normalizeTonAddress = (address: string): string => {
    if (!address || address === t.notConnected) return address;
    
    try {
      // Если адрес уже в user-friendly формате, парсим его
      if (!address.includes(':')) {
        const parsed = Address.parse(address);
        return parsed.toString({ bounceable: true, testOnly: false });
      }
      
      // Если адрес в raw формате (0:xxx), преобразуем в user-friendly
      const [workchain, hash] = address.split(':');
      if (workchain !== undefined && hash !== undefined) {
        const parsed = Address.parseRaw(`${workchain}:${hash}`);
        return parsed.toString({ bounceable: true, testOnly: false });
      }
      
      return address;
    } catch (error) {
      console.error("Failed to normalize TON address:", error);
      return address;
    }
  };
  
  // Функция для форматирования адреса кошелька (сокращение для отображения)
  const formatAddress = (address: string, network: Network = selectedNetwork): string => {
    if (!address || address === t.notConnected) return address;
    
    // Для TON сначала нормализуем, потом форматируем
    let displayAddress = address;
    if (network === "TON") {
      displayAddress = normalizeTonAddress(address);
    }
    
    if (displayAddress.length <= 16) return displayAddress;
    return `${displayAddress.slice(0, 8)}...${displayAddress.slice(-8)}`;
  };

  const currentNetwork = networkData[selectedNetwork];

  const handleClose = () => {
    hapticFeedback.impactOccurred("light");
    router.push("/wallet");
  };

  const handleNetworkSelect = (network: Network) => {
    hapticFeedback.selectionChanged();
    setSelectedNetwork(network);
  };

  const handleQuickWithdraw = async () => {
    if (!quickAmount || parseFloat(quickAmount) <= 0) {
      showToast("Введите сумму", "error");
      return;
    }

    if (parseFloat(quickAmount) < (walletData?.min_withdraw || 5)) {
      showToast(`Минимальная сумма вывода: ${walletData?.min_withdraw || 5} USDT`, "error");
      return;
    }

    if (!linkedWallet || linkedWallet === t.notConnected) {
      showToast("Подключите кошелек", "error");
      return;
    }

    setLoading(true);
    hapticFeedback.impactOccurred("medium");

    try {
      // Convert network type to coin type for API
      const coinType = selectedNetwork === "BEP20" ? "BNB" : "TON";
      const response = await apiClient.withdraw(linkedWallet, parseFloat(quickAmount), coinType);

      if (response.error) {
        showToast(response.error, "error");
      } else {
        showToast("Заявка на вывод отправлена", "success");
        setQuickAmount("");
        fetchWalletData();
      }
    } catch (error) {
      console.error("Withdraw error:", error);
      showToast("Ошибка при выводе", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleManualWithdraw = async () => {
    if (!manualAmount || parseFloat(manualAmount) <= 0) {
      showToast("Введите сумму", "error");
      return;
    }

    if (parseFloat(manualAmount) < (walletData?.min_withdraw || 5)) {
      showToast(`Минимальная сумма вывода: ${walletData?.min_withdraw || 5} USDT`, "error");
      return;
    }

    if (!manualAddress) {
      showToast("Введите адрес кошелька", "error");
      return;
    }

    setLoading(true);
    hapticFeedback.impactOccurred("medium");

    try {
      // Convert network type to coin type for API
      const coinType = selectedNetwork === "BEP20" ? "BNB" : "TON";
      const response = await apiClient.withdraw(manualAddress, parseFloat(manualAmount), coinType);

      if (response.error) {
        showToast(response.error, "error");
      } else {
        showToast("Заявка на вывод отправлена", "success");
        setManualAmount("");
        setManualAddress("");
        fetchWalletData();
      }
    } catch (error) {
      console.error("Withdraw error:", error);
      showToast("Ошибка при выводе", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleMaxQuick = () => {
    hapticFeedback.selectionChanged();
    setQuickAmount(maxBalance.toString());
  };

  const handleMaxManual = () => {
    hapticFeedback.selectionChanged();
    setManualAmount(maxBalance.toString());
  };

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
        {/* Header */}
        <div className="flex flex-row justify-center items-center w-full max-w-[343px] h-8 relative">
          <h1 className="font-rubik font-semibold text-[22px] leading-[26px] text-center text-[#1F2937]">
            {t.withdrawTitle}
          </h1>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute right-0 w-[29px] h-[30px] flex items-center justify-center transition-transform active:scale-95"
          >
            <svg width="29" height="30" viewBox="0 0 29 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g filter="url(#filter0_d_266_2357)">
                <path fillRule="evenodd" clipRule="evenodd" d="M14.1667 28.3333C7.4885 28.3333 4.14942 28.3333 2.074 26.2579C0 24.1853 0 20.8448 0 14.1667C0 7.4885 0 4.14942 2.074 2.074C4.15083 0 7.4885 0 14.1667 0C20.8448 0 24.1839 0 26.2579 2.074C28.3333 4.15083 28.3333 7.4885 28.3333 14.1667C28.3333 20.8448 28.3333 24.1839 26.2579 26.2579C24.1853 28.3333 20.8448 28.3333 14.1667 28.3333ZM9.87417 9.87417C10.0734 9.6752 10.3434 9.56343 10.625 9.56343C10.9066 9.56343 11.1766 9.6752 11.3758 9.87417L14.1667 12.665L16.9575 9.87417C17.1589 9.68649 17.4253 9.58431 17.7006 9.58917C17.9758 9.59402 18.2385 9.70553 18.4331 9.9002C18.6278 10.0949 18.7393 10.3575 18.7442 10.6328C18.749 10.908 18.6468 11.1744 18.4592 11.3758L15.6683 14.1667L18.4592 16.9575C18.5636 17.0548 18.6473 17.1721 18.7054 17.3024C18.7634 17.4327 18.7947 17.5734 18.7972 17.7161C18.7997 17.8588 18.7734 18.0005 18.72 18.1328C18.6666 18.2651 18.587 18.3852 18.4861 18.4861C18.3852 18.587 18.2651 18.6666 18.1328 18.72C18.0005 18.7734 17.8588 18.7997 17.7161 18.7972C17.5734 18.7947 17.4327 18.7634 17.3024 18.7054C17.1721 18.6473 17.0548 18.5636 16.9575 18.4592L14.1667 15.6683L11.3758 18.4592C11.2786 18.5636 11.1613 18.6473 11.0309 18.7054C10.9006 18.7634 10.7599 18.7947 10.6172 18.7972C10.4746 18.7997 10.3329 18.7734 10.2006 18.72C10.0683 18.6666 9.94809 18.587 9.8472 18.4861C9.7463 18.3852 9.66676 18.2651 9.61333 18.1328C9.55989 18.0005 9.53364 17.8588 9.53616 17.7161C9.53868 17.5734 9.56991 17.4327 9.62798 17.3024C9.68605 17.1721 9.76978 17.0548 9.87417 16.9575L12.665 14.1667L9.87417 11.3758C9.6752 11.1766 9.56343 10.9066 9.56343 10.625C9.56343 10.3434 9.6752 10.0734 9.87417 9.87417Z" fill="white"/>
              </g>
              <defs>
                <filter id="filter0_d_266_2357" x="0" y="0" width="28.333" height="29.3333" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                  <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                  <feOffset dy="1"/>
                  <feComposite in2="hardAlpha" operator="out"/>
                  <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
                  <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_266_2357"/>
                  <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_266_2357" result="shape"/>
                </filter>
              </defs>
            </svg>
          </button>
        </div>

        {/* Quick Withdrawal Card */}
        <div className="flex flex-col items-start p-3 gap-2 w-full max-w-[343px] bg-white shadow-[0px_2px_0px_rgba(0,0,0,0.25)] rounded-2xl">
          {/* Title */}
          <div className="flex flex-col items-start gap-4 w-full">
            <div className="flex flex-col items-start w-full">
              <h2 className="font-rubik font-semibold text-lg leading-[21px] text-[#1F2937]">
                {t.withdrawAmount}
              </h2>
            </div>

            {/* Amount Input */}
            <div className="flex flex-row justify-between items-center px-2.5 py-2 gap-2.5 w-full h-10 bg-[#F6FAFF] border border-[#E6EEF6] rounded">
              <div className="flex flex-row items-center gap-2.5 flex-1">
                <Image
                  src="/wallet/tether.webp"
                  alt="USDT"
                  width={24}
                  height={24}
                />
                <input
                  type="number"
                  placeholder={t.enterSum}
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                  className="flex-1 font-rubik font-normal text-sm leading-[17px] text-[#475569] opacity-50 bg-transparent focus:outline-none"
                />
              </div>
              <button
                onClick={handleMaxQuick}
                className="px-1.5 py-1.5 w-12 h-6 bg-[#475569] rounded-md flex items-center justify-center transition-transform active:scale-95"
              >
                <span className="font-sf-pro font-medium text-xs leading-4 text-white opacity-80">
                  Max
                </span>
              </button>
            </div>

            {/* Linked Wallet */}
            <div className="flex flex-col items-start gap-1 w-full">
              <span className="font-roboto font-medium text-xs leading-[130%] text-[#475569]">
                {t.linkedWallet}
              </span>
              <span className="font-roboto font-medium text-sm leading-[130%] text-[#1F2937]">
                {formatAddress(linkedWallet, "TON")}
              </span>
            </div>
          </div>

          {/* Withdraw Button */}
          <button
            onClick={handleQuickWithdraw}
            className="flex flex-row justify-center items-center px-4 py-2 gap-2.5 h-12 w-full bg-gradient-to-b from-[#4CD964] to-[#34C759] border border-[#169E1C] rounded-xl transition-transform active:scale-95"
          >
            <span className="font-rubik font-medium text-base leading-[22px] text-white [text-shadow:0px_1px_0px_#158941]">
              {t.withdrawButton}
            </span>
          </button>

          {/* Warning */}
          <div className="font-rubik font-normal text-xs leading-[18px]">
            <span className="text-[#FF4800]">* </span>
            <span className="text-[#475569]">{t.withdrawTime}</span>
          </div>

          {/* 48 Hours Warning */}
          <div className="flex flex-row items-center gap-1.5 w-full p-2 bg-[#FFF5F5] border border-[#FFE5E5] rounded-lg">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-none">
              <circle cx="8" cy="8" r="7" fill="#FF4800"/>
              <path d="M8 4.5V9" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="8" cy="11.5" r="0.75" fill="white"/>
            </svg>
            <span className="font-rubik font-medium text-sm leading-[18px] text-[#FF4800]">
              Вывод средств обрабатывается в течение 48 часов
            </span>
          </div>
        </div>

        {/* Manual Withdrawal Card */}
        <div className="flex flex-col items-start p-3 gap-4 w-full max-w-[343px] bg-white shadow-[0px_2px_0px_rgba(0,0,0,0.25)] rounded-2xl">
          {/* Header */}
          <div className="flex flex-col items-start w-full">
            <h2 className="font-rubik font-semibold text-lg leading-[21px] text-[#1F2937]">
              {t.manualWithdraw}
            </h2>
            <p className="font-rubik font-normal text-xs leading-[22px] text-[#6E6E73]">
              {t.manualWithdrawDesc}
            </p>
          </div>

          {/* Network Selection */}
          <div className="flex flex-col items-start gap-1.5 w-full">
            <span className="font-rubik font-medium text-sm leading-5 text-[#1F2937]">
              {t.selectNetwork}
            </span>

            <div className="flex flex-row items-start gap-1.5 w-full">
              <button
                onClick={() => handleNetworkSelect("TON")}
                className={`flex-1 flex flex-col justify-center items-center p-1.5 gap-2.5 h-10 rounded-md transition-all ${
                  selectedNetwork === "TON"
                    ? "bg-[#FFF9E6] border border-[#FFB800] shadow-[0px_1px_6px_rgba(137,137,137,0.06)]"
                    : "bg-[#F6FAFF] border border-[#E6EEF6] shadow-[0px_1px_6px_rgba(137,137,137,0.06)]"
                }`}
              >
                <span className={`font-rubik font-medium text-sm leading-[17px] ${selectedNetwork === "TON" ? "text-[#1F2937]" : "text-[#475569]"}`}>
                  TON
                </span>
              </button>
              <button
                onClick={() => handleNetworkSelect("BEP20")}
                className={`flex-1 flex flex-col justify-center items-center p-1.5 gap-2.5 h-10 rounded-md transition-all ${
                  selectedNetwork === "BEP20"
                    ? "bg-[#FFF9E6] border border-[#FFB800] shadow-[0px_1px_6px_rgba(137,137,137,0.06)]"
                    : "bg-[#F6FAFF] border border-[#E6EEF6] shadow-[0px_1px_6px_rgba(137,137,137,0.06)]"
                }`}
              >
                <span className={`font-rubik font-medium text-sm leading-[17px] ${selectedNetwork === "BEP20" ? "text-[#1F2937]" : "text-[#475569]"}`}>
                  BEP20
                </span>
              </button>
            </div>
          </div>

          {/* Wallet Address */}
          <div className="flex flex-col items-start gap-1 w-full">
            <div className="flex flex-row items-start gap-2 w-full">
              <span className="font-rubik font-normal text-xs leading-[18px] text-[#6E6E73]">
                {t.walletAddress}
              </span>
              <span className="font-rubik font-normal text-xs leading-[18px] text-[#E4BD4C]">
                ({t.network}: {currentNetwork.label})
              </span>
            </div>
            <input
              type="text"
              placeholder={t.walletAddress}
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              className="px-2.5 py-2 w-full h-10 bg-[#F6FAFF] border border-[#E6EEF6] rounded font-rubik font-normal text-sm leading-[17px] text-[#475569] opacity-50 focus:outline-none focus:opacity-100"
            />
          </div>

          {/* Amount */}
          <div className="flex flex-col items-start gap-1.5 w-full">
            <div className="flex flex-col items-start gap-1 w-full">
              <span className="font-rubik font-normal text-xs leading-[18px] text-[#6E6E73]">
                {t.withdrawSum}
              </span>
              <div className="flex flex-row justify-between items-center px-2.5 py-2 gap-2.5 w-full h-10 bg-[#F6FAFF] border border-[#E6EEF6] rounded">
                <input
                  type="number"
                  placeholder="0.00"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  className="flex-1 font-rubik font-normal text-sm leading-[17px] text-[#475569] opacity-50 bg-transparent focus:outline-none focus:opacity-100"
                />
                <button
                  onClick={handleMaxManual}
                  className="px-1.5 py-1.5 w-12 h-6 bg-[#475569] rounded-md flex items-center justify-center transition-transform active:scale-95"
                >
                  <span className="font-sf-pro font-medium text-xs leading-4 text-white opacity-80">
                    Max
                  </span>
                </button>
              </div>
            </div>
            <span className="font-rubik font-normal text-[10px] leading-[18px] text-right text-[#475569] opacity-50 w-full">
              {t.minAmount} 5 USDT | {t.commission}: 1 USDT
            </span>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleManualWithdraw}
            className="flex flex-row justify-center items-center px-4 py-2 gap-2.5 h-12 w-full bg-gradient-to-b from-[#4CD964] to-[#34C759] border border-[#169E1C] rounded-xl transition-transform active:scale-95"
          >
            <span className="font-rubik font-medium text-base leading-[22px] text-white [text-shadow:0px_1px_0px_#158941]">
              {t.requestWithdraw}
            </span>
          </button>

          {/* 48 Hours Warning */}
          <div className="flex flex-row items-center gap-1.5 w-full p-2 bg-[#FFF5F5] border border-[#FFE5E5] rounded-lg">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-none">
              <circle cx="8" cy="8" r="7" fill="#FF4800"/>
              <path d="M8 4.5V9" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="8" cy="11.5" r="0.75" fill="white"/>
            </svg>
            <span className="font-rubik font-medium text-sm leading-[18px] text-[#FF4800]">
              Вывод средств обрабатывается в течение 48 часов
            </span>
          </div>

          {/* Warning */}
          <div className="flex flex-row items-start p-1.5 gap-1.5 w-full border border-[#E6EEF6] rounded">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-none">
              <circle cx="8" cy="8" r="7" fill="#FFB800"/>
              <path d="M8 4.5V9" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="8" cy="11.5" r="0.75" fill="white"/>
            </svg>
            <div className="flex flex-col items-start gap-0.5 flex-1">
              <span className="font-rubik font-normal text-xs leading-[14px] text-[#E4BD4C]">
                {t.checkData}
              </span>
              <span className="font-rubik font-normal text-[10px] leading-[12px] text-[#6B7280] opacity-50">
                {t.checkDataDesc}
              </span>
            </div>
          </div>
        </div>
      </div>

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

