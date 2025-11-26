# Conventions de Commit pour T41 Assistant Pro

Ce projet utilise **Conventional Commits** pour déterminer automatiquement le type de version à publier.

## Format des Messages de Commit

### PATCH : Corrections et petites modifications (2.1.2 → 2.1.3)

Utilisez ces préfixes pour les corrections de bugs et petites modifications :

```
fix: correction de l'alignement du bouton dans la popup
chore: mise à jour des dépendances
docs: amélioration du README
style: formatage du code
refactor: réorganisation du code sans changement fonctionnel
```

**Résultat** : Version PATCH incrémentée (ex: 2.1.2 → 2.1.3)

### MINOR : Nouvelles fonctionnalités (2.1.2 → 2.2.0)

Utilisez le préfixe `feat:` pour ajouter de nouvelles fonctionnalités :

```
feat: ajout d'un sélecteur de thème
feat(popup): implémentation du mode sombre
feat(content): ajout de nouveaux raccourcis clavier
```

**Résultat** : Version MINOR incrémentée (ex: 2.1.2 → 2.2.0)

### MAJOR : Changements cassants (2.1.2 → 3.0.0)

Utilisez `!` après le type ou `BREAKING CHANGE:` dans le corps du commit :

**Méthode 1 - Avec `!` :**
```
feat!: refonte de l'architecture de l'extension
fix!: correction cassant la compatibilité avec l'ancienne API
```

**Méthode 2 - Avec `BREAKING CHANGE:` :**
```
feat: nouvelle gestion des thèmes

BREAKING CHANGE: L'ancien format de thème n'est plus supporté.
Les utilisateurs devront reconfigurer leurs thèmes.
```

**Résultat** : Version MAJOR incrémentée (ex: 2.1.2 → 3.0.0)

### SKIP : Ignorer le workflow (pas de release)

Les commits de release sont automatiquement ignorés pour éviter les boucles infinies :

```
chore: release v2.1.3
```

Ce type de commit est créé automatiquement par le workflow GitHub Actions.

## Exemples Pratiques

| Commit Message | Version Actuelle | Nouvelle Version |
|----------------|------------------|------------------|
| `fix: corrige le bug d'affichage des fiches` | 2.1.2 | 2.1.3 |
| `feat: ajoute l'export PDF` | 2.1.2 | 2.2.0 |
| `feat!: nouvelle interface utilisateur` | 2.1.2 | 3.0.0 |
| `chore: mise à jour des dépendances` | 2.1.2 | 2.1.3 |
| `docs: amélioration du guide utilisateur` | 2.1.2 | 2.1.3 |

## Workflow Automatique

Lorsque vous poussez sur la branche `main`, le workflow GitHub Actions :

1. **Analyse vos messages de commit** depuis le dernier push
2. **Détermine le type de version** (major/minor/patch) selon les conventions ci-dessus
3. **Met à jour automatiquement** la version dans :
   - `manifest.json`
   - `popup/popup.html`
4. **Signe l'extension** avec vos credentials Mozilla AMO
5. **Crée un tag Git** (ex: `v2.1.3`)
6. **Publie une GitHub Release** avec le fichier `.xpi` téléchargeable

## Bonnes Pratiques

### ✅ Recommandé

- Utilisez des messages clairs et descriptifs
- Préfixez avec le bon type (`feat:`, `fix:`, etc.)
- Soyez précis sur ce qui a changé
- Utilisez le scope optionnel pour plus de clarté : `feat(popup): ...`

### ❌ À éviter

- Messages vagues : ~~`update code`~~
- Pas de préfixe : ~~`ajout fonctionnalité`~~
- Mélanger plusieurs changements dans un commit

## Scopes Suggérés

Vous pouvez ajouter un scope pour préciser la partie du code modifiée :

- `feat(popup): ...` - Modifications de l'interface popup
- `feat(content): ...` - Scripts de contenu
- `feat(background): ...` - Scripts en arrière-plan
- `fix(ui): ...` - Corrections d'interface
- `docs(readme): ...` - Documentation README

## Commit avec Plusieurs Changements

Si votre commit contient à la fois une nouvelle fonctionnalité ET un breaking change, le workflow choisira le type le plus important :

1. **BREAKING CHANGE** (highest priority) → major
2. **feat:** → minor
3. **fix:**, **chore:**, etc. → patch

## Ressources

Pour en savoir plus sur Conventional Commits : https://www.conventionalcommits.org/
