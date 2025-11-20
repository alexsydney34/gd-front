'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Phaser from 'phaser';
import GameScene from './GameScene';
import GameOverModal from './GameOverModal';
import { normalizeDuckKey } from '@/app/utils/duckMapper';
import { GameApiClient } from '@/app/lib/gameApi';
import { apiClient } from '@/app/lib/api';
import { useTranslation } from '@/app/hooks/useTranslation';

interface FlappyDuckGameProps {
  selectedDuck?: string;
  isNight?: boolean;
  onGameOver?: (score: number, eggs: string) => void; // eggs is string from API
}

const FlappyDuckGame: React.FC<FlappyDuckGameProps> = ({
  selectedDuck = 'gold',
  isNight = false,
  onGameOver,
}) => {
  const { t } = useTranslation();
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const gameApiRef = useRef<GameApiClient | null>(null);
  const isInitializingRef = useRef(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [gameStats, setGameStats] = useState({ score: 0, eggs: '0', usdt: '0' });
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [currentIsNight, setCurrentIsNight] = useState(isNight);
  const [restartTrigger, setRestartTrigger] = useState(0);
  const [showInitialLoader, setShowInitialLoader] = useState(true);
  const [fadeOutLoader, setFadeOutLoader] = useState(false);
  const [assetsPreloaded, setAssetsPreloaded] = useState(false); // Ассеты предзагружены
  const [loadingProgress, setLoadingProgress] = useState(0); // Прогресс загрузки (0-100)
  const [minLoaderTimeAfterAssets, setMinLoaderTimeAfterAssets] = useState(false); // Прошло 2 сек после загрузки ассетов
  const router = useRouter();
  
  // Create refs for callback functions to avoid re-initialization
  const onGameOverRef = useRef(onGameOver);
  
  // Keep refs up to date
  useEffect(() => {
    onGameOverRef.current = onGameOver;
  }, [onGameOver]);

  // Нормализуем и валидируем утку
  const validDuck = normalizeDuckKey(selectedDuck || 'gold');

  // Предзагрузка ассетов при монтировании
  useEffect(() => {
    const preloadAssets = async () => {
      // Список всех ассетов для предзагрузки
      const assets = [
        // Day theme
        '/game/day_sprites/center.svg',
        '/game/day_sprites/ground.svg',
        '/game/day_sprites/big-cloud.svg',
        '/game/day_sprites/small-cloud.svg',
        
        // Night theme
        '/game/night_sprites/center.svg',
        '/game/night_sprites/Ground.svg',
        '/game/night_sprites/big-cloud.svg',
        '/game/night_sprites/small-cloud.svg',
        '/game/night_sprites/moon.svg',
        
        // Duck
        `/game/duckbody/${validDuck}.svg`,
        `/game/wings/${validDuck}.svg`,
        
        // Pipes
        '/game/pipes/sliced pipes/1_level_top.png',
        '/game/pipes/sliced pipes/1_level_bottom.png',
        '/game/pipes/sliced pipes/2_level_top.png',
        '/game/pipes/sliced pipes/2_level_bottom.png',
        '/game/pipes/sliced pipes/3_level_top.png',
        '/game/pipes/sliced pipes/3_level_bottom.png',
        
        // Egg
        '/game/egg.svg',
      ];

      let loaded = 0;
      const total = assets.length;

      // Параллельная загрузка с отслеживанием прогресса
      const loadPromises = assets.map(async (src) => {
        try {
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              loaded++;
              setLoadingProgress(Math.round((loaded / total) * 100));
              resolve();
            };
            img.onerror = () => {
              console.warn(`Failed to preload: ${src}`);
              loaded++;
              setLoadingProgress(Math.round((loaded / total) * 100));
              resolve(); // Не блокируем при ошибке
            };
            img.src = src;
          });
        } catch (error) {
          console.warn(`Error preloading ${src}:`, error);
        }
      });

      await Promise.all(loadPromises);
      setAssetsPreloaded(true);
    };

    preloadAssets();
  }, [validDuck]);

  // Минимальное время показа лоадера после загрузки ассетов (2 секунды)
  useEffect(() => {
    if (assetsPreloaded) {
      const timer = setTimeout(() => {
        setMinLoaderTimeAfterAssets(true);
      }, 2000); // 2 секунды после загрузки ассетов

      return () => clearTimeout(timer);
    }
  }, [assetsPreloaded]);

  // Скрываем лоадер когда: ассеты загружены + прошло 2 секунды + подключился к серверу
  useEffect(() => {
    if (!isConnecting && assetsPreloaded && minLoaderTimeAfterAssets) {
      // Начинаем fade out
      setFadeOutLoader(true);
      
      // Полностью скрываем через 300ms
      const hideTimer = setTimeout(() => {
        setShowInitialLoader(false);
      }, 300);

      return () => clearTimeout(hideTimer);
    }
  }, [isConnecting, assetsPreloaded, minLoaderTimeAfterAssets]);

  // Смена дня/ночи каждые 20 секунд с плавной анимацией (БЕЗ рестарта игры)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIsNight(prev => {
        const newValue = !prev;
        console.log('[Game] Day/Night cycle changed to:', newValue ? 'Night' : 'Day');
        
        // Плавная смена темы БЕЗ рестарта игры
        const game = phaserGameRef.current;
        if (game) {
          const scene = game.scene.getScene('GameScene') as GameScene;
          if (scene && scene.scene.isActive() && scene.switchTheme) {
            // Switch theme instantly without fade to avoid gameplay disruption
            scene.switchTheme(newValue);
          }
        }
        
        return newValue;
      });
    }, 20000); // 20 секунд

    return () => clearInterval(interval);
  }, []); // Empty dependency array

  useEffect(() => {
    // Prevent duplicate initialization
    if (isInitializingRef.current) {
      return;
    }
    
    // Ждем пока ассеты предзагрузятся
    if (!assetsPreloaded) {
      return;
    }
    
    let mounted = true;
    let initTimer: NodeJS.Timeout;
    
    const initGame = async () => {
      if (isInitializingRef.current) {
        return;
      }
      
      if (!gameRef.current) {
        initTimer = setTimeout(() => {
          if (mounted) initGame();
        }, 100);
        return;
      }
      
      isInitializingRef.current = true;

      try {
        setIsConnecting(true);
        setConnectionError(null);

        // Get JWT token
        const token = apiClient.getToken();
        if (!token) {
          throw new Error('Not authenticated');
        }

        // Create GameApiClient
        const gameApi = new GameApiClient(token);
        gameApiRef.current = gameApi;

        if (!mounted) {
          return;
        }

        // Calculate game dimensions - уменьшили множитель для большего масштаба
        const width = Math.min(window.innerWidth, 428) * 1.5;
        const height = window.innerHeight * 1.5;

        const config: Phaser.Types.Core.GameConfig = {
          type: Phaser.AUTO,
          width,
          height,
          parent: gameRef.current,
          physics: {
            default: 'arcade',
            arcade: {
              gravity: { x: 0, y: 0 },
              debug: false,
            },
          },
          scene: [GameScene],
          backgroundColor: '#000000', // Черный фон для камеры
          scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
          },
          // Оптимизация загрузки и производительности
          loader: {
            maxParallelDownloads: 6, // Загружаем до 6 файлов параллельно
            crossOrigin: 'anonymous', // Для кеширования
          },
          render: {
            antialias: true,
            pixelArt: false, // SVG выглядят лучше без pixelArt
            roundPixels: false,
          },
          fps: {
            target: 60,
            forceSetTimeOut: false,
          },
        };

        // Create game instance
        phaserGameRef.current = new Phaser.Game(config);
        
        // Set up game over callback in registry
        phaserGameRef.current.registry.set('onGameOver', (score: number, eggs: string, usdt: string) => {
          setGameStats({ score, eggs, usdt });
          setShowGameOver(true);
          if (onGameOverRef.current) {
            onGameOverRef.current(score, eggs);
          }
        });

        // Set up game finish callback (when 50 eggs collected)
        phaserGameRef.current.registry.set('onGameFinish', (score: number, eggs: string, usdt: string) => {
          setGameStats({ score, eggs, usdt });
          setShowGameOver(true); // Показываем тот же модал, но игрок не умер
          if (onGameOverRef.current) {
            onGameOverRef.current(score, eggs);
          }
        });
        
        // Pass duck selection, GameApiClient and language to scene
        phaserGameRef.current.scene.start('GameScene', {
          duck: validDuck,
          night: currentIsNight,
          gameApi: gameApiRef.current,
          language: t.tapToStart === 'TAP TO START' ? 'en' : 'ru', // Detect language
        });

        // Hide loading screen after game is created
        setIsConnecting(false);
        isInitializingRef.current = false;
      } catch (error) {
        console.error('[Game] Failed to initialize:', error);
        if (mounted) {
          setConnectionError(error instanceof Error ? error.message : 'Failed to connect');
          setIsConnecting(false);
          isInitializingRef.current = false;
        }
      }
    };

    initGame();

    // Cleanup
    return () => {
      mounted = false;
      isInitializingRef.current = false;
      if (initTimer) {
        clearTimeout(initTimer);
      }
      if (gameApiRef.current) {
        gameApiRef.current.reset();
        gameApiRef.current = null;
      }
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validDuck, restartTrigger, assetsPreloaded]);
  // Note: currentIsNight is intentionally NOT in dependencies to prevent game restart when day/night changes

  const handleRestart = async () => {
    // Cleanup before navigation
    if (gameApiRef.current) {
      gameApiRef.current.reset();
      gameApiRef.current = null;
    }
    
    if (phaserGameRef.current) {
      phaserGameRef.current.destroy(true);
      phaserGameRef.current = null;
    }
    
    router.push('/choose-duck');
  };

  const handleHome = () => {
    // Cleanup before navigation
    if (gameApiRef.current) {
      gameApiRef.current.reset();
      gameApiRef.current = null;
    }
    
    if (phaserGameRef.current) {
      phaserGameRef.current.destroy(true);
      phaserGameRef.current = null;
    }
    
    router.push('/choose-duck');
  };

  return (
    <div className="relative w-full h-full">
      {/* Game container - always rendered so ref can attach */}
      <div
        ref={gameRef}
        className="w-full h-full"
        style={{
          maxWidth: '428px',
          margin: '0 auto',
          touchAction: 'none',
          visibility: isConnecting || connectionError || showInitialLoader ? 'hidden' : 'visible',
        }}
      />
      
      {/* Unified loader - показывается пока загружаются ассеты и подключается к серверу */}
      {showInitialLoader && (
        <div 
          className="absolute inset-0 w-full h-full flex items-center justify-center z-[60] transition-opacity duration-200"
          style={{
            backgroundImage: "url(/bg.webp)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: fadeOutLoader ? 0 : 1,
          }}
        >
          <div className="text-center flex flex-col items-center gap-8">
            {/* Duck animation */}
            <div className="relative w-24 h-24">
              <div 
                className="absolute inset-0 animate-bounce"
                style={{
                  backgroundImage: `url(/main/ducks/${validDuck}.webp)`,
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              />
            </div>
            
            {/* Loading text - меняется в зависимости от состояния */}
            <div className="flex flex-col items-center gap-6">
              {/* Progress bar */}
              <div className="w-64 h-3 bg-gray-700/50 rounded-full overflow-hidden backdrop-blur-sm">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-300 ease-out"
                  style={{ width: `${assetsPreloaded ? 100 : loadingProgress}%` }}
                />
              </div>
              
              {/* Animated dots */}
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
              
              {/* Status text */}
              <div className="flex flex-col items-center gap-2">
                <p 
                  className="font-rubik font-black text-2xl text-center uppercase"
                  style={{
                    background: 'linear-gradient(177.87deg, #FFE721 23.99%, #FCC100 80.34%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    WebkitTextStroke: '1.5px #AC5700',
                    filter: 'drop-shadow(0px 1px 0px #AC5700)'
                  }}
                >
                  {!assetsPreloaded ? t.loadingAssets : isConnecting ? t.connectingServer : t.ready}
                </p>
                <p className="font-rubik font-bold text-lg text-yellow-300">
                  {!assetsPreloaded ? `${loadingProgress}%` : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {connectionError && (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black z-50">
          <div className="text-center p-4">
            <p className="text-red-500 font-rubik text-xl mb-4">{t.connectionError}</p>
            <p className="text-white font-rubik mb-4">{connectionError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-yellow-400 text-black font-rubik font-bold rounded-lg"
            >
              {t.retry}
            </button>
          </div>
        </div>
      )}
      
      {/* Game over modal */}
      {showGameOver && (
        <GameOverModal
          eggs={gameStats.eggs}
          usdt={gameStats.usdt}
          onRestart={handleRestart}
          onHome={handleHome}
        />
      )}
    </div>
  );
};

export default FlappyDuckGame;

