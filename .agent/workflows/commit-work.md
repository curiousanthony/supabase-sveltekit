---
description: Commit changes using Conventional Commits
---

1.  **Stage changes**:
    ```bash
    git add .
    ```

2.  **Determine commit message**:
    -   Format: `type: description` (all lowercase, no period at end).
    -   **Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.
    -   When fix/chore/docs are **part of current work** (e.g. small fix while on `feat/forms`), **commit on the current branch**; do not create a new branch.

3.  **Commit**:
    ```bash
    git commit -m "[message]"
    ```
