import Image from "next/image";

interface DuckBadgeProps {
  type: 'lives' | 'days' | 'quantity';
  value: number;
  maxValue?: number;
}

export const DuckBadge = ({ type, value, maxValue }: DuckBadgeProps) => {
  const renderContent = () => {
    switch (type) {
      case 'lives':
        return (
          <>
            <Image
              src="/main/chose-duck-modal/heart.webp"
              alt="lives"
              width={10}
              height={9}
              className="flex-shrink-0"
            />
            <span className="font-rubik font-medium text-[10px] leading-3 text-[#475569]">
              {value}
            </span>
          </>
        );
      
      case 'days':
        return (
          <span className="font-rubik font-medium text-[10px] leading-3 text-center text-[#475569]">
            {value}/{maxValue} дн
          </span>
        );
      
      case 'quantity':
        return (
          <span className="font-rubik font-medium text-[10px] leading-3 text-center text-[#475569]">
            {value} шт
          </span>
        );
    }
  };

  return (
    <div className="flex flex-row justify-center items-center gap-2.5 px-1.5 py-1 bg-white rounded-xl">
      {renderContent()}
    </div>
  );
};

