/**
 * T41 Assistant Pro - Système de thèmes festifs français
 * Gestion des thèmes visuels basés sur les fêtes françaises
 */

// ===== CONFIGURATION DES THÈMES =====

const THEMES = {
  light: {
    id: 'light',
    name: 'Clair',
    icon: '\u2600\uFE0F', // ☀️ avec variante emoji
    isDefault: true,
    festive: false
  },
  dark: {
    id: 'dark',
    name: 'Sombre',
    icon: '\uD83C\uDF19', // 🌙
    isDefault: true,
    festive: false
  },
  christmas: {
    id: 'christmas',
    name: 'Noël',
    icon: '\uD83C\uDF84', // 🎄
    festive: true,
    period: { start: { month: 12, day: 1 }, end: { month: 12, day: 25 } },
    description: 'Célébrez Noël avec des décorations festives'
  },
  genevieve: {
    id: 'genevieve',
    name: 'Sainte Geneviève',
    icon: '\u2B50', // ⭐
    festive: true,
    period: { start: { month: 1, day: 3 }, end: { month: 1, day: 3 } },
    description: 'Patronne des gendarmes'
  },
  easter: {
    id: 'easter',
    name: 'Pâques',
    icon: '\uD83C\uDF38', // 🌸
    festive: true,
    period: 'easter', // Calculé dynamiquement
    description: 'Célébrez Pâques avec des couleurs printanières'
  },
  halloween: {
    id: 'halloween',
    name: 'Halloween',
    icon: '\uD83C\uDF83', // 🎃
    festive: true,
    period: { start: { month: 10, day: 28 }, end: { month: 11, day: 3 } },
    description: 'Ambiance mystérieuse pour Halloween'
  },
  newyear: {
    id: 'newyear',
    name: 'Nouvel An',
    icon: '\uD83C\uDF86', // 🎆
    festive: true,
    period: { start: { month: 12, day: 28 }, end: { month: 1, day: 4 } },
    description: 'Feux d\'artifice pour la nouvelle année'
  },
  bastille: {
    id: 'bastille',
    name: '14 Juillet',
    icon: '\uD83C\uDDEB\uD83C\uDDF7', // 🇫🇷
    festive: true,
    period: { start: { month: 7, day: 14 }, end: { month: 7, day: 14 } },
    description: 'Fête nationale française'
  }
};

// ===== CALCUL DE LA DATE DE PÂQUES =====

/**
 * Calcule la date de Pâques pour une année donnée (algorithme de Meeus/Jones/Butcher)
 * @param {number} year - L'année
 * @returns {Date} - La date de Pâques
 */
function calculateEaster(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
}

/**
 * Vérifie si une date est dans la période de Pâques (7 jours avant jusqu'à 2 jours après)
 * @param {Date} date - La date à vérifier
 * @returns {boolean}
 */
function isEasterPeriod(date) {
  const year = date.getFullYear();
  const easterDate = calculateEaster(year);

  // Calculer la différence en jours (positif = après Pâques, négatif = avant Pâques)
  const diffTime = date - easterDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // 7 jours avant (-7) jusqu'à 2 jours après (+2)
  return diffDays >= -7 && diffDays <= 2;
}

// ===== DÉTECTION AUTOMATIQUE DES FÊTES =====

/**
 * Vérifie si une date est dans une période donnée
 * @param {Date} date - La date à vérifier
 * @param {Object} period - La période {start: {month, day}, end: {month, day}}
 * @returns {boolean}
 */
function isInPeriod(date, period) {
  const month = date.getMonth() + 1; // getMonth() retourne 0-11
  const day = date.getDate();

  // Cas spécial pour le Nouvel An (28 déc - 4 jan)
  if (period.start.month === 12 && period.end.month === 1) {
    return (
      (month === 12 && day >= period.start.day) ||
      (month === 1 && day <= period.end.day)
    );
  }

  // Cas normal : même mois
  if (period.start.month === period.end.month) {
    return month === period.start.month &&
           day >= period.start.day &&
           day <= period.end.day;
  }

  // Cas avec plusieurs mois
  if (month === period.start.month) {
    return day >= period.start.day;
  }
  if (month === period.end.month) {
    return day <= period.end.day;
  }
  if (month > period.start.month && month < period.end.month) {
    return true;
  }

  return false;
}

/**
 * Détecte le thème festif approprié pour la date actuelle
 * @returns {string|null} - L'ID du thème festif ou null
 */
function detectFestiveTheme() {
  const today = new Date();

  // Vérifier chaque thème festif
  for (const [key, theme] of Object.entries(THEMES)) {
    if (!theme.festive) continue;

    // Cas spécial pour Pâques
    if (theme.period === 'easter') {
      if (isEasterPeriod(today)) {
        return theme.id;
      }
      continue;
    }

    // Vérifier les autres périodes
    if (isInPeriod(today, theme.period)) {
      return theme.id;
    }
  }

  return null;
}

// ===== GESTION DES THÈMES =====

/**
 * Classe pour gérer les thèmes de l'application
 */
class ThemeManager {
  constructor() {
    this.currentTheme = 'light';
    this.baseTheme = 'light'; // Thème de base (clair ou sombre) utilisé quand pas de thème festif
    this.autoMode = true;
    this.storageKey = 't41-theme-settings';
    this.body = document.body;
  }

  /**
   * Initialise le gestionnaire de thèmes
   */
  async init() {
    console.log('🎨 Initialisation du gestionnaire de thèmes');

    // Charger les préférences
    await this.loadPreferences();

    // Appliquer le thème approprié
    if (this.autoMode) {
      const festiveTheme = detectFestiveTheme();
      if (festiveTheme) {
        this.applyTheme(festiveTheme);
      } else {
        // Pas de thème festif : utiliser le thème de base préféré de l'utilisateur
        this.applyTheme(this.baseTheme);
      }
    } else {
      this.applyTheme(this.currentTheme);
    }

    // Créer l'interface de sélection
    this.createThemeSelector();

    console.log('√ Gestionnaire de thèmes initialisé');
  }

  /**
   * Charge les préférences depuis localStorage
   */
  async loadPreferences() {
    try {
      const data = await browser.storage.local.get(this.storageKey);
      const settings = data[this.storageKey];

      if (settings) {
        this.currentTheme = settings.theme || 'light';
        this.baseTheme = settings.baseTheme || 'light';
        this.autoMode = settings.autoMode !== undefined ? settings.autoMode : true;
        console.log('📖 Préférences chargées:', settings);
      } else {
        // Migration depuis l'ancien système de thème sombre
        const oldDarkTheme = localStorage.getItem('t41-dark-theme');
        if (oldDarkTheme === 'true') {
          this.currentTheme = 'dark';
          this.baseTheme = 'dark';
        }
      }
    } catch (error) {
      console.error('X Erreur lors du chargement des préférences:', error);
    }
  }

  /**
   * Sauvegarde les préférences dans localStorage
   */
  async savePreferences() {
    try {
      const settings = {
        theme: this.currentTheme,
        baseTheme: this.baseTheme,
        autoMode: this.autoMode
      };

      await browser.storage.local.set({ [this.storageKey]: settings });
      console.log('💾 Préférences sauvegardées:', settings);
    } catch (error) {
      console.error('X Erreur lors de la sauvegarde des préférences:', error);
    }
  }

  /**
   * Applique un thème
   * @param {string} themeId - L'ID du thème à appliquer
   */
  applyTheme(themeId) {
    console.log(`🎨 Application du thème: ${themeId}`);

    // Retirer tous les thèmes précédents
    Object.keys(THEMES).forEach(id => {
      this.body.classList.remove(`theme-${id}`);
    });

    // Compatibilité avec l'ancien système
    this.body.classList.remove('dark-theme');

    // Appliquer le nouveau thème
    if (themeId === 'dark') {
      // Compatibilité avec l'ancien système dark-theme
      this.body.classList.add('dark-theme');
    }
    this.body.classList.add(`theme-${themeId}`);

    this.currentTheme = themeId;

    // Animation de transition
    this.body.classList.add('theme-transition');
    setTimeout(() => {
      this.body.classList.remove('theme-transition');
    }, 400);

    // Démarrer les animations d'emojis pour les thèmes festifs
    if (window.themeAnimations) {
      window.themeAnimations.start(themeId);
    }
  }

  /**
   * Change le thème
   * @param {string} themeId - L'ID du nouveau thème
   * @param {boolean} manual - Si le changement est manuel (désactive le mode auto)
   */
  async changeTheme(themeId, manual = false) {
    if (manual) {
      this.autoMode = false;

      // Si l'utilisateur choisit 'light' ou 'dark', mémoriser comme thème de base
      if (themeId === 'light' || themeId === 'dark') {
        this.baseTheme = themeId;
      }
    }

    this.applyTheme(themeId);
    await this.savePreferences();

    // Mettre à jour l'interface
    this.updateThemeSelector();
  }

  /**
   * Active/désactive le mode automatique
   */
  async toggleAutoMode() {
    this.autoMode = !this.autoMode;

    if (this.autoMode) {
      // En mode auto, détecter et appliquer le thème festif
      const festiveTheme = detectFestiveTheme();
      if (festiveTheme) {
        this.applyTheme(festiveTheme);
      } else {
        // Pas de thème festif : utiliser le thème de base préféré de l'utilisateur
        this.applyTheme(this.baseTheme);
      }
    }

    await this.savePreferences();
    this.updateThemeSelector();
  }

  /**
   * Crée le sélecteur de thème dans l'interface
   */
  createThemeSelector() {
    const themeToggle = document.querySelector('.theme-toggle');
    if (!themeToggle) {
      console.error('X Conteneur theme-toggle non trouvé');
      return;
    }

    // Remplacer l'ancien bouton par le nouveau sélecteur
    const oldButton = document.getElementById('theme-switch');
    if (oldButton) {
      oldButton.remove();
    }

    // Créer le conteneur du sélecteur
    const selector = document.createElement('div');
    selector.className = 'theme-selector';
    selector.innerHTML = `
      <button id="theme-dropdown-btn" class="icon-button tooltip theme-dropdown-btn">
        <i class="fas fa-palette"></i>
        <span class="tooltip-text">Changer le thème</span>
      </button>
      <div id="theme-dropdown" class="theme-dropdown hidden">
        <div class="theme-dropdown-header">
          <span>Thèmes</span>
          <label class="theme-auto-toggle">
            <input type="checkbox" id="theme-auto-checkbox" ${this.autoMode ? 'checked' : ''}>
            <span class="theme-auto-label">Auto</span>
          </label>
        </div>
        <div class="theme-dropdown-list">
          ${this.renderThemeOptions()}
        </div>
      </div>
    `;

    themeToggle.appendChild(selector);

    // Ajouter les événements
    this.attachThemeSelectorEvents();
  }

  /**
   * Génère les options de thème pour le menu déroulant
   */
  renderThemeOptions() {
    const options = [];

    // Thèmes par défaut
    options.push('<div class="theme-section-title">Thèmes standards</div>');
    Object.values(THEMES).filter(t => !t.festive).forEach(theme => {
      const isActive = this.currentTheme === theme.id;
      options.push(`
        <button class="theme-option ${isActive ? 'active' : ''}" data-theme="${theme.id}">
          <span class="theme-icon">${theme.icon}</span>
          <span class="theme-name">${theme.name}</span>
          ${isActive ? '<i class="fas fa-check theme-check"></i>' : ''}
        </button>
      `);
    });

    // Thèmes festifs
    options.push('<div class="theme-section-title">Thèmes festifs</div>');
    Object.values(THEMES).filter(t => t.festive).forEach(theme => {
      const isActive = this.currentTheme === theme.id;
      options.push(`
        <button class="theme-option ${isActive ? 'active' : ''}" data-theme="${theme.id}">
          <span class="theme-icon">${theme.icon}</span>
          <span class="theme-name">${theme.name}</span>
          ${isActive ? '<i class="fas fa-check theme-check"></i>' : ''}
        </button>
      `);
    });

    return options.join('');
  }

  /**
   * Attache les événements au sélecteur de thème
   */
  attachThemeSelectorEvents() {
    const dropdownBtn = document.getElementById('theme-dropdown-btn');
    const dropdown = document.getElementById('theme-dropdown');
    const autoCheckbox = document.getElementById('theme-auto-checkbox');

    if (!dropdownBtn || !dropdown || !autoCheckbox) {
      console.error('X Éléments du sélecteur de thème non trouvés');
      return;
    }

    // Ouvrir/fermer le menu déroulant
    dropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('hidden');
    });

    // Fermer le menu en cliquant ailleurs
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && e.target !== dropdownBtn) {
        dropdown.classList.add('hidden');
      }
    });

    // Gérer le mode automatique
    autoCheckbox.addEventListener('change', () => {
      this.toggleAutoMode();
    });

    // Gérer la sélection des thèmes
    const themeOptions = dropdown.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
      option.addEventListener('click', () => {
        const themeId = option.dataset.theme;
        this.changeTheme(themeId, true);
        dropdown.classList.add('hidden');
      });
    });
  }

  /**
   * Met à jour l'interface du sélecteur de thème
   */
  updateThemeSelector() {
    const dropdown = document.getElementById('theme-dropdown');
    const autoCheckbox = document.getElementById('theme-auto-checkbox');

    if (!dropdown || !autoCheckbox) return;

    // Mettre à jour la checkbox auto
    autoCheckbox.checked = this.autoMode;

    // Mettre à jour les options
    const listContainer = dropdown.querySelector('.theme-dropdown-list');
    if (listContainer) {
      listContainer.innerHTML = this.renderThemeOptions();

      // Réattacher les événements aux nouvelles options
      const themeOptions = listContainer.querySelectorAll('.theme-option');
      themeOptions.forEach(option => {
        option.addEventListener('click', () => {
          const themeId = option.dataset.theme;
          this.changeTheme(themeId, true);
          dropdown.classList.add('hidden');
        });
      });
    }
  }
}

// ===== INITIALISATION =====

// Créer l'instance globale du gestionnaire de thèmes
let themeManager;

// Initialiser au chargement du DOM
document.addEventListener('DOMContentLoaded', async () => {
  themeManager = new ThemeManager();
  await themeManager.init();
});

// Exposer pour le débogage
window.themeManager = themeManager;
window.THEMES = THEMES;
window.detectFestiveTheme = detectFestiveTheme;
