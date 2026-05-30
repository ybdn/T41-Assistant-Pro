# 🧩 Modulariser `content/alphaMatchers.js` (2 796 lignes)

**Labels :** `refactor`
**Priorité :** P2

## Contexte

Le fichier `src/content/alphaMatchers.js` (2 796 lignes) est le cœur métier de l'extension. Il mélange **8 responsabilités** dans un seul IIFE :

1. Détection de page (`isControleDeFichePage`, `isEcranAccueilPage`)
2. Détection du format DOM (`detectDOMFormat`)
3. Définition des séquences (`steps`, `stepsEcranAccueil`)
4. Extraction de champs alpha
5. Règles de validation (alpha + NATINF + empreintes)
6. Highlight des erreurs (`highlightErrorFields`, `highlightField`)
7. Modale d'erreur (`showErrorWindow`)
8. Helpers DOM (`waitForElement*`, `executeMultipleActionsInternal`)
9. Bus de messages browser

L'absence de découpage rend le code **non-testable** et complique la revue.

## Découpage cible

```
src/content/
├── index.js                       # ~80 l — IIFE, bootstrap, browser.runtime.onMessage
├── pages/
│   ├── controle-fiche.js          # détection + sélecteurs spécifiques
│   └── ecran-accueil.js
├── steps/
│   ├── controle-fiche-steps.js    # séquences (anciennement `steps`)
│   └── accueil-steps.js           # (anciennement `stepsEcranAccueil`)
├── validation/
│   ├── alpha-fields.js
│   ├── natinf.js                  # logique NATINF + load JSON
│   └── fingerprints.js            # validateFingerprintsTab
├── dom/
│   ├── wait.js                    # waitForElement, waitForLoading
│   ├── selectors.js               # getSelector, getNatinfSelectors
│   └── format-detect.js           # detectDOMFormat
└── ui/
    ├── error-modal.js             # showErrorWindow
    └── highlight.js               # highlightErrorFields, highlightField
```

## Méthode (KISS)

1. **Étape 1 : convertir en module ES.** Ajouter `"type": "module"` dans le manifeste **ne fonctionne pas** pour les content scripts MV3 → utiliser un bundler **léger** : `esbuild`.
   - Ajouter `esbuild` aux devDeps
   - Script de build : `esbuild src/content/index.js --bundle --outfile=build/content/bundle.js`
   - Le manifeste pointe sur le bundle
2. **Étape 2 : extraire un module à la fois**, chaque extraction = 1 commit.
3. **Aucun changement de comportement** dans cette PR.

## Actions

- [ ] ADR `docs/adr/0004-esbuild-for-content.md` justifiant le bundler
- [ ] Mise en place `esbuild` + script `npm run build:content`
- [ ] Extraction module par module (commits séparés, dans l'ordre du tableau ci-dessus)
- [ ] Tester chaque commit sur une page FAED de test
- [ ] Mettre à jour `.gitignore` (`build/`)

## Critère d'acceptation

- Aucun fichier `src/content/**/*.js` ne dépasse 500 lignes
- Le golden path (lancer séquence → validation) fonctionne à l'identique
- ESLint passe sans erreur
