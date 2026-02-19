---
name: svelte5-stack
description: Enforces the SvelteKit 5 + shadcn-svelte + Tailwind + Drizzle + Supabase stack conventions. Use when adding or editing Svelte components/routes, UI, forms, or server logic in this project.
---

# Svelte 5 Application Stack

Use this skill whenever you write or modify application code in this repo. It encodes the core tech stack and patterns:

- **Framework**: SvelteKit (latest) with **Svelte 5 Runes**.
- **UI**: `shadcn-svelte` components, plus TailwindCSS utilities.
- **State & reactivity**: Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`).
- **Backend**: Supabase (PostgreSQL) via **Drizzle ORM**.

---

## When to Use

Apply this skill when:

- Creating or editing Svelte components (`*.svelte`) or route files under `src/routes`.
- Building forms, tables, dashboards, or interactive UI.
- Implementing server logic, loaders, or actions that touch the database.
- Refactoring older code that might still use Svelte 4 patterns.

If you are touching Svelte files or app logic, assume this skill applies.

---

## Core Conventions

### 1. Svelte 5 Runes Only

- Use **Svelte 5 runes** for state and props:
  - `$state` for reactive state.
  - `$derived` for computed values.
  - `$effect` for reactive side effects.
  - `$props` for component props.
- **Avoid legacy patterns**:
  - Do not use `export let` for props.
  - Do not use `$:` labels or reactive statements.
  - Prefer rune-based lifecycle instead of `onMount`/`afterUpdate` when possible.

Refer to `docs/svelte5-runes.md` for examples and details when needed.

### 2. UI Components: shadcn-svelte + Tailwind

- Default to **`shadcn-svelte` components** for UI building blocks (buttons, inputs, dialogs, sheets, etc.).
- Use **TailwindCSS** utility classes for layout and styling.
- Avoid introducing new UI libraries unless the user explicitly requests it.
- For discovering appropriate components and usage patterns, consult `docs/shadcn-svelte.md` which indexes the upstream documentation.

### 3. Data & Persistence: Supabase + Drizzle

- Use **Drizzle ORM** as the data access layer.
- Define and maintain schema in `src/lib/db/schema.ts`.
- Interact with Supabase/Postgres through Drizzle models rather than raw SQL, unless there is a strong reason not to.
- For schema changes or migrations, use the `supabase-database-migration` skill.

### 4. TypeScript

- Assume **strict TypeScript**:
  - Avoid `any`; prefer explicit types and generics.
  - Define interfaces/types for domain objects used across the app.
- Keep route modules and components strongly typed, especially around form data, API responses, and DB models.

---

## Patterns for New Code

When adding new features (pages, components, or flows):

1. **Routing & layout**
   - Place new pages under `src/routes` following SvelteKit conventions.
   - Use layout files for shared structure when appropriate.

2. **State management**
   - Use `$state` for local component state.
   - Derive computed values with `$derived`.
   - Use `$effect` for side-effects that depend on reactive state.

3. **Forms & validation**
   - Use existing form libraries in the project (e.g. `sveltekit-superforms`, `formsnap`, `zod`) according to established patterns in the codebase.
   - Validate data at the edge (server-side) and reflect errors in the UI.

4. **Database access**
   - Use Drizzle query builders rather than ad‑hoc SQL.
   - Keep DB access in dedicated modules or server-load/action files as appropriate, not inside pure UI components.

---

## Quick Checklist for Edits

Before finalizing Svelte-related changes, verify:

1. [ ] Components use Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`) instead of legacy patterns.
2. [ ] UI uses `shadcn-svelte` components and Tailwind utilities where appropriate.
3. [ ] Database interactions use Drizzle and align with `src/lib/db/schema.ts`.
4. [ ] Types are explicit and avoid `any`; core data structures have well-defined types.
5. [ ] If schema changed, the `supabase-database-migration` skill/workflow has been followed.

For deeper details and examples, see `.agent/rules.md`, `docs/svelte5-runes.md`, and `docs/shadcn-svelte.md`.

