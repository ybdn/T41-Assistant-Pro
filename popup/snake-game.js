// T41 Snake - Easter Egg Game
// Classic snake game with pixel-art style

class SnakeGame {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.width = 294;
    this.height = 432;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Grid settings
    this.gridSize = 14;
    this.tileCount = Math.floor(this.width / this.gridSize);
    this.tileCountY = Math.floor(this.height / this.gridSize);

    // Game state
    this.score = 0;
    this.gameOver = false;
    this.paused = false;
    this.animationFrame = null;
    this.gameSpeed = 100; // ms per frame
    this.lastUpdateTime = 0;

    // Snake
    this.snake = [
      { x: 10, y: 15 },
      { x: 9, y: 15 },
      { x: 8, y: 15 }
    ];
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };

    // Food
    this.food = { x: 15, y: 15 };
    this.foodColor = '#ff3333';

    // Particles for effects
    this.particles = [];

    // High score
    this.highScore = parseInt(localStorage.getItem('t41SnakeHighScore') || '0');

    // Difficulty settings
    this.difficulty = 'normal';
    this.difficultySettings = {
      easy: { speed: 180, scoreMultiplier: 1 },
      normal: { speed: 140, scoreMultiplier: 1.5 },
      hard: { speed: 100, scoreMultiplier: 2 }
    };

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupDifficultySelector();
    this.applyDifficulty('normal');
    this.updateHUD();
    this.generateFood();
  }

  setupEventListeners() {
    this.keyHandler = (e) => {
      if (this.gameOver) return;

      switch(e.key) {
        case 'ArrowUp':
          if (this.direction.y === 0) {
            this.nextDirection = { x: 0, y: -1 };
            e.preventDefault();
          }
          break;
        case 'ArrowDown':
          if (this.direction.y === 0) {
            this.nextDirection = { x: 0, y: 1 };
            e.preventDefault();
          }
          break;
        case 'ArrowLeft':
          if (this.direction.x === 0) {
            this.nextDirection = { x: -1, y: 0 };
            e.preventDefault();
          }
          break;
        case 'ArrowRight':
          if (this.direction.x === 0) {
            this.nextDirection = { x: 1, y: 0 };
            e.preventDefault();
          }
          break;
        case 'Escape':
          this.close();
          break;
      }
    };

    window.addEventListener('keydown', this.keyHandler);
  }

  setupDifficultySelector() {
    const difficultySelect = document.getElementById('difficulty-select');
    if (difficultySelect) {
      difficultySelect.addEventListener('change', (e) => {
        this.applyDifficulty(e.target.value);
        difficultySelect.blur();
      });

      difficultySelect.addEventListener('keydown', (e) => {
        if (e.key.startsWith('Arrow')) {
          e.preventDefault();
          difficultySelect.blur();
        }
      });
    }
  }

  applyDifficulty(difficulty) {
    this.difficulty = difficulty;
    const settings = this.difficultySettings[difficulty];
    this.gameSpeed = settings.speed;
    this.scoreMultiplier = settings.scoreMultiplier;
  }

  generateFood() {
    let validPosition = false;
    while (!validPosition) {
      this.food = {
        x: Math.floor(Math.random() * this.tileCount),
        y: Math.floor(Math.random() * this.tileCountY)
      };

      // Check if food is not on snake
      validPosition = !this.snake.some(segment =>
        segment.x === this.food.x && segment.y === this.food.y
      );
    }

    // Random food color
    const colors = ['#ff3333', '#ffaa00', '#00ff88', '#00aaff', '#ff00ff'];
    this.foodColor = colors[Math.floor(Math.random() * colors.length)];
  }

  update(currentTime) {
    if (this.gameOver || this.paused) return;

    if (currentTime - this.lastUpdateTime < this.gameSpeed) {
      return;
    }
    this.lastUpdateTime = currentTime;

    // Update direction
    this.direction = { ...this.nextDirection };

    // Calculate new head position
    const head = { ...this.snake[0] };
    head.x += this.direction.x;
    head.y += this.direction.y;

    // Check wall collision
    if (head.x < 0 || head.x >= this.tileCount ||
        head.y < 0 || head.y >= this.tileCountY) {
      this.endGame();
      return;
    }

    // Check self collision
    if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      this.endGame();
      return;
    }

    // Add new head
    this.snake.unshift(head);

    // Check food collision
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += Math.floor(10 * this.scoreMultiplier);
      this.updateHUD();
      this.createFoodParticles();
      this.generateFood();
      this.playSound('eat');
    } else {
      // Remove tail
      this.snake.pop();
    }

    // Update particles
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      return p.life > 0;
    });
  }

  createFoodParticles() {
    const centerX = this.food.x * this.gridSize + this.gridSize / 2;
    const centerY = this.food.y * this.gridSize + this.gridSize / 2;

    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * 2,
        vy: Math.sin(angle) * 2,
        color: this.foodColor,
        size: 3,
        life: 20
      });
    }
  }

  draw() {
    // Clear canvas
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw grid (subtle)
    this.ctx.strokeStyle = '#111';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < this.tileCount; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * this.gridSize, 0);
      this.ctx.lineTo(x * this.gridSize, this.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.tileCountY; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y * this.gridSize);
      this.ctx.lineTo(this.width, y * this.gridSize);
      this.ctx.stroke();
    }

    // Draw food with glow
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = this.foodColor;
    this.ctx.fillStyle = this.foodColor;
    this.ctx.fillRect(
      this.food.x * this.gridSize + 2,
      this.food.y * this.gridSize + 2,
      this.gridSize - 4,
      this.gridSize - 4
    );
    this.ctx.shadowBlur = 0;

    // Draw snake
    this.snake.forEach((segment, index) => {
      if (index === 0) {
        // Head - brighter green
        this.ctx.fillStyle = '#00ff88';
        this.ctx.fillRect(
          segment.x * this.gridSize + 1,
          segment.y * this.gridSize + 1,
          this.gridSize - 2,
          this.gridSize - 2
        );

        // Eyes
        this.ctx.fillStyle = '#000';
        const eyeSize = 2;
        if (this.direction.x === 1) {
          // Right
          this.ctx.fillRect(segment.x * this.gridSize + 8, segment.y * this.gridSize + 3, eyeSize, eyeSize);
          this.ctx.fillRect(segment.x * this.gridSize + 8, segment.y * this.gridSize + 8, eyeSize, eyeSize);
        } else if (this.direction.x === -1) {
          // Left
          this.ctx.fillRect(segment.x * this.gridSize + 3, segment.y * this.gridSize + 3, eyeSize, eyeSize);
          this.ctx.fillRect(segment.x * this.gridSize + 3, segment.y * this.gridSize + 8, eyeSize, eyeSize);
        } else if (this.direction.y === -1) {
          // Up
          this.ctx.fillRect(segment.x * this.gridSize + 3, segment.y * this.gridSize + 3, eyeSize, eyeSize);
          this.ctx.fillRect(segment.x * this.gridSize + 8, segment.y * this.gridSize + 3, eyeSize, eyeSize);
        } else {
          // Down
          this.ctx.fillRect(segment.x * this.gridSize + 3, segment.y * this.gridSize + 8, eyeSize, eyeSize);
          this.ctx.fillRect(segment.x * this.gridSize + 8, segment.y * this.gridSize + 8, eyeSize, eyeSize);
        }
      } else {
        // Body - gradient effect
        const alpha = 1 - (index / this.snake.length) * 0.5;
        this.ctx.fillStyle = `rgba(0, 255, 136, ${alpha})`;
        this.ctx.fillRect(
          segment.x * this.gridSize + 1,
          segment.y * this.gridSize + 1,
          this.gridSize - 2,
          this.gridSize - 2
        );
      }
    });

    // Draw particles
    this.particles.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    });
  }

  updateHUD() {
    document.getElementById('score-display').textContent = this.score;
    const levelDisplay = document.getElementById('level-display');
    if (levelDisplay) {
      levelDisplay.textContent = this.snake.length;
    }
    const livesDisplay = document.getElementById('lives-display');
    if (livesDisplay) {
      livesDisplay.textContent = '🐍';
    }
  }

  endGame() {
    this.gameOver = true;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('t41SnakeHighScore', this.highScore.toString());
    }

    const gameOverScreen = document.getElementById('game-over-screen');
    document.getElementById('final-score').textContent = this.score;
    document.getElementById('high-score-display').textContent = this.highScore;
    gameOverScreen.classList.add('active');

    this.playSound('gameover');
  }

  restart() {
    this.score = 0;
    this.gameOver = false;
    this.snake = [
      { x: 10, y: 15 },
      { x: 9, y: 15 },
      { x: 8, y: 15 }
    ];
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.particles = [];

    this.applyDifficulty(this.difficulty);
    this.generateFood();
    this.updateHUD();

    const gameOverScreen = document.getElementById('game-over-screen');
    gameOverScreen.classList.remove('active');
  }

  playSound(type) {
    if (!window.AudioContext && !window.webkitAudioContext) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

    switch(type) {
      case 'eat':
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        break;
      case 'gameover':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.5);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        break;
    }

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.5);
  }

  gameLoop(currentTime) {
    this.update(currentTime);
    this.draw();
    this.animationFrame = requestAnimationFrame((time) => this.gameLoop(time));
  }

  start() {
    this.lastUpdateTime = performance.now();
    this.gameLoop(this.lastUpdateTime);
  }

  close() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    window.removeEventListener('keydown', this.keyHandler);
    const overlay = document.getElementById('game-overlay');
    overlay.classList.remove('active');
  }
}
