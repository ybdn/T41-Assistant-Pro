# 🔴 [Sécurité] Révoquer les clés Mozilla exposées et assainir le repo

**Labels :** `security`, `tech-debt`
**Priorité :** P0 (bloquant)

## Contexte

Le fichier `PUBLISH.md` versionné dans le repo contient en clair :

- `WEB_EXT_API_KEY`
- `WEB_EXT_API_SECRET`

Ces identifiants permettent de signer/publier des extensions au nom du compte Mozilla. Ils doivent être considérés comme **compromis**.

D'autres éléments sensibles ou inutiles sont committés :
- `.amo-upload-uuid` (identifiant et hash d'upload AMO)
- `web-ext-artifacts/*.xpi` (8 builds signés)
- Aucun `.gitignore` au repo

## Actions

### 1. Révocation et rotation (urgent)
- [ ] Révoquer la clé sur https://addons.mozilla.org/developers/addon/api/key/
- [ ] Générer une nouvelle paire `WEB_EXT_API_KEY` / `WEB_EXT_API_SECRET`
- [ ] Ajouter la nouvelle paire dans **Settings → Secrets and variables → Actions** du repo GitHub
- [ ] Mettre à jour `.github/workflows/release-extension.yml` pour consommer ces secrets

### 2. Purge de l'historique
- [ ] Installer `git filter-repo`
- [ ] Exécuter :
  ```bash
  git filter-repo --path PUBLISH.md \
                  --path .amo-upload-uuid \
                  --path web-ext-artifacts \
                  --invert-paths
  ```
- [ ] Force-push après coordination avec les collaborateurs
- [ ] Demander à GitHub Support de purger les caches éventuels

### 3. `.gitignore`
- [ ] Créer un `.gitignore` à la racine :
  ```gitignore
  # Node
  node_modules/
  npm-debug.log*

  # Build artefacts
  web-ext-artifacts/
  *.xpi
  *.zip

  # Backups
  *.bak

  # AMO local
  .amo-upload-uuid

  # OS
  .DS_Store
  Thumbs.db

  # Editor
  .vscode/
  .idea/
  *.swp

  # Secrets
  .env
  .env.*
  ```

### 4. Documentation de publication sans secrets
- [ ] Recréer `docs/PUBLISH.md` (sans valeurs réelles, uniquement les noms de variables d'environnement)

## Critère d'acceptation

- `git log --all -- PUBLISH.md` ne renvoie plus rien.
- Le workflow de release fonctionne avec les nouvelles clés depuis GitHub Secrets.
- `.gitignore` présent et appliqué.
