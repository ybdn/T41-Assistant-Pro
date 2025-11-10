// T41 Space Invaders - Easter Egg Game
// Lightweight pixel-art space shooter

class SpaceInvadersGame {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.width = 294;
    this.height = 432;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Game state
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.gameOver = false;
    this.paused = false;
    this.animationFrame = null;

    // Player
    this.player = {
      x: this.width / 2 - 15,
      y: this.height - 60,
      width: 30,
      height: 30,
      speed: 3.5,
      color: '#00ff88'
    };

    // Input
    this.keys = {};
    this.lastShot = 0;
    this.shootDelay = 300;

    // Game objects
    this.bullets = [];
    this.aliens = [];
    this.alienBullets = [];
    this.particles = [];
    this.shields = [];
    this.stars = [];

    // Alien settings
    this.alienDirection = 1;
    this.alienSpeed = 0.3;
    this.alienShootChance = 0.0008;
    this.alienAnimFrame = 0;

    // High score
    this.highScore = parseInt(localStorage.getItem('t41SpaceInvadersHighScore') || '0');

    // Difficulty settings
    this.difficulty = 'normal';
    this.difficultySettings = {
      easy: {
        playerSpeed: 4,
        bulletSpeed: 6,
        alienSpeed: 0.2,
        alienBulletSpeed: 1.5,
        alienShootChance: 0.0005,
        alienSpeedIncrease: 0.1
      },
      normal: {
        playerSpeed: 3.5,
        bulletSpeed: 5,
        alienSpeed: 0.3,
        alienBulletSpeed: 2,
        alienShootChance: 0.0008,
        alienSpeedIncrease: 0.15
      },
      hard: {
        playerSpeed: 3,
        bulletSpeed: 4.5,
        alienSpeed: 0.45,
        alienBulletSpeed: 2.5,
        alienShootChance: 0.0012,
        alienSpeedIncrease: 0.2
      }
    };

    this.init();
  }

  init() {
    this.createStars();
    this.createShields();
    this.createAliens();
    this.setupEventListeners();
    this.setupDifficultySelector();
    this.applyDifficulty('normal');
    this.updateHUD();
  }

  createStars() {
    for (let i = 0; i < 40; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 2
      });
    }
  }

  createShields() {
    const shieldY = this.height - 100;
    for (let i = 0; i < 3; i++) {
      const x = 35 + i * 87;
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 5; col++) {
          this.shields.push({
            x: x + col * 6,
            y: shieldY + row * 6,
            width: 6,
            height: 6,
            health: 3
          });
        }
      }
    }
  }

  createAliens() {
    this.aliens = [];
    const startY = 50;
    const rows = 3 + Math.floor(this.level / 3);
    const cols = 6;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let type = 1;
        if (row === 0) type = 3;
        else if (row === 1) type = 2;

        this.aliens.push({
          x: 20 + col * 42,
          y: startY + row * 35,
          width: 28,
          height: 24,
          type: type,
          alive: true,
          animFrame: 0
        });
      }
    }
  }

  setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
      if (e.key === ' ') {
        e.preventDefault();
        this.shoot();
      }
      if (e.key === 'Escape') {
        this.close();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });
  }

  setupDifficultySelector() {
    const difficultySelect = document.getElementById('difficulty-select');
    if (difficultySelect) {
      difficultySelect.addEventListener('change', (e) => {
        this.applyDifficulty(e.target.value);
        // Enlever le focus pour éviter que les touches fléchées ne changent la sélection
        difficultySelect.blur();
      });

      // Empêcher les touches fléchées de changer la difficulté pendant le jeu
      difficultySelect.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          difficultySelect.blur();
        }
      });
    }
  }

  applyDifficulty(difficulty) {
    this.difficulty = difficulty;
    const settings = this.difficultySettings[difficulty];

    this.player.speed = settings.playerSpeed;
    this.alienSpeed = settings.alienSpeed;
    this.alienShootChance = settings.alienShootChance;

    // Store for use in other methods
    this.currentBulletSpeed = settings.bulletSpeed;
    this.currentAlienBulletSpeed = settings.alienBulletSpeed;
    this.currentAlienSpeedIncrease = settings.alienSpeedIncrease;
  }

  shoot() {
    const now = Date.now();
    if (now - this.lastShot > this.shootDelay && !this.gameOver) {
      this.bullets.push({
        x: this.player.x + this.player.width / 2 - 2,
        y: this.player.y,
        width: 4,
        height: 12,
        speed: this.currentBulletSpeed || 5
      });
      this.lastShot = now;
      this.playSound('shoot');
    }
  }

  update() {
    if (this.gameOver || this.paused) return;

    // Update player
    if (this.keys['ArrowLeft'] && this.player.x > 0) {
      this.player.x -= this.player.speed;
    }
    if (this.keys['ArrowRight'] && this.player.x < this.width - this.player.width) {
      this.player.x += this.player.speed;
    }

    // Update bullets
    this.bullets = this.bullets.filter(bullet => {
      bullet.y -= bullet.speed;
      return bullet.y > 0;
    });

    // Update alien bullets
    this.alienBullets = this.alienBullets.filter(bullet => {
      bullet.y += bullet.speed;
      return bullet.y < this.height;
    });

    // Update aliens
    this.updateAliens();

    // Update particles
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      return p.life > 0;
    });

    // Check collisions
    this.checkCollisions();

    // Check win condition
    if (this.aliens.filter(a => a.alive).length === 0) {
      this.nextLevel();
    }

    // Alien animation
    if (Math.floor(Date.now() / 500) !== this.alienAnimFrame) {
      this.alienAnimFrame = Math.floor(Date.now() / 500);
    }
  }

  updateAliens() {
    let moveDown = false;
    const aliveAliens = this.aliens.filter(a => a.alive);

    // Check boundaries
    for (let alien of aliveAliens) {
      if ((alien.x <= 0 && this.alienDirection < 0) ||
          (alien.x >= this.width - alien.width && this.alienDirection > 0)) {
        moveDown = true;
        this.alienDirection *= -1;
        break;
      }
    }

    // Move aliens
    for (let alien of aliveAliens) {
      alien.x += this.alienSpeed * this.alienDirection;
      if (moveDown) {
        alien.y += 15;
      }

      // Alien shooting
      if (Math.random() < this.alienShootChance * this.level) {
        this.alienBullets.push({
          x: alien.x + alien.width / 2 - 2,
          y: alien.y + alien.height,
          width: 4,
          height: 10,
          speed: this.currentAlienBulletSpeed || 2
        });
      }

      // Game over if alien reaches bottom
      if (alien.y + alien.height > this.height - 70) {
        this.endGame();
      }
    }
  }

  checkCollisions() {
    // Bullets hit aliens
    for (let bullet of this.bullets) {
      for (let alien of this.aliens) {
        if (alien.alive && this.collision(bullet, alien)) {
          alien.alive = false;
          this.bullets = this.bullets.filter(b => b !== bullet);
          this.createExplosion(alien.x + alien.width / 2, alien.y + alien.height / 2, alien.type);
          this.score += alien.type * 10;
          this.updateHUD();
          this.playSound('explosion');
          break;
        }
      }
    }

    // Bullets hit shields
    for (let bullet of this.bullets) {
      for (let shield of this.shields) {
        if (shield.health > 0 && this.collision(bullet, shield)) {
          shield.health--;
          this.bullets = this.bullets.filter(b => b !== bullet);
          break;
        }
      }
    }

    // Alien bullets hit shields
    for (let bullet of this.alienBullets) {
      for (let shield of this.shields) {
        if (shield.health > 0 && this.collision(bullet, shield)) {
          shield.health--;
          this.alienBullets = this.alienBullets.filter(b => b !== bullet);
          break;
        }
      }
    }

    // Alien bullets hit player
    for (let bullet of this.alienBullets) {
      if (this.collision(bullet, this.player)) {
        this.alienBullets = this.alienBullets.filter(b => b !== bullet);
        this.hit();
        break;
      }
    }
  }

  collision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }

  createExplosion(x, y, type) {
    const colors = ['#00ff88', '#ff00ff', '#ff3333', '#ffa500', '#ffff00'];
    for (let i = 0; i < 8 + type * 2; i++) {
      const angle = (Math.PI * 2 * i) / (8 + type * 2);
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * (2 + Math.random() * 2),
        vy: Math.sin(angle) * (2 + Math.random() * 2),
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 2,
        life: 30 + Math.random() * 20
      });
    }
  }

  hit() {
    this.lives--;
    this.updateHUD();
    this.createExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, 3);
    this.playSound('hit');

    if (this.lives <= 0) {
      this.endGame();
    } else {
      // Brief invincibility flash
      this.paused = true;
      setTimeout(() => {
        this.paused = false;
      }, 500);
    }
  }

  nextLevel() {
    this.level++;
    this.alienSpeed += this.currentAlienSpeedIncrease || 0.15;
    this.alienShootChance += 0.0002;
    this.score += 100 * this.level;
    this.createAliens();
    this.createShields();
    this.updateHUD();
    this.playSound('levelup');
  }

  endGame() {
    this.gameOver = true;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('t41SpaceInvadersHighScore', this.highScore.toString());
    }

    const gameOverScreen = document.getElementById('game-over-screen');
    document.getElementById('final-score').textContent = this.score;
    document.getElementById('high-score-display').textContent = this.highScore;
    gameOverScreen.classList.add('active');
  }

  restart() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.gameOver = false;
    this.bullets = [];
    this.alienBullets = [];
    this.particles = [];
    this.shields = [];
    this.player.x = this.width / 2 - 15;

    // Reapply current difficulty settings
    this.applyDifficulty(this.difficulty);

    this.createShields();
    this.createAliens();
    this.updateHUD();

    const gameOverScreen = document.getElementById('game-over-screen');
    gameOverScreen.classList.remove('active');
  }

  draw() {
    // Clear canvas
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw stars
    this.ctx.fillStyle = '#fff';
    for (let star of this.stars) {
      this.ctx.fillRect(star.x, star.y, star.size, star.size);
    }

    // Draw shields
    for (let shield of this.shields) {
      if (shield.health > 0) {
        this.ctx.fillStyle = shield.health === 3 ? '#00ff88' : shield.health === 2 ? '#ffff00' : '#ff8800';
        this.ctx.fillRect(shield.x, shield.y, shield.width, shield.height);
      }
    }

    // Draw player
    this.drawPlayer();

    // Draw bullets
    this.ctx.fillStyle = '#00ff88';
    for (let bullet of this.bullets) {
      this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }

    // Draw alien bullets
    this.ctx.fillStyle = '#ff3333';
    for (let bullet of this.alienBullets) {
      this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }

    // Draw aliens
    for (let alien of this.aliens) {
      if (alien.alive) {
        this.drawAlien(alien);
      }
    }

    // Draw particles
    for (let p of this.particles) {
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(p.x, p.y, p.size, p.size);
    }
  }

  drawPlayer() {
    const x = this.player.x;
    const y = this.player.y;
    const w = this.player.width;
    const h = this.player.height;

    this.ctx.fillStyle = this.player.color;

    // Cockpit (triangle on top)
    this.ctx.beginPath();
    this.ctx.moveTo(x + w / 2, y);
    this.ctx.lineTo(x + w / 2 - 6, y + 8);
    this.ctx.lineTo(x + w / 2 + 6, y + 8);
    this.ctx.closePath();
    this.ctx.fill();

    // Main body
    this.ctx.fillRect(x + w / 2 - 8, y + 8, 16, 12);

    // Wings
    this.ctx.fillRect(x, y + 14, w, 8);

    // Engines
    this.ctx.fillRect(x + 4, y + 22, 6, 6);
    this.ctx.fillRect(x + w - 10, y + 22, 6, 6);

    // Engine glow
    if (Math.random() > 0.5) {
      this.ctx.fillStyle = '#ffaa00';
      this.ctx.fillRect(x + 6, y + 28, 2, 2);
      this.ctx.fillRect(x + w - 8, y + 28, 2, 2);
    }
  }

  drawAlien(alien) {
    const x = alien.x;
    const y = alien.y;
    const frame = this.alienAnimFrame % 2;

    // Color based on type
    const colors = ['#ff3333', '#ff00ff', '#ffa500'];
    this.ctx.fillStyle = colors[alien.type - 1];

    if (alien.type === 1) {
      // Simple alien
      this.ctx.fillRect(x + 6, y, 16, 4); // top
      this.ctx.fillRect(x + 2, y + 4, 24, 10); // body
      this.ctx.fillRect(x + 4, y + 14, 4, 4); // leg1
      this.ctx.fillRect(x + 12, y + 14, 4, 4); // leg2
      this.ctx.fillRect(x + 20, y + 14, 4, 4); // leg3

      // Eyes
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(x + 8, y + 6, 3, 3);
      this.ctx.fillRect(x + 17, y + 6, 3, 3);
    } else if (alien.type === 2) {
      // Medium alien
      this.ctx.fillRect(x + 4, y, 20, 4); // top antennae
      this.ctx.fillRect(x + 2, y + 4, 24, 12); // body

      if (frame === 0) {
        this.ctx.fillRect(x, y + 16, 6, 4); // legs
        this.ctx.fillRect(x + 22, y + 16, 6, 4);
      } else {
        this.ctx.fillRect(x + 4, y + 16, 6, 4);
        this.ctx.fillRect(x + 18, y + 16, 6, 4);
      }

      // Eyes
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(x + 7, y + 7, 4, 4);
      this.ctx.fillRect(x + 17, y + 7, 4, 4);
    } else {
      // Boss alien
      this.ctx.fillRect(x + 4, y, 20, 6); // head
      this.ctx.fillRect(x, y + 6, 28, 10); // body
      this.ctx.fillRect(x + 6, y + 16, 4, 4); // legs
      this.ctx.fillRect(x + 12, y + 16, 4, 4);
      this.ctx.fillRect(x + 18, y + 16, 4, 4);

      // Eyes
      this.ctx.fillStyle = '#ffff00';
      this.ctx.fillRect(x + 8, y + 8, 4, 4);
      this.ctx.fillRect(x + 16, y + 8, 4, 4);
    }
  }

  updateHUD() {
    document.getElementById('score-display').textContent = this.score;
    document.getElementById('level-display').textContent = this.level;

    const livesDisplay = document.getElementById('lives-display');
    livesDisplay.innerHTML = '';
    for (let i = 0; i < this.lives; i++) {
      livesDisplay.innerHTML += '💚';
    }
  }

  playSound(type) {
    // Simple beep sounds using Web Audio API
    if (!window.AudioContext && !window.webkitAudioContext) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

    switch(type) {
      case 'shoot':
        oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        break;
      case 'explosion':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        break;
      case 'hit':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.3);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        break;
      case 'levelup':
        oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
        oscillator.frequency.setValueAtTime(500, audioCtx.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime + 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        break;
    }

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.3);
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
    const overlay = document.getElementById('game-overlay');
    overlay.classList.remove('active');
  }
}

// Initialize game when overlay opens
function initSpaceInvaders() {
  const overlay = document.getElementById('game-overlay');
  overlay.classList.add('active');

  const game = new SpaceInvadersGame('game-canvas');
  game.start();

  // Close button
  document.getElementById('game-close-btn').onclick = () => game.close();

  // Restart button
  document.getElementById('game-restart-btn').onclick = () => game.restart();

  // Store game instance
  window.spaceInvadersGame = game;
}
