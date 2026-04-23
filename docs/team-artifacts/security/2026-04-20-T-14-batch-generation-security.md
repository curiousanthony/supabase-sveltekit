# T-14 — Batch generation security audit

**Date:** 2026-04-20
**Analyst:** security-analyst
**Ticket:** T-14
**Inputs:**
- `docs/plans/2026-04-20-T-14-batch-generation.plan.md`
- `docs/team-artifacts/architecture/2026-04-20-T-14-write-path-review.md`
- `src/lib/preflight/document-preflight.ts`
- `src/routes/(app)/formations/[id]/documents/+page.server.ts` (action `generateForAll`, L606-846)
- `src/routes/(app)/formations/[id]/documents/+page.svelte`
- `src/routes/(app)/formations/[id]/apprenants/+page.svelte`
- `src/lib/components/documents/BatchGenerateDialog.svelte`
- `src/lib/services/audit-log.ts` (cross-check on caveat #1)
- `src/lib/components/preflight/PreflightResumeBanner.svelte` (open-redirect guard)

---

## 1. Verdict

**PASS_WITH_NOTES** — workspace isolation, auth hardening, input validation, and
open-redirect protection are all clean. **One HIGH finding blocks the Qualiopi
contract:** the audit-failure rollback path implemented in `generateForAll` is
*dead code* because `logAuditEvent` is called without the explicit-client argument
and therefore swallows errors internally. This must be fixed before T-14 is
considered Qualiopi-safe; the rest can ship as documented notes.

Counts: **0 critical · 1 high · 3 medium · 4 low**.

---

## 2. Critical

_None._

---

## 3. High

| # | Location | Issue | Risk | Fix |
|---|---|---|---|---|
| H-1 | `+page.server.ts:769-800` | The per-learner `try/catch` around `logAuditEvent({...})` cannot ever observe an audit failure. `logAuditEvent` is called with the **single-arg** signature; in that branch the service wraps its insert in its own `try/catch` and **silently swallows** errors (`audit-log.ts:35-39`). The outer rollback (`db.delete(formationDocuments).where(eq(id, newResult.documentId))`) is therefore unreachable on real audit failures. | Architect caveat #1 (`write-path-review.md` §3, §6) is **not implemented**. Batch can produce `formationDocuments` rows with no `formation_audit_log` row → Qualiopi audit gap (the entire contract of T-14). Failure modes that hit this: `formation_audit_log` insert errors (FK violation if formation deleted between gate and write, transient DB error, RLS surprise once T-46/T-47 land). | Pass `db` as the second arg so the service uses the explicit-client branch (which throws): `await logAuditEvent({...}, db);`. The existing outer `try/catch` will then correctly fire the rollback and emit the `'audit_log_failed'` per-learner result. Add a unit test that mocks `db.insert` for `formationAuditLog` to throw and asserts (a) the doc row is deleted, (b) the result row has `status: 'failed'`, `reason: 'audit_log_failed'`. |

---

## 4. Medium

| # | Location | Issue | Risk | Fix |
|---|---|---|---|---|
| M-1 | `+page.server.ts:606-846` (whole action) | No rate limit per workspace/user. PDF generation is CPU-bound and concurrency is 3, so a malicious or buggy client can fire `generateForAll` repeatedly (each time spinning up to 3 parallel pdfmake jobs) until the SvelteKit worker is starved. Idempotency map prevents *DB* duplicates but does not prevent CPU/Storage churn (each call still re-reads, re-evaluates preflight, and may re-write `genere` rows). | DoS — a single tenant can degrade the shared SvelteKit instance for everyone. Cost — Supabase Storage egress / write churn. Pre-existing for single-doc generation but amplified ×N by batch. | Add a per-(workspaceId, action) in-memory or Redis sliding window (e.g. 5 batches / 5 min). Out-of-MVP-scope per plan, but record explicitly as a follow-up ticket so it does not get lost. |
| M-2 | `+page.server.ts:769-800` rollback path | When the audit-fail rollback fires (after H-1 is fixed), the rollback only deletes the `formationDocuments` row — the underlying PDF in Supabase Storage (`{formationId}/{type}_{suffix}_{ts}.pdf`) is **not** removed. | Storage orphan accumulates per audit failure. No cross-tenant impact (path is workspace-prefixed and Storage RLS still scopes reads), but it widens the pre-existing orphan surface noted by architect §3. | After deleting the doc row in the rollback, attempt a best-effort `supabase.storage.from('documents').remove([newResult.storagePath])` (requires returning `storagePath` from `generateDocument` if not already exposed; check service signature). Wrap in its own try/catch — do not let storage failure mask the original audit error. |
| M-3 | `+page.server.ts:670-683` (`existingByContact` map loaded once) + `+page.server.ts:706-818` (per-learner loop) | Two-tab race: Marie clicks "Générer pour tous" in two tabs simultaneously. Each invocation snapshots `existingByContact` BEFORE the other tab's writes land. Result: both tabs may regenerate the same learner, producing two rows whose `status='genere'`; the in-place delete in tab B targets only the `existing.id` it saw, leaving tab A's row intact. UI eventually shows the latest, but two `genere` rows briefly co-exist for the same `(formationId, type, contactId)` and **two audit rows are emitted with different `batchId`s**. | Qualiopi noise (duplicate `document_batch_generated` rows for the same learner across two batchIds). No security boundary crossed. | Same risk surface as `regenerateAll` (existing). Architect already classified it as out-of-scope for T-14. **Defer with explicit advisory-lock ticket** — flag for the next round. Do not paper over with a client-side single-flight; that does not protect the server. |

---

## 5. Low

| # | Location | Issue | Risk | Fix |
|---|---|---|---|---|
| L-1 | `+page.server.ts:756-761` (`db.delete(formationDocuments).where(and(eq(id, existing.id), eq(status, 'genere')))`) | Defense-in-depth: the `where` clause omits `formationId`. The `existing.id` was loaded from a `formationId`-scoped query (L672-678), so this is safe today. But a future refactor that reuses this delete with a different source for `existing.id` could cross workspaces silently. | Cross-tenant delete if the upstream query ever changes shape. | Add `eq(formationDocuments.formationId, params.id)` to the `and(...)` for both this delete and the rollback delete (L789-791). Mirrors `deleteDocument` action (L291-296). Cheap. |
| L-2 | `+page.server.ts:789-791` rollback delete | Same as L-1: rollback delete keys only on `id`. The id is fresh (just generated), so collision impossible — but again, defense-in-depth. | Same as L-1. | Same as L-1. |
| L-3 | `BatchGenerateDialog.svelte:121` | The per-learner `[Compléter →]` URL is built with the correct `?resumeBatch=` param, but `PreflightResumeBanner.svelte` only recognizes `resumeGenerate=` (T-13 contract). The same-origin filter (L19-30 of the banner) still rejects open-redirect payloads, so this is a UX nit not a security bug. The banner WILL render with the generic label "Reprendre la génération du document" instead of "des convocations". | UX degradation only. No security impact. | Out of scope for this audit; either add `resumeBatch` to `PreflightResumeBanner`'s label-derivation switch or change T-14 to use `resumeGenerate`. Track separately. |
| L-4 | `+page.svelte:621-630` (`formationLearners`) | `formationLearners` is exposed to the client and includes each learner's email. This is the same data already on the apprenants tab (no new exfiltration), but worth noting since the batch dialog ships emails into a script-tag-serialized prop. | None today (data is in same workspace). Will need re-evaluation if/when the documents page gains a "shared link" mode. | No action; record so the next read of this file does not panic. |

---

## 6. RLS Policy Review

**No new tables, no schema changes** (per architect §2). Existing policies on
`formationDocuments` and `formationAuditLog` remain in force. This action does NOT
bypass RLS in any new way — every query is scoped via the upstream
`verifyFormationOwnership` guard, identical to the proven pattern in
`generateDocument` (L159-249) and `regenerateAll` (L376-490).

**Drizzle bypass note:** Drizzle queries in this file run as the service role and
do not enforce RLS at the database layer. T-47's workspace-clause audit is the
remediation. See §8 below for the new query inventory.

---

## 7. Coordination notes for T-46

Add to T-46's audit-scope inventory:

1. **New `actionType`:** `'document_batch_generated'`
   - Emitted from: `+page.server.ts:773`
   - `userId` source: `locals.safeGetSession().user.id` (verified — never from `formData`).
   - `formationId` source: `params.id` (verified — bound by `verifyFormationOwnership` at L612-613).
   - `newValue` payload: `{ documentType, contactId, batchId, warningsAcknowledged }`. Stored as TEXT (per architect §2). Future Qualiopi export queries that filter by `batchId` must use `(new_value::jsonb ->> 'batchId')`.
2. **Sibling action types already in this file** (for completeness):
   - `'document_generation_warnings_overridden'` (L236)
   - Single-doc generation does not currently emit a per-doc audit row; only batch does. Worth a discussion in T-46.
3. **H-1 dependency:** the audit-row guarantee is currently broken (see §3). T-46
   should not close until H-1 is verified fixed and the rollback path is unit-tested.

---

## 8. Coordination notes for T-47 (workspace-clause audit)

New Drizzle query sites added by `generateForAll` (`+page.server.ts:606-846`).
All are safe today via the upstream `verifyFormationOwnership` gate (L612-613)
but should appear in T-47's inventory:

| # | Line | Query | Workspace scope |
|---|---|---|---|
| 1 | L629 | `loadPreflightRows(params.id, workspaceId)` | Direct (already in helper). |
| 2 | L672-678 | `db.query.formationDocuments.findMany({ where: and(eq(formationId, params.id), eq(type, batchDocType)) })` | Indirect via `params.id` gate. |
| 3 | L750-752 | `generateDocument(batchDocType, params.id, user.id, { contactId })` → internal `db.insert(formationDocuments)` (services/document-generator.ts) | Indirect via `params.id` gate. Already on T-47 list (central insert). |
| 4 | L756-761 | `db.delete(formationDocuments).where(and(eq(id, existing.id), eq(status, 'genere')))` | Indirect via L2. **L-1 above suggests adding `formationId` clause for defense-in-depth.** |
| 5 | L770-782 | `logAuditEvent(...)` → internal `db.insert(formationAuditLog)` (services/audit-log.ts) | Indirect via `formationId` arg → `formations.workspaceId` derivation. |
| 6 | L789-791 | `db.delete(formationDocuments).where(eq(id, newResult.documentId))` (rollback) | Indirect via L3. **L-2 above suggests adding `formationId` clause.** |

None widen the existing surface. T-47 should fold these into its single tracking
table rather than treating them as a new policy class.

---

## 9. Required fixes before ship

- **H-1:** Pass `db` as the second arg to `logAuditEvent` so the architect's
  caveat #1 actually takes effect. Add a unit test that exercises the rollback.

## 10. Recommended (non-blocking)

- **L-1, L-2:** Add `eq(formationDocuments.formationId, params.id)` to both
  delete clauses (cheap, defense-in-depth).
- **M-2:** Best-effort Storage cleanup in the rollback path.
- **M-1:** Open a follow-up ticket for per-workspace rate-limiting on
  generation actions (covers `generateDocument`, `regenerateAll`, `generateForAll`).
- **M-3:** Open a follow-up ticket for advisory-lock-based two-tab serialization
  on generation actions (covers same three actions).
