# Issues GitHub — chantier de rénovation

Chaque fichier de ce dossier correspond à **une issue GitHub** à créer.

Copier-coller le **contenu de chaque fichier** dans une nouvelle issue (titre = première ligne `# …`, corps = le reste).

## Ordre recommandé

| # | Fichier | Phase | Bloque |
|---|---|---|---|
| 1 | `01-securite-et-hygiene.md` | 0 + 1 | toutes les autres |
| 2 | `02-nettoyer-code-mort.md` | 1 | 4, 5 |
| 3 | `03-outillage.md` | 2 | 4, 5, 9, 10 |
| 4 | `04-restructurer-dossiers.md` | 3 | 5, 6, 7 |
| 5 | `05-modulariser-alphamatchers.md` | 4.b | 9 |
| 6 | `06-modulariser-popup.md` | 4.a | 7, 9 |
| 7 | `07-isoler-arcade.md` | 4.c | — |
| 8 | `08-consolidation-css.md` | 5 | — |
| 9 | `09-tests-et-ci.md` | 5 + 6 | — |
| 10 | `10-appliquer-conventions.md` | 2 | 4, 5, 6 |

## Labels suggérés à créer sur GitHub

Tous en français, conformément à `docs/CONVENTIONS.md §6.3` :

- `securite` (rouge)
- `dette-technique` (orange)
- `refactor` (jaune)
- `outillage` (bleu)
- `docs` (vert)
- `tests` (turquoise)
- `bonne-premiere-issue` (violet)
