# Plan de réorganisation — T41 Assistant Pro

Ce plan opérationnalise l'[audit](AUDIT.md) en respectant strictement les [conventions](../CONVENTIONS.md) du projet (tout en français, KISS).

Il suit le principe **KISS** : on déplace, on supprime, on isole — on ne refactor pas tant qu'on n'a pas un socle propre.

L'exécution est volontairement **séquentielle par phase** pour permettre des PRs courtes et reviewables.

---

## Cible : structure finale

> Tous les noms de fichiers et dossiers sont en **kebab-case français** conformément à `CONVENTIONS.md §2`.
> Exceptions tolérées : termes techniques universels (`dom`, `ui`, `data`, `vendor`, `icons`, `e2e`) et acronymes métier (`adr`, `ci`).

```
T41-Assistant-Pro/
├── CLAUDE.md
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
├── .claude/                       # Versionné — config Claude Code
│   ├── README.md
│   └── settings.json
│
├── src/                           # Tout ce qui est packagé dans l'extension
│   ├── manifest.json
│   ├── background/
│   │   └── arriere-plan.js
│   ├── content/
│   │   ├── index.js               # Point d'entrée (IIFE, messagerie)
│   │   ├── pages/                 # Détection de la page courante
│   │   │   ├── controle-fiche.js
│   │   │   └── ecran-accueil.js
│   │   ├── etapes/                # Séquences d'automatisation
│   │   │   ├── etapes-controle-fiche.js
│   │   │   └── etapes-accueil.js
│   │   ├── validations/           # Règles métier
│   │   │   ├── champs-alpha.js
│   │   │   ├── codes-natinf.js
│   │   │   └── empreintes.js
│   │   ├── dom/                   # Helpers bas niveau
│   │   │   ├── attente.js         # waitForElement → attendreElement
│   │   │   ├── selecteurs.js
│   │   │   └── detection-format.js
│   │   └── ui/                    # Restitution à l'opérateur
│   │       ├── modale-erreur.js
│   │       └── surlignage.js
│   ├── popup/
│   │   ├── popup.html
│   │   ├── index.js               # Point d'entrée
│   │   ├── etat.js                # État de la boucle, progression
│   │   ├── messagerie.js          # Pont avec background/content
│   │   ├── notifications.js
│   │   ├── fenetre-detachee.js
│   │   ├── icone.js               # Mise à jour de l'icône action
│   │   ├── themes/                # JS thèmes
│   │   │   ├── themes.js
│   │   │   └── animations.js
│   │   ├── styles/
│   │   │   ├── base.css           # reset, variables, layout
│   │   │   ├── composants.css     # boutons, cartes, modales, todo
│   │   │   ├── notifications.css
│   │   │   └── themes/
│   │   │       ├── clair.css
│   │   │       ├── sombre.css
│   │   │       └── festifs/
│   │   │           ├── noel.css
│   │   │           ├── paques.css
│   │   │           ├── halloween.css
│   │   │           └── sainte-genevieve.css
│   │   └── arcade/                # Easter-egg — chargé à la demande
│   │       ├── index.js           # Registre + ouvreur
│   │       ├── menu.js
│   │       ├── space-defender.js  # ex space-invaders
│   │       ├── serpent.js         # ex snake
│   │       ├── oiseau-volant.js   # ex floppy-bird
│   │       ├── asteroides.js
│   │       └── arcade.css
│   ├── data/
│   │   └── natinf-survey.json
│   ├── icons/
│   └── vendor/                    # font-awesome, twemoji, polyfill
│
├── tools/                         # Scripts dev — JAMAIS packagés
│   ├── empaqueter-extension.js    # ex pack-extension.js
│   ├── incrementer-version.js     # ex bump-version.js
│   └── analyseur.js               # ex analyzer.js
│
├── docs/
│   ├── CONVENTIONS.md             # règles de code (la référence)
│   ├── ARCHITECTURE.md            # architecture courante (post-rénovation)
│   ├── PUBLICATION.md             # ex PUBLISH.md, sans secrets
│   ├── THEMES.md
│   ├── UI.md
│   ├── adr/
│   │   ├── 0001-manifest-v3.md
│   │   ├── 0002-fenetre-popup-detachee.md
│   │   ├── 0003-isoler-arcade.md
│   │   └── 0004-esbuild-pour-content.md
│   └── renovation/                # chantier de rénovation (temporaire)
│       ├── README.md
│       ├── AUDIT.md
│       ├── PLAN.md
│       ├── ETUDE-CONTRADICTOIRE.md
│       └── issues/
│           ├── 01-securite-et-hygiene.md
│           ├── 02-nettoyer-code-mort.md
│           ├── 03-outillage.md
│           ├── 04-restructurer-dossiers.md
│           ├── 05-modulariser-alphamatchers.md
│           ├── 06-modulariser-popup.md
│           ├── 07-isoler-arcade.md
│           ├── 08-consolidation-css.md
│           ├── 09-tests-et-ci.md
│           └── 10-appliquer-conventions.md
│
├── tests/                         # À créer en phase 5
│   ├── unitaires/
│   └── e2e/
│
└── .github/
    ├── PULL_REQUEST_TEMPLATE.md
    ├── ISSUE_TEMPLATE/
    │   ├── bug.md
    │   └── fonctionnalite.md
    └── workflows/
        ├── ci.yml
        └── publication.yml        # ex release-extension.yml
```

**Bénéfices :**
- `src/` = ce qui part dans le `.xpi`. Whitelist au lieu de blacklist `.web-extignore`.
- `tools/` = dev only, impossible d'être packagé par erreur.
- `docs/` = documentation centralisée.
- Modules courts conformes à `CONVENTIONS.md §4.4` (< 500 lignes, cible 200).
- Noms 100% français (cf. `CONVENTIONS.md §1` et `§2`).

---

## Phases

### 🔴 Phase 0 — Sécurité (urgence)

**Objectif :** stopper l'exposition des secrets. **Avant tout commit de restructure.**

1. **Révoquer** la clé Mozilla actuelle sur https://addons.mozilla.org/developers/addon/api/key/.
2. Régénérer un couple `WEB_EXT_API_KEY` / `WEB_EXT_API_SECRET`.
3. Stocker la nouvelle paire dans :
   - un **gestionnaire de mots de passe** personnel,
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
- Mettre à jour `README.md` (structure réelle, lien vers `../CONVENTIONS.md`).
- Créer `CHANGELOG.md` (depuis git log) et `CONTRIBUTING.md`.

**Critère de sortie :** `git status` propre, repo allégé de ~1,5 Mo (artefacts + backups).

---

### 🟡 Phase 2 — Outillage (1 PR, ~2h)

- Créer `package.json` :
  - dépendances dev : `web-ext`, `eslint`, `prettier`, `eslint-config-prettier`, `eslint-plugin-no-unsanitized`.
  - scripts : `lint`, `format`, `build`, `sign`, `run`, `bump`
    *(noms conservés en anglais — convention npm universelle, cf. `CONVENTIONS.md §1.1` exceptions techniques)*.
- Ajouter `.eslintrc.json` (preset `eslint:recommended` + globales `webextensions`).
- Ajouter `.prettierrc` selon `CONVENTIONS.md §3.1`.
- Lancer une passe `prettier --write` (commit séparé `style: passe prettier initiale` pour le diff cosmétique).

**Critère de sortie :** `npm run lint` passe, `npm run build` produit le `.xpi`.

---

### 🟢 Phase 3 — Restructuration des dossiers (1 PR, ~2h)

> ⚠️ Cette PR contient uniquement **des `git mv`** + ajustements de chemins. Aucune logique modifiée, aucune francisation de contenu (faite en phase 4 module par module).

1. Créer `src/` et déplacer : `manifest.json`, `background/`, `content/`, `popup/`, `icons/`, `data/`.
2. Déplacer `popup/vendor/` → `src/vendor/`.
3. Déplacer et renommer en français les scripts dev :
   - `analyzer.js` → `tools/analyseur.js`
   - `pack-extension.js` → `tools/empaqueter-extension.js`
   - `scripts/bump-version.js` → `tools/incrementer-version.js`
4. Déplacer la documentation dans `docs/` :
   - `THEMES.md` → `docs/THEMES.md`
   - `PUBLISH.md` (épuré) → `docs/PUBLICATION.md`
   - `popup/UI-documentation.md` → `docs/UI.md`
   - `.github/COMMIT_CONVENTIONS.md` → fusionner dans `../CONVENTIONS.md` puis supprimer
5. Mettre à jour :
   - `manifest.json` (chemins relatifs à `src/`),
   - `popup.html` (vendor),
   - les scripts dans `tools/` (chemins),
   - workflow CI (chemin source),
   - `package.json` (`--source-dir=src`).
6. Remplacer `.web-extignore` par un build whitelist via `web-ext --source-dir=src`.

**Critère de sortie :** `npm run build && npm run run` (Firefox) fonctionne, l'extension marche sur une page FAED de test.

---

### 🔵 Phase 4 — Modularisation (3 PRs séparées)

Chaque PR est indépendante. **Pas de refactor fonctionnel** — uniquement de l'extraction de modules avec exports/imports.
La **francisation des identifiants** se fait dans la même PR que l'extraction du module (un module = un commit français), cf. `CONVENTIONS.md §1.1`.

#### 4.a — Splitter `popup-consolidated.js` (1 114 → ~6 fichiers)

Cible :
- `src/popup/index.js` — bootstrap, câblage
- `src/popup/etat.js` — `popupLoopStateActive` → `boucleActive`, `demoProgress` → `progressionDemo`, etc.
- `src/popup/messagerie.js`
- `src/popup/notifications.js`
- `src/popup/fenetre-detachee.js` — `isDetachedWindow` → `estFenetreDetachee`
- `src/popup/icone.js`

#### 4.b — Splitter `content/alphaMatchers.js` (2 796 → ~10 fichiers)

Renommer le module global : `alphaMatchers` → `verifications-alpha` (ou intégrer directement dans `src/content/`).

Cible (chemins selon la structure finale ci-dessus). Renommages d'identifiants à appliquer :
- `isControleDeFichePage` → `estPageControleFiche`
- `isEcranAccueilPage` → `estPageEcranAccueil`
- `validateFingerprintsTab` → `validerOngletEmpreintes`
- `waitForElement` → `attendreElement`
- `waitForLoadingToComplete` → `attendreFinChargement`
- `detectDOMFormat` → `detecterFormatDom`
- `getSelector` → `obtenirSelecteur`
- `extractNatinfFieldValues` → `extraireValeursChampsNatinf`
- `showErrorWindow` → `afficherModaleErreurs`
- `highlightErrorFields` → `surlignerChampsEnErreur`
- `MAX_RETRY_ATTEMPTS` → `NB_TENTATIVES_MAX`
- `MIN_SEQUENCE_DURATION` → `DUREE_MIN_SEQUENCE_MS`

> Les content scripts MV3 ne supportent pas nativement les modules ES → utiliser **esbuild** (cf. ADR `0004`).

#### 4.c — Isoler l'arcade

Déplacer les 4 jeux + `easter-egg-init.js` + `space-invaders.css` dans `src/popup/arcade/`. Renommer en français (cf. cible). **Chargement paresseux** via `import()` dynamique au déclenchement de l'easter-egg.

**Critère de sortie :** popup démarre en chargeant uniquement le strict minimum, vocabulaire 100% français dans `src/`.

---

### 🟣 Phase 5 — Qualité (1 PR, ~3h)

- Consolider les CSS : `styles.css` + `styles-additional.css` + `themes-fixes.css` → `base.css` + `composants.css`. Centraliser les variables CSS dans `:root`.
- Ajouter des tests unitaires sur la logique pure (validation NATINF, extraction de champs) avec **Vitest**.
- Ajouter un test E2E **Playwright** sur le chemin doré : ouvrir popup → cliquer "Lancer" → vérifier le changement de message.
- Activer ESLint + tests dans la CI.

---

### 🟤 Phase 6 — Documentation continue

- Rédiger les ADR référencés (cf. structure cible).
- Activer `release-please` ou `changesets` pour générer le `CHANGELOG.md` automatiquement (config FR).
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

**Total :** ~3 jours-homme étalés en ~10 PRs.

---

## Règles d'or pour les PRs

> Détail complet dans `CONVENTIONS.md §6`.

1. **Une PR = un sujet.** Pas de phase 1 + phase 2 dans la même PR.
2. **Aucun refactor fonctionnel pendant la restructuration.** Renommer/déplacer d'abord, refactor après.
3. **Commit, branche, titre de PR, description en français** — toujours.
4. **Tester en local avec `npm run run`** avant chaque push.
5. **Vérifier que le `.xpi` ne contient pas** `tools/`, `docs/`, `node_modules/`, `.git/`, `.claude/`.
6. **Mettre à jour le `CHANGELOG.md`** à chaque PR.

### Exemples de commits attendus pour ce chantier

```
chore: ajouter .gitignore et editorconfig
chore: créer package.json avec eslint, prettier et web-ext
style: passe prettier initiale
refactor: déplacer le code livré dans src/
refactor: extraire la validation NATINF dans validations/codes-natinf
refactor: franciser les identifiants de la modale d'erreur
feat: charger l'arcade en lazy-load
test: couvrir l'extraction des codes NATINF
ci: ajouter le workflow de lint et tests sur PR
```
