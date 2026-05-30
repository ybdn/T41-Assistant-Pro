# Conventions de code — T41 Assistant Pro

> Document de référence unique. Toute contribution (humaine ou IA) doit s'y conformer.
> Règle d'or : **KISS — Keep It Simple, Stupid.** Si une règle complique sans bénéfice clair, on la retire.

---

## 1. Langue

### 1.1 Code source
- **Tout le code est en français** : noms de variables, fonctions, classes, modules, fichiers.
- **Pas d'anglicismes inutiles** : `utilisateur` plutôt que `user`, `verifier` plutôt que `check`.
- **Exceptions tolérées** (termes techniques sans bon équivalent FR) :
  - `id`, `url`, `dom`, `api`, `json`, `html`, `css`, `regex`
  - vocabulaire WebExtension : `manifest`, `popup`, `background`, `content script`, `listener`, `polyfill`
  - termes métier officiels : `FAED`, `NATINF`, `T41`, `Alpha-numérique`, `Empreintes`

### 1.2 Commentaires & documentation
- Commentaires : **français**, phrases complètes, ponctuation correcte.
- JSDoc : **français** pour la description, anglais toléré pour `@param`/`@returns` (mots-clés techniques).
- Markdown (`docs/`, `README.md`) : **français**.

### 1.3 Git
- **Messages de commit : français**.
- **Titres et descriptions de PR : français**.
- **Issues : français**.
- Labels GitHub : français court (`securite`, `dette-technique`, `refactor`, `outillage`, `docs`, `tests`).

### 1.4 Interface utilisateur
- Tout texte affiché à l'utilisateur en français (déjà le cas).
- Préparer l'i18n via `_locales/fr/messages.json` à terme (cf. plan de réorganisation, phase 6).

---

## 2. Nommage

### 2.1 Variables et fonctions — `camelCase`
```js
// ✅ Bon
let indexEtapeCourante = 0;
const dureeMinimaleSequence = 4000;
function verifierPagePresente() { /* ... */ }
function extraireChampsAlpha(formulaire) { /* ... */ }

// ❌ À éviter
let currentStepIndex = 0;          // anglais
let index_etape_courante = 0;      // snake_case
let IndexEtape = 0;                // PascalCase pour variable
```

### 2.2 Constantes globales — `SCREAMING_SNAKE_CASE`
```js
const DUREE_MIN_SEQUENCE_MS = 4000;
const NB_TENTATIVES_MAX = 3;
const REGEX_CODE_NATINF = /^\s*([A-Z0-9]{1,6})\s*(?:-|$)/i;
```

### 2.3 Classes & constructeurs — `PascalCase`
```js
class GestionnaireEtapes { /* ... */ }
class ValidateurNatinf { /* ... */ }
```

### 2.4 Fichiers
- **JS** : `kebab-case.js` — ex : `validation-natinf.js`, `modale-erreur.js`.
- **CSS** : `kebab-case.css` — ex : `themes-festifs.css`.
- **Pas de `-fixes`, `-additional`, `-consolidated`, `-fixed`** : ces suffixes signalent une dette, pas une organisation.
- **Pas de `.bak`** dans le repo — git fait office de versioning.

### 2.5 Dossiers
- `kebab-case` au pluriel quand ils contiennent une collection : `etapes/`, `pages/`, `validations/`.

### 2.6 Booléens
- Préfixe `est`, `a`, `doit`, `peut` :
```js
const estActif = true;
const aDesErreurs = false;
function doitValider(champ) { /* ... */ }
```

### 2.7 Fonctions
- Verbe à l'infinitif : `extraire…`, `valider…`, `afficher…`, `calculer…`.
- Une fonction = une responsabilité. Si on doit utiliser "et" pour la nommer, elle est trop grosse.

---

## 3. Style de code

### 3.1 Format automatique (Prettier)
- Indentation : **2 espaces**, jamais de tabulations.
- Guillemets : **doubles** (`"`) — cohérent avec l'existant.
- Point-virgule : **toujours**.
- Virgule terminale : `es5`.
- Largeur max : **100 colonnes**.
- Fin de ligne : `LF`.

> **Prettier est l'arbitre.** Aucune discussion sur le format en revue : `npm run format` règle tout.

### 3.2 ESLint
- Preset : `eslint:recommended`
- Environnements : `browser`, `webextensions`, `es2022`
- Règles supplémentaires :
  - `no-unused-vars: error`
  - `no-console: off` (utile en extension)
  - `prefer-const: error`
  - `eqeqeq: ["error", "always"]`
  - `no-var: error`

### 3.3 Variables
- `const` par défaut, `let` si réassignation, **`var` interdit**.
- Une déclaration = une variable (pas de `let a, b, c`).

### 3.4 Fonctions
- Préférer `function` nommée pour les fonctions exportées (meilleure trace en stack).
- Arrow `=>` pour les callbacks et fonctions courtes.
- Pas de fonction > 50 lignes. Si nécessaire, scinder.

### 3.5 Asynchrone
- **`async/await` partout**, pas de chaîne `.then().then()` au-delà de 2 maillons.
- Toujours `try/catch` autour d'un `await` qui peut échouer (appels `browser.*`, `fetch`).
- Pas de `Promise` sans gestion d'erreur.

### 3.6 Imports
- Ordre :
  1. Vendor (`browser-polyfill`)
  2. Modules internes absolus
  3. Modules relatifs (`./`, `../`)
- Une ligne vide entre chaque groupe.

### 3.7 Modules
- ES modules (`import`/`export`) — un default export max par fichier, préférer les nommés.
- **Un module = un sujet**. Si le fichier dépasse 300 lignes, se poser la question de la scission.

---

## 4. Architecture

### 4.1 Principes
- **KISS** : la solution la plus simple qui fonctionne gagne.
- **YAGNI** : pas d'abstraction "au cas où". On code pour le besoin actuel.
- **DRY raisonné** : duplication évidente → factorisation. Trois lignes similaires ≠ besoin d'une abstraction.
- **Boy-scout rule** : on laisse le module un peu plus propre qu'on l'a trouvé.

### 4.2 Séparation des responsabilités
- **`background/`** : état global, messaging, cycle de vie.
- **`content/`** : interaction avec le DOM de FAED.
- **`popup/`** : interface utilisateur uniquement.
- **`data/`** : référentiels JSON statiques.
- **`tools/`** : scripts dev (jamais packagés).
- **`docs/`** : documentation.

### 4.3 Couches dans `content/`
```
pages/        → "où suis-je ?" (détection)
steps/        → "que faire ?" (séquences)
validations/  → "est-ce correct ?" (règles métier)
dom/          → "comment lire/écrire ?" (helpers bas niveau)
ui/           → "comment signaler ?" (modale, highlight)
```
Une couche ne dépend que des couches **en dessous**. Pas de cycle.

### 4.4 Limites de taille
| Élément | Cible | Limite dure |
|---|---:|---:|
| Fonction | 30 lignes | 50 |
| Fichier | 200 lignes | 500 |
| Profondeur d'indentation | 3 | 5 |
| Paramètres d'une fonction | 3 | 5 (au-delà → objet) |
| Complexité cyclomatique | < 10 | 15 |

Une violation = un commentaire en revue (pas un blocage si justifié).

### 4.5 État
- Pas de variable globale mutable sauf dans des modules **explicitement** dédiés à l'état (`state.js`).
- Préférer le passage d'arguments aux variables partagées.
- `browser.storage.local` est l'unique source de vérité pour l'état persistant.

### 4.6 Communication entre scripts
- Un seul protocole : `browser.runtime.sendMessage` / `browser.tabs.sendMessage`.
- Forme du message :
  ```js
  { commande: "verifierAlphaNumerique", donnees: { /* ... */ } }
  ```
- Toujours retourner `{ succes: bool, donnees?, erreur? }`.

---

## 5. Sécurité

### 5.1 Secrets
- **Aucun secret dans le code, jamais.** Ni token, ni clé API, ni mot de passe.
- Secrets en CI → **GitHub Secrets** uniquement.
- Secrets locaux → variables d'environnement, jamais committées.
- `.gitignore` couvre `.env`, `.env.*`, `.amo-upload-uuid`.

### 5.2 Injection
- **Pas de `innerHTML`** avec du contenu dynamique. Utiliser `textContent` ou créer des éléments via `document.createElement`.
- **Pas de `eval`, `Function()`, `setTimeout(string)`**.
- Plugin ESLint : `eslint-plugin-no-unsanitized`.

### 5.3 Permissions
- `manifest.json` : minimum nécessaire. Toute nouvelle permission justifiée dans la PR.
- `host_permissions` restreints aux domaines FAED.

### 5.4 Données utilisateur
- L'extension ne collecte rien (`data_collection_permissions.required: ["none"]`).
- Toute évolution qui changerait ce comportement → ADR obligatoire + communication.

---

## 6. Git & GitHub

### 6.1 Branches
- `main` : protégée, état de production.
- `feature/<slug>` : nouvelle fonctionnalité — ex : `feature/lazy-load-arcade`.
- `fix/<slug>` : correction de bug — ex : `fix/highlight-empreintes`.
- `refactor/<slug>` : refactor sans changement fonctionnel.
- `docs/<slug>` : documentation seule.
- `chore/<slug>` : outillage, dépendances.

### 6.2 Commits — convention française

Format inspiré de Conventional Commits, en français :

```
<type>: <résumé impératif en français, < 72 caractères>

<corps optionnel, expliquant le POURQUOI plus que le QUOI>

<pied optionnel : références issues, breaking changes>
```

**Types autorisés** :
| Type | Usage |
|---|---|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `refactor` | Refactor sans changement de comportement |
| `perf` | Amélioration de performance |
| `docs` | Documentation seule |
| `style` | Format, indentation (Prettier) |
| `test` | Ajout/modification de tests |
| `chore` | Outillage, dépendances |
| `build` | Système de build, packaging |
| `ci` | Workflow GitHub Actions |
| `revert` | Annulation d'un commit précédent |

**Exemples** :
```
feat: ajouter le thème festif Sainte-Geneviève

fix: corriger la détection de l'onglet Empreintes désactivé

Le sélecteur précédent ne tenait pas compte des onglets grisés
par PrimeFaces lorsque le profil ne dispose pas du droit.

refactor: extraire la validation NATINF dans un module dédié

docs: documenter le protocole de messaging
```

**Règles** :
- Verbe à l'infinitif (`ajouter`, `corriger`, `extraire`) — pas de participe passé.
- Pas de point final au résumé.
- Première lettre minuscule après le `:`.
- Une idée = un commit. Si on doit utiliser "et", scinder.

### 6.3 Pull Requests

**Titre** : même format que le commit principal.

**Description (gabarit)** :
```markdown
## Pourquoi
<contexte métier ou technique qui motive la PR>

## Quoi
<liste à puces des changements>

## Comment tester
- [ ] Étape 1
- [ ] Étape 2

## Captures (si UI)
<avant / après>

## Issues liées
Closes #XX
```

**Règles** :
- PR petite (< 400 lignes diff idéalement). Au-delà : justifier.
- Une PR = un sujet. Pas de "refactor + nouvelle feature" mélangés.
- CI verte obligatoire avant merge.
- Au moins une revue avant merge sur `main`.
- **Squash and merge** par défaut (historique linéaire).

### 6.4 Versionnage — SemVer
- `MAJOR.MINOR.PATCH`
- `MAJOR` : breaking change (rare pour une extension).
- `MINOR` : nouvelle fonctionnalité rétrocompatible.
- `PATCH` : correction de bug.
- Bump via `npm run bump` (script existant).

---

## 7. Documentation

### 7.1 Code
- JSDoc obligatoire pour les fonctions **exportées** :
  ```js
  /**
   * Extrait les codes NATINF d'un champ texte.
   * @param {string} texte - Le contenu brut du champ commentaire.
   * @returns {string[]} La liste des codes uniques détectés.
   */
  export function extraireCodesNatinf(texte) { /* ... */ }
  ```
- Pas de JSDoc pour les fonctions internes triviales — le nom doit suffire.

### 7.2 ADR (Architecture Decision Records)
- Chaque décision structurante → un ADR dans `docs/adr/NNNN-titre-court.md`.
- Gabarit :
  ```markdown
  # NNNN — Titre

  ## Statut
  Accepté | Proposé | Déprécié | Remplacé par NNNN

  ## Contexte
  ## Décision
  ## Conséquences
  ```

### 7.3 CHANGELOG
- `CHANGELOG.md` à la racine, format [Keep a Changelog](https://keepachangelog.com/fr/).
- Une entrée par version, mise à jour à chaque PR significative.

---

## 8. Tests

### 8.1 Pyramide
- **Beaucoup d'unitaires** sur la logique pure (validations, parsing).
- **Quelques E2E** sur les golden paths.
- Pas d'intégration lourde.

### 8.2 Nommage
- Fichier de test : `<module>.test.js` à côté du module testé.
- Description : phrase complète française.
  ```js
  describe("extraireCodesNatinf", () => {
    it("retourne un tableau vide quand le texte ne contient aucun code", () => { /* ... */ });
    it("ignore les codes en doublon", () => { /* ... */ });
  });
  ```

### 8.3 Couverture
- Cible : **70%** sur `content/validations/` et `content/dom/`.
- Pas de seuil sur l'UI (testée en E2E).

### 8.4 Tests manuels
- Toute PR touchant l'UI → captures avant/après.
- Toute PR touchant la logique FAED → test sur une fiche réelle décrit dans la PR.

---

## 9. Performance

### 9.1 Popup
- Temps d'affichage perçu < 200 ms.
- Pas de JS bloquant > 50 ms au boot.
- Modules non critiques en **lazy-load** (cf. arcade).

### 9.2 Content script
- Pas d'observer DOM permanent sans `disconnect()`.
- `waitForElement` avec **timeout explicite**, jamais d'attente infinie.
- Pas de `setInterval` non nettoyé.

### 9.3 Stockage
- `browser.storage.local` : petites valeurs uniquement. Pour du gros : `IndexedDB`.

---

## 10. Revue de code

### 10.1 Côté auteur
- Auto-revue avant publication : "Est-ce que je comprendrais ce code dans 6 mois ?"
- PR rebasée sur `main` à jour avant demande de revue.
- Tous les commentaires de PR précédents résolus.

### 10.2 Côté relecteur
- Vérifier : **lisibilité** > correction > performance > style (Prettier s'en charge).
- Distinguer :
  - 🔴 `bloquant :` à corriger avant merge,
  - 🟡 `suggestion :` à considérer,
  - 🟢 `note :` info, non bloquant.
- Pas de bikeshedding sur le format (Prettier est l'arbitre).

---

## 11. Checklist avant commit

- [ ] `npm run lint` passe
- [ ] `npm run format` appliqué
- [ ] `npm test` passe (si tests existent sur la zone modifiée)
- [ ] `npm run build` produit un `.xpi` valide
- [ ] Le code est en français (variables, commentaires)
- [ ] Le message de commit est en français, au bon format
- [ ] Pas de `console.log` de debug oublié
- [ ] Pas de `// TODO` sans issue associée
- [ ] Pas de secret en clair

---

## 12. Évolution de ces conventions

Ce document est **vivant**. Toute évolution :
1. Proposée via une PR sur `docs/CONVENTIONS.md`.
2. Discutée en revue.
3. Mergée → s'applique aux **nouvelles** contributions (pas de refactor massif rétroactif).

> Une convention sans application est pire qu'une absence de convention. **Mieux vaut une règle simple et respectée qu'une règle parfaite et ignorée.**
