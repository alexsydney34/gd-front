"use client";

import { useState } from "react";
import { DuckCardProps } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import { useTelegram } from "../../hooks/useTelegram";
import { getDuckNameKey, getDuckImage, canPlayDuck } from "./utils";
import { DuckBadge } from "./DuckBadge";
import { DuckButton } from "./DuckButton";
import { DuckInfo } from "./DuckInfo";
import DuckModal from "../DuckModal";
import BuyConfirmModal from "../BuyConfirmModal";

export default function DuckCard({ duck, onPlayClick, onBuyClick, isShopItem = false, eggsPrice }: DuckCardProps) {
  const { t } = useTranslation();
  const { hapticFeedback } = useTelegram();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);

  const handlePlayClick = () => {
    hapticFeedback.impactOccurred("medium");
    onPlayClick?.(duck.id);
  };

  const handleBuyClick = () => {
    hapticFeedback.impactOccurred("medium");
    setIsBuyModalOpen(true);
  };

  const handleBuyConfirm = async () => {
    if (onBuyClick) {
      const result = await onBuyClick(duck.id);
      return result || { ok: true };
    }
    return { ok: true };
  };

  const handleDuckImageClick = () => {
    hapticFeedback.impactOccurred("light");
    setIsModalOpen(true);
  };

  // Determine button variant
  const getButtonVariant = (): 'play' | 'buy' | 'soon' | 'disabled' => {
    if (isShopItem) {
      return duck.opened ? 'buy' : 'soon';
    }
    
    if (!duck.opened) return 'soon';
    return canPlayDuck(duck) ? 'play' : 'disabled';
  };

  const buttonVariant = getButtonVariant();
  const duckImageSrc = getDuckImage(duck.key, duck.image);
  const duckNameKey = getDuckNameKey(duck.key) as keyof typeof t;
  const isGrayDuck = duckNameKey === 'grayDuck';

  return (
    <>
      <div className="flex items-end px-3 pb-[2px] gap-3 w-full bg-[#FFFFFF] shadow-[0px_2px_0px_rgba(0,0,0,0.25)] rounded-2xl transition-transform active:scale-[0.98]">
        {/* Duck image container */}
        <div 
          onClick={handleDuckImageClick}
          className="relative flex flex-col justify-end items-end min-w-[70px] h-[85px] overflow-visible top-[-20px] cursor-pointer transition-transform active:scale-95"
          style={{ 
            backgroundImage: `url(${duckImageSrc})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center bottom',
            backgroundRepeat: 'no-repeat'
          }}
        >
        {/* Bottom-right badge - Lives (for My Ducks with lives) */}
        {!isShopItem && duck.lives > 0 && (
          <DuckBadge type="lives" value={duck.lives} />
        )}
        
        {/* Bottom-right badge - Days (for My Ducks without lives, except gray duck) */}
        {!isShopItem && duck.curent_from && duck.curent_from.from > 0 && duck.lives === 0 && !isGrayDuck && (
          <DuckBadge 
            type="days" 
            value={duck.curent_from.curent} 
            maxValue={duck.curent_from.from} 
          />
        )}
        
        {/* Bottom-right badge - Quantity (for Shop) */}
        {isShopItem && duck.pcs > 0 && (
          <DuckBadge type="quantity" value={duck.pcs} />
        )}
      </div>

      {/* Duck info */}
      <div className={`flex-1 flex items-center justify-between gap-2 min-h-[42px] ${isShopItem ? 'mb-2' : 'mb-3'}`}>
        <div className={`flex flex-col gap-0.5 ${isShopItem && !duck.opened ? 'opacity-40' : ''} flex-1 min-w-0`}>
          <h3 className={`font-rubik font-medium ${isShopItem ? 'text-lg leading-[22px]' : 'text-[28px] leading-[32px]'} tracking-[-1px] uppercase text-[#1F2937] overflow-hidden text-ellipsis whitespace-nowrap`}>
            {t[duckNameKey] && t[duckNameKey].length > 5
              ? `${t[duckNameKey].slice(0, 5)}...`
              : t[duckNameKey]}
          </h3>
          <DuckInfo mode={isShopItem ? 'shop' : 'myDucks'} duck={duck} t={t} eggsPrice={eggsPrice} />
        </div>

        <DuckButton
          variant={buttonVariant}
          onClick={buttonVariant === 'play' ? handlePlayClick : buttonVariant === 'buy' ? handleBuyClick : undefined}
          label={buttonVariant === 'buy' ? t.buyButton : buttonVariant === 'play' ? t.playButton : t.soonButton}
          price={buttonVariant === 'buy' ? duck.price : undefined}
        />
      </div>
    </div>

    {/* Duck Info Modal */}
    <DuckModal 
      duck={duck}
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      isShopItem={isShopItem}
      eggsPrice={eggsPrice}
    />

    {/* Buy Confirmation Modal */}
    {isShopItem && (
      <BuyConfirmModal
        duck={duck}
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        onConfirm={handleBuyConfirm}
      />
    )}
  </>
  );
}

