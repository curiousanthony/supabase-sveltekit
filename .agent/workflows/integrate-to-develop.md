---
description: Push branch and merge into develop (integrate)
---

**Run push/merge only after the user explicitly says "Integrate" or "Merge to develop".**

1.  **Push branch**:
    ```bash
    git push -u origin HEAD
    ```

2.  **Merge into develop**:
    -   **Direct merge**: `git checkout develop && git pull origin develop`, then `git merge <feature-branch>`, then `git push origin develop`.
    -   **Via PR**: Open a PR into `develop` on GitHub; merge there, then pull `develop` locally.

3.  **Clean up** (optional): Delete the feature branch locally and remotely after merging.

**Note**: PRs to `main` are only for releases (see `release-to-main` workflow). Day-to-day integration is into `develop`.
