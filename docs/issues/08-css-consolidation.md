# 🎨 Consolider les feuilles CSS

**Labels :** `refactor`, `tech-debt`
**Priorité :** P2

## Contexte

Le dossier popup contient **5 feuilles CSS** qui se patchent mutuellement :

| Fichier | Taille | Rôle |
|---|---:|---|
| `styles.css` | 24 ko | Styles principaux |
| `styles-additional.css` | 19 ko | Patchs "ajoutés après" |
| `themes-festive.css` | 23 ko | Thèmes festifs |
| `themes-animations.css` | 1,4 ko | Animations |
| `themes-fixes.css` | 10 ko | Patchs "fixes" sur les thèmes |
| `space-invaders.css` | 6,5 ko | Easter-egg (issue séparée #7) |

La présence de `-additional` et `-fixes` est typique d'un cycle "patch over patch" — la dette s'accumule à chaque évolution.

## Cible

```
src/popup/styles/
├── base.css          # reset + variables CSS + layout
├── components.css    # boutons, cartes, modales, todo
├── notifications.css # système de notifications
└── themes/
    ├── light.css     # extrait des vars custom du thème clair
    ├── dark.css
    └── festive/
        ├── christmas.css
        ├── halloween.css
        ├── easter.css
        └── ...
```

## Méthode (KISS, sans framework)

1. **Diagnostic** : exécuter une analyse de dédoublonnage des règles CSS avec un outil comme [`css-analyzer`](https://www.projectwallace.com/) ou simplement `grep` pour repérer les sélecteurs définis dans plusieurs fichiers.
2. **Fusion par lots** : merger `styles-additional.css` dans `styles.css`, puis `themes-fixes.css` dans `themes-festive.css`, en résolvant les conflits.
3. **Découpage par responsabilité** (base / components / themes).
4. **Variables CSS** : centraliser toutes les `--var` dans `base.css :root`.

## Actions

- [ ] Audit doublons (commande `grep -h "^\." popup/styles/*.css | sort | uniq -d`)
- [ ] Fusion en 2 fichiers maximum : `base.css` + `components.css`
- [ ] Sortir les thèmes festifs dans `themes/festive/`
- [ ] Mettre à jour `popup.html`
- [ ] Tester visuellement chaque thème (cf. `docs/THEMES.md`)

## Critère d'acceptation

- Plus aucun fichier nommé `-additional` ou `-fixes`
- Pas de doublon de sélecteur entre fichiers
- Capture visuelle identique avant/après (golden screenshot recommandé)
