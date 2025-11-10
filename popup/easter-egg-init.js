// Easter Egg Initializer - Game Menu System
// Click on version to launch the game selection menu

let currentGame = null;

// Game configurations
const gameConfigs = {
  'space-invaders': {
    title: 'T41 SPACE DEFENDER',
    subtitle: 'Yoann est incroyable',
    instructions: '<kbd>←</kbd> <kbd>→</kbd> Déplacer • <kbd>SPACE</kbd> Tirer • <kbd>ESC</kbd> Quitter',
    gameClass: SpaceInvadersGame
  },
  'snake': {
    title: 'T41 SNAKE',
    subtitle: 'Yoann est le meilleur du FAED',
    instructions: '<kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd> Diriger • <kbd>ESC</kbd> Quitter',
    gameClass: SnakeGame
  },
  'floppy-bird': {
    title: 'FLOPPY BIRD',
    subtitle: 'Yoann, le pro du code',
    instructions: '<kbd>SPACE</kbd> ou <kbd>CLIC</kbd> Sauter • <kbd>ESC</kbd> Quitter',
    gameClass: FloppyBirdGame
  }
};

document.addEventListener('DOMContentLoaded', function() {
  const versionInfo = document.querySelector('.version-info');

  if (versionInfo) {
    // Add click event to version element to open menu
    versionInfo.addEventListener('click', function() {
      console.log('🎮 T41 Arcade Menu activated!');
      openGameMenu();
    });
  }

  // Setup game menu
  setupGameMenu();
});

function openGameMenu() {
  const menuOverlay = document.getElementById('game-menu-overlay');
  menuOverlay.classList.add('active');
}

function closeGameMenu() {
  const menuOverlay = document.getElementById('game-menu-overlay');
  menuOverlay.classList.remove('active');
}

function setupGameMenu() {
  // Close button
  const closeBtn = document.getElementById('game-menu-close-btn');
  if (closeBtn) {
    closeBtn.onclick = closeGameMenu;
  }

  // Game selection buttons
  const gameItems = document.querySelectorAll('.game-menu-item');
  gameItems.forEach(item => {
    item.addEventListener('click', function() {
      const gameType = this.getAttribute('data-game');
      closeGameMenu();
      setTimeout(() => {
        launchGame(gameType);
      }, 300);
    });
  });
}

function launchGame(gameType) {
  const config = gameConfigs[gameType];
  if (!config) {
    console.error('Unknown game type:', gameType);
    return;
  }

  console.log(`🎮 Launching ${config.title}!`);

  // Update game UI
  document.getElementById('game-title').textContent = config.title;
  document.querySelector('.game-subtitle').textContent = config.subtitle;
  document.getElementById('game-instructions').innerHTML = config.instructions;

  // Show game overlay
  const overlay = document.getElementById('game-overlay');
  overlay.classList.add('active');

  // Clean up previous game instance
  if (currentGame && currentGame.close) {
    currentGame.close();
  }

  // Create and start new game
  currentGame = new config.gameClass('game-canvas');
  currentGame.start();

  // Setup game controls
  setupGameControls();
}

function setupGameControls() {
  // Close button
  const closeBtn = document.getElementById('game-close-btn');
  if (closeBtn) {
    closeBtn.onclick = () => {
      if (currentGame && currentGame.close) {
        currentGame.close();
      }
      currentGame = null;
    };
  }

  // Restart button
  const restartBtn = document.getElementById('game-restart-btn');
  if (restartBtn) {
    restartBtn.onclick = () => {
      if (currentGame && currentGame.restart) {
        currentGame.restart();
      }
    };
  }
}
