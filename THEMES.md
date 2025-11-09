# 🎨 Système de Thèmes Festifs - T41 Assistant Pro

## Vue d'ensemble

T41 Assistant Pro dispose d'un système de thèmes visuels avancé qui inclut 8 thèmes au total :
- 2 thèmes standards (Clair et Sombre)
- 6 thèmes festifs basés sur les fêtes françaises

Le système peut fonctionner en **mode automatique** (détection automatique des fêtes) ou en **mode manuel** (sélection libre par l'utilisateur).

---

## 📋 Liste des Thèmes

### Thèmes Standards

#### ☀️ Thème Clair
- **ID**: `light`
- **Description**: Thème par défaut avec un design clair et moderne
- **Utilisation**: Recommandé pour une utilisation en journée

#### 🌙 Thème Sombre
- **ID**: `dark`
- **Description**: Thème sombre pour réduire la fatigue visuelle
- **Utilisation**: Recommandé pour une utilisation de nuit ou dans des environnements peu éclairés

---

### Thèmes Festifs

#### 🎄 Thème Noël
- **ID**: `christmas`
- **Période**: 1er au 25 décembre
- **Couleurs**: Rouge, vert et or
- **Ambiance**: Festive avec des décorations de Noël
- **Emojis**: 🎄 ❄️ 🎅 ⛄ 🎁
- **Animation**: Chute de flocons de neige ❄️

#### ⭐ Thème Sainte Geneviève
- **ID**: `genevieve`
- **Période**: 3 janvier
- **Couleurs**: Or, bleu et argent
- **Ambiance**: Élégante et solennelle
- **Description**: En l'honneur de Sainte Geneviève, patronne des gendarmes
- **Emojis**: ⭐ 🛡️ ⚔️ 👮
- **Animation**: Étoiles scintillantes ✨

#### 🌸 Thème Pâques
- **ID**: `easter`
- **Période**: 7 jours avant jusqu'à 48h après Pâques (calculé dynamiquement)
- **Couleurs**: Rose, violet, jaune, vert et bleu pastel
- **Ambiance**: Printanière et colorée
- **Emojis**: 🌸 🐰 🥚 🌷
- **Animation**: Éléments printaniers flottants 🌸

#### 🎃 Thème Halloween
- **ID**: `halloween`
- **Période**: 28 octobre au 3 novembre
- **Couleurs**: Orange, violet et noir
- **Ambiance**: Mystérieuse et sombre
- **Emojis**: 🎃 👻 🦇 🕷️
- **Animation**: Éléments effrayants volants 👻

#### 🎆 Thème Nouvel An
- **ID**: `newyear`
- **Période**: 28 décembre au 4 janvier
- **Couleurs**: Bleu, or, argent et violet
- **Ambiance**: Festive avec des effets de feux d'artifice
- **Emojis**: 🎆 ✨ 🎉 🥂 🎊
- **Animation**: Explosions de feux d'artifice 🎆

#### 🇫🇷 Thème 14 Juillet
- **ID**: `bastille`
- **Période**: 14 juillet
- **Couleurs**: Bleu, blanc et rouge (couleurs du drapeau français)
- **Ambiance**: Patriotique et élégante
- **Emojis**: 🇫🇷 🎆 🗼 🥖
- **Animation**: Feux d'artifice montants 🎇

---

## 🚀 Utilisation

### Accéder au Sélecteur de Thèmes

1. Ouvrez l'extension T41 Assistant Pro
2. Cliquez sur l'icône **palette** (🎨) dans l'en-tête
3. Un menu déroulant s'ouvre avec tous les thèmes disponibles

### Mode Automatique

Le mode automatique est **activé par défaut**. Il détecte automatiquement la période de l'année et applique le thème festif approprié.

- **Checkbox "Auto"**: Activez ou désactivez le mode automatique
- Lorsqu'il est activé, le thème change automatiquement en fonction de la date
- En dehors des périodes festives, le thème par défaut (Clair ou Sombre) est appliqué

### Mode Manuel

Pour choisir manuellement un thème :

1. Ouvrez le menu déroulant des thèmes
2. Cliquez sur le thème de votre choix
3. Le mode automatique se désactive automatiquement
4. Le thème choisi reste actif jusqu'à ce que vous en changiez

---

## 🔧 Fonctionnalités Techniques

### Sauvegarde des Préférences

- Les préférences de thème sont sauvegardées dans `browser.storage.local`
- La clé de stockage : `t41-theme-settings`
- Les données sauvegardées :
  - `theme`: ID du thème actuel
  - `baseTheme`: Thème de base préféré de l'utilisateur (light ou dark)
  - `autoMode`: État du mode automatique (true/false)

### Calcul Automatique de Pâques

Le thème Pâques utilise un algorithme (Meeus/Jones/Butcher) pour calculer la date de Pâques chaque année. Le thème s'active 7 jours avant jusqu'à 48 heures après cette date.

### Transitions Fluides

- Toutes les transitions de thème sont animées (400ms)
- Les changements de couleur utilisent des transitions CSS
- Animation spéciale lors du changement de thème pour une meilleure expérience utilisateur

### Animations d'Emojis

Chaque thème festif dispose d'**animations d'emojis** uniques qui apparaissent en arrière-plan :

- **🎄 Noël** : Flocons de neige qui tombent doucement avec rotation
- **⭐ Sainte Geneviève** : Étoiles scintillantes avec effet de pulsation
- **🌸 Pâques** : Éléments printaniers qui flottent vers le haut avec oscillation
- **🎃 Halloween** : Éléments effrayants qui volent horizontalement de façon irrégulière
- **🎆 Nouvel An** : Explosions de feux d'artifice avec effets de lumière
- **🇫🇷 14 Juillet** : Feux d'artifice qui montent avec effet de dispersion

**Caractéristiques techniques** :
- Animations générées dynamiquement en JavaScript
- Optimisées pour les performances (GPU acceleration)
- Respect du paramètre `prefers-reduced-motion` pour l'accessibilité
- Pas d'animations sur les thèmes Clair et Sombre pour préserver la sobriété

### Compatibilité

- ✅ Compatible avec l'ancien système de thème sombre
- ✅ Migration automatique des préférences
- ✅ Rétrocompatibilité avec `localStorage.getItem('t41-dark-theme')`

---

## 🎨 Personnalisation Avancée

### Variables CSS

Chaque thème utilise des variables CSS pour définir ses couleurs :

```css
--theme-bg: /* Couleur de fond principale */
--theme-card-bg: /* Couleur de fond des cartes */
--theme-text: /* Couleur du texte normal */
--theme-text-dark: /* Couleur du texte important */
--theme-text-light: /* Couleur du texte secondaire */
--theme-border: /* Couleur des bordures */
--theme-primary-bg: /* Couleur de fond primaire */
/* ... et plus */
```

### Structure des Fichiers

```
popup/
├── themes.js                # Logique du système de thèmes
├── themes-festive.css       # Styles CSS des thèmes festifs
├── themes-animations.js     # Animations d'emojis pour les thèmes
├── themes-animations.css    # Styles CSS pour les animations
├── styles.css               # Styles de base
└── styles-additional.css    # Styles additionnels (thèmes Clair/Sombre)
```

---

## 🐛 Débogage

### Console du Navigateur

Le système de thèmes expose plusieurs fonctions pour le débogage :

```javascript
// Accéder au gestionnaire de thèmes
window.themeManager

// Voir tous les thèmes disponibles
window.THEMES

// Détecter le thème festif actuel
window.detectFestiveTheme()

// Changer de thème manuellement (via console)
window.themeManager.changeTheme('christmas', true)

// Activer/désactiver le mode auto
window.themeManager.toggleAutoMode()

// === Commandes pour les animations ===

// Accéder au gestionnaire d'animations
window.themeAnimations

// Démarrer les animations pour un thème
window.themeAnimations.start('christmas')

// Arrêter toutes les animations
window.themeAnimations.stop()
```

### Logs Console

Le système affiche des logs détaillés :
- `🎨 Initialisation du gestionnaire de thèmes`
- `📖 Préférences chargées: {...}`
- `🎨 Application du thème: [themeId]`
- `🎬 Démarrage des animations pour le thème: [themeId]`
- `💾 Préférences sauvegardées: {...}`
- `✅ Gestionnaire de thèmes initialisé`

---

## ♿ Accessibilité

### Contrastes

Tous les thèmes respectent les ratios de contraste WCAG 2.1 :
- **AA** pour le texte normal (≥ 4.5:1)
- **AAA** pour les titres (≥ 7:1)

### Thèmes Clairs vs Sombres

- Thèmes clairs : Pâques, 14 Juillet
- Thèmes sombres : Noël, Sainte Geneviève, Halloween, Nouvel An, Sombre

### Navigation au Clavier

- Le menu déroulant est entièrement accessible au clavier
- Utilisez `Tab` pour naviguer entre les options
- `Enter` ou `Espace` pour sélectionner un thème
- `Esc` pour fermer le menu

---

## 📊 Statistiques

- **8 thèmes au total**
- **6 périodes festives françaises**
- **6 types d'animations uniques**
- **~1400 lignes de CSS** pour les thèmes et animations
- **~900 lignes de JavaScript** pour la logique et animations
- **Mode automatique intelligent** avec calcul de Pâques
- **Optimisé pour les performances** avec GPU acceleration

---

## 🔄 Mises à Jour Futures

### Idées d'Améliorations

- [ ] Ajouter d'autres fêtes françaises (1er mai, 8 mai, 11 novembre, etc.)
- [ ] Permettre la création de thèmes personnalisés
- [x] ~~Ajouter des animations spéciales pour chaque thème~~ ✅ **Terminé !**
- [ ] Synchronisation des thèmes entre appareils (via `browser.storage.sync`)
- [ ] Mode "Surprise" qui change de thème aléatoirement
- [ ] Paramètres avancés pour contrôler l'intensité des animations

---

## 📝 Notes de Version

### Version 2.2.0 (Actuelle)
- ✨ Ajout du système de thèmes festifs français
- ✨ 6 nouveaux thèmes festifs avec identités visuelles uniques
- ✨ Animations d'emojis dynamiques pour chaque thème festif
- ✨ Mode automatique avec détection intelligente des fêtes
- ✨ Menu déroulant premium pour sélection manuelle
- ✨ Sauvegarde des préférences utilisateur
- ✨ Transitions fluides entre les thèmes
- 🎬 6 types d'animations uniques (neige, étoiles, fleurs, fantômes, feux d'artifice)
- ⚡ Optimisations de performance (GPU acceleration, respect de prefers-reduced-motion)
- 🔧 Amélioration de l'accessibilité

### Version 2.1.0
- Thèmes Clair et Sombre uniquement
- Système de bascule simple

---

## 📞 Support

Pour toute question ou problème concernant les thèmes :
- 📧 Contactez l'auteur : [GitHub @ybdn](https://github.com/ybdn)
- 🐛 Signalez un bug : Créez une issue sur le dépôt GitHub
- 💡 Suggérez un thème : Ouvrez une discussion sur GitHub

---

**© 2025 T41 Assistant Pro - Développé avec ❤️ par ybdn**
