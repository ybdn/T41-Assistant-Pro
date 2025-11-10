// Floppy Bird - Easter Egg Game
// Flappy Bird inspired game with pixel-art style

class FloppyBirdGame {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.width = 294;
    this.height = 432;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Game state
    this.score = 0;
    this.gameOver = false;
    this.started = false;
    this.paused = false;
    this.animationFrame = null;

    // Bird
    this.bird = {
      x: 80,
      y: this.height / 2,
      width: 20,
      height: 20,
      velocity: 0,
      gravity: 0.35,
      jumpStrength: -6.5,
      rotation: 0
    };

    // Pipes
    this.pipes = [];
    this.pipeWidth = 40;
    this.pipeGap = 130;
    this.pipeSpeed = 1.5;
    this.pipeSpawnDistance = 200;
    this.lastPipeX = this.width;

    // Background
    this.bgOffset = 0;
    this.bgSpeed = 1;

    // Particles
    this.particles = [];

    // High score
    this.highScore = parseInt(localStorage.getItem('t41FloppyBirdHighScore') || '0');

    // Difficulty settings
    this.difficulty = 'normal';
    this.difficultySettings = {
      easy: { gravity: 0.3, jumpStrength: -6, pipeGap: 150, pipeSpeed: 1.2 },
      normal: { gravity: 0.35, jumpStrength: -6.5, pipeGap: 130, pipeSpeed: 1.5 },
      hard: { gravity: 0.45, jumpStrength: -7, pipeGap: 110, pipeSpeed: 2 }
    };

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupDifficultySelector();
    this.applyDifficulty('normal');
    this.updateHUD();
  }

  setupEventListeners() {
    this.keyHandler = (e) => {
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!this.started) {
          this.started = true;
        }
        if (!this.gameOver) {
          this.jump();
        }
      }
      if (e.key === 'Escape') {
        this.close();
      }
    };

    this.clickHandler = (e) => {
      if (e.target === this.canvas) {
        if (!this.started) {
          this.started = true;
        }
        if (!this.gameOver) {
          this.jump();
        }
      }
    };

    window.addEventListener('keydown', this.keyHandler);
    this.canvas.addEventListener('click', this.clickHandler);
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
    this.bird.gravity = settings.gravity;
    this.bird.jumpStrength = settings.jumpStrength;
    this.pipeGap = settings.pipeGap;
    this.pipeSpeed = settings.pipeSpeed;
  }

  jump() {
    this.bird.velocity = this.bird.jumpStrength;
    this.playSound('jump');
  }

  update() {
    if (this.gameOver || this.paused || !this.started) return;

    // Update bird
    this.bird.velocity += this.bird.gravity;
    this.bird.y += this.bird.velocity;

    // Bird rotation based on velocity
    this.bird.rotation = Math.min(Math.max(this.bird.velocity * 3, -30), 90);

    // Check ground and ceiling collision
    if (this.bird.y + this.bird.height > this.height || this.bird.y < 0) {
      this.endGame();
      return;
    }

    // Update background
    this.bgOffset -= this.bgSpeed;
    if (this.bgOffset < -this.width) {
      this.bgOffset = 0;
    }

    // Spawn pipes
    if (this.pipes.length === 0 || this.pipes[this.pipes.length - 1].x < this.width - this.pipeSpawnDistance) {
      this.spawnPipe();
    }

    // Update pipes
    this.pipes.forEach(pipe => {
      pipe.x -= this.pipeSpeed;

      // Check collision
      if (this.checkCollision(pipe)) {
        this.endGame();
        return;
      }

      // Score point
      if (!pipe.passed && pipe.x + this.pipeWidth < this.bird.x) {
        pipe.passed = true;
        this.score++;
        this.updateHUD();
        this.playSound('score');
        this.createScoreParticles();
      }
    });

    // Remove off-screen pipes
    this.pipes = this.pipes.filter(pipe => pipe.x > -this.pipeWidth);

    // Update particles
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2; // gravity
      p.life--;
      return p.life > 0;
    });
  }

  spawnPipe() {
    const minHeight = 50;
    const maxHeight = this.height - this.pipeGap - minHeight;
    const topHeight = minHeight + Math.random() * (maxHeight - minHeight);

    this.pipes.push({
      x: this.width,
      topHeight: topHeight,
      bottomY: topHeight + this.pipeGap,
      passed: false
    });
  }

  checkCollision(pipe) {
    // Check if bird is in pipe x range
    if (this.bird.x + this.bird.width > pipe.x &&
        this.bird.x < pipe.x + this.pipeWidth) {
      // Check if bird hits top or bottom pipe
      if (this.bird.y < pipe.topHeight ||
          this.bird.y + this.bird.height > pipe.bottomY) {
        return true;
      }
    }
    return false;
  }

  createScoreParticles() {
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: this.bird.x + this.bird.width / 2,
        y: this.bird.y + this.bird.height / 2,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 4,
        color: '#ffaa00',
        size: 3,
        life: 30
      });
    }
  }

  createCrashParticles() {
    for (let i = 0; i < 15; i++) {
      const angle = (Math.PI * 2 * i) / 15;
      this.particles.push({
        x: this.bird.x + this.bird.width / 2,
        y: this.bird.y + this.bird.height / 2,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        color: ['#ff3333', '#ff8800', '#ffaa00'][Math.floor(Math.random() * 3)],
        size: 4,
        life: 40
      });
    }
  }

  draw() {
    // Clear canvas
    this.ctx.fillStyle = '#87ceeb'; // Sky blue
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw moving clouds (background)
    this.drawClouds();

    // Draw pipes
    this.pipes.forEach(pipe => {
      // Top pipe
      this.ctx.fillStyle = '#00ff88';
      this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);

      // Pipe border
      this.ctx.strokeStyle = '#00cc6a';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);

      // Pipe cap
      this.ctx.fillStyle = '#00cc6a';
      this.ctx.fillRect(pipe.x - 3, pipe.topHeight - 20, this.pipeWidth + 6, 20);

      // Bottom pipe
      this.ctx.fillStyle = '#00ff88';
      this.ctx.fillRect(pipe.x, pipe.bottomY, this.pipeWidth, this.height - pipe.bottomY);

      // Pipe border
      this.ctx.strokeRect(pipe.x, pipe.bottomY, this.pipeWidth, this.height - pipe.bottomY);

      // Pipe cap
      this.ctx.fillStyle = '#00cc6a';
      this.ctx.fillRect(pipe.x - 3, pipe.bottomY, this.pipeWidth + 6, 20);
    });

    // Draw bird
    this.ctx.save();
    this.ctx.translate(this.bird.x + this.bird.width / 2, this.bird.y + this.bird.height / 2);
    this.ctx.rotate(this.bird.rotation * Math.PI / 180);
    this.ctx.translate(-(this.bird.x + this.bird.width / 2), -(this.bird.y + this.bird.height / 2));

    // Bird body
    this.ctx.fillStyle = '#ffaa00';
    this.ctx.fillRect(this.bird.x, this.bird.y, this.bird.width, this.bird.height);

    // Bird wing
    this.ctx.fillStyle = '#ff8800';
    this.ctx.fillRect(this.bird.x + 4, this.bird.y + 8, 8, 6);

    // Bird eye
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(this.bird.x + 13, this.bird.y + 5, 5, 5);
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(this.bird.x + 15, this.bird.y + 7, 2, 2);

    // Bird beak
    this.ctx.fillStyle = '#ff3333';
    this.ctx.fillRect(this.bird.x + 18, this.bird.y + 9, 4, 3);

    this.ctx.restore();

    // Draw particles
    this.particles.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    });

    // Draw "Click or Space to start" message
    if (!this.started) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(0, this.height / 2 - 30, this.width, 60);

      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 14px "Courier New"';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('CLIQUEZ OU APPUYEZ SUR ESPACE', this.width / 2, this.height / 2 - 5);
      this.ctx.fillText('POUR COMMENCER', this.width / 2, this.height / 2 + 15);
    }
  }

  drawClouds() {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 3; i++) {
      const x = (this.bgOffset + i * 150) % this.width;
      const y = 50 + i * 80;

      // Simple cloud shapes
      this.ctx.fillRect(x, y, 40, 15);
      this.ctx.fillRect(x + 10, y - 8, 25, 15);
      this.ctx.fillRect(x + 20, y + 5, 30, 12);
    }
  }

  updateHUD() {
    document.getElementById('score-display').textContent = this.score;
    const levelDisplay = document.getElementById('level-display');
    if (levelDisplay) {
      levelDisplay.textContent = Math.floor(this.score / 5) + 1;
    }
    const livesDisplay = document.getElementById('lives-display');
    if (livesDisplay) {
      livesDisplay.textContent = '🐦';
    }
  }

  endGame() {
    this.gameOver = true;
    this.createCrashParticles();

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('t41FloppyBirdHighScore', this.highScore.toString());
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
    this.started = false;
    this.bird.y = this.height / 2;
    this.bird.velocity = 0;
    this.bird.rotation = 0;
    this.pipes = [];
    this.particles = [];
    this.lastPipeX = this.width;

    this.applyDifficulty(this.difficulty);
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
      case 'jump':
        oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        break;
      case 'score':
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
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

  gameLoop() {
    this.update();
    this.draw();
    this.animationFrame = requestAnimationFrame(() => this.gameLoop());
  }

  start() {
    this.gameLoop();
  }

  close() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    window.removeEventListener('keydown', this.keyHandler);
    this.canvas.removeEventListener('click', this.clickHandler);
    const overlay = document.getElementById('game-overlay');
    overlay.classList.remove('active');
  }
}
