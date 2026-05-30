# ✅ Mettre en place tests + CI complète

**Labels :** `tooling`, `tests`
**Priorité :** P3

## Contexte

Le projet n'a **aucun test** automatisé. Les refactors (issues #5, #6, #7) deviennent risqués sans filet de sécurité.

Le workflow existant (`.github/workflows/release-extension.yml`) ne fait que de la release ; il n'y a pas de pipeline de validation sur PR.

## Cible

```
tests/
├── unit/
│   ├── natinf.test.js          # validation pure
│   ├── alpha-fields.test.js
│   └── fingerprints.test.js
└── e2e/
    ├── popup.spec.js           # golden path
    └── faed-fixture.html       # page FAED minimale pour test
```

## Stack proposée (KISS)

- **Unit** : [Vitest](https://vitest.dev/) — rapide, zero-config, compatible ESM
- **E2E** : [Playwright](https://playwright.dev/) avec le mode extension (`launchPersistentContext` + `--load-extension`)
- Pas besoin de Jest, ts-jest, ou autre.

## Actions

### Tests unitaires
- [ ] Ajouter `vitest` aux devDeps
- [ ] Script `npm test` → `vitest run`
- [ ] Couvrir au minimum :
  - parsing/validation NATINF
  - extraction des champs alpha
  - détection de format DOM (avec fixtures HTML)

### Tests E2E
- [ ] Ajouter `@playwright/test`
- [ ] Script `npm run test:e2e`
- [ ] Test golden path : popup s'ouvre, bouton "Lancer" clique, état change
- [ ] Test sur fixture FAED locale (HTML statique servi par Playwright)

### CI
- [ ] Créer `.github/workflows/ci.yml` :
  - Triggers : `pull_request` et `push` sur `main`
  - Jobs :
    1. `lint` (`npm run lint`)
    2. `test` (`npm test`)
    3. `e2e` (`npm run test:e2e`)
    4. `build` (`npm run build`)
- [ ] Ajouter badge dans `README.md`

### Hook pre-commit (optionnel)
- [ ] `simple-git-hooks` ou `husky` + `lint-staged` pour exécuter lint+test sur les fichiers modifiés avant commit

## Critère d'acceptation

- Couverture > 50% sur `src/content/validation/`
- CI verte sur la PR
- Une régression introduite volontairement fait échouer la CI
