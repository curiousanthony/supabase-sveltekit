---
description: Start a new feature branch from develop
---

1.  **Update develop**:
    ```bash
    git checkout develop
    git pull origin develop
    ```

2.  **Determine branch name**:
    -   Ask the user for a short description of the task if not provided.
    -   Use the format: `type/short-description` (kebab-case).
    -   **Types**:
        -   `feat/`: New features
        -   `fix/`: Bug fixes
        -   `chore/`: Maintenance/Config
        -   `docs/`: Documentation
    -   For **new standalone** fix/chore/docs tasks, use `fix/...`, `chore/...`, or `docs/...`.
    -   Optionally derive from a GitHub Issue (e.g. `feat/42-issue-slug`).

3.  **Create branch**:
    ```bash
    git checkout -b [branch_name]
    ```
