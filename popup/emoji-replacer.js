/**
 * SYSTÈME DE REMPLACEMENT DES ÉMOJIS
 * ===================================
 * Ce module remplace les émojis Unicode par des alternatives compatibles Windows
 * - Pour les logs console : utilise des symboles ASCII
 * - Pour l'interface : génère des éléments HTML avec classes CSS
 */

// ===== CONFIGURATION DES ÉMOJIS =====
const EMOJI_MAP = {
  // Succès et validation
  '✅': { text: '[OK]', html: 'success', ascii: '√' },
  '✓': { text: '[OK]', html: 'check', ascii: '√' },

  // Erreurs
  '❌': { text: '[ERREUR]', html: 'error', ascii: 'X' },

  // Avertissements
  '⚠️': { text: '[ATTENTION]', html: 'warning', ascii: '/!\\' },
  '⚠': { text: '[ATTENTION]', html: 'warning', ascii: '/!\\' },

  // Actions et processus
  '🚀': { text: '[LANCEMENT]', html: 'rocket', ascii: '>>' },
  '🔍': { text: '[RECHERCHE]', html: 'search', ascii: '?' },
  '📦': { text: '[PACKAGE]', html: 'package', ascii: '[]' },
  '📋': { text: '[INFO]', html: 'clipboard', ascii: '::' },
  'ℹ️': { text: '[INFO]', html: 'info', ascii: 'i' },
  'ℹ': { text: '[INFO]', html: 'info', ascii: 'i' }
};

/**
 * Remplace les émojis dans un texte par leurs équivalents ASCII pour les logs
 * @param {string} text - Le texte contenant des émojis
 * @returns {string} - Le texte avec émojis remplacés
 */
function replaceEmojisForConsole(text) {
  let result = text;

  for (const [emoji, replacement] of Object.entries(EMOJI_MAP)) {
    // Utilise l'ASCII pour la console
    result = result.replace(new RegExp(emoji, 'g'), replacement.ascii);
  }

  return result;
}

/**
 * Remplace les émojis dans un texte par leurs équivalents textuels
 * @param {string} text - Le texte contenant des émojis
 * @returns {string} - Le texte avec émojis remplacés par du texte
 */
function replaceEmojisForText(text) {
  let result = text;

  for (const [emoji, replacement] of Object.entries(EMOJI_MAP)) {
    result = result.replace(new RegExp(emoji, 'g'), replacement.text);
  }

  return result;
}

/**
 * Crée un élément HTML pour remplacer un émoji
 * @param {string} emoji - L'émoji à remplacer
 * @param {string} size - Taille de l'icône (sm, md, lg)
 * @returns {HTMLElement} - L'élément HTML créé
 */
function createEmojiElement(emoji, size = 'md') {
  const replacement = EMOJI_MAP[emoji];

  if (!replacement) {
    // Si l'émoji n'est pas dans notre map, retourne un span avec le texte original
    const span = document.createElement('span');
    span.textContent = emoji;
    return span;
  }

  const iconDiv = document.createElement('span');
  iconDiv.className = `emoji-icon emoji-${replacement.html} size-${size}`;
  iconDiv.setAttribute('aria-label', replacement.text);
  iconDiv.setAttribute('title', replacement.text);

  return iconDiv;
}

/**
 * Remplace tous les émojis dans un élément HTML par des icônes CSS
 * @param {HTMLElement} element - L'élément à traiter
 */
function replaceEmojisInElement(element) {
  if (!element) return;

  // Récupère le texte de l'élément
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  const nodesToReplace = [];
  let node;

  // Collecte tous les nœuds texte contenant des émojis
  while ((node = walker.nextNode())) {
    for (const emoji of Object.keys(EMOJI_MAP)) {
      if (node.textContent.includes(emoji)) {
        nodesToReplace.push(node);
        break;
      }
    }
  }

  // Remplace les émojis dans chaque nœud
  nodesToReplace.forEach(textNode => {
    const fragment = document.createDocumentFragment();
    let text = textNode.textContent;
    let lastIndex = 0;

    // Cherche chaque émoji dans le texte
    for (const emoji of Object.keys(EMOJI_MAP)) {
      const index = text.indexOf(emoji, lastIndex);

      if (index !== -1) {
        // Ajoute le texte avant l'émoji
        if (index > lastIndex) {
          fragment.appendChild(
            document.createTextNode(text.substring(lastIndex, index))
          );
        }

        // Ajoute l'icône de remplacement
        fragment.appendChild(createEmojiElement(emoji));

        lastIndex = index + emoji.length;
      }
    }

    // Ajoute le texte restant
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
    }

    // Remplace le nœud texte par le fragment
    if (fragment.childNodes.length > 0) {
      textNode.parentNode.replaceChild(fragment, textNode);
    }
  });
}

/**
 * Surcharge de console.log pour remplacer automatiquement les émojis
 */
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;
const originalConsoleInfo = console.info;

console.log = function(...args) {
  const processedArgs = args.map(arg =>
    typeof arg === 'string' ? replaceEmojisForConsole(arg) : arg
  );
  originalConsoleLog.apply(console, processedArgs);
};

console.warn = function(...args) {
  const processedArgs = args.map(arg =>
    typeof arg === 'string' ? replaceEmojisForConsole(arg) : arg
  );
  originalConsoleWarn.apply(console, processedArgs);
};

console.error = function(...args) {
  const processedArgs = args.map(arg =>
    typeof arg === 'string' ? replaceEmojisForConsole(arg) : arg
  );
  originalConsoleError.apply(console, processedArgs);
};

console.info = function(...args) {
  const processedArgs = args.map(arg =>
    typeof arg === 'string' ? replaceEmojisForConsole(arg) : arg
  );
  originalConsoleInfo.apply(console, processedArgs);
};

// ===== EXPORT DES FONCTIONS =====
// Pour utilisation dans d'autres scripts
if (typeof window !== 'undefined') {
  window.EmojiReplacer = {
    replaceInConsole: replaceEmojisForConsole,
    replaceInText: replaceEmojisForText,
    createElement: createEmojiElement,
    replaceInElement: replaceEmojisInElement,
    EMOJI_MAP: EMOJI_MAP
  };
}

// Pour utilisation dans les content scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    replaceInConsole: replaceEmojisForConsole,
    replaceInText: replaceEmojisForText,
    createElement: createEmojiElement,
    replaceInElement: replaceEmojisInElement,
    EMOJI_MAP: EMOJI_MAP
  };
}

console.info('[EMOJI REPLACER] Système de remplacement des émojis initialisé');
