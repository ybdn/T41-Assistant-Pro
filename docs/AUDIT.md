# Audit architecture & organisation — T41 Assistant Pro

> Audit réalisé sur la branche `claude/dreamy-ptolemy-WUdfC` — version `manifest.json` : **2.5.2**.
> Objectif : identifier les écarts par rapport aux principes **KISS**, clarté, scalabilité, et préparer un plan de rénovation.

---

## 1. Synthèse exécutive

Le projet est une extension Firefox Manifest V3 (~8 800 lignes JS). Le cœur métier (`content/alphaMatchers.js`) est solide mais souffre :

- d'un **dossier `popup/` devenu fourre-tout** (30 fichiers : prod, debug, diagnostic, backups, jeux, thèmes, vendor mélangés) ;
- de **fichiers dupliqués / morts / de sauvegarde** versionnés (`.bak`, `button-diagnostic.js` vide, deux `browser-polyfill*.js`, deux fichiers `.web-ext[-]ignore`) ;
- d'un **fuite de secret** dans `PUBLISH.md` (clé API Mozilla en clair, committé) ;
- d'**artefacts de build commités** (`web-ext-artifacts/*.xpi`, 8 fichiers) et **aucun `.gitignore`** ;
- d'une **absence totale d'outillage** : pas de `package.json`, pas de lockfile, pas de linter/formatter, pas de tests ;
- d'une **documentation éparpillée à la racine** (5 markdowns) sans dossier `docs/` ;
- d'un **easter-egg arcade (~2 230 lignes, 4 jeux)** chargé inconditionnellement dans la popup.

Risque global : **moyen-élevé** (sécurité + dette technique + onboarding difficile). Aucun de ces points n'est bloquant pour le fonctionnement actuel, mais ils empêchent l'évolution sereine du projet.

---

## 2. Inventaire et métriques

### 2.1 Taille des fichiers JS

| Fichier | Lignes | Statut |
|---|---:|---|
| `content/alphaMatchers.js` | 2 796 | Monolithe — cœur métier |
| `popup/popup-consolidated.js` | 1 114 | **Actif** (chargé par `popup.html`) |
| `popup/asteroids-game.js` | 721 | Easter-egg |
| `popup/space-invaders.js` | 650 | Easter-egg |
| `popup/themes.js` | 616 | Thèmes festifs |
| `popup/popup.js` | 518 | **Mort** — non chargé |
| `popup/floppy-bird-game.js` | 447 | Easter-egg |
| `popup/snake-game.js` | 413 | Easter-egg |
| `popup/diagnostic.js` | 339 | Outil dev |
| `popup/themes-animations.js` | 313 | Thèmes |
| `background/backgroundScript.js` | 205 | OK |
| `analyzer.js` (racine) | 179 | Script de dev — racine |
| `popup/popup-interactive.js` | 136 | **Mort** — non chargé |
| `popup/easter-egg-init.js` | 131 | Easter-egg |
| `popup/debug.js` | 95 | Outil dev |
| `pack-extension.js` (racine) | 74 | Script de build — racine |
| `popup/browser-polyfill-fixed.js` | 57 | Polyfill |
| `popup/ripple-fix.js` | 41 | Patch UI |
| `popup/browser-polyfill.js` | 4 | **Mort** — stub |
| `popup/button-diagnostic.js` | **0** | **Mort** — fichier vide |

**Total :** ~8 850 lignes JS. **Code mort identifié :** ~660 lignes (popup.js, popup-interactive.js, polyfills, button-diagnostic) + 2 fichiers `.bak`.

### 2.2 Feuilles CSS

5 fichiers CSS dans `popup/` : `styles.css`, `styles-additional.css`, `themes-festive.css`, `themes-animations.css`, `themes-fixes.css`. La présence de `-additional` et `-fixes` est le signe classique de patchs successifs sans refactor.

### 2.3 Documentation

- Racine : `README.md`, `SECURITY.md`, `THEMES.md`, `PUBLISH.md`
- `.github/COMMIT_CONVENTIONS.md`
- `popup/UI-documentation.md`

Aucun dossier `docs/`. Le `README.md` décrit une structure projet **obsolète** (mentionne un `controleDeLaFiche.html` qui n'existe plus, ne mentionne ni les thèmes, ni les jeux, ni les outils diag).

---

## 3. Constats détaillés

### 3.1 Sécurité

| Sévérité | Constat |
|---|---|
| 🔴 **Critique** | `PUBLISH.md` committé contient `WEB_EXT_API_KEY` **et** `WEB_EXT_API_SECRET` en clair. À révoquer immédiatement chez Mozilla et purger de l'historique git. |
| 🟠 Élevée | `.amo-upload-uuid` (UUID d'upload AMO + hash) committé — devrait être local. |
| 🟠 Élevée | Aucun `.gitignore` — risque d'inclure accidentellement des secrets, `node_modules/`, `.env`, etc. |
| 🟡 Moyenne | Artefacts `.xpi` signés (8 versions) committés dans `web-ext-artifacts/` — pollue l'historique, alourdit le repo. |

### 3.2 Organisation des dossiers

| Constat | Impact |
|---|---|
| `popup/` mélange : code prod, code mort (`popup.js`, `popup-interactive.js`), debug (`debug.html`, `diagnostic.html`), backups (`.bak`), jeux (4 fichiers), thèmes (4 fichiers), vendor, patches (`ripple-fix.js`, `themes-fixes.css`). | Onboarding très difficile, recherche pénible, risque d'éditer le mauvais fichier. |
| Scripts de build à la racine (`analyzer.js`, `pack-extension.js`) **et** dans `scripts/` (`bump-version.js`). | Convention incohérente. |
| `data/` n'a qu'un fichier (`natinf-survey.json`) — OK mais isolé. | Cohérent si on prévoit d'en ajouter. |
| Pas de séparation `src/` (livré) vs `tools/` (dev) vs `docs/`. | Le packaging via `.web-extignore` est fragile : il faut maintenir une blacklist alors qu'une whitelist serait plus sûre. |

### 3.3 Doublons et fichiers morts

| Fichier | Taille | Action recommandée |
|---|---:|---|
| `popup/popup.js` | 518 l | **Supprimer** (non chargé par `popup.html`) |
| `popup/popup-interactive.js` | 136 l | **Supprimer** (non chargé) |
| `popup/popup-consolidated.js.bak` | 24 ko | **Supprimer** (sauvegarde — git fait ça) |
| `popup/popup.html.bak` | 13 ko | **Supprimer** |
| `popup/button-diagnostic.js` | 0 l | **Supprimer** (vide) |
| `popup/browser-polyfill.js` | 4 l | **Supprimer** (remplacé par `-fixed`) |
| `.web-ext-ignore` | — | **Supprimer** (web-ext lit `.web-extignore` — typo/doublon) |
| `web-ext-artifacts/*.xpi` | 8 files | **Supprimer du repo**, ajouter à `.gitignore` |

### 3.4 Architecture

#### 3.4.1 Monolithe `alphaMatchers.js` (2 796 l)

Le fichier mélange :
- détection de page (`isControleDeFichePage`, `isEcranAccueilPage`),
- détection de format DOM,
- définition des **séquences d'étapes** (`steps`, `stepsEcranAccueil`),
- extraction de champs,
- règles de validation,
- highlighting / modale d'erreur,
- helpers DOM bas-niveau (`waitForElement*`),
- bus de messages browser,
- logique NATINF.

C'est testable en théorie, mais aucune séparation = aucun test possible aujourd'hui.

#### 3.4.2 Couplage popup ↔ logique

`popup-consolidated.js` (1 114 l) regroupe : UI, état de boucle, notifications, vérif détachement fenêtre, communication browser. Pourrait être scindé en `ui/`, `state/`, `messaging/`.

#### 3.4.3 Easter-egg arcade

4 jeux (~2 230 l + 1 CSS de 6 ko) sont chargés **inconditionnellement** dans la popup d'une extension métier gendarmerie. À isoler dans un module `arcade/` chargé à la demande, ou à retirer du build de release.

### 3.5 Outillage manquant

- ❌ Pas de `package.json` → versions de `web-ext` non figées (`npx` télécharge à chaque fois).
- ❌ Pas de linter (ESLint) → erreurs de style et bugs latents non détectés.
- ❌ Pas de formatter (Prettier) → indentation/quotes non homogènes.
- ❌ Pas de test (unit ou e2e Playwright/Puppeteer).
- ❌ Pas de hook pre-commit (Husky / simple-git-hooks).
- ❌ Pas de `CHANGELOG.md`.
- ✅ Présence d'un workflow CI `release-extension.yml` (à auditer séparément).

### 3.6 Manifest & permissions

`manifest.json` est propre. Le content_script est restreint aux domaines FAED — bon. Pas de `web_accessible_resources` superflus.

### 3.7 Documentation

| Constat |
|---|
| `README.md` désynchronisé (mentionne un fichier inexistant, omet 90% des modules). |
| Pas de `CONTRIBUTING.md`, pas de `CHANGELOG.md`. |
| `PUBLISH.md` contient des secrets ET de la documentation utile (à scinder). |
| `THEMES.md` (12 ko) et `popup/UI-documentation.md` sont de qualité mais perdus parmi le reste. |
| Pas d'**ADR** (Architecture Decision Records) pour expliquer les choix (pourquoi MV3, pourquoi fenêtre détachée, etc.). |

---

## 4. Score KISS par zone

| Zone | Score /5 | Commentaire |
|---|:---:|---|
| `manifest.json` | 5 | Minimal, propre. |
| `background/` | 4 | Un seul fichier, lisible. |
| `content/` | 2 | Cœur métier solide mais monolithique. |
| `popup/` | 1 | Fourre-tout. |
| `icons/` | 5 | OK. |
| `data/` | 5 | OK. |
| Build / outillage | 1 | Pas de `package.json`, scripts éparpillés. |
| Documentation | 2 | Présente mais dispersée et obsolète. |
| Sécurité repo | 1 | Secrets committés, pas de `.gitignore`. |

**Moyenne :** 2,9 / 5.

---

## 5. Priorités

| P0 — immédiat (sécurité) | P1 — court terme (hygiène) | P2 — moyen terme (architecture) | P3 — long terme (qualité) |
|---|---|---|---|
| Révoquer la clé Mozilla, purger l'historique | Ajouter `.gitignore`, supprimer fichiers morts/backups | Modulariser `alphaMatchers.js` & `popup-consolidated.js` | Tests E2E Playwright |
| Sortir `.amo-upload-uuid` et `web-ext-artifacts/` | Créer `package.json` + ESLint + Prettier | Isoler l'easter-egg arcade | ADR + CHANGELOG automatisé |
| Scinder `PUBLISH.md` (retirer secrets) | Restructurer dossiers (`src/`, `tools/`, `docs/`) | Refondre les CSS (`-fixes`, `-additional`) | i18n via `_locales/` |

Voir `docs/REORGANIZATION_PLAN.md` pour le plan d'exécution et `docs/issues/` pour les tickets GitHub prêts à coller.
