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
    this.ripples = []; // Ondes de répulsion
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

      // Ajouter l'interaction au clic pour créer des ondes de répulsion
      this.container.addEventListener('click', (e) => this.createRipple(e));
    }

    // S'assurer que le conteneur a les bonnes dimensions
    this.container.style.width = '100%';
    this.container.style.height = '100%';
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
        // Thème Noël : flocons, sapins (x3), cadeaux (x3), étoiles, bonhommes de neige, chocolat chaud
        icons: ['❄️', '🎄', '🎄', '🎄', '🎁', '🎁', '🎁', '⭐', '⛄', '☕'],
        count: 15,
        speed: 1.3
      },
      easter: {
        // Thème Pâques : œufs, lapins (x3), fleurs, cloches, carottes, paniers
        icons: ['🥚', '🐰', '🐰', '🐰', '🌸', '🔔', '🥕', '🧺', '🌺'],
        count: 16,
        speed: 1.2
      },
      halloween: {
        // Thème Halloween : fantômes, citrouilles, toiles d'araignées, têtes de mort
        icons: ['👻', '🎃', '💀', '🕸️', '☠️'],
        count: 16,
        speed: 1.4
      },
      newyear: {
        // Thème Nouvel An : feux d'artifice, champagne, horloge minuit, confettis, étoiles filantes
        icons: ['🥂', '🕛', '⭐', '✨', '🎁', '🎆', '🍷'],
        count: 16,
        speed: 1.5
      },
      bastille: {
        // Pas d'animations pour le 14 Juillet
        icons: [],
        count: 0,
        speed: 0
      },
      eid: {
        // Thème Aïd : base (beaucoup) + complément/sacrifice (peu)
        icons: ['🌙', '🌙', '🌙', '✨', '✨', '✨', '🕌', '🕌', '☪️', '☪️', '⭐', '⭐', '🐑', '🐑', '🎁', '🎊'],
        count: 15,
        speed: 1.2
      }
    };

    const config = themeConfig[themeId];
    if (config) {
      this.createParticles(config.icons, config.count, config.speed);
      this.animate();
    } else {
      // Pas d'animation pour les thèmes clair et sombre
      this.stop();
    }
  }

  /**
   * Crée les particules pour l'animation
   * @param {Array} icons - Liste des emojis Unicode possibles
   * @param {number} count - Nombre de particules
   * @param {number} speedMultiplier - Multiplicateur de vitesse
   */
  createParticles(icons, count, speedMultiplier) {
    this.particles = [];

    // Obtenir les dimensions du conteneur
    const containerWidth = this.container.clientWidth || window.innerWidth || 340;
    const containerHeight = this.container.clientHeight || window.innerHeight || 600;

    console.log(`📐 Dimensions du conteneur: ${containerWidth}x${containerHeight}`);

    for (let i = 0; i < count; i++) {
      const emoji = icons[Math.floor(Math.random() * icons.length)];
      const element = document.createElement('span');
      element.className = 'theme-animation-element bouncing-emoji';
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

      // Appliquer la position initiale avec !important pour éviter les conflits
      element.style.setProperty('transform', `translate(${x}px, ${y}px)`, 'important');
      element.style.setProperty('position', 'absolute', 'important');
      element.style.setProperty('left', '0', 'important');
      element.style.setProperty('top', '0', 'important');

      this.container.appendChild(element);

      this.particles.push({
        element,
        x,
        y,
        vx,
        vy,
        size,
        icon: emoji
      });

      console.log(`🎨 Particule ${i}: emoji=${emoji}, pos=(${x.toFixed(1)}, ${y.toFixed(1)}), vitesse=(${vx.toFixed(1)}, ${vy.toFixed(1)})`);
    }

    // Convertir tous les emojis en images Twemoji
    if (typeof twemoji !== 'undefined') {
      twemoji.parse(this.container, {
        folder: 'svg',
        ext: '.svg'
      });
      console.log(`✅ ${this.particles.length} particules créées et converties en Twemoji`);
    } else {
      console.warn('⚠️ Twemoji non disponible, les emojis seront affichés en mode natif');
      console.log(`✅ ${this.particles.length} particules créées`);
    }
  }

  /**
   * Crée une onde de répulsion au point de clic
   * @param {MouseEvent} e - L'événement de clic
   */
  createRipple(e) {
    const rect = this.container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Créer l'élément visuel de l'onde
    const rippleElement = document.createElement('div');
    rippleElement.className = 'ripple-wave';
    rippleElement.style.left = `${x}px`;
    rippleElement.style.top = `${y}px`;
    this.container.appendChild(rippleElement);

    // Supprimer l'élément après l'animation
    setTimeout(() => {
      if (rippleElement.parentNode) {
        rippleElement.parentNode.removeChild(rippleElement);
      }
    }, 600);

    // Ajouter l'onde à la liste des répulsions actives
    this.ripples.push({
      x,
      y,
      radius: 0,
      maxRadius: 150, // Rayon maximum de l'onde
      speed: 400, // Vitesse de propagation (pixels/seconde)
      force: 300, // Force de répulsion
      startTime: performance.now()
    });
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

    // Mettre à jour les ondes de répulsion
    this.ripples = this.ripples.filter(ripple => {
      const elapsed = (currentTime - ripple.startTime) / 1000;
      ripple.radius = ripple.speed * elapsed;
      return ripple.radius < ripple.maxRadius;
    });

    // Mettre à jour chaque particule
    this.particles.forEach(particle => {
      // Appliquer les forces de répulsion des ondes
      this.ripples.forEach(ripple => {
        const dx = particle.x - ripple.x;
        const dy = particle.y - ripple.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Si la particule est dans le rayon de l'onde
        if (distance < ripple.radius && distance > ripple.radius - 50) {
          // Calculer la force de répulsion (plus fort près de l'onde)
          const force = ripple.force * (1 - (Math.abs(distance - ripple.radius) / 50));
          const angle = Math.atan2(dy, dx);

          // Appliquer la force de répulsion
          particle.vx += Math.cos(angle) * force * deltaTime;
          particle.vy += Math.sin(angle) * force * deltaTime;

          // Limiter la vitesse maximale
          const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
          const maxSpeed = 300;
          if (speed > maxSpeed) {
            particle.vx = (particle.vx / speed) * maxSpeed;
            particle.vy = (particle.vy / speed) * maxSpeed;
          }
        }
      });

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

      // Appliquer la position avec !important
      particle.element.style.setProperty('transform', `translate(${particle.x}px, ${particle.y}px)`, 'important');
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
    this.ripples = [];
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
