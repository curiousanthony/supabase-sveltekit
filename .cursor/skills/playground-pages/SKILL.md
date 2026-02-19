---
name: playground-pages
description: Creates and maintains SvelteKit playground pages for UI/components under src/routes/playground. Use when adding or updating test/demo pages for components, layouts, or interactions.
---

# Playground & Component Test Pages

Use this skill when you need to create or update a UI playground / test page to exercise components, layouts, or specific interactions. These pages serve as living documentation and stress tests, not production features.

The canonical rules live in `.agent/test-pages.md`; this skill summarizes how to apply them.

---

## When to Use

Apply this skill when:

- The user asks to "add a playground", "test page", "demo page", or "sandbox" for a component or feature.
- You need to verify complex UI states or variants manually.
- You are creating ad‑hoc pages solely to visualize interactions or layouts.

If the page is not part of the real product flow but is only for testing/demo, it belongs in the playground.

---

## Location & Structure

All playground pages must live under:

- `src/routes/playground`

Guidelines:

- Create a dedicated subdirectory per component or feature:
  - Example: `src/routes/playground/card-checkbox/+page.svelte`
  - Example: `src/routes/playground/deal-kanban/+page.svelte`
- Avoid mixing multiple unrelated components in one playground page unless it is explicitly a "kitchen sink" for that feature.

Do **not** add playground routes to the main app navigation.

---

## Content & Coverage

Playground pages are more than scratchpads; they should act as living documentation:

- **Showcase all important states**:
  - Success, error, loading, disabled, empty, overflowing, selected, etc.
- **Showcase key variants**:
  - Sizes, color variants, with/without icons, compact vs full layouts.
- **Contextual usage**:
  - Render components in realistic containers:
    - Narrow sidebars vs wide content areas.
    - Within cards, modals, drawers, or split panes as appropriate.
- **Interactions**:
  - Include buttons/toggles that mutate `$state` to flip between states.
  - Use simple, local state (Svelte 5 runes) rather than complex store wiring.

Think of each playground as a storybook-style page dedicated to one feature.

---

## SEO & Accessibility (Even for Playgrounds)

Even though these routes are for development, keep basic hygiene:

- Use a clear `<h1>` for the main heading.
- Add a descriptive `<title>` and meta description via SvelteKit page metadata.
- Use semantic HTML (`<section>`, `<article>`, `<nav>`, etc.) where appropriate.
- Ensure labels, roles, and interactive elements are accessible and keyboard-friendly.

IDs should be unique and descriptive when used (for testing hooks, ARIA relationships, etc.).

---

## Cleanup & Lifecycle

- Playground pages are primarily for development and ongoing maintenance.
- They should not appear in primary navigation, but it's fine to access them directly via URL (e.g. `/playground/card-checkbox`).
- If a playground is truly obsolete and no longer useful for maintenance or regression checks, it can be removed—but keeping useful playgrounds is encouraged.

For full details and original rules, refer to `.agent/test-pages.md`.

