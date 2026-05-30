# 🧩 Modulariser `popup/popup-consolidated.js` (1 114 lignes)

**Labels :** `refactor`
**Priorité :** P2

## Contexte

`src/popup/popup-consolidated.js` cumule plusieurs responsabilités :
- bootstrap DOM
- détection fenêtre détachée
- système de notifications
- état de la boucle de traitement
- communication avec background / content
- mise à jour de l'icône

À 1 114 lignes, c'est un autre monolithe qu'il faut casser.

## Découpage cible

```
src/popup/
├── popup.html
├── index.js              # entry point, DOMContentLoaded, câblage
├── state.js              # popupLoopStateActive, demoProgress, lastRealProgressTime
├── messaging.js          # bridge browser.runtime.sendMessage / onMessage
├── notifications.js      # showNotification
├── detached-window.js    # checkIfDetachedWindow + helpers windows.create
├── icon.js               # mise à jour de browser.action icon (vert/rouge)
└── styles/
    └── ...
```

## Méthode

- Modules ES standard (`<script type="module" src="index.js">` est supporté dans une popup MV3).
- Aucun bundler nécessaire ici.
- Une extraction par commit.

## Actions

- [ ] Convertir `popup.html` pour charger `index.js` comme `type="module"`
- [ ] Extraire `notifications.js` (fonction `showNotification`)
- [ ] Extraire `state.js`
- [ ] Extraire `messaging.js`
- [ ] Extraire `detached-window.js`
- [ ] Extraire `icon.js`
- [ ] Vérifier qu'`index.js` < 300 lignes
- [ ] Supprimer `popup-consolidated.js`

## Critère d'acceptation

- Aucun fichier popup JS ne dépasse 400 lignes
- Popup fonctionne en mode classique **et** en mode fenêtre détachée
- ESLint passe
