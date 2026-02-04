# Project Rules & Constitution

## 1. Tech Stack Constraints

- **Framework**: SvelteKit (Latest). Use **Svelte 5 Runes** syntax (`$state`, `$derived`, `$effect`) exclusively.
- **UI Library**: shadcn-svelte. Refer to [docs/shadcn-svelte.md](../docs/shadcn-svelte.md) for available components.
- **Database**: Supabase (PostgreSQL).
- **ORM**: Drizzle ORM.
- **Styling**: TailwindCSS.

## 2. Coding Standards

- **Reactivity**: Follow the [Svelte 5 Runes Guide](../docs/svelte5-runes.md). Avoid legacy `export let` or `$:`.
- **TypeScript**: Strict mode. No `any`. Define interfaces/types for all data structures.
- **Components**: Use functional components. Keep logic inside the component or in `*.svelte.ts` modules.

## 3. Database Workflow (Agents)

**Agents** must use the **schema-first** workflow so that the local database and Drizzle schema stay in sync and features work on first run. Follow [.agent/workflows/database-migration.md](workflows/database-migration.md).

- **Process for agents**:
  1. Edit `src/lib/db/schema.ts` (tables, columns, relations).
  2. Run `npm run db:generate`.
  3. Run `supabase db reset` (required: applies the new migration locally so the app works).
  4. Run `supabase db push` only when deploying to remote (e.g. when integrating or releasing).
- **Never assume** the local database has the latest migrations without running `supabase db reset` after adding or pulling migrations.
- **DATABASE_URL**: For local dev, must point to local Supabase (e.g. `postgresql://postgres:postgres@127.0.0.1:54322/supabase`) so `db:generate` works. See [docs/database.md](../docs/database.md).
- **Forbidden**: NEVER use `npm run db:push` or `npm run db:migrate`.

**Human / solo workflow** (edit in Dashboard → `db:pull` → `db:generate` → deploy) is documented in [docs/database.md](../docs/database.md); agents do not use that flow.

## 4. Git & Version Control

- **Base branch for features**: `develop` (not `main`). Create all feature branches from `develop`.
- **Commits**: Follow **Conventional Commits** (`feat:`, `fix:`, `chore:`).
- **Branches**: Use `type/description` (e.g. `feat/user-auth`, `fix/login-error`).
- **PRs**: Optional for solo dev. PRs to `main` are only for releases (when merging `develop` → `main`). Day-to-day integration is into `develop`.
- **Versioning**: Automated via Semantic Release on `main`. Do not manually bump versions.

## 5. Documentation

- **Language**: English for code/comments. French/English for documentation (as requested).
- **Maintenance**: Update `docs/` whenever workflows or patterns change.

## 6. UI / UX Patterns

- **No right-side Sheet for secondary content**: Do not use a Sheet (or similar panel) that slides in from the **right** to show secondary content (e.g. formateurs, séances, detail panels). Prefer **in-page sections** (scroll/focus to a section) or **full-page routes** instead. Right-side panels fragment the flow; in-page content keeps the user on the same context. (Bottom or left Sheets, e.g. for mobile step picker or sidebar, are acceptable.)

## 7. Testing & Playgrounds

- **Rule**: Follow the [Component Testing Rules](test-pages.md) for all ad-hoc UI testing.
- **Location**: All test pages must live in `src/routes/playground/[feature-name]`.
- **Coverage**: Showcase components in all possible use cases, states, and situations.
