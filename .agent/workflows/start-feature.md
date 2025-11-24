---
description: Start a new feature branch
---

1.  **Update Main**:
    ```bash
    git checkout main
    git pull origin main
    ```

2.  **Determine Branch Name**:
    -   Ask the user for a short description of the task if not provided.
    -   Use the format: `type/short-description` (kebab-case).
    -   **Types**:
        -   `feat/`: New features
        -   `fix/`: Bug fixes
        -   `chore/`: Maintenance/Config
        -   `docs/`: Documentation

3.  **Create Branch**:
    ```bash
    git checkout -b [branch_name]
    ```
