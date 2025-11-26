# Guide de publication - T41 Assistant Pro

## Configuration des clés API

Avant de publier, configurez vos clés API Mozilla :

```bash
export WEB_EXT_API_KEY='user:18800917:729'
export WEB_EXT_API_SECRET='a6a9d370563bfede7603abf6c9d854c05fbff7b505f7d64f59ec245883bfd26e'
```

## Publication en mode Unlisted (auto-distribution)

### Soumettre pour signature

```bash
npx web-ext sign --channel=unlisted
```

Cette commande va :
- Créer un package de l'extension
- Le soumettre à Mozilla pour signature
- Télécharger le fichier `.xpi` signé dans `./web-ext-artifacts/`

### Avec options supplémentaires

```bash
npx web-ext sign \
  --channel=unlisted \
  --source-dir=./ \
  --artifacts-dir=./web-ext-artifacts
```

## Tester l'extension localement

```bash
npx web-ext run
```

Ou pour spécifier un profil Firefox :

```bash
npx web-ext run --firefox-profile=dev-profile
```

## Créer un package sans signer

```bash
npx web-ext build
```

Le fichier ZIP sera créé dans `./web-ext-artifacts/`

## Version actuelle

**Version :** 2.1.3
**ID :** t41-assistant-pro@ybdn-dfaedgn

## Notes importantes

- Mode **unlisted** = distribution manuelle du fichier .xpi
- Mode **listed** = publication sur addons.mozilla.org
- Le fichier `.web-extignore` contrôle quels fichiers sont exclus du package
- Les clés API doivent être définies avant chaque session terminal

## Workflow de publication

1. Mettre à jour la version dans `manifest.json`
2. Configurer les variables d'environnement (clés API)
3. Exécuter `npx web-ext sign --channel=unlisted`
4. Récupérer le fichier `.xpi` dans `./web-ext-artifacts/`
5. Distribuer le fichier `.xpi` manuellement
