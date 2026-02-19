---
name: supabase-database-migration
description: Manages Supabase + Drizzle schema changes using a schema-first workflow. Use when the task involves changing database tables/columns, adding/removing relations, generating migrations, or when the user mentions migrations, drizzle-kit, supabase db reset, or DATABASE_URL.
---

# Supabase Database Migration (Schema-First)

Use this skill whenever you change the database schema (tables, columns, relations) or need to generate/apply migrations. This project uses **Supabase + Drizzle ORM** with a **schema-first** workflow so that code, migrations, and the local database stay in sync.

Always treat this as the source of truth instead of ad‑hoc `db:push` or dashboard-only edits.

---

## When to Use

Use this skill when:

- Editing `src/lib/db/schema.ts` (adding/removing tables, columns, relations, indexes).
- Creating, updating, or reviewing Supabase migrations under `supabase/migrations/`.
- The user mentions:
  - "add a table/column/index/relation"
  - "change schema", "update Drizzle schema"
  - "generate migration", "db:generate", "drizzle-kit"
  - "supabase db reset", "migrations not applied", "relation already exists"
- You are about to run **any** migration-related command.

If in doubt, assume this skill applies whenever schema changes are involved.

---

## Core Workflow (Agents)

Agents MUST follow this schema-first workflow for any schema change. Do **not** assume the local database has the latest migrations.

1. **Edit schema in code**
   - Make schema changes in `src/lib/db/schema.ts`:
     - Add or modify tables, columns, relations, indexes, constraints.
   - Ensure types are accurate and consistent with how the app uses the data.

2. **Generate a migration**
   - Create a timestamped SQL migration from the Drizzle schema:
   ```bash
   bun run db:generate
   ```
   - This uses **drizzle-kit** and requires `DATABASE_URL` pointing to **local Supabase**, for example:
     - `postgresql://postgres:postgres@127.0.0.1:54322/supabase`

3. **Apply migrations locally (REQUIRED)**
   - After generating (or pulling) new migrations, always reset and apply them to the local DB:
   ```bash
   supabase db reset
   ```
   - This ensures the local database schema matches `schema.ts` and the migrations, so the app works on first run.
   - Never skip this step after adding or pulling new migrations.

4. **Deploy migrations to remote (when integrating/releasing)**
   - Only when integrating a branch to `develop` or releasing to `main`, push migrations to the remote Supabase project:
   ```bash
   supabase db push
   ```
   - If `supabase db push` raises "relation already exists" or similar drift errors, suggest using `supabase migration repair` before retrying, and avoid modifying generated SQL by hand unless absolutely necessary.

---

## Forbidden / Avoided Commands

- **NEVER** run:
  - `bun run db:push`
  - `bun run db:migrate`
- Do **not** bypass the schema-first flow by editing the database only in the Supabase Dashboard without reflecting changes in `schema.ts`.
- Do **not** assume local DB is current; always run `supabase db reset` after new migrations are added or pulled.

---

## Quick Checklist for Schema Changes

When implementing a feature that touches the DB, follow this checklist:

1. [ ] Update `src/lib/db/schema.ts` to reflect the desired schema.
2. [ ] Run `bun run db:generate` to create a new migration.
3. [ ] Run `supabase db reset` so the local DB matches the new migrations.
4. [ ] Run tests / start the app and verify the feature against the updated DB.
5. [ ] When integrating or releasing, run `supabase db push` to apply migrations to remote.

---

## Human vs Agent Workflows

- **Agents**: Must always use this **schema-first** workflow.
- **Humans (solo dev)**: May sometimes use a DB‑first workflow (edit in Supabase Dashboard → `db:pull` → `db:generate`), as documented in `docs/database.md`, but agents should **not** rely on that path.

If the user explicitly asks you to follow the human DB‑first flow, confirm in chat and restate the implications (schema must still match `schema.ts` and migrations).

