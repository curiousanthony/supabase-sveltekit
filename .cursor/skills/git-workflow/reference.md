# Git Workflow Reference

Concise reference for branch naming, commit types, and workflow details. See [docs/git-workflow.md](../../docs/git-workflow.md) for the full project guide.

## Branch naming

- Format: `type/short-description` (kebab-case).
- Types: `feat/`, `fix/`, `chore/`, `docs/`.
- Examples: `feat/trainer-matchmaking`, `fix/login-error`, `chore/update-deps`, `docs/update-readme`.

## Conventional Commits

- Format: `type: description` (lowercase, no period at end).
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`.
- Examples: `feat: add login page`, `fix: correct date formatting`, `chore: bump dependencies`.

## Branch roles

- **`main`**: Production. Deployable. Only updated when releasing from `develop`.
- **`develop`**: Integration. All feature work merges here first. Preview/staging.
- **`feat/*`, `fix/*`, `chore/*`, `docs/*`**: Short-lived branches from `develop`.

## Agent safety

Never run `git push` or `git merge` unless the user has explicitly said "Integrate", "Merge to develop", "Release", or "Ship to prod".
