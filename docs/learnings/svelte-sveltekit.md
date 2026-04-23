# Svelte / SvelteKit Learnings

Project-specific patterns discovered during development. Read this file before implementing Svelte components or SvelteKit routes/actions.

- **SvelteKit navigation**: `replaceState` from `$app/navigation` must not run before the router is ready — on pages that read URL params in `$effect`, guard with `onMount` + `requestAnimationFrame`.
- **Kanban / boards**: Reuse an existing route's pattern (`flex`, `overflow-x-auto`, sensible `min-w` / `max-w` columns) instead of inventing a new grid/breakpoint layout.
- **Filters**: When removing or hiding a filter category, if the active filter equals that category, reset to `all` so the list does not look broken.
- **PDFs (French)**: Use `Intl` for currency; normalize narrow/no-break spaces (`U+202F` / `U+00A0`) for fonts like Helvetica; centralize shared timezone (e.g. `PDF_TIMEZONE`) across templates.
- **Exhaustive unions**: For enums like document type, use `default` + `assertNever` so missing cases fail at compile time.
- **Status transitions**: Reuse helpers like `transitionStatus` / timestamp maps — avoid manually setting fields the helper already applies.
- **Email**: Prefer Postmark templates; do not keep a parallel raw-HTML send path for the same flow.
- **Quest / sub-actions**: Map lifecycle steps using sub-action `orderIndex`, not title matching.
- **Compliance / warnings**: When two routes need the same derived warnings, compute once in a shared layout load instead of duplicating per-page queries.
- **Long-form text inputs**: For multi-line inputs (textarea, `publicVise`, description fields), use explicit **Modifier / Enregistrer** + **Annuler** (⌘+Entrée shortcut) rather than blur-save; blur mid-thought destroys in-progress work.
- **`$derived.by` type anchoring**: Always supply an explicit type parameter (`$derived.by<Array<{...}>>(() => ...)`) when the derived returns different shapes on different branches — otherwise svelte-check infers a broad union and downstream field access fails. Return named-field objects, never tuples; named fields survive HMR and read well in templates.
- **Field migration completeness**: When porting a field to a derived value, update every dependent calculation in one pass — a single orphan reference keeps the deprecated field alive through transitive UI, defeating the "deprecate in one release cycle" plan.
- **Smart form defaults are additive only**: Only fill a field when the user's current value is empty (`if (!existingValue)`). "Source changes → fill label" sounds right until the user has typed a custom value and re-selects the source to double-check — their input vanishes and trust erodes.
- **Shared descriptor lookups**: Reusable label/descriptor lookups keyed by enum value belong in `src/lib/utils/*.ts` (no Svelte, no DB imports) — importable by both UI components and server services without import cycles or runtime cost.
- **Feature toggle – writable override**: A toggle backed by a computed default must use `let override = $state<boolean | null>(null); const value = $derived(override ?? computedDefault)` — never destructively clear the underlying field on toggle-off; an accidental click must be recoverable and consistent with persisted data on refresh.
- **Route path drift**: Plan docs drift faster than code — always `rg` for the actual route before trusting a plan's path references (e.g. plan says `/parametres/organisme` but code has `/parametres/workspace`).
- **Fallback resolution boundary**: When a feature has a "default at level N, override at level N+1" shape (e.g. workspace default → per-formation override), resolve the fallback **once at the loader/service boundary** (`entity.field = entity.field ?? workspace.default`). Never scatter `??` across templates, PDF builders, and components — one missed spread silently diverges the day someone forgets it.
- **TypeScript brand types for trusted data**: For "data must come from a trusted source" invariants, use a brand type (`type Authenticated<X> = X & { readonly __brand: 'Authenticated' }` + single mint helper) rather than docstrings — refactors that add a new caller break the build instead of silently passing client input through. Pair with an RLS `WITH CHECK` clause for defense in depth.
