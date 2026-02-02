# Development Guide

This project uses **Supabase** for the database and **Drizzle ORM** for type-safe database interactions.

[🇫🇷 Version Française](./database.fr.md)

## Database Workflow (DB-First)

We follow a "DB-First" workflow where you make changes in the Supabase Dashboard and then sync them to your code.

### 1. Edit Database

Make your schema changes (create tables, add columns, etc.) directly in your **local** Supabase Dashboard.

- URL: `http://127.0.0.1:54323` (default)

### 2. Sync Code (`db:pull`)

Pull the changes from your local database into your Drizzle schema file.

```bash
npm run db:pull
```

> **What this does:** Introspects your local database and updates `src/lib/db/schema.ts` to match it.

### 3. Generate Migration (`db:generate`)

Create a new SQL migration file based on the changes in your schema file.

```bash
npm run db:generate
```

> **What this does:** Compares your new `schema.ts` against the previous migration snapshot and generates a timestamped `.sql` file in `supabase/migrations/`.

### 4. Deploy (`supabase db push`)

Apply the new migration to your linked **remote** Supabase project (Production/Staging).

```bash
supabase db push
```

> **What this does:** Applies pending migrations to the remote database and updates the `supabase_migrations` history table.

---

## Important Notes

### Applying migrations locally

If you have **new migration files** (e.g. after `db:generate` or after pulling a branch with new migrations), run:

```bash
supabase db reset
```

This applies all migrations in `supabase/migrations/` to your local database so the app runs correctly. Your local DB already matches after step 1 (Edit Database) in the workflow above; use `supabase db reset` when you've added or pulled migration files from elsewhere.

### Local development: `DATABASE_URL`

For `db:pull` and `db:generate` to work, `DATABASE_URL` must point to your **local** Supabase Postgres. With `supabase start`, the direct Postgres URL is typically:

```
postgresql://postgres:postgres@127.0.0.1:54322/supabase
```

Set this in `.env` or `.env.local` (and ensure the file is in `.gitignore`).

### 🚫 Do NOT use `db:push` or `db:migrate`

We have disabled `npm run db:push` and `npm run db:migrate`.

- **Reason:** These commands bypass Supabase's migration history tracking, which leads to "relation already exists" conflicts when you try to deploy later.
- **Always** use the workflow above to ensure Drizzle and Supabase stay in sync.

### Troubleshooting

If you encounter **"relation already exists"** errors during `supabase db push`:

1.  This usually means the migration was already applied (perhaps manually or via UI) but Supabase doesn't know about it.
2.  Use `supabase migration repair` to mark the conflicting migration as "applied".

### Note for AI agents

AI agents working on this codebase must follow the **schema-first** workflow and apply migrations locally; see [.agent/workflows/database-migration.md](../.agent/workflows/database-migration.md). The DB-first workflow above is for human/solo development.

### Storage (workspace logos)

Workspace logo uploads use **Supabase Storage**. For uploads to work:

1. **Set the service role key** in `.env` (never commit it):

   ```bash
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

   Get it from **Supabase Dashboard → Project Settings → API → service_role** (secret).

2. The app will **create the bucket** `workspace-logos` automatically on first upload when using the service role. Alternatively, run the migration that creates the bucket and RLS policies (`20260202151400_workspace_settings_and_invites.sql`), or create the bucket manually in **Storage** in the Dashboard (public, 5MB limit, allowed MIME types: image/jpeg, image/png, image/webp, image/svg+xml).

Without `SUPABASE_SERVICE_ROLE_KEY`, uploads may fail unless Storage RLS is configured and the anon key has permission.

---

## Remote database (production)

To ensure the **remote** Supabase database matches the local schema and migrations (e.g. after a release to `main`):

1. **Link your remote project** (if not already linked):

   ```bash
   supabase link --project-ref <your-project-ref>
   ```

   Get the project ref from the Supabase Dashboard → Project Settings → General.

2. **Push migrations** to the remote database:
   ```bash
   supabase db push
   ```
   This applies all pending migrations in `supabase/migrations/` to the remote DB. The remote schema and seed data will match what you have locally.

---

## Demo data (testing in production/staging)

The migration `20260202100000_seed_demo_workspace_and_mock_data.sql` seeds a demo workspace **"Espace démo"** with:

- **1 demo user** in `public.users` (email: `demo@example.com`) and **1 workspace** "Espace démo"
- **3 clients** (Acme Corp, Globex Corporation, Jean Dupont)
- **3 formations** (Leadership, Excel avancé, Anglais business) with different statuts and types
- **3 deals** (Lead, Qualification, Proposition) linked to those clients
- **2 formateurs** (Paris, Lyon) with rates and descriptions

This runs automatically when you apply migrations (e.g. `supabase db push` on the remote).

### Accessing the demo workspace

To see this data in the app, add your **auth user** to the demo workspace. After signing in, run in the Supabase SQL Editor (or any Postgres client connected to your project):

```sql
-- Replace YOUR_AUTH_USER_ID with your actual user id (from auth.users or the app)
INSERT INTO workspaces_users (workspace_id, user_id, role)
SELECT id, 'YOUR_AUTH_USER_ID'::uuid, 'admin'
FROM workspaces
WHERE name = 'Espace démo'
ON CONFLICT (workspace_id, user_id) DO NOTHING;
```

Then switch to the workspace **"Espace démo"** in the app (workspace switcher in the sidebar) to view and test with the mock data.
