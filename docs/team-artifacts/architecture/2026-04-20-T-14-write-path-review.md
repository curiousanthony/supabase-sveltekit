# T-14 — Batch generation write-path review

**Date:** 2026-04-20
**Architect:** architect
**Ticket:** T-14
**Inputs:**
- `docs/plans/2026-04-20-T-14-batch-generation.plan.md`
- `docs/team-artifacts/product/2026-04-20-T-14-batch-generation-analysis.md`
- `src/routes/(app)/formations/[id]/documents/+page.server.ts`
- `src/lib/db/schema/{documents,formations}.ts`
- `src/lib/services/{audit-log,document-generator}.ts`

**Verdict:** **AMBER** — proceed with the caveats in §6.

---

## 1. Workspace scope confirmation

Trace for `generateForAll` (plan Task 2):

- **Auth gate.** `getUserWorkspace(locals)` (plan L141) → `safeGetSession()` (L143) → `verifyFormationOwnership(params.id, workspaceId)` (L146) before any DB write or Storage upload. Mirrors `generateDocument` lines 159-165 of the existing file. **Confirmed: ownership verified before writes.**
- **Per-learner write.** Inside the loop, `generateDocument(type, params.id, user.id, { contactId })` (plan L270-275) and the optional `db.delete(formationDocuments).where(...id == existing.id ... AND status = 'genere')` (plan L279-284) both key off `params.id` (the already-verified formation). `formationDocuments.formationId` FK enforces the link to the verified formation. **No workspace boundary crossed.**
- **Audit log row.** `formation_audit_log` schema (`schema/formations.ts:325-355`) has NO `workspace_id` column — workspace scope is **derived via `formationId → formations.workspaceId`**. The plan passes `formationId: params.id` to `logAuditEvent` (L288), which is correct. ⚠️ Note: `formation_audit_log.formationId` FK uses `onDelete('set null')`, so historical audit rows survive formation deletion as orphaned-but-typed entries; that is the existing project policy.
- **T-47 surface.** New Drizzle queries introduced by this action that the T-47 workspace-clause audit must inventory:
  1. `db.query.formationDocuments.findMany({ where: and(eq(formationDocuments.formationId, params.id), eq(formationDocuments.type, type)) })` — plan L198-204. Scoped to formationId only; relies on the upstream `verifyFormationOwnership` for workspace safety.
  2. `db.delete(formationDocuments).where(eq(id, existing.id) AND eq(status, 'genere'))` — plan L279-284. Indirectly scoped (the id was loaded from query #1).
  3. `loadPreflightRows(params.id, workspaceId)` — already workspace-scoped via `formations.workspaceId` clause in the existing helper (`+page.server.ts:24`).
  4. `db.insert(formationDocuments)` — happens *inside* `generateDocument` (services/document-generator.ts:542-556); `formationId` arg is the verified one. Already in scope of the ongoing T-47 audit because `generateDocument` is the central insert site.
  5. `db.insert(formationAuditLog)` — happens inside `logAuditEvent` (services/audit-log.ts:30-32). `formationId` is the verified one.

  None of these widen the existing workspace surface; they reuse already-audited helpers under an upstream ownership guard.

---

## 2. Schema fit

**`formationDocuments` columns referenced by batch:** `formationId` (uuid notNull), `type` (text notNull), `status` (text default 'genere'), `relatedContactId` (uuid nullable), `generatedAt`, `storagePath`, `generatedBy`, `metadata` — all present (`schema/documents.ts:17-108`). No new columns required.

**Unique-constraint check on `(formationId, type, relatedContactId)`:** **None.** The table has indexes on `(formationId)`, `(type)`, `(status)`, and a composite `(formationId, type, status)` for read paths, but **no `unique()` constraint** that would block N rows per learner. The plan's idempotency policy (skip if `envoye/signe/archive/accepte`; in-place replace if `genere`; otherwise let `remplace` history coexist) is therefore **schema-compatible as designed**. Application-layer dedup via `existingByContact` is the enforcement point — fine.

**`formationAuditLog` payload check:**

| Plan field | Schema column | Type | Compatible? |
|---|---|---|---|
| `actionType: 'document_batch_generated'` | `action_type` | `text notNull` | ✓ |
| `entityType: 'formation_document'` | `entity_type` | `text` | ✓ |
| `entityId: newResult.documentId` | `entity_id` | `uuid` | ✓ |
| `newValue: { documentType, contactId, batchId, warningsAcknowledged }` | `new_value` | **`text`** (NOT `jsonb`) | ✓ via `JSON.stringify` (audit-log service L26-27) |

⚠️ **`new_value` is `text`, not `jsonb`.** The audit service serializes via `JSON.stringify`, so writes succeed. Future analytics queries (e.g. "give me all docs for `batchId = X`") will need `(new_value::jsonb ->> 'batchId')` casts. Out of scope for T-14 but worth flagging to T-46 for the audit-scope inventory.

**`logAuditEvent` signature.** Already accepts every field the plan needs (`AuditEntry` interface, audit-log.ts:6-15). No service change required.

---

## 3. Write ordering & atomicity

**Per-learner sequence (plan L269-301):**
1. `generateDocument(...)` — internally (a) generates PDF buffer, (b) uploads to Supabase Storage, (c) `db.insert(formationDocuments)`. **Not transactional.**
2. *(optional)* `db.delete(formationDocuments)` of the old `genere` row.
3. `logAuditEvent(...)` — wrapped in a try/catch in the service that **silently swallows errors** (audit-log.ts:35-39).

**Atomicity gaps identified:**

| Step that fails | Resulting state | Severity |
|---|---|---|
| Storage upload | Throws, no DB write | Clean — caller catches and reports `failed` |
| `db.insert(formationDocuments)` after Storage upload OK | Orphaned PDF in Storage; no DB row | Pre-existing risk, same as today's `generateDocument` |
| `db.delete(old genere)` after new insert OK | Briefly two `genere` rows for same `(formationId, type, contactId)` | Minor — UI shows latest first; resolves on next regenerate |
| `logAuditEvent` after both writes OK | New doc row exists, audit row is silently lost | **Qualiopi gap** — batch's per-learner audit trail is the entire compliance contract for this feature |

**Recommendations:**

- **Required:** Make audit failure visible for batch. Either (a) call `logAuditEvent` with the explicit-client signature (passing `db` so errors throw), then push a `result.warning` into the per-learner result, or (b) wrap *delete-old + audit-log* in `db.transaction` so a missing audit row also rolls back the deletion of the previous `genere` row. Option (a) is the lighter touch; the implementer can choose.
- **Not required:** Wrapping `generateDocument`'s internal insert + the outer delete in a single transaction would force a refactor of `generateDocument` (extract a tx-aware variant). Out of scope for T-14.
- **Storage non-atomic.** If the DB write fails after Storage upload, an orphan PDF remains. Document — do not block. Same pre-existing failure mode as single-doc generation; addressing it project-wide is a separate ticket (Storage-GC sweeper).

---

## 4. Concurrency cap of 3 verified

**pdfmake mutable state.** `generatePdfBuffer` (services/document-generator.ts:207-224) calls `pdfmake.setFonts({Helvetica: ...})` on every invocation. pdfmake 0.3.7 is a CJS singleton — `setFonts` mutates global font registry. ✓ Safe under concurrency: **the registry is set to the same constant value on every call**, so parallel writes converge to the same state. `pdfmake.createPdf(docDefinition)` returns a fresh doc instance per call, no shared output buffer. **No corruption risk at concurrency 3.**

**Storage path uniqueness.** `uploadToStorage` builds `${formationId}/${type}_${suffix}_${Date.now()}.pdf` where `suffix = contactId.slice(0, 8)` for convocation/certificat (services/document-generator.ts:336, 386). Within a single batch, every learner has a different `contactId`, so suffixes differ → **no collision risk between parallel learners**. Across re-runs for the same learner, `Date.now()` differs by ≥1ms; even on a hash collision the bucket call uses `upsert: false` (line 242), so the upload would fail-loud rather than overwrite. ✓

**Verdict on `CONCURRENCY = 3`:** safe. The inline pool is fine.

---

## 5. Audit log T-46 coordination

- **`userId` source.** Plan L289: `userId: user.id` from `locals.safeGetSession()` (L143). ✓ Matches T-46's "auth.uid from server locals only, never from client" pattern. The form data parse on L149-154 reads only `type` and `warningsAcknowledged` — no `userId` field exists in the form contract.
- **Action-type inventory note for T-46.** Add `'document_batch_generated'` to T-46's audit-scope catalogue. Existing related action types in the codebase: `'document_generation_warnings_overridden'` (already in `+page.server.ts:235`), `'field_update'` (`audit-log.ts:54`). The new one is conceptually parallel to the warnings-override row but carries per-learner identity in `newValue.contactId` plus the `batchId` correlator.
- **Side note for T-46 reviewer.** Because `new_value` is text (§2), T-46's eventual security review may want to budget for a future `jsonb` migration if any audit query becomes cross-cutting (e.g. "Qualiopi export: all documents for batch X").

---

## 6. Verdict

**AMBER — proceed with the caveats below.** The schema accepts everything the plan writes, workspace scope is preserved end-to-end, the concurrency cap is genuinely safe, and audit-log payload fits without service-layer changes. The one substantive risk is that `logAuditEvent` silently swallows failures, which would let the batch produce documents without their Qualiopi audit row — that must be addressed during implementation, not after.

### Must-do during implementation (caveats)

1. **Audit-log failures must not be silent in batch path.** Either call `logAuditEvent(entry, db)` (explicit-client form, throws on failure) inside a per-learner `db.transaction` that also encloses the `db.delete` of the old `genere` row, or surface the audit failure into the per-learner `LearnerResult` as a non-blocking warning. Pick one before merging Task 2.
2. **Document the JSON-as-text storage in the audit row.** Implementer should add a one-line comment at the `logAuditEvent` call site noting that `newValue.batchId` is searchable only via `(new_value::jsonb ->> 'batchId')`, so future Qualiopi export queries don't accidentally `LIKE '%batchId%'` the text column.
3. **T-47 audit inventory addendum.** When the workspace-clause audit ticket runs, add the four new query sites listed in §1 to its inspection list. They are all safe today via the upstream `verifyFormationOwnership` guard, but they should be visible in the inventory.
4. **Storage orphan tolerance is documented, not fixed.** The `Storage upload OK → DB insert fails` gap pre-exists in `generateDocument`; T-14 inherits it. Implementer should not invent a new mitigation here; if a project-wide Storage-GC ticket is desired, file separately.

No schema migration is required. No existing constraint blocks the planned writes.

---

## Open questions for the user / orchestrator

None blocking. The four caveats above are implementer-actionable.
