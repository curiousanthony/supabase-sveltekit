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

4.  **If the feature will touch the database**:
    -   Run `supabase db reset` so the local database applies all migrations for this branch (ensures local DB matches code).
    -   When you **add new migrations** on the feature branch, always run `supabase db reset` after `npm run db:generate` so the app works on first run.
    -   Follow [database-migration.md](database-migration.md) for all schema changes.
