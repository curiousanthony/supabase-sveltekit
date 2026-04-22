# Security audit: T-12 Regeneration prompt

**Date:** 2026-04-13  
**Scope:** `formations.updated_at` schema/migration, `regenerateDocument` action, documents page stale UI.

## Summary

**Overall risk: LOW** — The new server action follows the same workspace and formation scoping pattern as existing document actions. The migration is a standard `updated_at` column plus an existing trigger function. No Critical or High issues tied to this ticket’s changes.

## Findings

### Low — Informational: Stale UI vs. documents load consistency

- **Location:** `src/routes/(app)/formations/[id]/documents/+page.svelte` (e.g. `isDocStale`, `formationUpdatedAt`); `src/routes/(app)/formations/[id]/+layout.server.ts` (formation load).
- **Issue:** The stale banner compares `formation.updatedAt` (from layout `data.formation`) with each document’s `generatedAt`. The documents `load` returns an empty list when `verifyFormationOwnership` fails, so users without access to the formation’s workspace do not see document rows or stale banners for those rows. The indicator itself does not introduce a new authorization primitive.
- **Risk:** None specific to the stale UI beyond the app’s existing data-exposure model for `data.formation` (broader layout scoping is outside this ticket’s diff).
- **Fix:** Optional hardening: align formation layout loads with explicit workspace checks for defense-in-depth (separate backlog if not already tracked).

_No Critical, High, or Medium findings for the scoped changes._

## RLS policy review

- **Migration:** Adds `updated_at` on `public.formations` and a `BEFORE UPDATE` trigger calling `public.set_updated_at()`. No new tables; no policy changes required by this migration alone.
- **Trigger function:** `set_updated_at()` only assigns `NEW.updated_at := now()` — no dynamic SQL, no elevated privilege pattern beyond normal trigger behavior.

## Required fixes before shipping

None for this ticket’s changes (no Critical/High).

## Notes on specific questions

1. **`regenerateDocument` auth and workspace:** Requires `getUserWorkspace`, `safeGetSession`, `verifyFormationOwnership(params.id, workspaceId)`, then loads the document with `formationDocuments.id` **and** `formationDocuments.formationId = params.id`. Cross-formation document IDs yield 404, not cross-tenant mutation.
2. **Regenerate document “they don’t own”:** Not under a user’s workspace formation: blocked by `verifyFormationOwnership`. Wrong `documentId` for that formation: 404 from `oldDoc` query.
3. **Delete for `genere` path:** `delete` uses `oldDoc.id` and `params.id` (formation) in the `WHERE` clause — same pattern as `deleteDocument`.
4. **Migration:** No additional security concerns identified.
5. **Stale indicator leakage:** Shows only that formation data changed relative to generation time, to users who already receive `documents` and `formation` in the page data model; server still enforces regeneration rules (`signe` blocked).
