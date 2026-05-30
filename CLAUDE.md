# CLAUDE.md — Briefing projet T41 Assistant Pro

> Ce fichier est lu automatiquement par Claude Code à chaque session.
> Il doit rester **court, factuel, à jour**. Tout ce qui est volumineux va dans `docs/`.

---

## Identité du projet

- **Nom** : T41 Assistant Pro
- **Type** : Extension Firefox (Manifest V3)
- **Domaine métier** : assistance aux opérateurs FAED (DFAED — Gendarmerie Nationale, FR) sur l'application web T41 Alpha-numérique
- **Auteur** : Yoann Baudrin (ybdn)
- **Repo** : `ybdn/T41-Assistant-Pro`

## Stack

- JavaScript vanilla (pas de framework)
- WebExtension API (`browser.*`) avec polyfill
- HTML/CSS pour la popup
- Build : `web-ext` (en cours de structuration via `package.json` — cf. plan de rénovation)

## Cible navigateur

- Firefox uniquement (signature AMO unlisted)
- Domaines d'injection : `https://faed.ppsso.gendarmerie.fr/*` et `https://faed.sso.gendarmerie.fr/*`

---

## Règles non négociables

### 🇫🇷 Tout est en français
- Code (variables, fonctions, fichiers, commentaires)
- Messages de commit
- Titres et descriptions de PR
- Issues GitHub
- Documentation

**Exceptions tolérées** : termes techniques sans bon équivalent FR (`id`, `url`, `dom`, `api`, `json`, `regex`, `manifest`, `popup`, `background`, `listener`, `polyfill`) et termes métier officiels (`FAED`, `NATINF`, `T41`).

Détail complet : `docs/CONVENTIONS.md §1`.

### 🔒 Sécurité
- **Aucun secret dans le code, jamais.** Ni clé API, ni token, ni mot de passe.
- Secrets en CI = GitHub Secrets uniquement.
- Pas de `innerHTML` avec du contenu dynamique → `textContent` ou `createElement`.
- Pas de `eval`, `Function()`, `setTimeout(string)`.

### 📏 KISS
- Pas d'abstraction "au cas où" (YAGNI).
- Une fonction = une responsabilité.
- Limites : fichier < 500 l (cible 200), fonction < 50 l (cible 30), 3 paramètres max.
- Trois lignes similaires ne justifient pas une abstraction.

### 🚫 Pas de bruit
- Pas de `// TODO` sans issue associée.
- Pas de `console.log` de debug oublié.
- Pas de `.bak` (git versionne déjà).
- Pas de commentaire qui paraphrase le code.

---

## Conventions

### Nommage
| Élément | Format | Exemple |
|---|---|---|
| Variable / fonction | `camelCase` | `verifierPagePresente()` |
| Constante globale | `SCREAMING_SNAKE_CASE` | `DUREE_MIN_SEQUENCE_MS` |
| Classe | `PascalCase` | `ValidateurNatinf` |
| Fichier JS / CSS | `kebab-case` | `validation-natinf.js` |
| Booléen | préfixe `est`, `a`, `doit`, `peut` | `estActif`, `aDesErreurs` |

### Commits (français, format Conventional)

```
<type>: <résumé impératif, < 72 caractères>

<corps optionnel : pourquoi plus que quoi>
```

Types : `feat`, `fix`, `refactor`, `perf`, `docs`, `style`, `test`, `chore`, `build`, `ci`, `revert`.

**Exemples** :
- `feat: ajouter le thème festif Sainte-Geneviève`
- `fix: corriger la détection de l'onglet Empreintes désactivé`
- `refactor: extraire la validation NATINF dans un module dédié`

Détail complet : `docs/CONVENTIONS.md §6`.

### Branches

- `feature/<slug>` — nouvelle fonctionnalité
- `fix/<slug>` — correction
- `refactor/<slug>` — refactor sans changement de comportement
- `docs/<slug>` — documentation
- `chore/<slug>` — outillage

---

## Structure (état cible — voir plan de rénovation pour l'état actuel)

```
src/           # tout ce qui est packagé dans le .xpi
  manifest.json
  background/
  content/     # injecté dans FAED — découpé en pages/steps/validations/dom/ui
  popup/       # interface utilisateur
  data/
  icons/
  vendor/
tools/         # scripts dev, jamais packagés
docs/          # documentation, ADR, issues
tests/         # vitest + playwright
```

⚠️ **État actuel ≠ état cible.** Voir `docs/REORGANIZATION_PLAN.md` pour la feuille de route.

---

## Documents de référence

Lire **avant** toute contribution significative :

| Fichier | Contenu |
|---|---|
| `docs/CONVENTIONS.md` | Règles de code, nommage, commits, sécurité — **la référence** |
| `docs/AUDIT.md` | État des lieux du projet (dette, scores KISS) |
| `docs/REORGANIZATION_PLAN.md` | Plan de rénovation en 7 phases |
| `docs/issues/` | Issues GitHub prêtes à coller |
| `docs/THEMES.md` | Spécification des thèmes festifs |
| `docs/PUBLISH.md` | Procédure de publication AMO (sans secrets) |

---

## Commandes utiles

> Certaines ne fonctionneront qu'une fois `package.json` créé (cf. issue #3).

```bash
# Lancer Firefox avec l'extension chargée
npm run run

# Linter + formatter
npm run lint
npm run format

# Construire le .xpi
npm run build

# Signer + publier (AMO unlisted)
npm run sign

# Bumper la version
npm run bump
```

---

## Workflow attendu de Claude

1. **Lire** `CLAUDE.md` (ce fichier) et `docs/CONVENTIONS.md` avant d'agir.
2. **Annoncer** brièvement ce qu'on s'apprête à faire.
3. **Travailler sur la branche désignée** dans le prompt (jamais `main` directement).
4. **Respecter** la convention française pour code et commits.
5. **Ne pas créer** de PR sans demande explicite de l'utilisateur.
6. **Tester** quand c'est possible (`npm run lint`, `npm test`, voire `npm run run`).
7. **Commit atomique** : un sujet par commit.

### À ne JAMAIS faire
- Pousser sur `main`.
- Mettre des secrets dans le code.
- Désactiver les hooks (`--no-verify`).
- `git push --force` sans demande explicite.
- Renommer/déplacer + refactorer dans la même PR.
- Mélanger francisation et refactor dans le même commit.

### En cas de doute
- Sur une règle → `docs/CONVENTIONS.md`
- Sur l'architecture cible → `docs/REORGANIZATION_PLAN.md`
- Sur une fonctionnalité → `README.md`
- Sinon → poser la question à l'utilisateur.

---

## Notes spécifiques au domaine FAED

- **NATINF** : nomenclature des infractions (codes ~1-6 caractères alphanumériques).
- **Onglets de la fiche** : Alpha-numérique, Portraits, Empreintes digitales, Empreintes palmaires.
- **Sensibilité** : aucune donnée personnelle ne doit être loggée, persistée ou exfiltrée — `data_collection_permissions: ["none"]`.
- **PrimeFaces** : framework UI de FAED, génère des IDs avec `:` (à échapper en `\:` dans les sélecteurs CSS).
