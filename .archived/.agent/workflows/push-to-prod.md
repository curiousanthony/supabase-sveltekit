---
description: Push to production — commit on develop if needed, then merge develop into main and sync branches
---

**Use when the user runs `/push-to-prod` or says "push to prod".**

1. **If current branch is `develop` and there are uncommitted changes**
   - Stage and commit with a Conventional Commit message (e.g. `chore: prepare release` or ask the user for the message).
   - Then push: `git push origin develop`.

2. **Merge develop → main** (use **merge**, not squash, so Semantic Release sees `feat`/`fix` commits):
   ```bash
   git checkout main
   git pull origin main
   git merge develop
   git push origin main
   ```

3. **Semantic Release** runs on `main` via GitHub Actions: updates `package.json`, `CHANGELOG.md`, creates a tag and GitHub Release.

4. **Update `develop` from `main`** so both branches are in sync (no commits ahead/behind):
   ```bash
   git checkout develop
   git merge main
   git push origin develop
   ```
