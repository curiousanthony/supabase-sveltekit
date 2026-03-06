# AGENTS.md

## Cursor Cloud specific instructions

### Architecture

Mentore Manager is a monolithic SvelteKit 5 app backed by Supabase (Postgres, Auth, Storage, Realtime). The package manager is **Bun** (`bun.lock`). See `README.md` for standard commands (`bun run dev`, `bun run build`, etc.) and `docs/setup-dev.fr.md` for the full local setup guide.

### Starting services

1. **Docker** must be running before Supabase can start.
2. **Supabase local stack**: `supabase start` (pulls/starts ~12 Docker containers; first run is slow). Use `supabase status` to get API keys.
3. **SvelteKit dev server**: `bun run dev --host` (port 5173).

The `.env` file is created from `.env.dev.example`. The only keys that must be filled are `PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (from `supabase status`), and `INVITE_TOKEN_SECRET` (any random hex string, e.g. `openssl rand -hex 32`). OAuth keys (`GITHUB_*`, `GOOGLE_*`) are optional for local dev.

### Known issues

- **Duplicate migration**: `supabase/migrations/20260226110000_bibliotheque_tables.sql` overlaps with `20260225190000_bibliotheque_tables.sql`. This migration has been made idempotent (using `DO $$ ... EXCEPTION WHEN duplicate_object ...$$` blocks and `IF NOT EXISTS`) to avoid `supabase start` / `supabase db reset` failures.
- **Prettier errors on some `.svelte` files**: Two files (`src/lib/_archived/ajouter/+page.svelte` and `src/routes/test-card-checkbox/+page.svelte`) cause `TypeError: getVisitorKeys is not a function` in Prettier. This is a pre-existing compatibility issue, not a blocker.
- **`svelte-check` reports ~46 errors**: Mostly Zod/Superforms type mismatches. Pre-existing; does not block `bun run dev` or `bun run build`.

### Docker in Cloud Agent VM

Docker runs inside a nested container environment. The daemon requires `fuse-overlayfs` as the storage driver and `iptables-legacy`. These are configured during initial setup. After VM restart, Docker daemon may need to be started explicitly: `sudo dockerd &>/tmp/dockerd.log &` then `sudo chmod 666 /var/run/docker.sock`.

### Testing

- `bun run test` — runs Vitest (currently 1 test file with 4 tests).
- `bun run lint` — runs Prettier + ESLint.
- `bun run check` — runs `svelte-check` for type errors.
