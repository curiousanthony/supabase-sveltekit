# T-14 Batch Generation — Code Review

**Date:** 2026-04-20
**Reviewer:** reviewer (Ask mode)
**Verdict:** **APPROVE_WITH_FIXES**

Caveat 1 (audit-log failure surfacing) is correctly implemented. Per-learner preflight, concurrency cap, idempotency, and cancellation match the plan. Types are clean. A few accessibility and UX-copy issues should be fixed before merge.

## 1. Critical findings (must fix)

_None._

## 2. High findings (should fix before merge)

| # | Title | File:Line | Issue | Fix |
|---|---|---|---|---|
| H1 | `prefers-reduced-motion` not respected for the cosmetic sweep | `src/lib/components/documents/BatchGenerateDialog.svelte:73-81` | Plan §Task 4 explicitly requires "replace `animate-spin` **and 'sweep'** with static '…' via CSS guard." `motion-safe:animate-spin` covers the spinner, but the 600 ms `setInterval` sweep still mutates row state for users who set `prefers-reduced-motion: reduce`. | Guard the `setInterval` with `window.matchMedia('(prefers-reduced-motion: reduce)').matches` — when reduced, set every row to `'generating'` immediately (no animation) and skip the interval. |
| H2 | Spinner icons not marked `aria-hidden` | `BatchGenerateDialog.svelte:223-231, 272` | Lucide SVG icons are exposed to AT by default. Screen readers will announce decorative iconography alongside the already-readable text labels. | Add `aria-hidden="true"` to all Loader2/Check/AlertTriangle/MinusCircle/Clock icons inside the result/progress lists. |

## 3. Medium findings

| # | Title | File:Line | Issue | Fix |
|---|---|---|---|---|
| M1 | `[Compléter →]` link tap target < 44px on mobile | `BatchGenerateDialog.svelte:275-282` | `variant="link" size="sm" class="h-auto p-0"` produces a sub-24px tap target — fails iOS HIG / WCAG 2.5.5 on the 375px viewport target listed in Task 10. | Use at least `min-h-11 px-2` or wrap the row's right side with a larger hit area (`<a class="block py-2">`). |
| M2 | "Régénérer pour tous" / "Générer pour les N restants" can lie about results | `+page.svelte:1080-1098` (CTA), server `+page.server.ts:611-621` (skip set) | When all docs are `envoye`, the CTA reads "Régénérer pour tous" but the server SKIPs every learner. Marie expects N regenerations; she sees `0 done / N skipped`. | Either (a) change CTA copy to "Régénérer pour tous (sans modifier les envoyées)" when any doc is in `envoye/signe/archive/accepte`, or (b) add a one-line explanatory subtitle on the confirm dialog. |
| M3 | Native `window.confirm()` for cancellation breaks Dialog focus context & dark mode | `BatchGenerateDialog.svelte:160-163` | Native confirm dialogs are not styled, jarring UX, inconsistent with shadcn surface, pull focus away from parent Dialog. | Use `AlertDialog` from `$lib/components/ui/alert-dialog`. |
| M4 | Storage orphan after audit-failure rollback | `+page.server.ts:721-735` | When `logAuditEvent` fails, `db.delete(formationDocuments)` runs but PDF in Supabase Storage remains. Same orphan class as existing single-doc path. | Acceptable per architect §3. Add a TODO comment referencing the Storage-GC ticket. |

## 4. Low findings / suggestions

| # | Title | Note |
|---|---|---|
| L1 | `as unknown as` cast in test fixture | Acceptable in tests; consider typing `makeEvent` against `RequestEvent` parameter helpers. |
| L2 | Cast `batchDocType as DocumentType` | Structurally safe. `generateDocument` could accept the union directly via overloads — minor. |
| L3 | `formationLearners.length - item.total` may go negative | Handled by `<= 0`, but `Math.max(0, …)` would be clearer. |
| L4 | `r.reason` switch in `reasonToFr` is not exhaustive | Acceptable open union; keep the server `reason` field stable. |

## 5. Verified — what was done well

- **Architect caveat 1 (audit failure)** implemented exactly: catch → roll back doc row → push `failed` with `reason: 'audit_log_failed'`. Test `caveat-1` covers it.
- **Discriminated union `LearnerResult`** with no `any` and no `as unknown as` in source.
- **`PreflightContext.contactEmail: string | null | undefined`** preserves single-doc UI semantics while enabling per-learner mode (presence of `contactId` toggles).
- **3-slot inline pool** is the simplest correct shape; no new dependencies; `request.signal.aborted` checked at the right two points.
- **T-13 reuse**: `?preflightFocus=email&focusContactId=...&returnTo=...` URL pattern reused; `PreflightResumeBanner` mounted in `+layout.svelte:62` (no duplication).
- **Svelte 5 idioms**: only runes, `$bindable()` on `open`, `onclick`/`onOpenChange`, no `<svelte:fragment>`, no `$:`.
- **shadcn-svelte compliance** for Dialog/Button/Checkbox/Progress.
- **`aria-live="polite"`** on progress text.
- **No new dependencies** (`p-limit` correctly avoided per plan).
- **No `console.log` left behind** (only `console.error` in catch blocks — deliberate).
- **One audit row per `done`** with shared `batchId`; skipped/failed write nothing — matches Qualiopi contract.
