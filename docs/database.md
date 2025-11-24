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

### 🚫 Do NOT use `db:push` or `db:migrate`
We have disabled `npm run db:push` and `npm run db:migrate`.
- **Reason:** These commands bypass Supabase's migration history tracking, which leads to "relation already exists" conflicts when you try to deploy later.
- **Always** use the workflow above to ensure Drizzle and Supabase stay in sync.

### Troubleshooting
If you encounter **"relation already exists"** errors during `supabase db push`:
1.  This usually means the migration was already applied (perhaps manually or via UI) but Supabase doesn't know about it.
2.  Use `supabase migration repair` to mark the conflicting migration as "applied".
