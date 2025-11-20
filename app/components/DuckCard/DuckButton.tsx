interface DuckButtonProps {
  variant: 'play' | 'buy' | 'soon' | 'disabled';
  onClick?: () => void;
  label: string;
  price?: number;
}

export const DuckButton = ({ variant, onClick, label, price }: DuckButtonProps) => {
  const getButtonStyles = () => {
    const baseStyles = "flex items-center justify-center px-3 py-2 h-9 rounded-[18px]";
    
    switch (variant) {
      case 'play':
        return `${baseStyles} min-w-[98px] bg-gradient-to-b from-[#FFF382] via-[#FFD52C] to-[#FF9F0A] border border-[rgba(172,87,0,0.6)] transition-transform active:scale-95`;
      
      case 'buy':
        return `${baseStyles} min-w-[98px] bg-gradient-to-b from-[#4CD964] via-[#34C759] to-[#34C759] border border-[#169E1C] transition-transform active:scale-95`;
      
      case 'soon':
      case 'disabled':
        return `${baseStyles} min-w-[98px] bg-gradient-to-b from-[#ECEFF3] to-[#DDE3EA] border border-[#C6CFD8] cursor-not-allowed`;
    }
  };

  const getTextStyles = () => {
    const baseStyles = "font-rubik font-bold text-center uppercase whitespace-nowrap";
    
    switch (variant) {
      case 'play':
        // Для play кнопки всегда используем text-xs для лучшего отображения длинного текста
        const playFontSize = price !== undefined ? "text-xs" : "text-xs";
        return `${baseStyles} ${playFontSize} leading-[22px] text-white [text-shadow:0px_1px_0px_rgba(172,87,0,0.6)]`;
      
      case 'buy':
        const buyFontSize = price !== undefined ? "text-xs" : "text-sm";
        return `${baseStyles} ${buyFontSize} leading-[22px] text-white [text-shadow:0px_1px_0px_#158941]`;
      
      case 'soon':
      case 'disabled':
        return `${baseStyles} text-sm leading-[22px] text-[#9CA3AF]`;
    }
  };

  const isDisabled = variant === 'soon' || variant === 'disabled';
  const displayText = price !== undefined ? `${label} $${price}` : label;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={getButtonStyles()}
    >
      <span className={getTextStyles()}>
        {displayText}
      </span>
    </button>
  );
};

