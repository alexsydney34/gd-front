"use client";

import { PlayButtonProps } from "../types";
import { useTelegram } from "../hooks/useTelegram";

export default function PlayButton({ onClick }: PlayButtonProps) {
  const { hapticFeedback } = useTelegram();

  const handleClick = () => {
    // Haptic feedback при клике
    hapticFeedback.impactOccurred("medium");
    
    if (onClick) {
      onClick();
    }
  };

  return (
    <button 
      className="btn-play" 
      style={{ marginBottom: "48px" }}
      onClick={handleClick}
      aria-label="Play game"
    >
      <div className="btn-play-oval"></div>
      <span className="btn-play-label">PLAY</span>
    </button>
  );
}

