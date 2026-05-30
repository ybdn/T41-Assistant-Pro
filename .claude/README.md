# Dossier `.claude/`

Ce dossier contient la **configuration spécifique à Claude Code** pour ce projet.

## ⚠️ Doit être versionné

Ce dossier **ne doit jamais** apparaître dans `.gitignore`. Il fait partie intégrante du projet et garantit que chaque session Claude (web, CLI, IDE) démarre avec les mêmes règles, hooks et permissions.

Seul `.claude/settings.local.json` peut être local (préférences individuelles) — il est listé dans le `.gitignore`.

## Contenu

| Fichier | Rôle |
|---|---|
| `settings.json` | Permissions, hooks et environnement partagés par toute l'équipe |
| `settings.local.json` | Préférences individuelles (non versionné) |
| `commands/` | Commandes slash personnalisées (`/<nom>`) propres au projet |
| `agents/` | Sous-agents personnalisés propres au projet |

## Référence

- `CLAUDE.md` (racine du repo) → briefing projet, lu automatiquement à chaque session.
- `docs/CONVENTIONS.md` → règles de code détaillées.
- Documentation officielle : https://docs.claude.com/en/docs/claude-code
