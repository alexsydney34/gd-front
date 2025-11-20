"use client";

import { useEffect } from "react";
import Image from "next/image";

export type ToastType = "success" | "error";

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, isVisible, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const iconSrc = type === "success" ? "/system/succes.webp" : "/system/error.webp";
  const textColor = type === "success" ? "text-[#0E9F6E]" : "text-[#FFB800]";

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-[100px] z-[100001] w-full max-w-[343px] px-4 animate-slideUp">
      <div className="flex flex-row justify-center items-center px-3 py-2.5 gap-0.5 w-full bg-white shadow-[0px_2px_0px_rgba(0,0,0,0.25)] rounded-xl">
        <div className="flex flex-row items-center gap-3 mx-auto">
          <Image
            src={iconSrc}
            alt={type}
            width={24}
            height={24}
            className="flex-shrink-0"
          />
          <span className={`font-rubik font-medium text-base leading-[19px] text-center capitalize ${textColor}`}>
            {message}
          </span>
        </div>
      </div>
    </div>
  );
}

