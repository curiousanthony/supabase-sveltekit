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

## 3. Database Workflow

- **Source of Truth**: The local Supabase database is the source of truth for schema.
- **Process**:
  1. Edit schema in Supabase Dashboard (`local`).
  2. Run `npm run db:pull`.
  3. Run `npm run db:generate`.
  4. Run `supabase db push` (to deploy).
- **Forbidden**: NEVER use `drizzle-kit push` or `drizzle-kit migrate`.

## 4. Git & Version Control

- **Base branch for features**: `develop` (not `main`). Create all feature branches from `develop`.
- **Commits**: Follow **Conventional Commits** (`feat:`, `fix:`, `chore:`).
- **Branches**: Use `type/description` (e.g. `feat/user-auth`, `fix/login-error`).
- **PRs**: Optional for solo dev. PRs to `main` are only for releases (when merging `develop` → `main`). Day-to-day integration is into `develop`.
- **Versioning**: Automated via Semantic Release on `main`. Do not manually bump versions.

## 5. Documentation

- **Language**: English for code/comments. French/English for documentation (as requested).
- **Maintenance**: Update `docs/` whenever workflows or patterns change.

## 6. Testing & Playgrounds

- **Rule**: Follow the [Component Testing Rules](test-pages.md) for all ad-hoc UI testing.
- **Location**: All test pages must live in `src/routes/playground/[feature-name]`.
- **Coverage**: Showcase components in all possible use cases, states, and situations.
