# T-13 Security audit — preflight, RLS, audit log

**Date:** 2026-04-13  
**Ticket:** T-13  
**Overall risk:** **MEDIUM** (after closing the suivi preflight bypass)

## Summary

RLS on `formation_audit_log` correctly scopes SELECT/INSERT to workspace members via `formations` → `workspaces_users`. Server actions on the documents route enforce preflight on DB-backed context and validate `documentType`. Two gaps stood out: **quest document generation could skip preflight** when the workspace row was missing, and **`warningsAcknowledged` is not validated** against server-computed warning ids before audit logging. Application DB access uses Drizzle + `DATABASE_URL`, which typically **bypasses Postgres RLS**; RLS remains important for PostgREST/Supabase client access and defense in depth.

## Findings

### High

| Severity | Location | Issue | Risk | Fix |
|----------|----------|--------|------|-----|
| High | `src/routes/(app)/formations/[id]/suivi/+page.server.ts` (`generateQuestDocument`) | Preflight lived inside `if (workspaceRow) { ... }`; if `workspaceRow` was absent, **generation proceeded with no `assertPreflightOrThrow`** | Legally required checks (client, séance, prerequisites) could be skipped in edge cases (e.g. inconsistent DB) | **Fixed:** return 404 when workspace missing; always run preflight (parity with documents route) |

### Medium

| Severity | Location | Issue | Risk | Fix |
|----------|----------|--------|------|-----|
| Medium | `src/routes/(app)/formations/[id]/documents/+page.server.ts` (`generateDocument`) | `warningsAcknowledged` parsed from FormData (comma-separated) **not intersected** with `preflightResult.items` where `severity === 'warn'` | Spurious or forged warning ids in `formation_audit_log.newValue`; weak compliance trail | After `evaluatePreflight`, allow only ids present in current warn items; ignore or reject unknown ids |
| Medium | `supabase/migrations/20260413110000_rls_formation_audit_log.sql` | INSERT `WITH CHECK` ensures membership on `formation_id` but **not** `user_id = auth.uid()` | If rows are ever inserted via PostgREST as `authenticated`, a member could attribute audit rows to another `user_id` | Add `WITH CHECK (... AND user_id = auth.uid())` (and same for SELECT if rows must be self-attributed) |
| Medium | App architecture (`src/lib/db/index.ts`) | Drizzle uses **direct Postgres** connection; RLS does not apply to that role | Security depends on server code paths; RLS alone does not protect app inserts | Keep mutations server-only; document that RLS targets API/PostgREST exposure |

### Low

| Severity | Location | Issue | Risk | Fix |
|----------|----------|--------|------|-----|
| Low | `src/lib/services/audit-log.ts` | `newValue`/`oldValue` JSON-stringified from arbitrary objects | If UI ever renders audit JSON as HTML without escaping, theoretical stored XSS | Treat audit values as text; escape in UI |
| Low | `src/lib/preflight/document-preflight.ts` | Used from server **and** could be imported client-side for UI | Preflight results must not be sole authority; server already re-runs | Ensure no mutation paths trust client-only preflight (current generation paths are server-side) |

### Critical

**None** identified in the reviewed scope.

## RLS policy review — `formation_audit_log`

| Operation | Required | Status |
|-----------|----------|--------|
| ENABLE RLS | Yes | Yes |
| SELECT | Workspace member via formation | `formation_audit_log_select` |
| INSERT | Same | `formation_audit_log_insert` |
| UPDATE / DELETE | Should be denied for immutability | No policies → denied for `authenticated` |

**Suggested hardening:** tie `user_id` to `auth.uid()` on INSERT if the table is exposed to Supabase clients.

## Required fixes (before ship)

1. **High:** Suivi quest document path must not skip preflight — **addressed in code** (same response as this artifact).
2. **Medium (recommended):** Validate `warningsAcknowledged` against server-side warning item ids before `logAuditEvent`.

## RLS Policy Review (summary)

- **formation_audit_log:** SELECT + INSERT for `authenticated`, workspace-scoped via `EXISTS` join `formations` + `workspaces_users` and `auth.uid()`. No UPDATE/DELETE policies (immutable audit).
