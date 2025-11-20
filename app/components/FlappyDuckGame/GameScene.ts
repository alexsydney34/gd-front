import Phaser from 'phaser';
import { normalizeDuckKey } from '@/app/utils/duckMapper';
import { GameApiClient } from '@/app/lib/gameApi';

interface HapticFeedback {
  impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
  notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
  selectionChanged: () => void;
}

export default class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private pipesGroup!: Phaser.Physics.Arcade.Group;
  private gapsGroup!: Phaser.Physics.Arcade.Group;
  private eggsGroup!: Phaser.Physics.Arcade.Group;
  private ground!: Phaser.GameObjects.TileSprite;
  private background!: Phaser.GameObjects.TileSprite;
  
  // Day/Night theme objects
  private dayBackgroundCenter!: Phaser.GameObjects.Image;
  private nightBackgroundCenter!: Phaser.GameObjects.Image;
  private dayGround!: Phaser.GameObjects.TileSprite;
  private nightGround!: Phaser.GameObjects.TileSprite;
  private dayClouds!: Phaser.GameObjects.Group;
  private nightClouds!: Phaser.GameObjects.Group;
  private moon!: Phaser.GameObjects.Image;
  private bgMusic?: Phaser.Sound.BaseSound;
  
  private gameStarted = false;
  private gameOver = false;
  private score = 0;
  private eggs = '0'; // Баланс EGGS с сервера
  private usdt = '0'; // Баланс USDT с сервера
  private prevEggs = '0'; // Предыдущее значение для анимации
  private prevUsdt = '0'; // Предыдущее значение для анимации
  private framesMoveUp = 0;
  private isRestarting = false; // Флаг процесса рестарта
  private collectedEggsCount = 0; // Счетчик собранных яиц в текущей игре
  private totalEggsOnMap = 0; // Общее количество яиц на карте (макс 50)
  private gameStartTime = 0; // Время старта игры для таймаута
  private lastProgressTime = 0; // Время последнего прогресса (сбор яйца или прохождение трубы)
  
  // Game speed settings (основано на 50 яйцах максимум)
  private readonly PIPE_SPEED = 300; // Начальная скорость движения труб
  private readonly GROUND_SCROLL_SPEED = 2; // Скорость прокрутки земли
  private currentPipeSpeed = 300; // Текущая скорость труб (увеличивается динамически)
  private readonly PIPE_SPEED_INCREMENT = 5; // Увеличение скорости за каждую пройденную трубу (ускорено для более динамичной игры)
  private readonly MAX_PIPE_SPEED = 500; // Максимальная скорость (увеличена для более динамичной игры)
  
  private scoreText!: Phaser.GameObjects.Text;
  private eggsText!: Phaser.GameObjects.Text;
  private startMessage!: Phaser.GameObjects.Text;
  private gameOverText!: Phaser.GameObjects.Text;
  
  private selectedDuck = 'gold';
  private isNight = false;
  private language = 'ru'; // Language for UI text

  // REST API integration
  private gameApi?: GameApiClient;
  private lastPipeX = 0; // Last created pipe X position
  private pipeCounter = 0; // Counter for unique pipe IDs
  private nextPipeTime = 0; // Time until next pipe spawn
  private readonly PIPE_SPAWN_INTERVAL = 3500; // Spawn pipe every 3.5 seconds (increased from 3)
  private readonly PIPES_PER_LEVEL = 20; // Number of pipes before level change
  private backgroundGradient!: Phaser.GameObjects.Graphics; // For theme switching
  private hapticFeedback?: HapticFeedback; // Telegram WebApp haptic feedback
  private shouldLose = false; // Flag for win_next = false
  private lastPipeTime = 0; // Track time since last pipe for consistent spawning

  constructor() {
    super({ key: 'GameScene' });
    
    // Get Telegram WebApp haptic feedback
    if (typeof window !== 'undefined') {
      const telegram = (window as { Telegram?: { WebApp?: { HapticFeedback?: HapticFeedback } } }).Telegram;
      if (telegram?.WebApp?.HapticFeedback) {
        this.hapticFeedback = telegram.WebApp.HapticFeedback;
      }
    }
  }

  init(data: { duck?: string; night?: boolean; gameApi?: GameApiClient; language?: string }) {
    // Сбрасываем состояние игры
    this.gameStarted = false;
    this.gameOver = false;
    this.score = 0;
    this.eggs = '0';
    this.usdt = '0';
    this.prevEggs = '0';
    this.prevUsdt = '0';
    this.collectedEggsCount = 0;
    this.totalEggsOnMap = 0;
    this.isRestarting = true; // Блокируем input на время инициализации
    this.lastPipeX = 0; // Reset last pipe position
    this.pipeCounter = 0;
    this.nextPipeTime = 0;
    this.shouldLose = false;
    this.lastPipeTime = 0;
    this.currentPipeSpeed = this.PIPE_SPEED; // Сбрасываем скорость труб
    this.gameStartTime = 0;
    this.lastProgressTime = 0;
    
    // Валидация и нормализация утки
    const duckValue = data.duck && data.duck !== 'undefined' ? data.duck : 'gold';
    this.selectedDuck = normalizeDuckKey(duckValue);
    this.isNight = data.night || false;
    this.language = data.language || 'ru';
    this.gameApi = data.gameApi;
    
    // Разблокируем input через 500ms после инициализации
    setTimeout(() => {
      this.isRestarting = false;
    }, 500);
  }


  preload() {
    // Показываем прогресс загрузки
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(this.scale.width / 2 - 160, this.scale.height / 2 - 30, 320, 50);
    
    const loadingText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 50, 'Loading...', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    const percentText = this.add.text(this.scale.width / 2, this.scale.height / 2, '0%', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(this.scale.width / 2 - 150, this.scale.height / 2 - 20, 300 * value, 30);
      percentText.setText(Math.floor(value * 100) + '%');
    });
    
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });
    
    // КЕШИРОВАНИЕ: загружаем только то, что еще не загружено
    
    // Day theme - проверяем кеш
    if (!this.textures.exists('day-center')) {
      this.load.svg('day-center', '/game/day_sprites/center.svg');
    }
    if (!this.textures.exists('day-ground')) {
      this.load.svg('day-ground', '/game/day_sprites/ground.svg');
    }
    if (!this.textures.exists('day-big-cloud')) {
      this.load.svg('day-big-cloud', '/game/day_sprites/big-cloud.svg');
    }
    if (!this.textures.exists('day-small-cloud')) {
      this.load.svg('day-small-cloud', '/game/day_sprites/small-cloud.svg');
    }
    
    // Night theme - проверяем кеш
    if (!this.textures.exists('night-center')) {
      this.load.svg('night-center', '/game/night_sprites/center.svg');
    }
    if (!this.textures.exists('night-ground')) {
      this.load.svg('night-ground', '/game/night_sprites/Ground.svg');
    }
    if (!this.textures.exists('night-big-cloud')) {
      this.load.svg('night-big-cloud', '/game/night_sprites/big-cloud.svg');
    }
    if (!this.textures.exists('night-small-cloud')) {
      this.load.svg('night-small-cloud', '/game/night_sprites/small-cloud.svg');
    }
    if (!this.textures.exists('moon')) {
      this.load.svg('moon', '/game/night_sprites/moon.svg');
    }

    // Duck - загружаем только выбранную утку
    if (!this.textures.exists(`duck-body-${this.selectedDuck}`)) {
      this.load.svg(`duck-body-${this.selectedDuck}`, `/game/duckbody/${this.selectedDuck}.svg`);
    }
    if (!this.textures.exists(`duck-wing-${this.selectedDuck}`)) {
      this.load.svg(`duck-wing-${this.selectedDuck}`, `/game/wings/${this.selectedDuck}.svg`);
    }
    
    // Pipes - проверяем кеш
    if (!this.textures.exists('pipe-1-top')) {
      this.load.image('pipe-1-top', '/game/pipes/sliced pipes/1_level_top.png');
    }
    if (!this.textures.exists('pipe-1-bottom')) {
      this.load.image('pipe-1-bottom', '/game/pipes/sliced pipes/1_level_bottom.png');
    }
    if (!this.textures.exists('pipe-2-top')) {
      this.load.image('pipe-2-top', '/game/pipes/sliced pipes/2_level_top.png');
    }
    if (!this.textures.exists('pipe-2-bottom')) {
      this.load.image('pipe-2-bottom', '/game/pipes/sliced pipes/2_level_bottom.png');
    }
    if (!this.textures.exists('pipe-3-top')) {
      this.load.image('pipe-3-top', '/game/pipes/sliced pipes/3_level_top.png');
    }
    if (!this.textures.exists('pipe-3-bottom')) {
      this.load.image('pipe-3-bottom', '/game/pipes/sliced pipes/3_level_bottom.png');
    }
    
    // Egg - проверяем кеш
    if (!this.textures.exists('egg')) {
      this.load.svg('egg', '/game/egg.svg');
    }
    
    // Background music - проверяем кеш
    if (!this.sound.get('bgMusic')) {
      this.load.audio('bgMusic', '/game/music.mp3');
    }
  }

  create() {
    // Set camera background to black (prevents white flash during shake)
    this.cameras.main.setBackgroundColor('#000000');
    
    // Create gradient background using Phaser's fillGradientStyle
    this.backgroundGradient = this.add.graphics();
    this.updateBackgroundGradient();
    this.backgroundGradient.setDepth(-10); // Behind everything

    // Initialize and play background music
    if (this.sound.get('bgMusic')) {
      this.bgMusic = this.sound.get('bgMusic');
    } else {
      this.bgMusic = this.sound.add('bgMusic', { 
        loop: true, 
        volume: 0.3 // Тихая фоновая музыка
      });
    }
    
    // Start music if not already playing
    if (this.bgMusic && !this.bgMusic.isPlaying) {
      this.bgMusic.play();
    }

    // Create moon (always create, control visibility)
    if (this.textures.exists('moon')) {
      this.moon = this.add.image(this.scale.width - 80, 80, 'moon');
      this.moon.setScale(1.2);
      this.moon.setVisible(this.isNight);
    }

    // Create day clouds
    this.dayClouds = this.add.group();
    this.createClouds(this.dayClouds, 'day');
    
    // Create night clouds
    this.nightClouds = this.add.group();
    this.createClouds(this.nightClouds, 'night');

    // Add background centers (buildings) for both themes
    if (this.textures.exists('day-center')) {
      this.dayBackgroundCenter = this.add.image(
        this.scale.width / 2,
        this.scale.height - 200,
        'day-center'
      );
      this.dayBackgroundCenter.setDisplaySize(this.scale.width, 387);
      this.dayBackgroundCenter.setVisible(!this.isNight);
    }
    
    if (this.textures.exists('night-center')) {
      this.nightBackgroundCenter = this.add.image(
        this.scale.width / 2,
        this.scale.height - 200,
        'night-center'
      );
      this.nightBackgroundCenter.setDisplaySize(this.scale.width, 387);
      this.nightBackgroundCenter.setVisible(this.isNight);
    }

    // Physics groups
    this.pipesGroup = this.physics.add.group();
    this.gapsGroup = this.physics.add.group();
    this.eggsGroup = this.physics.add.group();

    // Create ground for both themes
    if (this.textures.exists('day-ground')) {
      this.dayGround = this.add.tileSprite(
        this.scale.width / 2,
        this.scale.height - 100,
        this.scale.width,
        200,
        'day-ground'
      );
      this.dayGround.setDepth(20);
      this.dayGround.setVisible(!this.isNight);
    }
    
    if (this.textures.exists('night-ground')) {
      this.nightGround = this.add.tileSprite(
        this.scale.width / 2,
        this.scale.height - 100,
        this.scale.width,
        200,
        'night-ground'
      );
      this.nightGround.setDepth(20);
      this.nightGround.setVisible(this.isNight);
    }
    
    // Use physics body from active ground
    const activeGround = this.isNight ? this.nightGround : this.dayGround;
    if (activeGround) {
      this.physics.add.existing(activeGround, true); // true = static body
      this.ground = activeGround; // Keep reference for collision
    }

    // Create player (duck)
    this.createPlayer();
    
    console.log('[GameScene] Game dimensions - width:', this.scale.width, 'height:', this.scale.height);

    // UI
    this.createUI();

    // Input
    this.input.on('pointerdown', () => this.handleInput());
    this.input.keyboard?.on('keydown-SPACE', () => this.handleInput());
    this.input.keyboard?.on('keydown-UP', () => this.handleInput());

    // Collisions
    // Overlap для подсчета очков (мягкое столкновение)
    this.physics.add.overlap(
      this.player,
      this.gapsGroup,
      (_player, gapObject) => {
        const gap = gapObject as Phaser.GameObjects.Rectangle;
        const playerSprite = _player as Phaser.Physics.Arcade.Sprite;
        
        console.log('[GameScene] Gap overlap detected!', {
          gapName: gap.name,
          gapX: gap.x,
          playerX: playerSprite.x,
          scored: gap.getData('scored')
        });
        
        if (!gap.getData('scored')) {
          gap.setData('scored', true);
          this.score++;
          
          // Обновляем время последнего прогресса
          this.lastProgressTime = this.time.now;
          
          // Увеличиваем скорость труб постепенно (динамически)
          if (this.currentPipeSpeed < this.MAX_PIPE_SPEED) {
            this.currentPipeSpeed += this.PIPE_SPEED_INCREMENT;
          }
          
          this.updateScoreDisplay();
          
          // Явное логирование прохождения трубы
          // Уровень теперь зависит от собранных яиц, а не от пройденных труб
          let currentLevel = 1;
          if (this.collectedEggsCount >= 40) currentLevel = 3;
          else if (this.collectedEggsCount >= 20) currentLevel = 2;
          
          console.log(`[GameScene] ✅ PASSED PIPE #${this.score} | Eggs: ${this.collectedEggsCount} | Current Level: ${currentLevel} | Speed: ${Math.round(this.currentPipeSpeed)}px/s`);
        }
      }
    );
    
    // Overlap для сбора яиц (один коллайдер для всей группы)
    this.physics.add.overlap(
      this.player,
      this.eggsGroup,
      (_player, eggObject) => {
        const eggSprite = eggObject as Phaser.Physics.Arcade.Sprite;
        
        // Check if already collected to prevent double collection
        if (eggSprite.getData('collected')) {
          return;
        }
        
        console.log('[GameScene] Collecting egg:', eggSprite.name);
        eggSprite.setData('collected', true);
        
        // Обновляем время последнего прогресса
        this.lastProgressTime = this.time.now;
        
        // Haptic feedback при сборе яйца (успех)
        if (this.hapticFeedback) {
          this.hapticFeedback.notificationOccurred('success');
        }
        
        // Увеличиваем счетчик собранных яиц
        this.collectedEggsCount++;
        
        // Определяем текущий уровень сложности
        let currentLevel = 1;
        if (this.collectedEggsCount >= 40) currentLevel = 3;
        else if (this.collectedEggsCount >= 20) currentLevel = 2;
        
        // Проверяем смену уровня
        const isLevelChange = 
          this.collectedEggsCount === 20 || 
          this.collectedEggsCount === 40;
        
        if (isLevelChange) {
          console.log(`[GameScene] 🎉 LEVEL UP! Now Level ${currentLevel} | Collected eggs: ${this.collectedEggsCount}`);
        } else {
          console.log(`[GameScene] 🥚 Collected egg #${this.collectedEggsCount} | Level: ${currentLevel}`);
        }
        
        // Destroy egg immediately
        eggSprite.destroy();
        
        // Проверяем достижение лимита (50 яиц = победа!)
        if (this.collectedEggsCount >= 50) {
          console.log('[GameScene] 🎊 ALL 50 EGGS COLLECTED! Victory! Showing finish banner...');

          // ВАЖНО: Сразу блокируем игру, чтобы игрок не мог умереть во время задержки
          this.gameOver = true;
          this.gameStarted = false;

          // Небольшая задержка перед показом баннера для красоты
          this.time.delayedCall(500, () => {
            this.finishGame();
          });

          return; // Выходим, не отправляем на сервер
        }
        
        // Отправляем на сервер и получаем НОВЫЕ значения
        if (this.gameApi) {
          console.log('[GameScene] Sending coin collection to API...');
          
          this.gameApi.collectCoin().then((result) => {
            console.log('[GameScene] ===== SERVER RESPONSE =====');
            console.log('[GameScene] Raw result:', JSON.stringify(result));
            console.log('[GameScene] Eggs collected:', this.collectedEggsCount);
            
            // Сохраняем ПРЕДЫДУЩИЕ значения для анимации
            this.prevEggs = this.eggs;
            this.prevUsdt = this.usdt;
            
            // Получаем НОВЫЕ значения с сервера (БЕЗ ИЗМЕНЕНИЙ!)
            if (result.eggs !== undefined) {
              this.eggs = result.eggs;
            }
            if (result.usdt !== undefined) {
              this.usdt = result.usdt;
            }
            
            console.log('[GameScene] Balance update:');
            console.log(`  Previous: ${this.prevEggs} EGGS = $${this.prevUsdt}`);
            console.log(`  New:      ${this.eggs} EGGS = $${this.usdt}`);
            console.log('[GameScene] ========================');
            
            // Запускаем анимацию плавного начисления
            this.animateScoreUpdate();
          }).catch((error) => {
            console.error('[GameScene] Failed to collect coin:', error);
          });
        }
      }
    );
    
    // Collider для труб (твердое столкновение - игра заканчивается)
    this.physics.add.collider(
      this.player,
      this.pipesGroup,
      () => this.hitPipe(),
      undefined,
      this
    );

    // Ground collision (твердое столкновение)
    if (this.ground && this.ground.body) {
      this.physics.add.collider(
        this.player,
        this.ground,
        () => this.hitPipe(),
        undefined,
        this
      );
    }
  }

  update(time: number, delta: number) {
    // Update container position even during game over (for death animation)
    if (this.gameOver) {
      const container = this.player.getData('visualContainer');
      if (container && this.player.body) {
        container.x = this.player.x;
        container.y = this.player.y;
      }
      return;
    }
    
    if (!this.gameStarted) return;

    // === ЗАЩИТА ОТ ЗАВИСАНИЯ: Проверка таймаута без прогресса ===
    const timeSinceLastProgress = time - this.lastProgressTime;
    const MAX_IDLE_TIME = 20000; // 20 секунд без прогресса = проигрыш
    
    if (timeSinceLastProgress > MAX_IDLE_TIME) {
      console.log('[GameScene] ⚠️ TIMEOUT: No progress for', Math.round(timeSinceLastProgress / 1000), 'seconds. Ending game.');
      this.endGame();
      return;
    }

    // Track time and spawn pipes at regular intervals
    this.nextPipeTime -= delta;
    if (this.nextPipeTime <= 0) {
      this.spawnPipe();
      this.nextPipeTime = this.PIPE_SPAWN_INTERVAL;
    }

    // Animate both grounds (only visible one will show)
    if (this.dayGround) {
      this.dayGround.tilePositionX += this.GROUND_SCROLL_SPEED;
    }
    if (this.nightGround) {
      this.nightGround.tilePositionX += this.GROUND_SCROLL_SPEED;
    }

    // Move clouds (both groups) - с вертикальным движением для живости
    const moveClouds = (group: Phaser.GameObjects.Group) => {
      group.getChildren().forEach((cloud) => {
        const cloudSprite = cloud as Phaser.GameObjects.Sprite;
        
        // Горизонтальное движение
        cloudSprite.x -= cloudSprite.getData('speed');
        if (cloudSprite.x < -150) {
          cloudSprite.x = this.scale.width + 150;
          // При возврате меняем высоту для разнообразия
          const newBaseY = Phaser.Math.Between(120, 400);
          cloudSprite.setData('baseY', newBaseY);
        }
        
        // Вертикальное плавное колебание (синусоида)
        const baseY = cloudSprite.getData('baseY');
        const verticalOffset = cloudSprite.getData('verticalOffset');
        const amplitude = cloudSprite.getData('verticalAmplitude');
        const verticalSpeed = cloudSprite.getData('verticalSpeed');
        
        // Обновляем вертикальное смещение
        const newOffset = verticalOffset + verticalSpeed;
        cloudSprite.setData('verticalOffset', newOffset);
        
        // Применяем синусоидальное движение к Y позиции
        cloudSprite.y = baseY + Math.sin(newOffset) * amplitude;
      });
    };
    
    moveClouds(this.dayClouds);
    moveClouds(this.nightClouds);

    // Update visual container position and rotation to match physics sprite
    const container = this.player.getData('visualContainer');
    if (container && this.player.body) {
      container.x = this.player.x;
      container.y = this.player.y;
      
      const velocity = (this.player.body as Phaser.Physics.Arcade.Body).velocity.y;
      const angle = Phaser.Math.Clamp(velocity / 10, -20, 90);
      container.angle = angle;
    }

    // Decrement flap frames
    if (this.framesMoveUp > 0) {
      this.framesMoveUp--;
    }

    // Move pipes and their visual parts
    this.pipesGroup.getChildren().forEach((pipe) => {
      const pipeSprite = pipe as Phaser.Physics.Arcade.Sprite;
      // Update visual parts position to match physics sprite
      const visualParts = pipeSprite.getData('visualParts');
      if (visualParts) {
        visualParts.forEach((part: Phaser.GameObjects.Image) => {
          part.x = pipeSprite.x;
        });
      }
      
      // Destroy pipe and its visual parts when off screen
      if (pipeSprite.x < -100) {
        if (visualParts) {
          visualParts.forEach((part: Phaser.GameObjects.Image) => {
            part.destroy();
          });
        }
        pipeSprite.destroy();
      }
    });

    this.gapsGroup.getChildren().forEach((gap) => {
      const gapRect = gap as Phaser.GameObjects.Rectangle;
      if (gapRect.x < -100) {
        gapRect.destroy();
      }
    });

    // Clean up eggs that are off screen
    this.eggsGroup.getChildren().forEach((egg) => {
      const eggSprite = egg as Phaser.Physics.Arcade.Sprite;
      if (eggSprite.x < -100) {
        eggSprite.destroy();
      }
    });

    // Check if player is out of bounds (слишком высоко или низко)
    if (this.player.y > this.scale.height - 150 || this.player.y < -50) {
      this.endGame();
    }
  }

  private createPlayer() {
    const startX = this.scale.width * 0.2;
    const startY = this.scale.height / 2;

    // Create container for duck
    const duckContainer = this.add.container(startX, startY);
    
    // Add duck body first (будет на заднем плане)
    const duckBody = this.add.image(0, 0, `duck-body-${this.selectedDuck}`);
    duckBody.setScale(1.0);
    duckContainer.add(duckBody);
    
    // Add wing on top with animation (будет на переднем плане)
    if (this.textures.exists(`duck-wing-${this.selectedDuck}`)) {
      const wing = this.add.image(-10, 0, `duck-wing-${this.selectedDuck}`);
      wing.setScale(1.0);
      wing.setOrigin(0.6, 0.4);
      
      // Wing flap animation
      this.tweens.add({
        targets: wing,
        angle: { from: -15, to: 15 },
        duration: 150,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      duckContainer.add(wing);
    }

    // Create physics sprite
    this.player = this.physics.add.sprite(startX, startY, `duck-body-${this.selectedDuck}`);
    this.player.setScale(1.0);
    this.player.setCollideWorldBounds(false);
    this.player.setAlpha(0); // Make invisible, we use container for visuals
    
    // Set physics
    if (this.player.body) {
      (this.player.body as Phaser.Physics.Arcade.Body).setGravityY(0); // Start with no gravity
      (this.player.body as Phaser.Physics.Arcade.Body).setSize(60, 60); // Hitbox под размер 1.0
    }

    this.player.setDepth(10);
    duckContainer.setDepth(10);
    
    // Store container reference
    this.player.setData('visualContainer', duckContainer);
  }

  private createUI() {
    // Score display (top center) с Rubik шрифтом и правильной обводкой
    this.eggsText = this.add.text(
      this.scale.width / 2,
      220,
      '0.0 EGGS = $ 0.00',
      {
        fontSize: '48px',
        fontFamily: 'Rubik, sans-serif',
        fontStyle: '900',
        color: '#FFE721',
        stroke: '#AC5700',
        strokeThickness: 4,
        shadow: {
          offsetX: 0,
          offsetY: 2,
          color: '#AC5700',
          blur: 0,
          fill: true
        }
      }
    ).setOrigin(0.5).setDepth(100);

    // Score counter с Rubik шрифтом (скрыт, так как не работает)
    this.scoreText = this.add.text(
      this.scale.width / 2,
      260,
      '0',
      {
        fontSize: '96px',
        fontFamily: 'Rubik, sans-serif',
        fontStyle: '900',
        color: '#FFFFFF',
        stroke: '#AC5700',
        strokeThickness: 4,
        shadow: {
          offsetX: 0,
          offsetY: 2,
          color: '#AC5700',
          blur: 0,
          fill: true
        }
      }
    ).setOrigin(0.5).setDepth(100).setVisible(false); // Скрыт

    // Start message с Rubik шрифтом и правильной обводкой
    const startText = this.language === 'en' ? 'TAP TO START' : 'НАЖМИТЕ, ЧТОБЫ НАЧАТЬ';
    this.startMessage = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2 - 50,
      startText,
      {
        fontSize: this.language === 'en' ? '56px' : '42px', // Smaller font for Russian
        fontFamily: 'Rubik, sans-serif',
        fontStyle: '900',
        color: '#FFE721',
        stroke: '#AC5700',
        strokeThickness: 4,
        shadow: {
          offsetX: 0,
          offsetY: 2,
          color: '#AC5700',
          blur: 0,
          fill: true
        }
      }
    ).setOrigin(0.5).setDepth(100);

    // Game over text (скрыт, модал показывается из React)
    this.gameOverText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      '',
      {
        fontSize: '40px',
        fontFamily: 'Arial Black',
        color: '#FF0000',
        stroke: '#000000',
        strokeThickness: 8,
        align: 'center',
      }
    ).setOrigin(0.5).setDepth(100).setVisible(false);
  }

  private createClouds(group: Phaser.GameObjects.Group, theme: 'day' | 'night') {
    const cloudCount = 5; // Увеличили количество облаков
    for (let i = 0; i < cloudCount; i++) {
      const isSmall = Math.random() > 0.5;
      const cloudKey = isSmall ? `${theme}-small-cloud` : `${theme}-big-cloud`;
      
      if (this.textures.exists(cloudKey)) {
        // Разная высота для каждого облака - широкий диапазон для разнообразия
        const baseY = Phaser.Math.Between(120, 400);
        const cloud = this.add.image(
          Phaser.Math.Between(0, this.scale.width),
          baseY,
          cloudKey
        );
        
        // Разные размеры для визуального разнообразия
        const scale = Phaser.Math.FloatBetween(1.2, 2.0);
        cloud.setScale(scale);
        
        // Разная прозрачность для глубины
        const alpha = Phaser.Math.FloatBetween(0.5, 0.85);
        cloud.setAlpha(alpha);
        
        // Разная скорость движения
        const speed = Phaser.Math.FloatBetween(0.3, 0.8);
        cloud.setData('speed', speed);
        
        // Сохраняем начальную Y позицию и параметры вертикального движения
        cloud.setData('baseY', baseY);
        cloud.setData('verticalOffset', Phaser.Math.FloatBetween(0, Math.PI * 2)); // Начальная фаза
        cloud.setData('verticalAmplitude', Phaser.Math.FloatBetween(10, 30)); // Амплитуда колебания
        cloud.setData('verticalSpeed', Phaser.Math.FloatBetween(0.01, 0.03)); // Скорость вертикального движения
        
        cloud.setVisible(theme === 'day' ? !this.isNight : this.isNight);
        group.add(cloud);
      }
    }
  }

  // Spawn a new pipe with local generation
  private spawnPipe() {
    if (this.gameOver) return;
    
    this.pipeCounter++;
    const pipeId = this.pipeCounter;
    
    console.log('[GameScene] Spawning pipe:', pipeId, 'passed pipes:', this.score, 'shouldLose:', this.shouldLose);
    
    const groundHeight = 200;
    const pipeWidth = 80;
    const playableHeight = this.scale.height - groundHeight;
    
    // Determine gap size and pipe level based on passed pipes count (score)
    let gapSize: number;
    let pipeLevel: string;
    
    // Progressive difficulty: levels change based on COLLECTED EGGS
    // Level 1: 0-19 собранных яиц
    // Level 2: 20-39 собранных яиц
    // Level 3: 40+ собранных яиц
    
    // ВАЖНО: Сложность зависит от количества СОБРАННЫХ ЯИЦ
    if (this.collectedEggsCount < 20) {
      pipeLevel = '1'; // Первые 20 яиц
    } else if (this.collectedEggsCount < 40) {
      pipeLevel = '2'; // 20-39 яиц
    } else {
      pipeLevel = '3'; // 40+ яиц
    }
    
    // ДИНАМИЧЕСКОЕ СУЖЕНИЕ: gap size уменьшается с каждым собранным яйцом
    const initialGapSize = 450; // Начальный размер gap (увеличен на 20% для легкого старта)
    const minGapSize = 200; // Минимальный размер gap
    const gapDecreasePerEgg = 3.5; // Уменьшение gap за каждое собранное яйцо
    
    // Вычисляем gap size: стартовый размер минус уменьшение за каждое яйцо
    gapSize = Math.max(minGapSize, initialGapSize - (this.collectedEggsCount * gapDecreasePerEgg));
    
    // Добавляем небольшую случайность (±15) для разнообразия
    gapSize = Phaser.Math.Between(Math.max(minGapSize, gapSize - 15), gapSize + 15);
    
    // Прогрессивная сложность труб:
    // Первые 25 труб: супер легкие (+25%)
    // Трубы 26-40: средняя сложность (+10%)
    // Трубы 41-50: сложные (нормальный gap или уменьшенный на -10%)
    if (this.pipeCounter <= 25) {
      gapSize = gapSize * 1.25;
      console.log('[GameScene] Pipes 1-25 (super easy) - gap increased by 25% to:', Math.round(gapSize));
    } else if (this.pipeCounter <= 40) {
      gapSize = gapSize * 1.10;
      console.log('[GameScene] Pipes 26-40 (medium) - gap increased by 10% to:', Math.round(gapSize));
    } else {
      // Последние 10 труб (41-50) - сложные, уменьшаем gap на 10%
      gapSize = gapSize * 0.90;
      console.log('[GameScene] Pipes 41-50 (hard) - gap DECREASED by 10% to:', Math.round(gapSize));
    }

    // Дополнительное усложнение для последних 12 яиц (38-50 собранных яиц)
    if (this.collectedEggsCount >= 38) {
      gapSize = gapSize * 0.85; // Уменьшаем gap еще на 15% для максимальной сложности
      console.log('[GameScene] Last 12 eggs (38-50) - gap DECREASED by additional 15% to:', Math.round(gapSize));
    }
    
    // If shouldLose = true, make gaps narrower (but keep visual level progression)
    if (this.shouldLose && this.collectedEggsCount >= 3) {
      // После 3 яиц в losing режиме начинаем сужать
      gapSize = Math.max(180, gapSize - 40);
      console.log('[GameScene] Losing mode - gap reduced to:', gapSize);
    }
    
    console.log(`[GameScene] 🥚 PIPE LEVEL: ${pipeLevel} | Collected eggs: ${this.collectedEggsCount} | Gap size: ${Math.round(gapSize)}px | shouldLose: ${this.shouldLose}`);
    
    // Random gap position (Y coordinate)
    const minGapY = gapSize / 2 + 80;
    const maxGapY = playableHeight - gapSize / 2 - 80;
    const gapY = Phaser.Math.Between(minGapY, maxGapY);
    
    // Position pipe off-screen to the right
    const pipeX = this.scale.width + 100;
    
    // Логика спавна яиц: всего максимум 50 яиц на карте
    // 1. Яйцо В GAP между трубами - 100% шанс
    // 2. Дополнительное яйцо в случайном месте - 50% шанс
    
    let hasEggInGap = false;
    let hasRandomEgg = false;
    let randomEggX = 0;
    let randomEggY = 0;
    
    const activeEggsCount = this.eggsGroup.getChildren().length;
    
    // === 1. ЯЙЦО В GAP (100% шанс) ===
    if (this.totalEggsOnMap < 50) {
      hasEggInGap = true; // ВСЕГДА спавним яйцо в gap!
      this.totalEggsOnMap++;
    }
    
    // === 2. ДОПОЛНИТЕЛЬНОЕ СЛУЧАЙНОЕ ЯЙЦО (50% шанс) ===
    if (this.totalEggsOnMap < 50 && activeEggsCount < 50) {
      hasRandomEgg = Math.random() < 0.5; // 50% шанс
      
      if (hasRandomEgg) {
        this.totalEggsOnMap++;
        
        // Случайная позиция между текущей трубой и следующей
        randomEggX = pipeX + Phaser.Math.Between(150, 400);
        
        // Y координата в игровой зоне (не слишком высоко и не слишком низко)
        const minY = 150;
        const maxY = playableHeight - 150;
        randomEggY = Phaser.Math.Between(minY, maxY);
      }
    }
    
    console.log('[GameScene] Pipe parameters:', {
      pipeId,
      pipeLevel,
      gapSize,
      gapY,
      passedPipes: this.score,
      hasEggInGap,
      hasRandomEgg,
      randomEggX,
      randomEggY,
      totalEggsOnMap: this.totalEggsOnMap,
      activeEggsCount,
      collectedEggsCount: this.collectedEggsCount,
      shouldLose: this.shouldLose
    });
    
    // Сохраняем X координату текущей трубы для следующего спавна
    this.lastPipeX = pipeX;
    
    // Get actual cap height from texture
    const capTexture = this.textures.get(`pipe-${pipeLevel}-top`);
    const actualCapHeight = capTexture.getSourceImage().height;
    
    // Calculate positions
    const topPipeBodyHeight = gapY - gapSize / 2 - actualCapHeight;
    const bottomPipeY = gapY + gapSize / 2;
    const bottomPipeBodyHeight = playableHeight - bottomPipeY - actualCapHeight;
    
    // Create pipes (with egg in gap if needed)
    this.createPipeVisuals(
      pipeLevel,
      gapY,
      gapSize,
      pipeWidth,
      actualCapHeight,
      topPipeBodyHeight,
      bottomPipeY,
      bottomPipeBodyHeight,
      pipeId,
      pipeX,
      hasEggInGap
    );
    
    // Create additional random egg if needed
    if (hasRandomEgg) {
      this.createRandomEgg(randomEggX, randomEggY, pipeId);
    }
  }


  private createPipeVisuals(
    pipeNum: string,
    gapY: number,
    gapSize: number,
    pipeWidth: number,
    actualCapHeight: number,
    topPipeBodyHeight: number,
    bottomPipeY: number,
    bottomPipeBodyHeight: number,
    pipeId: number,
    pipeX: number = this.scale.width + 50,
    hasEggInGap: boolean = false
  ) {
    const groundHeight = 200;
    
    console.log('[GameScene] Creating pipe visuals at X:', pipeX);
    
    // === ВЕРХНЯЯ ТРУБА ===
    // Невидимый спрайт для физики верхней трубы
    const topPipe = this.pipesGroup.create(
      pipeX,
      (gapY - gapSize / 2) / 2,
      ''
    ) as Phaser.Physics.Arcade.Sprite;
    topPipe.setVisible(false);
    topPipe.setOrigin(0.5, 0.5);
    
    if (topPipe.body) {
      (topPipe.body as Phaser.Physics.Arcade.Body).setVelocityX(-this.currentPipeSpeed);
      (topPipe.body as Phaser.Physics.Arcade.Body).allowGravity = false;
      topPipe.body.setSize(pipeWidth, gapY - gapSize / 2);
    }
    
    // Визуальные части верхней трубы
    // Тело трубы - растягивается от верха до шляпки
    const topPipeBody = this.add.image(
      pipeX,
      topPipeBodyHeight / 2,
      `pipe-${pipeNum}-bottom`
    );
    topPipeBody.setOrigin(0.5, 0.5);
    topPipeBody.setScale(1.0, 1);
    topPipeBody.displayHeight = topPipeBodyHeight;
    topPipeBody.setFlipY(true);
    
    // Шляпка трубы - перед gap
    const topPipeCap = this.add.image(
      pipeX,
      gapY - gapSize / 2 - actualCapHeight / 2,
      `pipe-${pipeNum}-top`
    );
    topPipeCap.setOrigin(0.5, 0.5);
    topPipeCap.setScale(1.0);
    topPipeCap.setFlipY(true);
    
    topPipe.setData('visualParts', [topPipeBody, topPipeCap]);
    
    // === НИЖНЯЯ ТРУБА ===
    // Невидимый спрайт для физики нижней трубы
    const bottomPipe = this.pipesGroup.create(
      pipeX,
      bottomPipeY + (this.scale.height - groundHeight - bottomPipeY) / 2,
      ''
    ) as Phaser.Physics.Arcade.Sprite;
    bottomPipe.setVisible(false);
    bottomPipe.setOrigin(0.5, 0.5);
    
    if (bottomPipe.body) {
      (bottomPipe.body as Phaser.Physics.Arcade.Body).setVelocityX(-this.currentPipeSpeed);
      (bottomPipe.body as Phaser.Physics.Arcade.Body).allowGravity = false;
      bottomPipe.body.setSize(pipeWidth, this.scale.height - groundHeight - bottomPipeY);
    }
    
    // Визуальные части нижней трубы
    // Шляпка трубы - сразу после gap
    const bottomPipeCap = this.add.image(
      pipeX,
      bottomPipeY + actualCapHeight / 2,
      `pipe-${pipeNum}-top`
    );
    bottomPipeCap.setOrigin(0.5, 0.5);
    bottomPipeCap.setScale(1.0);
    
    // Тело трубы - растягивается от шляпки до земли
    const bottomPipeBody = this.add.image(
      pipeX,
      bottomPipeY + actualCapHeight + bottomPipeBodyHeight / 2,
      `pipe-${pipeNum}-bottom`
    );
    bottomPipeBody.setOrigin(0.5, 0.5);
    bottomPipeBody.setScale(1.0, 1);
    bottomPipeBody.displayHeight = bottomPipeBodyHeight;
    
    bottomPipe.setData('visualParts', [bottomPipeCap, bottomPipeBody]);
    
    // Create gap trigger (invisible) - чуть шире чем труба для надежности
    const gap = this.add.rectangle(
      pipeX,
      gapY,
      pipeWidth + 20,
      gapSize,
      0xffffff,
      0
    );
    gap.setName(`gap-${pipeId}`); // For debugging
    this.physics.add.existing(gap);
    if (gap.body) {
      (gap.body as Phaser.Physics.Arcade.Body).setVelocityX(-this.currentPipeSpeed);
      (gap.body as Phaser.Physics.Arcade.Body).allowGravity = false;
    }
    this.gapsGroup.add(gap);
    gap.setData('scored', false);
    console.log('[GameScene] Gap created:', gap.name, 'at X:', pipeX, 'Y:', gapY, 'size:', gapSize);
    
    // Create egg IN GAP if needed
    if (hasEggInGap) {
      // Размещаем яйцо в центре gap с небольшим случайным смещением (±10% от высоты gap)
      const eggYOffset = Phaser.Math.Between(-gapSize * 0.1, gapSize * 0.1);
      const eggY = gapY + eggYOffset;
      
      console.log('[GameScene] Creating egg IN GAP at X:', pipeX, 'Y:', eggY, 'center:', gapY, 'offset:', eggYOffset);
      
      const egg = this.eggsGroup.create(
        pipeX,
        eggY,
        'egg'
      ) as Phaser.Physics.Arcade.Sprite;
      
      egg.setScale(0.9);
      egg.setData('collected', false);
      egg.setName(`egg-gap-${pipeId}`);
      egg.setDepth(15); // Поверх труб
      
      if (egg.body) {
        (egg.body as Phaser.Physics.Arcade.Body).setVelocityX(-this.currentPipeSpeed);
        (egg.body as Phaser.Physics.Arcade.Body).allowGravity = false;
      }
      
      console.log('[GameScene] Egg created IN GAP:', egg.name);
    }
  }

  // Создание дополнительного яйца в случайном месте
  private createRandomEgg(eggX: number, eggY: number, pipeId: number) {
    console.log('[GameScene] Creating random egg at X:', eggX, 'Y:', eggY);
    
    const egg = this.eggsGroup.create(
      eggX,
      eggY,
      'egg'
    ) as Phaser.Physics.Arcade.Sprite;
    
    egg.setScale(0.9);
    egg.setData('collected', false);
    egg.setName(`egg-random-${pipeId}`);
    egg.setDepth(15); // Поверх труб
    
    console.log('[GameScene] Random egg created:', {
      name: egg.name,
      x: egg.x,
      y: egg.y,
      scale: egg.scale,
      visible: egg.visible,
      active: egg.active
    });
    
    if (egg.body) {
      (egg.body as Phaser.Physics.Arcade.Body).setVelocityX(-this.currentPipeSpeed);
      (egg.body as Phaser.Physics.Arcade.Body).allowGravity = false;
    }
  }

  private handleInput() {
    // Игнорируем input во время рестарта
    if (this.isRestarting) {
      return;
    }

    // Игнорируем input после game over (модал обрабатывает это)
    if (this.gameOver) {
      return;
    }

    if (!this.gameStarted) {
      this.startGame();
      return; // Не прыгаем при старте
    }

    // Haptic feedback при тапе (легкая вибрация)
    if (this.hapticFeedback) {
      this.hapticFeedback.impactOccurred('light');
    }

    // Flap
    if (this.player.body) {
      (this.player.body as Phaser.Physics.Arcade.Body).setVelocityY(-900);
      this.framesMoveUp = 10;
    }
  }

  private async startGame() {
    this.gameStarted = true;
    this.startMessage.setVisible(false);
    // this.scoreText.setVisible(true); // Убрано - счетчик труб не работает
    
    // Инициализируем таймеры
    this.gameStartTime = this.time.now;
    this.lastProgressTime = this.time.now;
    
    // Enable gravity for player
    if (this.player.body) {
      (this.player.body as Phaser.Physics.Arcade.Body).setGravityY(2000);
    }

    // Start game via API
    if (this.gameApi) {
      try {
        const result = await this.gameApi.startGame(parseInt(localStorage.getItem('selectedDuckId') || '1'));
        console.log('[GameScene] Game started via API:', result);
        
        // Set shouldLose based on win_next flag
        this.shouldLose = !result.win_next;
        console.log('[GameScene] win_next:', result.win_next, 'shouldLose:', this.shouldLose);
        
        // Получаем начальные балансы (eggs и usdt) с сервера
        if (result.eggs !== undefined) {
          this.eggs = result.eggs;
        }
        if (result.usdt !== undefined) {
          this.usdt = result.usdt;
        }
        
        this.updateScoreDisplay();
        console.log('[GameScene] Game started - initial balance from API:', {
          eggs: this.eggs,
          usdt: this.usdt
        });
      } catch (error) {
        console.error('[GameScene] Failed to start game:', error);
      }
    }
    
    // Start spawning pipes
    this.nextPipeTime = 1500; // First pipe in 1.5 seconds
  }

  // Обрезает СТРОКУ до 2 знаков БЕЗ округления (работает со строками!)
  private truncateString(str: string, decimals: number = 2): string {
    const dotIndex = str.indexOf('.');
    if (dotIndex === -1) {
      // Нет точки - возвращаем как есть
      return str;
    }
    // Обрезаем до нужного количества знаков после точки
    return str.substring(0, dotIndex + decimals + 1);
  }

  private updateScoreDisplay() {
    this.scoreText.setText(this.score.toString());
    
    // Показываем данные НАПРЯМУЮ с сервера (БЕЗ парсинга в number!)
    // Работаем со строками чтобы не терять точность
    const eggsStr = this.eggs || '0';
    const usdtStr = this.usdt || '0';
    
    // Скрываем табличку пока не собрано ни одного яйца
    if (this.collectedEggsCount === 0) {
      this.eggsText.setVisible(false);
    } else {
      this.eggsText.setVisible(true);
      this.eggsText.setText(`${this.truncateString(eggsStr)} EGGS = $ ${this.truncateString(usdtStr)}`);
    }
    
    console.log('[GameScene] Display updated (NO ROUNDING, NO PARSING):', {
      collectedEggs: this.collectedEggsCount,
      eggs: this.truncateString(eggsStr),
      usdt: this.truncateString(usdtStr),
      visible: this.collectedEggsCount > 0
    });
  }
  
  // Анимация плавного начисления (countUp эффект)
  private animateScoreUpdate() {
    const prevEggsValue = parseFloat(this.prevEggs) || 0;
    const newEggsValue = parseFloat(this.eggs) || 0;
    const prevUsdtValue = parseFloat(this.prevUsdt) || 0;
    const newUsdtValue = parseFloat(this.usdt) || 0;
    
    // Показываем табличку при первом яйце
    this.eggsText.setVisible(true);
    
    // Анимация плавного изменения чисел (500ms)
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 500,
      ease: 'Cubic.easeOut',
      onUpdate: (tween) => {
        const value = tween.getValue() || 0;
        
        // Интерполируем между старым и новым значением (для анимации)
        const currentEggs = prevEggsValue + (newEggsValue - prevEggsValue) * value;
        const currentUsdt = prevUsdtValue + (newUsdtValue - prevUsdtValue) * value;
        
        // Для анимации обрезаем через строку
        this.eggsText.setText(`${this.truncateString(currentEggs.toString())} EGGS = $ ${this.truncateString(currentUsdt.toString())}`);
      },
      onComplete: () => {
        // Финальное значение - показываем ТОЧНЫЕ данные с сервера (строки!)
        this.eggsText.setText(`${this.truncateString(this.eggs)} EGGS = $ ${this.truncateString(this.usdt)}`);
      }
    });
    
    console.log('[GameScene] Animating balance update:', {
      from: { eggs: prevEggsValue, usdt: prevUsdtValue },
      to: { eggs: newEggsValue, usdt: newUsdtValue }
    });
  }

  private hitPipe() {
    if (!this.gameOver) {
      this.endGame();
    }
  }

  private async endGame() {
    if (this.gameOver) return; // Prevent double end
    
    this.gameOver = true;
    this.gameStarted = false;
    
    // Haptic feedback при смерти (сильная вибрация - ошибка)
    if (this.hapticFeedback) {
      this.hapticFeedback.notificationOccurred('error');
      // Дополнительная сильная вибрация
      this.hapticFeedback.impactOccurred('heavy');
    }
    
    // Screen shake эффект
    this.cameras.main.shake(500, 0.01); // 500ms, интенсивность 0.01
    
    // Stop background music
    if (this.bgMusic && this.bgMusic.isPlaying) {
      this.bgMusic.stop();
    }
    
    // Останавливаем все яйца (чтобы они не летали после смерти)
    this.eggsGroup.getChildren().forEach((egg) => {
      const eggSprite = egg as Phaser.Physics.Arcade.Sprite;
      if (eggSprite.body && 'setVelocity' in eggSprite.body) {
        (eggSprite.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      }
    });
    
    // Останавливаем все трубы
    this.pipesGroup.getChildren().forEach((pipe) => {
      const pipeSprite = pipe as Phaser.Physics.Arcade.Sprite;
      if (pipeSprite.body && 'setVelocity' in pipeSprite.body) {
        (pipeSprite.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      }
    });
    
    // Send end to API и получаем финальные балансы
    let finalEggsValue = this.eggs;
    let finalUsdtValue = this.usdt;
    
    if (this.gameApi) {
      try {
        const result = await this.gameApi.endGame();
        console.log('[GameScene] Game ended via API:', result);
        
        // Получаем финальные балансы с сервера
        if (result.eggs !== undefined) {
          finalEggsValue = result.eggs;
        }
        if (result.usdt !== undefined) {
          finalUsdtValue = result.usdt;
        }
      } catch (error) {
        console.error('[GameScene] Failed to end game:', error);
      }
    }
    
    // Don't pause physics yet - we need animation
    // this.physics.pause();
    
    // Animate player death - rotation and fall
    const container = this.player.getData('visualContainer');
    if (container) {
      // Make player red
      container.list.forEach((child: Phaser.GameObjects.GameObject) => {
        if ('setTint' in child) {
          (child as Phaser.GameObjects.Image).setTint(0xff0000);
        }
      });
      
      // Включаем умеренную гравитацию для physics sprite (чтобы падал медленнее)
      if (this.player.body) {
        (this.player.body as Phaser.Physics.Arcade.Body).setGravityY(800); // Уменьшили с 2000
        (this.player.body as Phaser.Physics.Arcade.Body).setVelocityY(200); // Уменьшили с 300
      }
      
      // Анимация вращения контейнера вокруг своей оси (короче и быстрее)
      this.tweens.add({
        targets: container,
        angle: 360 * 2, // 2 полных оборота вместо 3
        duration: 800, // Уменьшили с 1500 до 800ms
        ease: 'Cubic.easeIn',
        onComplete: () => {
          // После анимации показываем modal
          this.physics.pause();
          const onGameOver = this.game.registry.get('onGameOver');
          if (onGameOver && typeof onGameOver === 'function') {
            // Передаем данные НАПРЯМУЮ с сервера
            onGameOver(this.score, finalEggsValue, finalUsdtValue);
          }
        }
      });
    } else {
      // Fallback if no container
      this.physics.pause();
      const onGameOver = this.game.registry.get('onGameOver');
      if (onGameOver && typeof onGameOver === 'function') {
        // Передаем данные НАПРЯМУЮ с сервера
        onGameOver(this.score, finalEggsValue, finalUsdtValue);
      }
    }
  }

  private async finishGame() {
    if (this.gameOver) return; // Prevent double finish

    this.gameOver = true;
    this.gameStarted = false;

    // Haptic feedback при победе (успех)
    if (this.hapticFeedback) {
      this.hapticFeedback.notificationOccurred('success');
    }

    // Stop background music
    if (this.bgMusic && this.bgMusic.isPlaying) {
      this.bgMusic.stop();
    }

    // Останавливаем все яйца
    this.eggsGroup.getChildren().forEach((egg) => {
      const eggSprite = egg as Phaser.Physics.Arcade.Sprite;
      if (eggSprite.body && 'setVelocity' in eggSprite.body) {
        (eggSprite.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      }
    });

    // Останавливаем все трубы
    this.pipesGroup.getChildren().forEach((pipe) => {
      const pipeSprite = pipe as Phaser.Physics.Arcade.Sprite;
      if (pipeSprite.body && 'setVelocity' in pipeSprite.body) {
        (pipeSprite.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      }
    });

    // Останавливаем утку (но не даем ей падать)
    if (this.player.body) {
      (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      (this.player.body as Phaser.Physics.Arcade.Body).setGravityY(0);
    }

    // Send end to API и получаем финальные балансы
    let finalEggsValue = this.eggs;
    let finalUsdtValue = this.usdt;

    if (this.gameApi) {
      try {
        const result = await this.gameApi.endGame();
        console.log('[GameScene] Game finished via API:', result);

        // Получаем финальные балансы с сервера
        if (result.eggs !== undefined) {
          finalEggsValue = result.eggs;
        }
        if (result.usdt !== undefined) {
          finalUsdtValue = result.usdt;
        }
      } catch (error) {
        console.error('[GameScene] Failed to finish game:', error);
      }
    }

    // Пауза физики
    this.physics.pause();

    // Показываем баннер финиша (вызываем callback из React)
    const onGameFinish = this.game.registry.get('onGameFinish');
    if (onGameFinish && typeof onGameFinish === 'function') {
      // Передаем данные с сервера
      onGameFinish(this.score, finalEggsValue, finalUsdtValue);
    } else {
      // Fallback: если нет onGameFinish callback, используем onGameOver
      const onGameOver = this.game.registry.get('onGameOver');
      if (onGameOver && typeof onGameOver === 'function') {
        onGameOver(this.score, finalEggsValue, finalUsdtValue);
      }
    }
  }

  private restartGame() {
    this.isRestarting = true;
    this.scene.restart();
  }

  // Public method to check if game is over
  public isGameOver(): boolean {
    return this.gameOver;
  }

  // Update background gradient colors
  private updateBackgroundGradient() {
    if (!this.backgroundGradient) return;
    
    this.backgroundGradient.clear();
    
    // Convert hex to numbers for Phaser
    const colorToNumber = (hex: string) => parseInt(hex.replace('#', '0x'));
    
    const colors = this.isNight 
      ? ['#1a3a52', '#2d5a7b', '#4a7a9e']  // Более светлые ночные цвета (синие оттенки)
      : ['#2BC9EC', '#C8F5FF', '#FFFFFF'];
    
    if (colors.length >= 3) {
      this.backgroundGradient.fillGradientStyle(
        colorToNumber(colors[0]),
        colorToNumber(colors[0]),
        colorToNumber(colors[2]),
        colorToNumber(colors[2]),
        1
      );
    } else {
      this.backgroundGradient.fillGradientStyle(
        colorToNumber(colors[0]),
        colorToNumber(colors[0]),
        colorToNumber(colors[1]),
        colorToNumber(colors[1]),
        1
      );
    }
    
    this.backgroundGradient.fillRect(0, 0, this.scale.width, this.scale.height);
  }

  // Public method to switch theme without restarting with smooth animation
  public switchTheme(isNight: boolean) {
    console.log('[GameScene] Switching theme to:', isNight ? 'Night' : 'Day');
    this.isNight = isNight;
    
    const duration = 2000; // 2 секунды для плавного перехода
    
    // Плавная смена градиента фона
    this.tweens.add({
      targets: this.backgroundGradient,
      alpha: { from: 1, to: 0 },
      duration: duration / 2,
      yoyo: true,
      onYoyo: () => {
        // Обновляем градиент в середине анимации
        this.updateBackgroundGradient();
      }
    });
    
    // Плавное появление/исчезновение луны
    if (this.moon) {
      if (isNight) {
        this.moon.setVisible(true);
        this.moon.setAlpha(0);
        this.tweens.add({
          targets: this.moon,
          alpha: { from: 0, to: 1 },
          duration: duration,
          ease: 'Sine.easeInOut'
        });
      } else {
        this.tweens.add({
          targets: this.moon,
          alpha: { from: 1, to: 0 },
          duration: duration,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            this.moon.setVisible(false);
          }
        });
      }
    }
    
    // Плавный переход фоновых центров
    if (this.dayBackgroundCenter && this.nightBackgroundCenter) {
      if (isNight) {
        // День -> Ночь
        this.nightBackgroundCenter.setVisible(true);
        this.nightBackgroundCenter.setAlpha(0);
        
        this.tweens.add({
          targets: this.dayBackgroundCenter,
          alpha: { from: 1, to: 0 },
          duration: duration,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            this.dayBackgroundCenter.setVisible(false);
          }
        });
        
        this.tweens.add({
          targets: this.nightBackgroundCenter,
          alpha: { from: 0, to: 1 },
          duration: duration,
          ease: 'Sine.easeInOut'
        });
      } else {
        // Ночь -> День
        this.dayBackgroundCenter.setVisible(true);
        this.dayBackgroundCenter.setAlpha(0);
        
        this.tweens.add({
          targets: this.nightBackgroundCenter,
          alpha: { from: 1, to: 0 },
          duration: duration,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            this.nightBackgroundCenter.setVisible(false);
          }
        });
        
        this.tweens.add({
          targets: this.dayBackgroundCenter,
          alpha: { from: 0, to: 1 },
          duration: duration,
          ease: 'Sine.easeInOut'
        });
      }
    }
    
    // Плавный переход земли
    if (this.dayGround && this.nightGround) {
      if (isNight) {
        this.nightGround.setVisible(true);
        this.nightGround.setAlpha(0);
        
        this.tweens.add({
          targets: this.dayGround,
          alpha: { from: 1, to: 0 },
          duration: duration,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            this.dayGround.setVisible(false);
          }
        });
        
        this.tweens.add({
          targets: this.nightGround,
          alpha: { from: 0, to: 1 },
          duration: duration,
          ease: 'Sine.easeInOut'
        });
      } else {
        this.dayGround.setVisible(true);
        this.dayGround.setAlpha(0);
        
        this.tweens.add({
          targets: this.nightGround,
          alpha: { from: 1, to: 0 },
          duration: duration,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            this.nightGround.setVisible(false);
          }
        });
        
        this.tweens.add({
          targets: this.dayGround,
          alpha: { from: 0, to: 1 },
          duration: duration,
          ease: 'Sine.easeInOut'
        });
      }
      
      // Update ground reference for collision
      this.ground = isNight ? this.nightGround : this.dayGround;
    }
    
    // Плавный переход облаков
    if (this.dayClouds && this.nightClouds) {
      const dayCloudsArray = this.dayClouds.getChildren() as Phaser.GameObjects.Image[];
      const nightCloudsArray = this.nightClouds.getChildren() as Phaser.GameObjects.Image[];
      
      if (isNight) {
        // День -> Ночь
        nightCloudsArray.forEach(cloud => {
          cloud.setVisible(true);
          cloud.setAlpha(0);
        });
        
        this.tweens.add({
          targets: dayCloudsArray,
          alpha: { from: 1, to: 0 },
          duration: duration,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            dayCloudsArray.forEach(cloud => cloud.setVisible(false));
          }
        });
        
        this.tweens.add({
          targets: nightCloudsArray,
          alpha: { from: 0, to: 1 },
          duration: duration,
          ease: 'Sine.easeInOut'
        });
      } else {
        // Ночь -> День
        dayCloudsArray.forEach(cloud => {
          cloud.setVisible(true);
          cloud.setAlpha(0);
        });
        
        this.tweens.add({
          targets: nightCloudsArray,
          alpha: { from: 1, to: 0 },
          duration: duration,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            nightCloudsArray.forEach(cloud => cloud.setVisible(false));
          }
        });
        
        this.tweens.add({
          targets: dayCloudsArray,
          alpha: { from: 0, to: 1 },
          duration: duration,
          ease: 'Sine.easeInOut'
        });
      }
    }
    
    console.log('[GameScene] Theme transition started');
  }
}

