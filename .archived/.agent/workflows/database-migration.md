---
description: Agent workflow for database schema changes (schema-first). Ensures local DB and Drizzle stay in sync so features work on first run.
---

**Agents must use this workflow** for any database schema changes. Do not assume the local database has the latest migrations; always apply them after generating or pulling new migrations.

## Steps

1.  **Edit schema in code**
    -   Update `src/lib/db/schema.ts` (tables, columns, relations) to match the feature’s needs.

2.  **Generate migration**
    -   Create a new timestamped SQL migration file.
    ```bash
    bun run db:generate
    ```
    -   Requires `DATABASE_URL` pointing to **local** Supabase (e.g. `postgresql://postgres:postgres@127.0.0.1:54322/supabase`).

3.  **Apply migration locally (required)**
    -   Apply the new migration to the local database so the app works on first run.
    ```bash
    supabase db reset
    ```
    -   **Do not skip this step.** Without it, the local DB will not have the new tables/columns and the app will fail at runtime.

4.  **Deploy to remote (when integrating)**
    -   When merging to `develop` or releasing, push migrations to the linked remote Supabase project.
    ```bash
    supabase db push
    ```

## Critical rules

-   **NEVER** use `bun run db:push` or `bun run db:migrate`.
-   **NEVER** assume the local database has the latest migrations. After adding a new migration (or pulling a branch with new migrations), always run `supabase db reset` before running or testing the app.
-   For local dev, **DATABASE_URL** must point to local Supabase so `db:generate` works (see [docs/database.md](../../docs/database.md)).
-   If "relation already exists" errors occur during `supabase db push`, suggest `supabase migration repair`.

## Human / solo workflow

The DB-first workflow (edit in Supabase Dashboard → `db:pull` → `db:generate` → deploy) remains in [docs/database.md](../../docs/database.md) for when the human codes alone. Agents must follow this schema-first workflow instead.
