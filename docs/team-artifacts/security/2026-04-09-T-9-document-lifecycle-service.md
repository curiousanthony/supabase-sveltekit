# Security review: T-9 — Document lifecycle service (`document-lifecycle.ts`)

**Date:** 2026-04-09  
**Scope:** `src/lib/services/document-lifecycle.ts`, usage from `src/routes/(app)/formations/[id]/documents/+page.server.ts` (load only)  
**Reviewer:** security-analyst

## 1. Summary

**Change-specific risk:** **MEDIUM** — Core transition validation is sound and queries are parameterized, but **`replaceDocument` does not prove the replacement row belongs to the same formation**, which can corrupt cross-formation data. There is also **no transaction or row locking**, so concurrency and partial-failure scenarios weaken integrity.

**Broader context:** `formation_documents` still has permissive RLS (`USING (true)`), as noted in [2026-04-09-T-32-document-lifecycle-schema.md](./2026-04-09-T-32-document-lifecycle-schema.md). The service uses the app’s Drizzle `db` (server-side); tenant isolation remains an application responsibility until T-6/T-7 RLS hardening ships.

**Mutation call sites:** At review time, `transitionStatus`, `cancelFormationDocuments`, and `replaceDocument` are **not yet invoked** from `+page.server.ts` (only `getEffectiveStatus` is imported). Future actions **must** mirror existing patterns: `getUserWorkspace`, session user, and `verifyFormationOwnership` before calling these helpers, and **`user.id` must come only from the authenticated session**, never from form input.

---

## 2. Findings (by severity)

### High — `replaceDocument` does not scope `newDocumentId` to the formation

| Field | Detail |
|-------|--------|
| **Location** | `src/lib/services/document-lifecycle.ts` — `replaceDocument`, second `update` (~lines 285–288) |
| **Issue** | After validating the **old** document with `(id, formationId)`, the code updates **any** row whose `id = newDocumentId`, without `eq(formationDocuments.formationId, ctx.formationId)`. |
| **Risk** | A caller who can mutate documents for formation A can set `replaces_document_id` on a document that belongs to formation B (if they know or guess UUIDs), breaking lineage integrity and linking unrelated workspaces’ data in the database. |
| **Fix** | Load `newDocumentId` with `and(eq(id, newDocumentId), eq(formationId, ctx.formationId))` (or equivalent), reject if missing. Optionally ensure the new row is the expected type / state for replacement. Wrap old+new updates in a **single transaction**. |

---

### Medium — No transactions; partial failure and inconsistent state

| Field | Detail |
|-------|--------|
| **Location** | `replaceDocument` (two updates + audit); `cancelFormationDocuments` (per-document update + audit in a loop) |
| **Issue** | Operations are not wrapped in `db.transaction()`. If the second update or an audit insert fails, the first update may already be committed. `logAuditEvent` swallows errors (`try/catch` + `console.error`), so **DB state can change without a corresponding audit row**. |
| **Risk** | Operational integrity and compliance: status or replacement links may not match the audit trail; admins cannot fully reconstruct who did what. |
| **Fix** | Use a transaction for multi-step mutations; treat audit failure policy explicitly (fail the transaction vs. best-effort log with monitoring). |

---

### Medium — Concurrent `transitionStatus` without row-level locking

| Field | Detail |
|-------|--------|
| **Location** | `transitionStatus` — read then update (~lines 142–184) |
| **Issue** | Two concurrent requests can both read the same `fromStatus`, both pass `isValidTransition`, and the last `UPDATE` wins. Transitions valid from the **initial** state might both appear legal while the resulting state skips the intended intermediate status or violates intended ordering. |
| **Risk** | Incorrect lifecycle state under load; harder-to-debug race bugs than direct privilege escalation. |
| **Fix** | Use `SELECT … FOR UPDATE` inside a transaction, or compare-and-set on `(id, status)` in the `UPDATE` `WHERE` clause so an intervening change causes zero rows updated and the caller can retry or fail. |

---

### Medium — Audit attribution trusts caller-supplied `userId`

| Field | Detail |
|-------|--------|
| **Location** | `transitionStatus`, `cancelFormationDocuments`, `replaceDocument` — `logAuditEvent({ userId: … })` |
| **Issue** | The service does not validate that `userId` matches the current session; it records whatever the caller passes into `formation_audit_log`. |
| **Risk** | If any future route passes client-controlled or spoofable input as `userId`, audit entries could attribute actions to the wrong user. |
| **Fix** | Document a strict contract: server actions must pass `locals`/session `user.id` only. Optionally add an overload that accepts `AuthenticatedContext` and resolves `userId` internally to reduce misuse. |

---

### Low — Defense in depth: final `UPDATE` omits `formationId` in `WHERE`

| Field | Detail |
|-------|--------|
| **Location** | `transitionStatus` — `update(...).where(eq(formationDocuments.id, ctx.documentId))` (~line 184) |
| **Issue** | The initial `findFirst` constrains `formationId`, but the write only filters by primary key. Document IDs are almost certainly globally unique, so this is unlikely to be exploitable. |
| **Risk** | Low; mainly consistency if IDs were ever reused or copied across environments. |
| **Fix** | Add `and(eq(formationDocuments.id, ctx.documentId), eq(formationDocuments.formationId, ctx.formationId))` on all writes for consistency with reads. |

---

### Low — “Trust the caller” for workspace authorization

| Field | Detail |
|-------|--------|
| **Location** | Entire service — no `workspaceId` / membership checks |
| **Issue** | Authorization is delegated to callers (e.g. `verifyFormationOwnership` in `+page.server.ts`). This matches a thin domain-service pattern but creates **footguns** if the module is imported from a new route or job without the same checks. |
| **Risk** | Future misuse could expose mutations without tenant checks. |
| **Fix** | Acceptable **if and only if** every entry point is reviewed to enforce workspace ownership (and session) before calling. Prefer documenting this in a file-level comment or passing an opaque `AuthorizedFormationContext` produced only by verified loaders/actions. |

---

### Low — `getEffectiveStatus` and corrupt `status` strings

| Field | Detail |
|-------|--------|
| **Location** | `getEffectiveStatus` (~lines 313–323) |
| **Issue** | Returns `doc.status as DocumentStatus` when devis expiry does not apply. Invalid DB values are not validated here. |
| **Risk** | UI or downstream logic may see unexpected status strings; not a direct data exfiltration vector on the server path shown (data already loaded under the same access rules as the page). |
| **Fix** | Optional: validate against known statuses or fall back to a safe display state. |

---

### Informational — Runtime `toStatus` / string safety

| Field | Detail |
|-------|--------|
| **Location** | `transitionStatus` — `isValidTransition(docType, fromStatus, toStatus)` |
| **Issue** | TypeScript types do not exist at runtime; callers could pass arbitrary strings. |
| **Assessment** | **Acceptable:** `getValidTransitions(...).includes(to)` only returns true for enumerated target statuses. Invalid strings are rejected before any `UPDATE`. Invalid **from** statuses from the DB are gated by `isValidStatus(docType, fromStatus)`. |

---

### Informational — SQL injection

| Field | Detail |
|-------|--------|
| **Location** | All queries in `document-lifecycle.ts` |
| **Assessment** | Uses Drizzle query builder with bound parameters; **no** string-concatenated SQL or `sql.raw` in this file. |

---

## 3. RLS policy review

No new tables. Mutations target existing `formation_documents` and `formation_audit_log`. Required posture remains:

- Workspace-scoped RLS on `formation_documents` (and related tables) per **T-6 / T-7** — see T-32 security note for current permissive policy risk.

---

## 4. Required fixes before shipping

1. **High:** In `replaceDocument`, verify `newDocumentId` belongs to `ctx.formationId` (and reject otherwise); use a transaction for the paired updates (+ audit policy as above).
2. **Medium (strongly recommended):** Add concurrency safety (`FOR UPDATE` or compare-and-set `WHERE status = fromStatus`) for `transitionStatus`.
3. **Medium (recommended):** Transaction + clear audit failure semantics for multi-step operations.

---

## 5. Answers to review questions (concise)

| Question | Answer |
|----------|--------|
| Trusting caller for workspace checks | **Acceptable** only if every call site enforces workspace + session; service-wide risk is **Low** as a pattern, **High** if misused. |
| Runtime `toStatus` | **Safe:** invalid targets fail `isValidTransition` before write. |
| Races | **Yes**, concurrent transitions can yield invalid effective ordering; mitigate with locking or conditional updates. |
| Malicious `userId` | **Yes** if passed from untrusted input; **No** if always `session.user.id` from server actions. |
| SQL injection | **None observed** in this module (Drizzle only). |
| `getEffectiveStatus` exposure | **No extra exposure** beyond already-loaded document rows; minor integrity concern for corrupt `status` values only. |
