# T41 Assistant Pro - Firefox - DFAED GN

## Description

**T41 Assistant Pro** est une extension pour le navigateur Firefox conçue pour assister les opérateurs du DFAED sur l'application web T41 Alphanu de la Gendarmerie Nationale (FR).

L'extension vise à automatiser et à vérifier certaines étapes du processus de contrôle des fiches de signalisation sur T41, réduisant ainsi les erreurs et le temps de traitement.

## Fonctionnalités principales

- **Automatisation du contrôle de la fiche FAED** :
  - Navigue automatiquement entre les différents onglets de la fiche (Alpha-numérique, Portraits, Empreintes digitales, Empreintes palmaires), en gérant les cas où certains onglets pourraient être désactivés (ex: Portraits).
  - Coche automatiquement les options "Non" requises dans les sections appropriées.
  - Clique sur les boutons de progression et de finalisation (ex: "Terminer", "OK et suivant", ou "OK").
- **Vérification des données alphanumériques** :
  - Extrait et analyse des informations clés de la fiche (telles que type de saisie, service initiateur, UNA, nom, prénom, ID Gaspard, etc.).
  - Détecte les incohérences, les erreurs de format, ou les données spécifiques (ex: "NEOTEST", "FRANCK DESMIS") conformément à la logique métier.
  - Met en évidence les champs contenant des erreurs directement sur la page FAED.
  - Affiche une fenêtre modale récapitulant les erreurs détectées.
- **Adaptabilité** : Détecte automatiquement certaines variations de la structure de la page FAED pour appliquer les actions et sélecteurs DOM corrects.
- **Gestion du chargement** : Attend activement la fin des indicateurs de chargement de la page FAED avant d'exécuter les actions pour fiabiliser l'automatisation.
- **Interface utilisateur via Popup** :
  - Un bouton "Lancer" dans la popup permet de démarrer ou de continuer séquentiellement le processus d'automatisation et de vérification.
  - L'icône de l'extension, en plus d'ouvrir la popup, peut aussi déclencher une vérification des données alphanumériques et change de couleur (vert/rouge) pour indiquer le résultat de la dernière vérification.

## Utilisation

1.  Naviguer vers une page de fiche de signalisation sur l'application FAED (`https://faed.ppsso.gendarmerie.fr/*` ou `https://faed.sso.gendarmerie.fr/*`).
2.  Cliquer sur l'icône de l'extension **Extension T41** dans la barre d'outils du navigateur pour ouvrir la popup.
3.  Dans la popup :
    - Cliquer sur le bouton "**Lancer**" pour démarrer la séquence d'automatisation et de vérification. Si une séquence est déjà en cours, ce bouton permet de passer à l'étape suivante (si applicable et après un délai de sécurité minimal).
    - L'icône de l'extension (dans la barre d'outils) reflète l'état de la dernière vérification (vert: OK, rouge: Erreur). Un clic sur l'icône peut aussi directement lancer une vérification alphanumérique.
4.  L'extension exécute les étapes d'automatisation (navigation, clics) et de vérification des données.
5.  Les éventuelles erreurs alphanumériques sont mises en évidence sur la page FAED et listées dans une fenêtre d'alerte. L'icône de l'extension reflète ce statut.

## Structure du projet

```
.
├── README.md               # Ce fichier
├── SECURITY.md             # Informations relatives à la sécurité
├── manifest.json           # Fichier de configuration de l'extension
├── background/
│   └── backgroundScript.js # Script de fond (gestion état, communication inter-scripts)
├── content/
│   └── alphaMatchers.js    # Script de contenu (logique principale, automatisation, vérification alphanumérique)
├── popup/
│   ├── popup.html          # Structure HTML de la popup
│   ├── popup.js            # Logique JS de la popup (interactions utilisateur, communication)
│   └── styles.css          # Styles CSS de la popup
├── icons/                  # Icônes de l'extension (normal, erreur, succès)
└── controleDeLaFiche.html  # Fichier HTML statique, exemple de la structure d'une page FAED (utile pour le développement et la compréhension des sélecteurs DOM)
```

## Fichiers importants

- `manifest.json` : Définit la structure, les permissions, les icônes, et les points d'entrée de l'extension (popup, script de fond, script de contenu).
- `content/alphaMatchers.js` : Cœur de l'extension. Ce script est injecté dans les pages FAED. Il implémente :
  - L'automatisation de la navigation et des actions sur la page.
  - L'extraction des données des champs de la fiche.
  - La logique de vérification alphanumérique détaillée dans `alphasMatchLogic.md`.
  - La mise en évidence des erreurs et l'affichage de la fenêtre de résultats.
- `background/backgroundScript.js` : Service worker de l'extension. Il gère :
  - L'état global de l'application.
  - La communication entre la popup et le script de contenu.
  - L'injection des scripts de contenu lors du clic sur l'icône de l'extension.
- `popup/popup.js` : Gère les interactions utilisateur dans la fenêtre popup (clic sur "Lancer") et communique avec `content/alphaMatchers.js` pour initier/continuer les actions et avec `backgroundScript.js`. Met à jour l'icône de l'extension.
- `controleDeLaFiche.html` : Un exemple statique de la page FAED "Contrôle de la fiche". Très utile pour identifier les sélecteurs DOM nécessaires à l'automatisation et à l'extraction de données, sans avoir besoin d'accéder constamment à l'application FAED réelle pendant le développement.

## Crédits

Développé par Yoann BAUDRIN.
