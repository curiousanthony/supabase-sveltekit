# Security Audit: T-34 Document Lifecycle Transition Service

**Date**: 2026-04-10  
**Scope**: `src/lib/services/document-lifecycle.ts`, `src/lib/db/schema/documents.ts`, `src/lib/services/audit-log.ts` (plus `formation_audit_log` definition in `src/lib/db/schema/formations.ts` for audit review).  
**Decision context**: `docs/decisions/2026-04-09-chunk2-document-lifecycle-ux.md`  
**RLS note**: Document/workspace RLS is explicitly deferred to T-6/T-7; gaps there are not rated Critical here.

## Summary

**Overall risk: MEDIUM**, with **High** findings around **audit trail atomicity and reliability** that should be fixed before treating lifecycle changes as compliance-grade evidence.

## Findings (by severity)

### High

| # | Location | Issue | Risk | Fix |
|---|----------|--------|------|-----|
| H1 | `document-lifecycle.ts` — `cancelFormationDocuments` (approx. L223–L255) | `db.transaction` wraps document `update` calls, but `logAuditEvent` uses the global `db` and commits on a **separate connection**. If the transaction fails after some iterations (or rolls back), **audit rows for earlier iterations may already be persisted** while document rows roll back → misleading or false audit history. | Auditors or admins trust `formation_audit_log` for Qualiopi-style traceability; log can disagree with actual DB state. | Perform audit inserts with the **same `tx`** (e.g. `tx.insert(formationAuditLog)`), or emit audit only **after** successful transaction commit (outbox / deferred job). Do not interleave autonomous commits inside a multi-row transactional loop. |
| H2 | `document-lifecycle.ts` — `replaceDocument` (approx. L265–L345) | Same pattern: transactional `tx.update` calls followed by `logAuditEvent` on global `db` while the transaction may still be completing. Under connection/commit ordering edge cases, **audit can diverge from document state** (less likely than H1 but same class). | Same as H1. | Use `tx.insert(formationAuditLog)` inside the callback, or log only after explicit successful commit. |
| H3 | `audit-log.ts` — `logAuditEvent` (approx. L15–L28) | Failures are **swallowed** (`try/catch` + `console.error` only). Callers always see success from the logging perspective. | Silent loss of audit entries while mutations succeed (or partial success) undermines integrity and incident response. | Surface failures to callers (return `Result`), or rethrow after logging; for regulated flows, **fail the mutation** if audit insert fails (or use a transactional outbox with retry). |

### Medium

| # | Location | Issue | Risk | Fix |
|---|----------|--------|------|-----|
| M1 | `document-lifecycle.ts` — `transitionStatus` (approx. L190–L198) | Initial read scopes by `documentId` **and** `formationId`, but the `UPDATE` `WHERE` only includes `id` and `fromStatus`, **not** `formationId`. | If `formation_id` were ever mutable or a bug passed inconsistent context, defense-in-depth would be weaker; optimistic lock still limits races on status. | Add `eq(formationDocuments.formationId, ctx.formationId)` to the update predicate. |
| M2 | Service layer (no file line — architectural) | **No authorization** in the service: it trusts `TransitionContext` (`documentId`, `formationId`, `userId`). | Acceptable only if **every caller** is a server path that already verified session + workspace membership and RLS/T-6/T-7 enforce isolation. | Document as a hard requirement; add optional guard helpers or assert workspace on call sites. |
| M3 | `TransitionContext` / `cancelFormationDocuments` params | **No UUID or Zod validation** in the service. | Invalid IDs fail at DB or cause confusing errors; not a direct bypass if upper layers validate. | Validate UUIDs (or branded types) at API/form action boundary; optional light check in service. |
| M4 | `transitionStatus` (approx. L190–L214) | Status update and audit are **not one transaction**; combined with H3, state can change without a durable log. | Weaker than H1 but same compliance story. | Wrap update + audit in a single transaction or post-commit outbox. |

### Low

| # | Location | Issue | Risk | Fix |
|---|----------|--------|------|-----|
| L1 | `transitionStatus` error strings (approx. L166–L174) | Messages include `fromStatus`, `toStatus`, `docType`. | Minor information leak to whoever receives API errors (helps enumeration). | Map to generic client messages; keep detail server-side only. |
| L2 | `audit-log.ts` — `JSON.stringify` for `oldValue`/`newValue` | Circular structures or `BigInt` can throw; error is caught by H3. | Rare logging failure. | Safe serializer or structured serialization with explicit handling. |
| L3 | `formation_audit_log` schema (`formations.ts` approx. L322–L351) | Append-only integrity and tamper resistance depend on **DB policies/triggers** (not visible in these files). | RLS/update policies are T-6/T-7; app inserts only today. | Ensure migrations restrict UPDATE/DELETE on audit table to privileged roles only. |

## RLS policy review

- **`formation_documents`** (in `documents.ts`): RLS not in scope of this diff; ensure T-6/T-7 cover SELECT/INSERT/UPDATE/DELETE with workspace isolation.
- **`formation_audit_log`**: Ensure policies allow insert for authenticated app role as needed, **disallow** arbitrary update/delete for end users, and align with workspace scoping.

## Required fixes before shipping (Critical + High)

- **H1, H2, H3** must be addressed for any claim that “all transitions are logged” in a compliance context: same-transaction audit, post-commit logging, or fail-closed behavior when logging fails.

## Race conditions (`transitionStatus`)

- **Optimistic lock** via `WHERE id = ? AND status = fromStatus` is appropriate: concurrent writers get `updated.length === 0` and a safe user message.
- Adding `formationId` to the `UPDATE` predicate (M1) tightens consistency without changing the race model.

## Injection

- Drizzle query builders use bound parameters; **`sql` fragments in `documents.ts` indexes** are static template literals (no user input). No SQL injection identified in scoped files.

## Knowledge base labels

`T-34`, `document-lifecycle`, `formation_audit_log`, `logAuditEvent`, `cancelFormationDocuments`, `replaceDocument`, `transitionStatus`, `audit-atomicity`
