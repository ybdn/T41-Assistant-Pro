# 🛠️ Mettre en place l'outillage (package.json, ESLint, Prettier)

**Labels :** `tooling`, `tech-debt`
**Priorité :** P1

## Contexte

Le projet n'a **ni `package.json`, ni lockfile, ni linter, ni formatter**. Les commandes `web-ext` utilisent `npx` sans version épinglée, ce qui rend les builds non reproductibles.

## Actions

### `package.json`
- [ ] Créer un `package.json` avec :
  - `"private": true`
  - `engines.node` >= 18
  - dépendances dev : `web-ext`, `eslint`, `prettier`, `eslint-config-prettier`, `eslint-plugin-no-unsanitized`
  - scripts :
    ```json
    {
      "lint": "eslint . --ext .js",
      "format": "prettier --write \"**/*.{js,css,html,json,md}\"",
      "build": "web-ext build --source-dir=src --artifacts-dir=web-ext-artifacts",
      "run": "web-ext run --source-dir=src",
      "sign": "web-ext sign --source-dir=src --channel=unlisted",
      "bump": "node tools/bump-version.js"
    }
    ```

### ESLint
- [ ] Créer `.eslintrc.json` avec preset `eslint:recommended`, env `browser` + `webextensions`, plugin `no-unsanitized`
- [ ] Configurer les globales (`browser`, `chrome`)

### Prettier
- [ ] Créer `.prettierrc` (semi: true, singleQuote: false, trailingComma: "es5", printWidth: 100)
- [ ] Créer `.prettierignore` (vendor/, web-ext-artifacts/)

### Editor config
- [ ] Créer `.editorconfig` (utf-8, LF, 2 spaces)

### Première passe
- [ ] Commit séparé : `chore: prettier format pass` (diff cosmétique uniquement)
- [ ] Corriger les warnings ESLint critiques (`no-unused-vars`, `no-undef`)

## Critère d'acceptation

- `npm install` installe sans erreur
- `npm run lint` retourne 0
- `npm run build` génère un `.xpi` valide
- `npm run run` ouvre Firefox avec l'extension chargée
