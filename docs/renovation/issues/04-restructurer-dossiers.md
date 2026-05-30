# 📂 Restructurer en `src/` / `tools/` / `docs/`

**Labels :** `refactor`, `tech-debt`
**Priorité :** P1

## Contexte

Aujourd'hui la racine du repo mélange :
- code livré (`background/`, `content/`, `popup/`, `icons/`, `data/`, `manifest.json`)
- scripts dev (`analyzer.js`, `pack-extension.js`, `scripts/`)
- documentation éparpillée (`README.md`, `THEMES.md`, `PUBLISH.md`, `SECURITY.md`, `popup/UI-documentation.md`, `.github/COMMIT_CONVENTIONS.md`)
- artefacts (`web-ext-artifacts/`)

Le packaging fonctionne par **blacklist** (`.web-extignore`), fragile. Une **whitelist** via `src/` est plus sûre.

⚠️ Cette PR contient **uniquement des déplacements et ajustements de chemins**. Aucune logique modifiée.

## Cible

```
src/
  manifest.json
  background/
  content/
  popup/
  icons/
  data/
  vendor/          ← anciennement popup/vendor
tools/
  pack-extension.js
  bump-version.js
  analyzer.js
docs/
  PUBLISH.md       ← sans secrets
  THEMES.md
  UI.md            ← anciennement popup/UI-documentation.md
  COMMIT_CONVENTIONS.md
  SECURITY.md
```

## Actions

- [ ] `git mv` les dossiers livrés dans `src/`
- [ ] `git mv` les scripts dev dans `tools/`
- [ ] `git mv` la doc dans `docs/`
- [ ] Mettre à jour les chemins dans :
  - `src/popup/popup.html` (vendor)
  - `src/manifest.json` (rien à changer si les chemins sont relatifs au manifeste — vérifier)
  - `tools/pack-extension.js` (lire le manifeste dans `src/`, zipper `src/`)
  - `.github/workflows/release-extension.yml` (`--source-dir=src`)
  - `package.json` (scripts `web-ext run/build/sign` avec `--source-dir=src`)
- [ ] Supprimer `.web-extignore` (plus nécessaire avec whitelist via `src/`)
- [ ] Mettre à jour `README.md` (section "Structure du projet")

## Critère d'acceptation

- `npm run build` produit un `.xpi` qui ne contient **que** le contenu de `src/`
- `npm run run` fonctionne
- Tests manuels : ouvrir popup, lancer séquence sur FAED de test, vérifier highlight
