---
description: Release to production by merging develop into main
---

**Run only after the user explicitly says "Release" or "Ship to prod".**

1.  **Merge develop → main** (use **merge**, not squash, so Semantic Release sees `feat`/`fix` commits):
    ```bash
    git checkout main
    git pull origin main
    git merge develop
    git push origin main
    ```

2.  **Semantic Release** runs on `main` via GitHub Actions: updates `package.json`, `CHANGELOG.md`, creates a tag and GitHub Release.

3.  **Optional**: Update `develop` from `main`:
    ```bash
    git checkout develop
    git merge main
    git push origin develop
    ```
