# Security review: T-32 — Document lifecycle schema (`formation_documents`)

**Date:** 2026-04-09  
**Scope:** `supabase/migrations/20260409100000_chunk2_document_lifecycle_schema.sql`, `src/lib/db/schema/documents.ts`  
**Reviewer:** security-analyst

## 1. Summary

**Change-specific risk:** **LOW** — New columns and indexes do not weaken RLS expressions or introduce new server-side trust boundaries by themselves.

**Overall table risk (unchanged):** **HIGH** — `formation_documents` still relies on the pre-existing `formation_documents_all` policy (`USING (true) WITH CHECK (true)`), so tenant isolation is not enforced at the database layer. That gap is unchanged by T-32; lifecycle fields could carry slightly richer operational metadata if data were ever readable across tenants, but the root issue remains permissive RLS (tracked in T-6 / T-7).

---

## 2. Findings (by severity)

### High — Pre-existing permissive RLS (not introduced by T-32)

| Field | Detail |
|-------|--------|
| **Location** | `supabase/migrations/20260323113000_phase0_documents_workspace_emargements.sql` — policy `formation_documents_all` |
| **Issue** | `FOR ALL USING (true) WITH CHECK (true)` allows any authenticated role that passes policy evaluation to read/write all rows. New columns (`accepted_at`, `refused_at`, `expires_at`, `archived_at`, `status_changed_at`, `status_changed_by`, `replaces_document_id`) are visible and updatable under the same policy. |
| **Risk** | Cross-workspace data access if the client uses the user-scoped Supabase client against this table without strict server-side scoping (or if bugs bypass app-layer checks). |
| **Fix** | Workspace-scoped RLS as planned in **T-6** / **T-7**; ensure policies cover SELECT/INSERT/UPDATE/DELETE and match `formation_id` → workspace membership. |

**T-32 note:** The migration does not alter policies; it does not *increase* RLS surface area beyond “more columns per leaked row.”

---

### Medium — Inconsistent FK target: `status_changed_by` → `public.users` vs `generated_by` → `auth.users`

| Field | Detail |
|-------|--------|
| **Location** | Migration T-32 lines 11–12 vs `20260323113000_phase0_documents_workspace_emargements.sql` line 71; Drizzle `documents.ts` uses `users` for both `generatedBy` and `statusChangedBy`. |
| **Issue** | In Postgres, `generated_by` still references `auth.users(id)` while new `status_changed_by` references `public.users(id)`. The Drizzle schema models both against `public.users`, which matches most of the app’s domain model but **not** the live FK on `generated_by`. |
| **Risk** | **Integrity / operational:** Inserts/updates can fail if a UUID exists in `auth.users` but not in `public.users` (or vice versa, depending on column). **Confusion** for future migrations and audits (“which user table is canonical for this row?”). Not a direct RCE; mainly consistency and subtle bug surface. |
| **Fix** | Long term: align all actor FKs on `formation_documents` to one canonical table (typically `public.users` with `id` synced to `auth.users`, or consistently `auth.users` if you only ever store Supabase auth IDs). Optionally add a follow-up migration to repoint `generated_by` to `users(id)` if that matches product rules. |

---

### Low — Self-referencing `replaces_document_id` and cycles

| Field | Detail |
|-------|--------|
| **Location** | Migration line 12; Drizzle FK `formation_documents_replaces_document_id_fkey`. |
| **Issue** | PostgreSQL does not prevent cycles in a self-FK (e.g. A → B → A). |
| **Risk** | Application bugs or malicious crafted updates could create confusing version chains; mainly integrity/UX, not a standalone privilege escalation. |
| **Fix** | Enforce acyclic lineage in application logic or, if needed later, a trigger/check constraint strategy. |

---

### Low — `ON DELETE SET NULL` on `status_changed_by` and `replaces_document_id`

| Field | Detail |
|-------|--------|
| **Location** | Migration lines 11–12. |
| **Issue** | Deleting a referenced user or prior document nulls the FK. |
| **Risk** | **Intentional trade-off:** preserves deletability and avoids cascading removal of documents. Downside: weaker audit trail (unknown who changed status; broken replacement link). Appropriate for many SaaS models; not a security defect. |
| **Fix** | None required for security; if compliance requires immutable attribution, consider soft-delete users or append-only audit logs (separate feature). |

---

### Low — Data migration `draft` → `genere`

| Field | Detail |
|-------|--------|
| **Location** | Migration line 15. |
| **Issue** | Unconditional `UPDATE` for all rows with `status = 'draft'`. |
| **Risk** | No injection or privilege issue (runs as migration role). Possible **business/audit** concern: rows that were truly “draft” become “genere,” which could misrepresent lifecycle for compliance reporting if “draft” had legal meaning. |
| **Fix** | Product validation only; optionally narrow the `WHERE` clause if some `draft` rows must stay draft (out of scope for pure security). |

---

### Low — New indexes

| Field | Detail |
|-------|--------|
| **Location** | Migration lines 21–32. |
| **Issue** | Composite and partial indexes on lifecycle/version fields. |
| **Risk** | None for confidentiality; minor exposure of query patterns to DBAs. Standard. |

---

## 3. RLS policy review (T-32)

| Table | RLS enabled | Policy change in T-32? | Assessment |
|-------|-------------|-------------------------|------------|
| `formation_documents` | Yes (pre-existing) | No | No new policies required *for this migration*; workspace-scoped policies remain **required** for production-grade isolation (T-6/T-7). |

New columns should be included when T-6 defines workspace-scoped `USING` / `WITH CHECK` expressions (e.g. via `formation_id` join to workspace), so lifecycle fields cannot be updated on another tenant’s rows.

---

## 4. Required fixes before shipping (Critical + High)

| Item | Severity | Owner |
|------|----------|--------|
| Replace permissive `formation_documents_all` with workspace-scoped RLS | **High** (pre-existing) | T-6 / T-7 |

**T-32:** No **new** Critical/High defect introduced by the lifecycle columns or the `UPDATE`/`ALTER DEFAULT` statements. Address **Medium** FK consistency when convenient to avoid subtle insert failures and schema drift.

---

## 5. Consistency note (Drizzle vs Postgres)

`src/lib/db/schema/documents.ts` correctly reflects the **new** FK to `users` for `statusChangedBy`. The database still has `generated_by` → `auth.users` from phase 0; teams should treat this as **technical debt** until migrations and Drizzle match the intended single source of truth for user IDs.
