# Security audit: T-6 RLS for `formation_documents`

**Scope:** `supabase/migrations/20260410100000_rls_formation_documents_workspace_scope.sql`  
**Overall risk (this migration):** **LOW** — workspace isolation logic is correct.  
**Overall risk (document feature end-to-end):** **MEDIUM** — related `storage.objects` and `formation_emails` policies remain overly permissive.

## Summary

The new policies correctly tie each row to a `formations` row whose `workspace_id` matches a `workspaces_users` row for `auth.uid()`. `formation_id` is `NOT NULL` with a FK to `formations`, so NULL/orphan edge cases do not bypass the policy. `TO authenticated` matches Supabase’s client role model (anon has no access unless separate policies exist). The main remaining exposure is the **formation-documents storage bucket**, where any authenticated user can read/write/delete objects regardless of workspace.

## Findings (by severity)

### High

| Location | Issue | Risk | Fix |
|----------|--------|------|-----|
| `supabase/migrations/20260323113000_phase0_documents_workspace_emargements.sql` (~154–167) | Policies `formation_docs_auth_read` / `_upload` / `_delete` only check `bucket_id = 'formation-documents'`. | Any authenticated user can access **all** PDFs/objects in that bucket, bypassing table RLS. | Scope policies to workspace (e.g. path prefix = `workspace_id`, same idea as workspace logos `(storage.foldername(name))[1] = w.id::text`) and membership (and optionally role). |
| Same file (~128–129) | `formation_emails_all` uses `USING (true) WITH CHECK (true)`. | Cross-tenant read/write on formation email metadata. | Mirror the `formation_documents` EXISTS pattern on `formation_id → formations → workspaces_users`, or equivalent. |

### Medium

| Location | Issue | Risk | Fix |
|----------|--------|------|-----|
| Policy design vs workspace logos | `formation_documents_delete` allows any workspace member to delete; logos restrict to `owner`/`admin` (`20260202151400_workspace_settings_and_invites.sql`). | Over-deletion / audit trail abuse by low-privilege members. | If product requires it, add `AND wu.role IN ('owner', 'admin')` (or your canonical roles) on DELETE (and possibly INSERT/UPDATE). |

### Low

| Location | Issue | Risk | Fix |
|----------|--------|------|-----|
| `workspaces_users` indexes | Only `unique_workspace_user (workspace_id, user_id)` is defined in baseline migrations. | At large scale, EXISTS may scan more rows when resolving by `user_id`. | Consider `CREATE INDEX ... ON workspaces_users (user_id)` if profiles show sequential scans. |
| `formations` RLS | No `ENABLE ROW LEVEL SECURITY` on `formations` found in searched migrations. | If `formations` is exposed via PostgREST without RLS, formation metadata could leak independently of document RLS. | Confirm production schema; add workspace-scoped RLS on `formations` if clients query it directly. |

## RLS policy review — `formation_documents`

| Operation | Clause | Assessment |
|-----------|--------|------------|
| SELECT | `USING (EXISTS …)` | Correct — only rows for formations in the user’s workspace(s). |
| INSERT | `WITH CHECK (EXISTS …)` | Correct — cannot insert into another workspace’s formation. |
| UPDATE | `USING (EXISTS …)` only | **OK** — PostgreSQL defaults `WITH CHECK` to the same expression as `USING` when omitted, so changing `formation_id` is re-validated. |
| DELETE | `USING (EXISTS …)` | Correct for membership; see Medium for role tightening. |

**Edge cases:** `formation_id` is `NOT NULL`; FK to `formations` prevents orphaned documents. `f.id = formation_documents.formation_id` with INNER JOIN semantics via EXISTS ensures no match if the formation row is missing.

**`TO authenticated`:** Appropriate for Supabase JWT-authenticated clients; avoids granting `anon` access.

## Required fixes before shipping (defense in depth)

1. **High:** Tighten `storage.objects` policies for `formation-documents` to enforce workspace (and path convention) alignment with `formation_documents.storage_path` / app uploads.  
2. **High:** Replace permissive `formation_emails` policies with workspace-scoped policies.

## Knowledge base labels

`T-6`, `formation_documents`, `RLS`, `workspace isolation`, `formation-documents storage`, `formation_emails`, `20260410100000_rls_formation_documents_workspace_scope.sql`
