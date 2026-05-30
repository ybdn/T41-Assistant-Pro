# Issues GitHub — chantier de rénovation

Chaque fichier de ce dossier correspond à **une issue GitHub** à créer.

Copier-coller le **contenu de chaque fichier** dans une nouvelle issue (titre = première ligne `# …`, corps = le reste).

## Ordre recommandé

| # | Fichier | Phase | Bloque |
|---|---|---|---|
| 1 | `01-security-and-hygiene.md` | 0 + 1 | toutes les autres |
| 2 | `02-cleanup-dead-code.md` | 1 | 4, 5 |
| 3 | `03-tooling.md` | 2 | 4, 5, 9 |
| 4 | `04-restructure-folders.md` | 3 | 5, 6, 7 |
| 5 | `05-modularize-alphamatchers.md` | 4.b | 9 |
| 6 | `06-modularize-popup.md` | 4.a | 7, 9 |
| 7 | `07-isolate-arcade.md` | 4.c | — |
| 8 | `08-css-consolidation.md` | 5 | — |
| 9 | `09-tests-and-ci.md` | 5 + 6 | — |

## Labels suggérés à créer sur GitHub

- `security` (rouge)
- `tech-debt` (orange)
- `refactor` (jaune)
- `tooling` (bleu)
- `docs` (vert)
- `good-first-issue` (violet)
