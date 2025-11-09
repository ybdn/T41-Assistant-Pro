/**
 * T41 Assistant Pro - Animations de thèmes festifs
 * Gestion des animations d'emojis pour chaque thème
 */

class ThemeAnimations {
  constructor() {
    this.container = null;
    this.animationInterval = null;
    this.currentTheme = null;
  }

  /**
   * Initialise le conteneur d'animations
   */
  init() {
    // Créer le conteneur d'animations s'il n'existe pas
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'theme-animations-container';
      document.body.appendChild(this.container);
    }
  }

  /**
   * Démarre les animations pour un thème donné
   * @param {string} themeId - L'ID du thème
   */
  start(themeId) {
    console.log(`🎬 Démarrage des animations pour le thème: ${themeId}`);

    // Arrêter les animations précédentes
    this.stop();

    this.currentTheme = themeId;
    this.init();

    // Démarrer les animations selon le thème
    switch(themeId) {
      case 'christmas':
        this.startChristmasAnimation();
        break;
      case 'genevieve':
        this.startGenevieveAnimation();
        break;
      case 'easter':
        this.startEasterAnimation();
        break;
      case 'halloween':
        this.startHalloweenAnimation();
        break;
      case 'newyear':
        this.startNewYearAnimation();
        break;
      case 'bastille':
        this.startBastilleAnimation();
        break;
      default:
        // Pas d'animation pour les thèmes clair et sombre
        this.stop();
    }
  }

  /**
   * Arrête toutes les animations
   */
  stop() {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }

    if (this.container) {
      this.container.innerHTML = '';
    }

    this.currentTheme = null;
  }

  /**
   * Crée un élément animé
   * @param {string} emoji - L'emoji à afficher
   * @param {string} animationClass - La classe CSS d'animation
   * @param {number} duration - Durée de l'animation en secondes
   * @param {number} delay - Délai avant le début en secondes
   * @param {number} left - Position horizontale en %
   */
  createAnimatedElement(emoji, animationClass, duration, delay = 0, left = null) {
    const element = document.createElement('div');
    element.className = `theme-animation-element ${animationClass}`;
    element.textContent = emoji;
    element.style.animationDuration = `${duration}s`;
    element.style.animationDelay = `${delay}s`;

    if (left !== null) {
      element.style.left = `${left}%`;
    } else {
      element.style.left = `${Math.random() * 100}%`;
    }

    this.container.appendChild(element);

    // Supprimer l'élément après l'animation
    setTimeout(() => {
      if (element.parentNode === this.container) {
        this.container.removeChild(element);
      }
    }, (duration + delay) * 1000);

    return element;
  }

  /**
   * Animation Noël - Chute de flocons
   */
  startChristmasAnimation() {
    const emojis = ['❄️', '⛄', '🎄', '🎁', '⭐'];

    // Créer des flocons initiaux
    for (let i = 0; i < 15; i++) {
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      const duration = 8 + Math.random() * 7; // 8-15 secondes
      const delay = Math.random() * 5;
      this.createAnimatedElement(emoji, 'falling-snow', duration, delay);
    }

    // Ajouter de nouveaux flocons régulièrement
    this.animationInterval = setInterval(() => {
      if (this.currentTheme === 'christmas') {
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        const duration = 8 + Math.random() * 7;
        this.createAnimatedElement(emoji, 'falling-snow', duration);
      }
    }, 1500);
  }

  /**
   * Animation Sainte Geneviève - Étoiles scintillantes
   */
  startGenevieveAnimation() {
    const emojis = ['⭐', '✨', '🌟', '💫'];

    // Créer des étoiles initiales
    for (let i = 0; i < 12; i++) {
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      const duration = 3 + Math.random() * 2;
      const delay = Math.random() * 3;
      this.createAnimatedElement(emoji, 'twinkling-stars', duration, delay);
    }

    // Ajouter de nouvelles étoiles
    this.animationInterval = setInterval(() => {
      if (this.currentTheme === 'genevieve') {
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        const duration = 3 + Math.random() * 2;
        this.createAnimatedElement(emoji, 'twinkling-stars', duration);
      }
    }, 2000);
  }

  /**
   * Animation Pâques - Éléments flottants
   */
  startEasterAnimation() {
    const emojis = ['🌸', '🌷', '🥚', '🐰', '🦋', '🌺'];

    // Créer des éléments initiaux
    for (let i = 0; i < 10; i++) {
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      const duration = 10 + Math.random() * 5;
      const delay = Math.random() * 4;
      this.createAnimatedElement(emoji, 'floating-spring', duration, delay);
    }

    // Ajouter de nouveaux éléments
    this.animationInterval = setInterval(() => {
      if (this.currentTheme === 'easter') {
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        const duration = 10 + Math.random() * 5;
        this.createAnimatedElement(emoji, 'floating-spring', duration);
      }
    }, 2500);
  }

  /**
   * Animation Halloween - Éléments volants
   */
  startHalloweenAnimation() {
    const emojis = ['🦇', '👻', '🕷️', '🎃', '🕸️'];

    // Créer des éléments initiaux
    for (let i = 0; i < 12; i++) {
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      const duration = 8 + Math.random() * 6;
      const delay = Math.random() * 4;
      this.createAnimatedElement(emoji, 'flying-spooky', duration, delay);
    }

    // Ajouter de nouveaux éléments
    this.animationInterval = setInterval(() => {
      if (this.currentTheme === 'halloween') {
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        const duration = 8 + Math.random() * 6;
        this.createAnimatedElement(emoji, 'flying-spooky', duration);
      }
    }, 1800);
  }

  /**
   * Animation Nouvel An - Feux d'artifice et confettis
   */
  startNewYearAnimation() {
    const emojis = ['🎆', '✨', '🎉', '🎊', '💫', '⭐'];

    // Créer des éléments initiaux
    for (let i = 0; i < 15; i++) {
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      const duration = 3 + Math.random() * 2;
      const delay = Math.random() * 2;
      this.createAnimatedElement(emoji, 'fireworks-burst', duration, delay);
    }

    // Ajouter de nouveaux feux d'artifice
    this.animationInterval = setInterval(() => {
      if (this.currentTheme === 'newyear') {
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        const duration = 3 + Math.random() * 2;
        this.createAnimatedElement(emoji, 'fireworks-burst', duration);
      }
    }, 800);
  }

  /**
   * Animation 14 Juillet - Feux d'artifice montants
   */
  startBastilleAnimation() {
    const emojis = ['🎆', '🎇', '✨', '💫', '🇫🇷'];

    // Créer des éléments initiaux
    for (let i = 0; i < 12; i++) {
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      const duration = 4 + Math.random() * 3;
      const delay = Math.random() * 3;
      this.createAnimatedElement(emoji, 'rising-fireworks', duration, delay);
    }

    // Ajouter de nouveaux feux d'artifice
    this.animationInterval = setInterval(() => {
      if (this.currentTheme === 'bastille') {
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        const duration = 4 + Math.random() * 3;
        this.createAnimatedElement(emoji, 'rising-fireworks', duration);
      }
    }, 1200);
  }
}

// Créer l'instance globale
const themeAnimations = new ThemeAnimations();

// Exposer pour le débogage
window.themeAnimations = themeAnimations;

// Exporter pour utilisation dans themes.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = themeAnimations;
}
