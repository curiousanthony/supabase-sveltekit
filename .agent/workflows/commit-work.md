---
description: Commit changes using Conventional Commits
---

1.  **Stage Changes**:
    ```bash
    git add .
    ```

2.  **Determine Commit Message**:
    -   Format: `type: description` (all lowercase, no period at end).
    -   **Types**:
        -   `feat`: New feature
        -   `fix`: Bug fix
        -   `docs`: Documentation
        -   `style`: Formatting
        -   `refactor`: Code restructuring
        -   `test`: Adding tests
        -   `chore`: Build/Tools

3.  **Commit**:
    ```bash
    git commit -m "[message]"
    ```
