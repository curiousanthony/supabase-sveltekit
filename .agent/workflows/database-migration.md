---
description: Sync database changes from Supabase to code and deploy
---

1.  **Pull Changes (Introspection)**:
    -   Read changes from the local Supabase database into `schema.ts`.
    ```bash
    npm run db:pull
    ```

2.  **Generate Migration**:
    -   Create a new timestamped SQL migration file.
    ```bash
    npm run db:generate
    ```

3.  **Deploy to Production**:
    -   Push the new migration to the remote Supabase project.
    ```bash
    supabase db push
    ```

**Critical Rules**:
-   NEVER use `npm run db:push` or `npm run db:migrate`.
-   If "relation already exists" errors occur, suggest `supabase migration repair`.
