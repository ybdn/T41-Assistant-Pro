# 📐 Appliquer la convention de code (FR, KISS, scalable)

**Labels :** `docs`, `outillage`, `dette-technique`
**Priorité :** P1

## Contexte

`docs/CONVENTIONS.md` formalise les règles du projet :
- code **intégralement en français** (variables, commentaires, commits, PR, issues),
- format imposé par Prettier + ESLint,
- limites de taille (fichier < 500 l, fonction < 50 l, etc.),
- conventions de commits françaises basées sur Conventional Commits,
- gabarit de PR,
- règles de sécurité (pas de secrets, pas de `innerHTML` non assaini).

L'existant ne respecte pas tout (vocabulaire mixte FR/EN dans `alphaMatchers.js` et `popup-consolidated.js`, fichiers `-additional` / `-fixes` / `.bak`, etc.). Cette issue trace la **mise en conformité progressive**.

## Actions

### Application des outils (dépend de l'issue #3)
- [ ] Ajouter `eslint-plugin-no-unsanitized`
- [ ] Configurer ESLint avec les règles listées dans `CONVENTIONS.md §3.2`
- [ ] Configurer Prettier avec les valeurs de `§3.1`
- [ ] Lancer une passe `npm run format` (commit séparé `style: passe prettier initiale`)

### Gabarits GitHub
- [ ] Créer `.github/PULL_REQUEST_TEMPLATE.md` reprenant le gabarit de `CONVENTIONS.md §6.3`
- [ ] Créer `.github/ISSUE_TEMPLATE/bug.md` et `feature.md` en français
- [ ] Renommer les labels GitHub en français (`securite`, `dette-technique`, `refactor`, `outillage`, `docs`, `tests`, `bonne-premiere-issue`)

### Hook pre-commit
- [ ] Installer `simple-git-hooks` + `lint-staged`
- [ ] Bloquer le commit si lint échoue
- [ ] Optionnel : valider le format du message de commit avec `commitlint` (config française dérivée de `@commitlint/config-conventional`)

### Francisation du code existant
> Faire **module par module**, après le découpage des issues #5 et #6 pour limiter les diffs.
- [ ] `background/` (~200 l) — court, à franciser en une PR
- [ ] Chaque module extrait de `content/alphaMatchers.js` — francisation à la volée lors de l'extraction
- [ ] Chaque module extrait de `popup/` — idem

⚠️ **Ne pas franciser et refactorer dans la même PR.** Une PR de francisation = uniquement des renommages.

### Documentation
- [ ] Mettre à jour `README.md` avec un lien vers `docs/CONVENTIONS.md` et un avertissement "code 100% français"
- [ ] Mettre à jour `.github/COMMIT_CONVENTIONS.md` → soit le supprimer (remplacé), soit le faire pointer sur `docs/CONVENTIONS.md §6.2`

## Critère d'acceptation

- `docs/CONVENTIONS.md` référencé depuis `README.md`
- Gabarits PR / Issue présents
- ESLint + Prettier configurés et passants
- Hook pre-commit actif
- Un module pilote (au choix : `background/`) entièrement francisé comme exemple
