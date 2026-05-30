# Plan de réorganisation — T41 Assistant Pro

Ce plan opérationnalise l'[audit](AUDIT.md). Il suit le principe **KISS** : on déplace, on supprime, on isole — on ne refactor pas tant qu'on n'a pas un socle propre.

L'exécution est volontairement **séquentielle par phase** pour permettre des PRs courtes et reviewables.

---

## Cible : structure finale

```
T41-Assistant-Pro/
├── README.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
├── SECURITY.md
├── .gitignore
├── .editorconfig
├── .eslintrc.json
├── .prettierrc
├── package.json
├── package-lock.json
│
├── src/                           # Tout ce qui est packagé dans l'extension
│   ├── manifest.json
│   ├── background/
│   │   └── background.js
│   ├── content/
│   │   ├── index.js               # Entry point (IIFE, messaging)
│   │   ├── pages/                 # Détection page (controle, accueil...)
│   │   ├── steps/                 # Séquences d'étapes
│   │   ├── validation/            # Règles alpha, NATINF, empreintes
│   │   ├── dom/                   # Helpers waitForElement, selectors
│   │   └── ui/                    # Modale d'erreur, highlight
│   ├── popup/
│   │   ├── popup.html
│   │   ├── index.js               # Entry point UI
│   │   ├── state.js               # État boucle, notifications
│   │   ├── messaging.js           # Bridge avec background/content
│   │   ├── styles/
│   │   │   ├── base.css
│   │   │   ├── components.css
│   │   │   └── themes/
│   │   │       ├── light.css
│   │   │       ├── dark.css
│   │   │       └── festive/...
│   │   ├── themes/                # JS thèmes
│   │   └── arcade/                # Easter-egg isolé (chargé à la demande)
│   │       ├── menu.js
│   │       ├── snake.js
│   │       ├── space-invaders.js
│   │       ├── floppy-bird.js
│   │       └── asteroids.js
│   ├── data/
│   │   └── natinf-survey.json
│   ├── icons/
│   └── vendor/                    # font-awesome, twemoji, polyfill
│
├── tools/                         # Scripts dev — JAMAIS packagés
│   ├── pack-extension.js
│   ├── bump-version.js
│   └── analyzer.js
│
├── docs/
│   ├── AUDIT.md
│   ├── REORGANIZATION_PLAN.md
│   ├── ARCHITECTURE.md
│   ├── PUBLISH.md                 # Sans secrets
│   ├── THEMES.md
│   ├── UI.md
│   ├── COMMIT_CONVENTIONS.md
│   ├── adr/
│   │   ├── 0001-manifest-v3.md
│   │   ├── 0002-detached-popup-window.md
│   │   └── 0003-isolate-arcade.md
│   └── issues/
│       ├── 01-security-and-hygiene.md
│       ├── 02-cleanup-dead-code.md
│       ├── 03-tooling.md
│       ├── 04-restructure-folders.md
│       ├── 05-modularize-alphamatchers.md
│       ├── 06-modularize-popup.md
│       ├── 07-isolate-arcade.md
│       ├── 08-css-consolidation.md
│       └── 09-tests-and-ci.md
│
├── tests/                         # À créer en phase 5
│   ├── unit/
│   └── e2e/
│
└── .github/
    └── workflows/
```

**Bénéfices :**
- `src/` = ce qui part dans le `.xpi`. Whitelist au lieu de blacklist `.web-extignore`.
- `tools/` = dev only, impossible d'être packagé par erreur.
- `docs/` = documentation centralisée.
- Modules courts (< 300 lignes idéalement, < 500 max).

---

## Phases

### 🔴 Phase 0 — Sécurité (urgence)

**Objectif :** stopper l'exposition des secrets. **Avant tout commit de restructure.**

1. **Révoquer** la clé Mozilla actuelle sur https://addons.mozilla.org/developers/addon/api/key/.
2. Régénérer un couple `WEB_EXT_API_KEY` / `WEB_EXT_API_SECRET`.
3. Stocker la nouvelle paire dans :
   - un **password manager** personnel,
   - les **GitHub Secrets** du repo (pour le workflow CI).
4. Purger l'historique git :
   ```bash
   git filter-repo --path PUBLISH.md --path .amo-upload-uuid --path web-ext-artifacts --invert-paths
   git push --force-with-lease
   ```
   (Coordonner avec tous les collaborateurs — opération destructive.)
5. Ajouter un `.gitignore` minimal (cf. issue #1).

⚠️ Tant que cette phase n'est pas terminée, considérer la clé comme **compromise**.

---

### 🟠 Phase 1 — Hygiène repo (1 PR, ~1h)

- Créer `.gitignore`, `.editorconfig`.
- Supprimer fichiers morts (cf. issue #2).
- Fusionner `.web-extignore` / `.web-ext-ignore`.
- Mettre à jour `README.md` (structure réelle).
- Créer `CHANGELOG.md` (depuis git log) et `CONTRIBUTING.md`.

**Critère de sortie :** `git status` propre, repo allégé de ~1,5 Mo (artefacts + backups).

---

### 🟡 Phase 2 — Outillage (1 PR, ~2h)

- Créer `package.json` :
  - dépendances dev : `web-ext`, `eslint`, `prettier`, `eslint-config-prettier`.
  - scripts : `lint`, `format`, `build`, `sign`, `run`, `bump`.
- Ajouter `.eslintrc.json` (preset `eslint:recommended` + globals webextensions).
- Ajouter `.prettierrc`.
- Lancer une passe `prettier --write` (commit séparé pour le diff cosmétique).

**Critère de sortie :** `npm run lint` passe, `npm run build` produit le `.xpi`.

---

### 🟢 Phase 3 — Restructuration des dossiers (1 PR, ~2h)

> ⚠️ Cette PR est uniquement **des `git mv`** + ajustements de chemins. Aucune logique modifiée.

1. Créer `src/` et déplacer : `manifest.json`, `background/`, `content/`, `popup/`, `icons/`, `data/`.
2. Déplacer `popup/vendor/` → `src/vendor/`.
3. Déplacer `analyzer.js`, `pack-extension.js` → `tools/`.
4. Déplacer `THEMES.md`, `PUBLISH.md` (sans secrets), `popup/UI-documentation.md`, `.github/COMMIT_CONVENTIONS.md` → `docs/`.
5. Mettre à jour :
   - `manifest.json` (chemins relatifs à `src/`),
   - `popup.html` (vendor),
   - `tools/pack-extension.js` (`--source-dir=src`),
   - workflow CI (chemin source).
6. Remplacer `.web-extignore` par un build whitelist via `web-ext --source-dir=src`.

**Critère de sortie :** `npm run build && npm run run` (Firefox) fonctionne.

---

### 🔵 Phase 4 — Modularisation (3 PRs séparées)

Chaque PR est indépendante. **Pas de refactor fonctionnel** — uniquement de l'extraction de modules avec exports/imports (`<script type="module">`).

#### 4.a — Splitter `popup-consolidated.js` (1 114 → ~5 fichiers)

Cible : `src/popup/{index,state,messaging,notifications,detached-window}.js`.

#### 4.b — Splitter `content/alphaMatchers.js` (2 796 → ~10 fichiers)

Cible :
- `src/content/index.js` — bootstrap, messaging
- `src/content/pages/{controle-fiche,ecran-accueil}.js`
- `src/content/steps/{steps,steps-accueil}.js`
- `src/content/validation/{fingerprints,natinf,alpha-fields}.js`
- `src/content/dom/{wait,selectors,format-detect}.js`
- `src/content/ui/{error-modal,highlight}.js`

#### 4.c — Isoler l'arcade

Déplacer les 4 jeux + easter-egg-init + space-invaders.css dans `src/popup/arcade/`. Lazy-load (import dynamique au déclenchement de l'easter-egg).

**Critère de sortie :** popup démarre en chargeant uniquement le strict minimum.

---

### 🟣 Phase 5 — Qualité (1 PR, ~3h)

- Consolider les CSS : `styles.css` + `styles-additional.css` + `themes-fixes.css` → `base.css` + `components.css`. Régénérer les variables CSS.
- Ajouter des tests unitaires sur la logique pure (validation NATINF, extraction de champs) avec **Vitest**.
- Ajouter un test E2E **Playwright** sur le golden path : ouvrir popup → cliquer "Lancer" → vérifier message.
- Activer ESLint + tests dans la CI.

---

### 🟤 Phase 6 — Documentation continue

- Rédiger 3 ADR (cf. structure cible).
- Activer `release-please` ou `changesets` pour générer le `CHANGELOG.md` automatiquement.
- Ajouter un badge CI dans le `README.md`.

---

## Estimation

| Phase | Effort | Risque |
|---|---|---|
| 0 — Sécurité | 1h | Élevé si non fait |
| 1 — Hygiène | 1h | Faible |
| 2 — Outillage | 2h | Faible |
| 3 — Restructuration | 2h | Moyen (chemins) |
| 4 — Modularisation | 1-2 jours | Moyen |
| 5 — Qualité | 3-4h | Faible |
| 6 — Docs | 2h | Faible |

**Total :** ~3 jours-homme étalés en ~9 PRs.

---

## Règles d'or pour les PRs

1. **Une PR = un sujet.** Pas de phase 1 + phase 2 dans la même PR.
2. **Aucun refactor fonctionnel pendant la restructuration.** Renommer/déplacer d'abord, refactor après.
3. **Tester en local avec `web-ext run`** avant chaque push.
4. **Vérifier que le `.xpi` ne contient pas** `tools/`, `docs/`, `node_modules/`, `.git/`.
5. **Mettre à jour le `CHANGELOG.md`** à chaque PR.
