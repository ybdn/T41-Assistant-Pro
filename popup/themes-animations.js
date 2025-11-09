/**
 * T41 Assistant Pro - Animations de thèmes festifs
 * Système d'animations avec rebonds sur les bords
 */

class ThemeAnimations {
  constructor() {
    this.container = null;
    this.animationFrame = null;
    this.currentTheme = null;
    this.particles = [];
    this.lastTime = 0;
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

    // Configuration des emojis par thème
    const themeConfig = {
      christmas: {
        emojis: ['❄️', '⛄', '🎄', '🎁', '⭐'],
        count: 12,
        speed: 1.5
      },
      genevieve: {
        emojis: ['⭐', '✨', '🌟', '💫', '🛡️'],
        count: 10,
        speed: 1.2
      },
      easter: {
        emojis: ['🌸', '🌷', '🥚', '🐰', '🦋', '🌺'],
        count: 10,
        speed: 1.3
      },
      halloween: {
        emojis: ['🦇', '👻', '🕷️', '🎃', '🕸️'],
        count: 12,
        speed: 1.5
      },
      newyear: {
        emojis: ['🎆', '✨', '🎉', '🎊', '💫', '⭐'],
        count: 14,
        speed: 1.4
      },
      bastille: {
        emojis: ['🎆', '🎇', '✨', '💫', '🇫🇷'],
        count: 12,
        speed: 1.4
      }
    };

    const config = themeConfig[themeId];
    if (config) {
      this.createParticles(config.emojis, config.count, config.speed);
      this.animate();
    } else {
      // Pas d'animation pour les thèmes clair et sombre
      this.stop();
    }
  }

  /**
   * Crée les particules pour l'animation
   * @param {Array} emojis - Liste des emojis possibles
   * @param {number} count - Nombre de particules
   * @param {number} speedMultiplier - Multiplicateur de vitesse
   */
  createParticles(emojis, count, speedMultiplier) {
    this.particles = [];

    // Obtenir les dimensions du conteneur
    const containerWidth = this.container.clientWidth || window.innerWidth || 340;
    const containerHeight = this.container.clientHeight || window.innerHeight || 600;

    console.log(`📐 Dimensions du conteneur: ${containerWidth}x${containerHeight}`);

    for (let i = 0; i < count; i++) {
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      const element = document.createElement('div');
      element.className = 'theme-animation-element bouncing-icon';
      element.textContent = emoji;

      // Taille aléatoire
      const size = 16 + Math.random() * 12; // 16-28px
      element.style.fontSize = `${size}px`;

      // Position initiale aléatoire
      const x = Math.random() * (containerWidth - size);
      const y = Math.random() * (containerHeight - size);

      // Vitesse aléatoire (en pixels par seconde)
      const baseSpeed = 80 * speedMultiplier;
      const vx = (Math.random() - 0.5) * baseSpeed * 2;
      const vy = (Math.random() - 0.5) * baseSpeed * 2;

      // Opacité aléatoire
      const opacity = 0.5 + Math.random() * 0.4; // 0.5-0.9
      element.style.opacity = opacity;

      // Appliquer la position initiale
      element.style.transform = `translate(${x}px, ${y}px)`;

      this.container.appendChild(element);

      this.particles.push({
        element,
        x,
        y,
        vx,
        vy,
        size,
        emoji
      });

      console.log(`🎨 Particule ${i}: emoji=${emoji}, pos=(${x.toFixed(1)}, ${y.toFixed(1)}), vitesse=(${vx.toFixed(1)}, ${vy.toFixed(1)})`);
    }

    console.log(`✅ ${this.particles.length} particules créées`);
  }

  /**
   * Boucle d'animation
   */
  animate() {
    const currentTime = performance.now();
    const deltaTime = this.lastTime ? (currentTime - this.lastTime) / 1000 : 0.016; // 16ms par défaut
    this.lastTime = currentTime;

    // Obtenir les dimensions du conteneur (une seule fois par frame)
    const containerWidth = this.container.clientWidth || window.innerWidth || 340;
    const containerHeight = this.container.clientHeight || window.innerHeight || 600;

    // Mettre à jour chaque particule
    this.particles.forEach(particle => {
      // Calculer la nouvelle position
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;

      // Rebond sur les bords horizontaux
      if (particle.x <= 0) {
        particle.x = 0;
        particle.vx = Math.abs(particle.vx);
      } else if (particle.x >= containerWidth - particle.size) {
        particle.x = containerWidth - particle.size;
        particle.vx = -Math.abs(particle.vx);
      }

      // Rebond sur les bords verticaux
      if (particle.y <= 0) {
        particle.y = 0;
        particle.vy = Math.abs(particle.vy);
      } else if (particle.y >= containerHeight - particle.size) {
        particle.y = containerHeight - particle.size;
        particle.vy = -Math.abs(particle.vy);
      }

      // Appliquer la position
      particle.element.style.transform = `translate(${particle.x}px, ${particle.y}px)`;
    });

    // Continuer l'animation
    if (this.currentTheme) {
      this.animationFrame = requestAnimationFrame(() => this.animate());
    }
  }

  /**
   * Arrête toutes les animations
   */
  stop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.container) {
      this.container.innerHTML = '';
    }

    this.particles = [];
    this.currentTheme = null;
    this.lastTime = 0;
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
