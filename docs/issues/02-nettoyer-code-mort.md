# 🧹 Supprimer le code mort, fichiers de sauvegarde et doublons

**Labels :** `tech-debt`, `good-first-issue`
**Priorité :** P1

## Contexte

Le dossier `popup/` contient plusieurs fichiers qui ne sont **plus chargés** par `popup.html`, des **sauvegardes** versionnées et des **doublons**. Ils nuisent à la lisibilité et au temps d'onboarding.

## Fichiers à supprimer

| Fichier | Raison |
|---|---|
| `popup/popup.js` (518 l) | Non chargé par `popup.html` — remplacé par `popup-consolidated.js` |
| `popup/popup-interactive.js` (136 l) | Non chargé par `popup.html` |
| `popup/popup-consolidated.js.bak` | Backup — git fait office de versioning |
| `popup/popup.html.bak` | Backup |
| `popup/button-diagnostic.js` | Fichier vide (0 octets) |
| `popup/browser-polyfill.js` (4 l) | Stub remplacé par `browser-polyfill-fixed.js` |
| `.web-ext-ignore` | Doublon de `.web-extignore` (typo) — `web-ext` lit uniquement `.web-extignore` |

## Actions

- [ ] Vérifier en cherchant `grep -r "popup.js\|popup-interactive\|browser-polyfill\b" .` que rien ne référence ces fichiers
- [ ] `git rm` les fichiers listés
- [ ] Si `popup/debug.html` et `popup/diagnostic.html` sont utilisés en dev → les déplacer dans `tools/diagnostic/` (issue séparée #4) ; sinon les supprimer aussi

## Critère d'acceptation

- `ls popup/` ne contient plus de `.bak`, plus de fichier vide, plus de fichier mort
- `npx web-ext run` lance la popup sans erreur console
- L'extension fonctionne (lancer la séquence sur une page FAED de test)
