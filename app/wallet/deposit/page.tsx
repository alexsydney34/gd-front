"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { Address, toNano } from "@ton/core";
import { useTelegram } from "../../hooks/useTelegram";
import { apiClient } from "../../lib/api";
import { USE_DEV_TOKEN, DEV_TOKEN } from "../../lib/devToken";
import { useTranslation } from "../../hooks/useTranslation";
import { useToast } from "../../hooks/useToast";
import Toast from "../../components/Toast";
import { 
  getUserUSDTJettonWallet, 
  createJettonTransferPayload, 
  formatUSDTAmount 
} from "../../lib/usdt";

type Network = "TON" | "BEP20";

export default function DepositPage() {
  const router = useRouter();
  const { safeAreaInsets, hapticFeedback } = useTelegram();
  const { t } = useTranslation();
  const { toast, showToast, hideToast } = useToast();
  const [tonConnectUI] = useTonConnectUI();
  
  const [amount, setAmount] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<Network>("TON");
  const [copiedField, setCopiedField] = useState<"address" | "comment" | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletData, setWalletData] = useState<{
    ton_wallet: string;
    bnb_wallet: string;
    min_withdraw: number;
    ton_comment: string;
    my_ton_wallet?: string;
  } | null>(null);

  const fetchWalletData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.getWallet();
      if (response.data) {
        setWalletData({
          ton_wallet: response.data.ton_wallet,
          bnb_wallet: response.data.bnb_wallet,
          min_withdraw: response.data.min_withdraw,
          ton_comment: response.data.ton_comment,
          my_ton_wallet: response.data.my_ton_wallet
        });
      }
    } catch (error) {
      console.error("Failed to fetch wallet data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (USE_DEV_TOKEN && typeof window !== "undefined") {
      apiClient.setToken(DEV_TOKEN);
    }
    fetchWalletData();
  }, [fetchWalletData]);

  // Отслеживаем подключение кошелька и отправляем адрес на бэкенд
  useEffect(() => {
    const unsubscribe = tonConnectUI.onStatusChange(async (wallet) => {
      if (wallet) {
        // Получаем нормализированный адрес (user-friendly format)
        const rawAddress = wallet.account.address;
        const normalizedAddress = Address.parse(rawAddress).toString();
        
        console.log("💳 Wallet connected:", normalizedAddress);
        
        // Отправляем адрес на бэкенд
        try {
          const connectResponse = await apiClient.connectWallet(normalizedAddress);
          if (connectResponse.error) {
            console.error("❌ Failed to connect wallet:", connectResponse.error);
          } else {
            console.log("✅ Wallet connected to backend");
            // Обновляем данные кошелька
            await fetchWalletData();
          }
        } catch (error) {
          console.error("❌ Error connecting wallet:", error);
        }
      }
    });

    return () => unsubscribe();
  }, [tonConnectUI, fetchWalletData]);

  const networkData = {
    TON: {
      address: walletData?.ton_wallet || "Loading...",
      comment: walletData?.ton_comment || "Loading...",
      label: "TON"
    },
    BEP20: {
      address: walletData?.bnb_wallet || "Loading...",
      comment: null,
      label: "BEP20"
    }
  };

  const handleBack = () => {
    hapticFeedback.impactOccurred("light");
    router.back();
  };

  const handleNetworkSelect = (network: Network) => {
    hapticFeedback.selectionChanged();
    setSelectedNetwork(network);
  };

  const handleAmountChange = (value: string) => {
    // Разрешаем только числа и одну точку
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value);
    }
  };

  const handleCopy = async (text: string, field: "address" | "comment") => {
    hapticFeedback.impactOccurred("light");
    
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        showToast("Скопировано", "success");
      }
    } catch (error) {
      console.error("Failed to copy:", error);
      showToast("Ошибка копирования", "error");
    }
    
    // Reset after 2 seconds
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      showToast(t.enterAmountError, "error");
      return;
    }

    const minDeposit = walletData?.min_withdraw || 5;
    if (parseFloat(amount) < minDeposit) {
      showToast(`${t.minAmountError}: ${minDeposit} USDT`, "error");
      return;
    }

    if (!tonConnectUI.connected) {
      showToast(t.connectWallet, "error");
      try {
        await tonConnectUI.openModal();
      } catch (error) {
        console.error("Failed to open TON Connect modal:", error);
      }
      return;
    }

    try {
      hapticFeedback.impactOccurred("medium");
      
      // Получаем адрес подключенного кошелька
      const connectedWallet = tonConnectUI.wallet;
      if (!connectedWallet) {
        showToast(t.connectWallet, "error");
        return;
      }
      
      const myWalletAddress = connectedWallet.account.address;
      console.log("💳 My wallet address:", myWalletAddress);
      
      // Адрес получателя USDT (из бэкенда)
      const recipientAddress = walletData?.ton_wallet;
      if (!recipientAddress) {
        showToast("Адрес получателя не найден", "error");
        return;
      }
      
      console.log("=====================================");
      console.log("🚀 STARTING USDT TRANSFER");
      console.log("Amount:", amount, "USDT");
      console.log("Recipient address:", recipientAddress);
      console.log("User address:", myWalletAddress);
      console.log("=====================================");
      
      // Форматируем amount (округляем до 2 знаков после запятой)
      const usdtAmount = formatUSDTAmount(parseFloat(amount));
      console.log("📊 Formatted USDT amount:", usdtAmount.toString(), "=", Number(usdtAmount) / 1_000_000, "USDT");
      
      // Получаем адрес USDT jetton wallet пользователя
      console.log("🔍 Resolving user's USDT jetton wallet...");
      const userJettonWallet = await getUserUSDTJettonWallet(myWalletAddress);
      console.log("💰 User USDT Jetton Wallet:", userJettonWallet);
      
      // Создаём payload для jetton transfer
      const payload = createJettonTransferPayload(
        recipientAddress,
        usdtAmount,
        undefined, // комментарий
        myWalletAddress // response address
      );
      
      // Отправляем транзакцию на jetton wallet пользователя
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [
          {
            address: userJettonWallet,
            amount: toNano("0.1").toString(), // 0.1 TON (0.05 forward + 0.05 gas, excess вернется)
            payload: payload,
          },
        ],
      };

      console.log("📤 Sending transaction...");
      const result = await tonConnectUI.sendTransaction(transaction);
      console.log("✅ USDT payment sent successfully!", result);
      
      hapticFeedback.notificationOccurred("success");
      showToast(t.paymentSent, "success");
      setAmount("");
      
      // Обновляем данные кошелька
      await fetchWalletData();
    } catch (error) {
      console.error("Deposit error:", error);
      hapticFeedback.notificationOccurred("error");
      
      // Более детальная обработка ошибок
      let errorMessage = t.paymentError;
      
      if (error instanceof Error && error.message) {
        if (error.message.includes('insufficient funds') || error.message.includes('Insufficient balance')) {
          errorMessage = 'Недостаточно TON для оплаты комиссии (нужно минимум 0.15 TON на балансе)';
        } else if (error.message.includes('User rejected')) {
          errorMessage = 'Транзакция отменена';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Превышено время ожидания';
        } else {
          errorMessage = `Ошибка: ${error.message}`;
        }
      }
      
      showToast(errorMessage, "error");
    }
  };

  const currentNetwork = networkData[selectedNetwork];

  return (
    <div
      className="mobile-container relative"
      style={{
        backgroundImage: "url(/bg.webp)",
        backgroundAttachment: "fixed",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Content */}
      <div className="flex flex-col items-start px-4 gap-5 w-full" style={{ 
        paddingTop: `${Math.max(76, safeAreaInsets.top + 60)}px`,
        paddingBottom: '50px' 
      }}>
        {/* Title with Close Button */}
        <div className="flex flex-row justify-center items-center w-full relative">
          <h1 className="font-rubik font-semibold text-[22px] leading-[26px] text-center text-[#1F2937]">
            {t.depositTitle}
          </h1>
          
          {/* Close Button */}
          <button
            onClick={handleBack}
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

        {/* Deposit Amount Card */}
        <div className="flex flex-col items-start p-3 gap-2.5 w-full max-w-[343px] mx-auto bg-white shadow-[0px_2px_0px_rgba(0,0,0,0.25)] rounded-2xl">
          <div className="flex flex-row items-center gap-2 w-full">
            <span className="font-rubik font-semibold text-lg leading-[21px] text-[#1F2937]">
              {t.depositAmount}
            </span>
            <span className="font-rubik font-normal text-xs leading-[14px] text-[#475569] opacity-60">
              ({t.minAmount} {walletData?.min_withdraw || 5} USDT)
            </span>
          </div>

          <div className="flex flex-row justify-between items-center px-2.5 py-2 w-full h-10 bg-[#F6FAFF] border border-[#E6EEF6] rounded">
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder={t.enterAmount}
              className="font-rubik font-normal text-sm leading-[17px] text-[#475569] bg-transparent outline-none flex-1 placeholder:opacity-50"
            />
            <span className="font-rubik font-normal text-xs leading-[130%] text-[#475569] opacity-50">
              USDT
            </span>
          </div>

          <button
            onClick={handleDeposit}
            className="flex flex-row justify-center items-center px-4 py-2 w-full h-12 bg-gradient-to-b from-[#4CD964] to-[#34C759] border border-[#169E1C] rounded-xl transition-transform active:scale-95"
          >
            <span className="font-rubik font-medium text-base leading-[22px] text-white [text-shadow:0px_1px_0px_#158941]">
              {t.depositAmount}
            </span>
          </button>
        </div>

        {/* Manual Deposit Card */}
        <div className="flex flex-col items-start p-3 gap-2.5 w-full max-w-[343px] mx-auto bg-white shadow-[0px_2px_0px_rgba(0,0,0,0.25)] rounded-2xl">
          {/* Header */}
          <div className="flex flex-col items-start w-full">
            <span className="font-rubik font-semibold text-lg leading-[21px] text-[#1F2937]">
              {t.manualDeposit}
            </span>
            <span className="font-rubik font-normal text-xs leading-[22px] text-[#6E6E73]">
              {t.manualDepositDesc}
            </span>
          </div>

          {/* Network Selection */}
          <span className="font-rubik font-medium text-sm leading-5 text-[#1F2937]">
            {t.selectNetwork}
          </span>

          <div className="flex flex-row items-start gap-1.5 w-full">
            {(["TON", "BEP20"] as Network[]).map((network) => (
              <button
                key={network}
                onClick={() => handleNetworkSelect(network)}
                className={`flex-1 flex flex-col justify-center items-center py-1.5 h-10 rounded-md shadow-[0px_1px_6px_rgba(137,137,137,0.06)] border transition-all ${
                  selectedNetwork === network
                    ? "bg-[#FFF9E6] border-[#FFB800]"
                    : "bg-[#F6FAFF] border-[#E6EEF6]"
                }`}
              >
                <span
                  className={`font-rubik font-medium text-sm leading-[17px] ${
                    selectedNetwork === network ? "text-[#1F2937]" : "text-[#475569]"
                  }`}
                >
                  {network}
                </span>
              </button>
            ))}
          </div>

          {/* Wallet Address */}
          <div className="flex flex-col items-start gap-1 w-full">
            <div className="flex flex-row items-start gap-2">
              <span className="font-rubik font-normal text-xs leading-[18px] text-[#6E6E73]">
                {t.walletAddress}
              </span>
              <span className="font-rubik font-normal text-xs leading-[18px] text-[#E4BD4C]">
                ({t.network}: {currentNetwork.label})
              </span>
            </div>

            <div className="flex flex-row justify-between items-center px-2.5 py-2 w-full h-10 bg-[#F6FAFF] border border-[#E6EEF6] rounded">
              <span className="font-rubik font-normal text-sm leading-[17px] text-[#1F2937] flex-1 truncate">
                {currentNetwork.address}
              </span>
              <button
                onClick={() => handleCopy(currentNetwork.address, "address")}
                className="w-[18px] h-[18px] flex-shrink-0 transition-all"
              >
                {copiedField === "address" ? (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 4.5L6.75 12.75L3 9" stroke="#0E9F6E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-50">
                    <path d="M2.75 7.25C2.75 5.129 2.75 4.06775 3.40925 3.40925C4.06775 2.75 5.129 2.75 7.25 2.75H9.5C11.621 2.75 12.6823 2.75 13.3408 3.40925C14 4.06775 14 5.129 14 7.25V11C14 13.121 14 14.1823 13.3408 14.8408C12.6823 15.5 11.621 15.5 9.5 15.5H7.25C5.129 15.5 4.06775 15.5 3.40925 14.8408C2.75 14.1823 2.75 13.121 2.75 11V7.25Z" stroke="#1F2937"/>
                    <path d="M2.75 13.25C2.15326 13.25 1.58097 13.0129 1.15901 12.591C0.737053 12.169 0.5 11.5967 0.5 11V6.5C0.5 3.67175 0.5 2.25725 1.379 1.379C2.258 0.50075 3.67175 0.5 6.5 0.5H9.5C10.0967 0.5 10.669 0.737053 11.091 1.15901C11.5129 1.58097 11.75 2.15326 11.75 2.75" stroke="#1F2937"/>
                  </svg>
                )}
              </button>
            </div>

            <span className="font-rubik font-normal text-[10px] leading-4 text-right text-[#475569] opacity-50 w-full">
              {t.minAmount} {walletData?.min_withdraw || 5} USDT
            </span>
          </div>

          {/* Comment Field (only for networks that need it) */}
          {currentNetwork.comment && (
            <div className="flex flex-col items-start gap-1 w-full">
              <span className="font-rubik font-normal text-xs leading-[18px] text-[#6E6E73]">
                {t.comment} *
              </span>

              <div className="flex flex-row justify-between items-center px-2.5 py-2 w-full h-10 bg-[#F6FAFF] border border-[#E6EEF6] rounded">
                <span className="font-rubik font-normal text-sm leading-[17px] text-[#1F2937]">
                  {currentNetwork.comment}
                </span>
              <button
                onClick={() => currentNetwork.comment && handleCopy(currentNetwork.comment, "comment")}
                className="w-[18px] h-[18px] transition-all"
              >
                {copiedField === "comment" ? (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 4.5L6.75 12.75L3 9" stroke="#0E9F6E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-50">
                    <path d="M2.75 7.25C2.75 5.129 2.75 4.06775 3.40925 3.40925C4.06775 2.75 5.129 2.75 7.25 2.75H9.5C11.621 2.75 12.6823 2.75 13.3408 3.40925C14 4.06775 14 5.129 14 7.25V11C14 13.121 14 14.1823 13.3408 14.8408C12.6823 15.5 11.621 15.5 9.5 15.5H7.25C5.129 15.5 4.06775 15.5 3.40925 14.8408C2.75 14.1823 2.75 13.121 2.75 11V7.25Z" stroke="#1F2937"/>
                    <path d="M2.75 13.25C2.15326 13.25 1.58097 13.0129 1.15901 12.591C0.737053 12.169 0.5 11.5967 0.5 11V6.5C0.5 3.67175 0.5 2.25725 1.379 1.379C2.258 0.50075 3.67175 0.5 6.5 0.5H9.5C10.0967 0.5 10.669 0.737053 11.091 1.15901C11.5129 1.58097 11.75 2.15326 11.75 2.75" stroke="#1F2937"/>
                  </svg>
                )}
              </button>
              </div>
            </div>
          )}

          {/* Warning (only for TON with comment) */}
          {currentNetwork.comment && (
            <div className="flex flex-row items-start px-2.5 py-1.5 gap-1.5 w-full h-10 border border-[#E6EEF6] rounded">
              <Image
                src="/wallet/danger.webp"
                alt="Warning"
                width={16}
                height={16}
              />
              <div className="flex flex-col items-start gap-0.5">
                <span className="font-rubik font-normal text-xs leading-[14px] text-[#FFB800]">
                  {t.warning}
                </span>
                <span className="font-rubik font-normal text-[10px] leading-3 text-[#6B7280] opacity-50">
                  {t.commentRequired}
                </span>
              </div>
            </div>
          )}
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

