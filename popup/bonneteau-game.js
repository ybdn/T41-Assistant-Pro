// BONNETEAU - Easter Egg Game
// Retrouvez la bille sous le bon gobelet !

const BONNETEAU_LIFT_HEIGHT = 55;   // pixels a cup rises when lifted off the table
const BONNETEAU_LIFT_SPEED = 260;   // pixels/second for the lift animation
const BONNETEAU_REVEAL_THRESHOLD = 30; // lift amount above which the ball underneath becomes visible

class BonneteauGame {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.width = 294;
    this.height = 432;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Game state
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.gameOver = false;
    this.animationFrame = null;
    this.lastTime = 0;

    // Phase: 'raised' -> 'lowering' -> 'shuffle' -> 'guess' -> 'reveal' -> 'round-over'
    this.phase = 'raised';

    // Cup layout
    this.cupWidth = 70;
    this.cupHeight = 80;
    this.cupY = 220;
    this.slotXs = [
      this.width / 2 - 90,
      this.width / 2,
      this.width / 2 + 90
    ];

    // cups[i] = { x, slot, hasBall, liftOffset, liftTarget, swapArc }
    this.cups = [];
    this.ballSlot = 0;
    this.selectedIndex = null;

    // Shuffle animation state
    this.shuffleMoves = [];
    this.shuffleIndex = 0;
    this.shuffleMoveDuration = 0.28; // seconds per swap
    this.swapping = null; // { a, b, progress }

    this.resultMessage = '';

    this.highScore = parseInt(localStorage.getItem('t41BonneteauHighScore') || '0');

    // Difficulty settings: shuffle speed and swap count scale with the chosen level
    this.difficulty = 'normal';
    this.difficultySettings = {
      easy: { moveDuration: 0.38, swapsBase: 3, swapsPerLevel: 1, maxSwaps: 12, levelSpeedFactor: 0.05 },
      normal: { moveDuration: 0.28, swapsBase: 4, swapsPerLevel: 2, maxSwaps: 20, levelSpeedFactor: 0.08 },
      hard: { moveDuration: 0.18, swapsBase: 6, swapsPerLevel: 2, maxSwaps: 26, levelSpeedFactor: 0.12 }
    };

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupDifficultySelector();
    this.applyDifficulty('normal');
    this.setupRound();
    this.updateHUD();
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
    this.shuffleMoveDuration = settings.moveDuration;
    this.swapsBase = settings.swapsBase;
    this.swapsPerLevel = settings.swapsPerLevel;
    this.maxSwaps = settings.maxSwaps;
    this.levelSpeedFactor = settings.levelSpeedFactor;
  }

  setupEventListeners() {
    this.keyHandler = (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    };

    this.clickHandler = (e) => {
      if (this.gameOver) return;

      if (this.phase === 'raised') {
        // Player launches the round: cups come down and cover the ball
        this.phase = 'lowering';
        this.cups.forEach(cup => { cup.liftTarget = 0; });
        return;
      }

      if (this.phase === 'round-over') {
        // Player chains into the next round
        if (this.lives <= 0) {
          this.endGame();
        } else {
          this.setupRound();
        }
        return;
      }

      if (this.phase !== 'guess') return;

      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.width / rect.width;
      const scaleY = this.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      this.cups.forEach((cup, index) => {
        if (
          x >= cup.x - this.cupWidth / 2 &&
          x <= cup.x + this.cupWidth / 2 &&
          y >= this.cupY - BONNETEAU_LIFT_HEIGHT &&
          y <= this.cupY + this.cupHeight
        ) {
          this.handleGuess(index);
        }
      });
    };

    window.addEventListener('keydown', this.keyHandler);
    this.canvas.addEventListener('click', this.clickHandler);
  }

  setupRound() {
    // Number of shuffle swaps grows with level, capped for playability, scaled by difficulty
    this.shuffleSwaps = Math.min(this.swapsBase + this.level * this.swapsPerLevel, this.maxSwaps);

    this.ballSlot = Math.floor(Math.random() * 3);
    this.cups = this.slotXs.map((x, i) => ({
      x,
      slot: i,
      hasBall: i === this.ballSlot,
      liftOffset: 0,
      liftTarget: BONNETEAU_LIFT_HEIGHT,
      swapArc: 0
    }));

    // Cups start raised, revealing the ball at its starting position
    this.phase = 'raised';
    this.selectedIndex = null;
    this.resultMessage = '';
    this.swapping = null;
    this.shuffleIndex = 0;
    this.generateShuffleMoves();
  }

  generateShuffleMoves() {
    this.shuffleMoves = [];
    for (let i = 0; i < this.shuffleSwaps; i++) {
      let a = Math.floor(Math.random() * 3);
      let b = Math.floor(Math.random() * 3);
      while (b === a) {
        b = Math.floor(Math.random() * 3);
      }
      this.shuffleMoves.push([a, b]);
    }
  }

  handleGuess(cupIndex) {
    const cup = this.cups[cupIndex];
    this.selectedIndex = cupIndex;
    cup.liftTarget = BONNETEAU_LIFT_HEIGHT;

    if (cup.hasBall) {
      this.score += 10 * this.level;
      this.level++;
      this.resultMessage = 'GAGNÉ !';
      this.playSound('win');
    } else {
      this.lives--;
      this.resultMessage = 'PERDU !';
      this.playSound('lose');

      // Also lift the cup that actually hides the ball
      const ballCup = this.cups.find(c => c.hasBall);
      if (ballCup) {
        ballCup.liftTarget = BONNETEAU_LIFT_HEIGHT;
      }
    }

    this.phase = 'reveal';
    this.updateHUD();
  }

  updateLiftAnimation(dt) {
    const step = BONNETEAU_LIFT_SPEED * dt;
    this.cups.forEach(cup => {
      if (cup.liftOffset < cup.liftTarget) {
        cup.liftOffset = Math.min(cup.liftTarget, cup.liftOffset + step);
      } else if (cup.liftOffset > cup.liftTarget) {
        cup.liftOffset = Math.max(cup.liftTarget, cup.liftOffset - step);
      }
    });
  }

  allCupsAtTarget() {
    return this.cups.every(cup => Math.abs(cup.liftOffset - cup.liftTarget) < 0.5);
  }

  updateShuffle(dt) {
    if (!this.swapping) {
      if (this.shuffleIndex >= this.shuffleMoves.length) {
        this.phase = 'guess';
        return;
      }
      const [a, b] = this.shuffleMoves[this.shuffleIndex];
      this.swapping = { a, b, progress: 0 };
    }

    // Faster shuffles at higher levels, scaled by difficulty
    const speedFactor = 1 + (this.level - 1) * this.levelSpeedFactor;
    this.swapping.progress += (dt / this.shuffleMoveDuration) * speedFactor;

    const cupA = this.cups[this.swapping.a];
    const cupB = this.cups[this.swapping.b];
    const startAX = this.slotXs[this.swapping.a];
    const startBX = this.slotXs[this.swapping.b];
    const t = Math.min(this.swapping.progress, 1);
    // Arc motion so cups visibly cross over each other
    const arc = Math.sin(t * Math.PI) * 24;
    cupA.x = startAX + (startBX - startAX) * t;
    cupA.swapArc = arc;
    cupB.x = startBX + (startAX - startBX) * t;
    cupB.swapArc = arc;

    if (this.swapping.progress >= 1) {
      // Commit the swap
      const tmpSlot = cupA.slot;
      cupA.slot = cupB.slot;
      cupB.slot = tmpSlot;
      cupA.x = this.slotXs[cupA.slot];
      cupB.x = this.slotXs[cupB.slot];
      cupA.swapArc = 0;
      cupB.swapArc = 0;

      // Reorder this.cups array to match slot positions
      const sorted = [null, null, null];
      this.cups.forEach(c => { sorted[c.slot] = c; });
      this.cups = sorted;

      this.swapping = null;
      this.shuffleIndex++;
    }
  }

  update(dt) {
    if (this.gameOver) return;

    switch (this.phase) {
      case 'raised':
        this.updateLiftAnimation(dt);
        break;
      case 'lowering':
        this.updateLiftAnimation(dt);
        if (this.allCupsAtTarget()) {
          this.phase = 'shuffle';
        }
        break;
      case 'shuffle':
        this.updateShuffle(dt);
        break;
      case 'guess':
        break;
      case 'reveal':
        this.updateLiftAnimation(dt);
        if (this.allCupsAtTarget()) {
          this.phase = 'round-over';
        }
        break;
      case 'round-over':
        break;
    }
  }

  draw() {
    // Background - felt table
    this.ctx.fillStyle = '#0b3d24';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Table texture lines
    this.ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    this.ctx.lineWidth = 1;
    for (let i = 0; i < this.height; i += 20) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(this.width, i);
      this.ctx.stroke();
    }

    // Title
    this.ctx.fillStyle = '#ffd700';
    this.ctx.font = 'bold 18px "Courier New"';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('BONNETEAU', this.width / 2, 55);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px "Courier New"';
    let statusText = '';
    switch (this.phase) {
      case 'raised':
        statusText = 'CLIQUEZ POUR LANCER LA MANCHE';
        break;
      case 'lowering':
        statusText = 'ON POSE LES GOBELETS...';
        break;
      case 'shuffle':
        statusText = 'MÉLANGE EN COURS...';
        break;
      case 'guess':
        statusText = 'OÙ EST LA BILLE ?';
        break;
      case 'reveal':
      case 'round-over':
        statusText = this.resultMessage;
        break;
    }
    this.ctx.fillText(statusText, this.width / 2, 85);

    if (this.phase === 'round-over') {
      this.ctx.fillStyle = 'rgba(255,255,255,0.8)';
      this.ctx.font = '11px "Courier New"';
      this.ctx.fillText('CLIQUEZ POUR CONTINUER', this.width / 2, 105);
    }

    // Draw cups (upside-down, covering the ball resting on the table)
    this.cups.forEach((cup) => {
      const totalLift = cup.liftOffset + cup.swapArc;
      const topY = this.cupY - totalLift;

      // Ball is visible once the cup covering it is lifted high enough
      if (cup.hasBall && totalLift > BONNETEAU_REVEAL_THRESHOLD) {
        this.ctx.fillStyle = '#ff3333';
        this.ctx.beginPath();
        this.ctx.arc(cup.x, this.cupY + this.cupHeight - 12, 10, 0, Math.PI * 2);
        this.ctx.fill();
      }

      // Cup body: narrow closed base at top, wide open rim at the bottom (à l'envers)
      this.ctx.fillStyle = '#c0392b';
      this.ctx.beginPath();
      this.ctx.moveTo(cup.x - this.cupWidth / 2 + 12, topY);
      this.ctx.lineTo(cup.x + this.cupWidth / 2 - 12, topY);
      this.ctx.lineTo(cup.x + this.cupWidth / 2, topY + this.cupHeight);
      this.ctx.lineTo(cup.x - this.cupWidth / 2, topY + this.cupHeight);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.strokeStyle = '#7a1f16';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      // Rim highlight at the bottom (opening resting toward the table)
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.fillRect(cup.x - this.cupWidth / 2, topY + this.cupHeight - 6, this.cupWidth, 6);

      // Small foot/knob at the top (closed base of the inverted cup)
      this.ctx.fillStyle = '#7a1f16';
      this.ctx.fillRect(cup.x - 6, topY - 4, 12, 6);
    });

    // Instructions during guess phase
    if (this.phase === 'guess') {
      this.ctx.fillStyle = 'rgba(255,255,255,0.8)';
      this.ctx.font = '11px "Courier New"';
      this.ctx.fillText('CLIQUEZ SUR UN GOBELET', this.width / 2, 340);
    }
  }

  updateHUD() {
    document.getElementById('score-display').textContent = this.score;
    const levelDisplay = document.getElementById('level-display');
    if (levelDisplay) {
      levelDisplay.textContent = this.level;
    }
    const livesDisplay = document.getElementById('lives-display');
    if (livesDisplay) {
      livesDisplay.innerHTML = '';
      for (let i = 0; i < this.lives; i++) {
        livesDisplay.innerHTML += '🔴';
      }
    }
  }

  endGame() {
    this.gameOver = true;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('t41BonneteauHighScore', this.highScore.toString());
    }

    const gameOverScreen = document.getElementById('game-over-screen');
    document.getElementById('final-score').textContent = this.score;
    document.getElementById('high-score-display').textContent = this.highScore;
    gameOverScreen.classList.add('active');

    this.playSound('gameover');
  }

  restart() {
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.gameOver = false;

    this.setupRound();
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

    switch (type) {
      case 'win':
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        break;
      case 'lose':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(250, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
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
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.update(dt);
    this.draw();
    this.animationFrame = requestAnimationFrame((time) => this.gameLoop(time));
  }

  start() {
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
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
