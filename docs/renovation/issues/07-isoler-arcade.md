# 🎮 Isoler l'easter-egg arcade (lazy-load)

**Labels :** `refactor`, `performance`
**Priorité :** P2

## Contexte

La popup charge **inconditionnellement** ~2 230 lignes de JS de jeux + une CSS dédiée :

| Fichier | Lignes |
|---|---:|
| `popup/asteroids-game.js` | 721 |
| `popup/space-invaders.js` | 650 |
| `popup/floppy-bird-game.js` | 447 |
| `popup/snake-game.js` | 413 |
| `popup/easter-egg-init.js` | 131 |
| `popup/space-invaders.css` | (6 ko) |

Pour une extension métier gendarmerie, ce code :
- alourdit le démarrage de la popup,
- pollue le dossier `popup/`,
- pourrait être désactivé en build de release si souhaité.

## Solution proposée

### Étape 1 : isoler
- [ ] Déplacer ces 5 JS + la CSS dans `src/popup/arcade/`
- [ ] Créer `src/popup/arcade/index.js` qui expose `openArcade()` (registre des jeux)

### Étape 2 : lazy-load
- [ ] Dans `src/popup/index.js`, remplacer le chargement statique par un import dynamique au déclenchement de l'easter-egg :
  ```js
  iconTrigger.addEventListener("dblclick", async () => {
    const { openArcade } = await import("./arcade/index.js");
    openArcade();
  });
  ```
- [ ] Idem pour la CSS : injection conditionnelle d'un `<link>` au premier lancement.

### Étape 3 : flag build (optionnel)
- [ ] Ajouter une option `--no-arcade` dans `tools/pack-extension.js` pour produire un build de release allégé.

## Critère d'acceptation

- Au chargement initial de la popup, **aucun fichier arcade** n'est exécuté (vérifier dans le DevTools Network)
- Le double-clic sur l'icône (ou le déclencheur actuel) ouvre le menu arcade comme avant
- Tous les jeux fonctionnent
