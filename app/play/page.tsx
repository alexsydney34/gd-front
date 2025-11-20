'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useTelegram } from '../hooks/useTelegram';

// Динамически импортируем игру (чтобы избежать SSR проблем с Phaser)
const FlappyDuckGame = dynamic(
  () => import('../components/FlappyDuckGame'),
  { ssr: false }
);

export default function PlayPage() {
  const [selectedDuck, setSelectedDuck] = useState<string | null>(null);
  const [isNight, setIsNight] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { webApp } = useTelegram();

  // Скрываем нижнюю навигацию на этой странице
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.body.classList.add('hide-navigation');
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        document.body.classList.remove('hide-navigation');
      }
    };
  }, []);

  // ОТКЛЮЧАЕМ кнопку "Назад" в игре (чтобы нельзя было вернуться)
  useEffect(() => {
    if (webApp) {
      webApp.BackButton.hide();
      console.log('[PlayPage] Back button disabled during game');
    }

    return () => {
      // При выходе со страницы игры показываем back button обратно
      if (webApp) {
        webApp.BackButton.show();
      }
    };
  }, [webApp]);

  // Получаем выбранную утку из localStorage при загрузке
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDuck = localStorage.getItem('selectedDuck');
      const savedDuckId = localStorage.getItem('selectedDuckId');
      console.log('Selected duck from localStorage:', { duck: savedDuck, id: savedDuckId });
      setSelectedDuck(savedDuck || 'gold');
    }
    setIsLoading(false);
  }, []);

  const handleGameOver = (score: number, eggs: string) => {
    console.log('Game Over! Score:', score, 'Eggs:', eggs);
    
    // Очищаем выбранную утку после завершения игры
    if (typeof window !== 'undefined') {
      localStorage.removeItem('selectedDuck');
      localStorage.removeItem('selectedDuckId');
      console.log('[PlayPage] Game over - cleared selected duck');
    }
  };

  // Показываем загрузку пока не получили утку из localStorage
  if (isLoading || !selectedDuck) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black" style={{ overscrollBehaviorY: 'none' }}>
      {/* Game Container */}
      <div className="w-full h-full flex items-center justify-center">
        <FlappyDuckGame
          selectedDuck={selectedDuck}
          isNight={isNight}
          onGameOver={handleGameOver}
        />
      </div>
    </div>
  );
}

