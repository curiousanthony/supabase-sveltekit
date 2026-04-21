# T-20 Security Audit — `formation_documents` deal link

**Date**: 2026-04-21
**Auditor**: security-analyst
**Scope**: migration `20260421120000_t20_formation_documents_deal_link.sql`, `src/lib/db/schema/documents.ts`, `src/lib/db/relations.ts`
**Verdict**: **FAIL** — one HIGH severity cross-workspace data poisoning vector must be fixed before merge.

---

## Findings

| # | Severity | Location | Issue | Risk | Fix |
|---|----------|----------|-------|------|-----|
| 1 | **HIGH** | migration L54-69 (`formation_documents_insert` `WITH CHECK`) | The `OR` between the formation-scope branch and the deal-scope branch lets a member of workspace A insert a row with `formation_id` ∈ workspace A AND `deal_id` ∈ workspace B. Only one branch needs to pass. | **Cross-workspace data poisoning.** Workspace B members will see an attacker-controlled row (title, type, `storage_path`, `metadata`) attached to their deal via the deal-scope SELECT branch. They can also UPDATE/DELETE it. Title/`metadata` may render in the UI → phishing / stored content injection. `storage_path` may point at attacker-controlled blobs displayed to victim users. | Tighten `WITH CHECK` so each non-null FK must be in the caller's workspace (AND, not OR). See diff below. |
| 2 | **HIGH** | migration L71-86 (`formation_documents_update`) | UPDATE has `USING` but no `WITH CHECK`; PG re-uses `USING` for the new row. Same `OR` flaw → an attacker who owns a row via `formation_id` (workspace A) can pivot it by setting `deal_id` to any deal UUID in workspace B. | Same as #1 (post-creation pivot). Also lets attacker silently re-parent their own docs onto a victim deal. | Add explicit `WITH CHECK` mirroring the hardened insert policy. |
| 3 | Medium | migration L18-20 + L54-103 | No SQL-layer guarantee that when **both** `formation_id` and `deal_id` are set they belong to the same workspace. CHECK can't cross tables, but RLS could enforce it. Without this, T-21's "transfer deal-doc to converted formation" path is one bug away from creating a row that straddles two workspaces. | Defence-in-depth gap; combined with a future RLS regression this re-opens findings #1/#2. | Either the hardened policy in fix-1 (which closes the practical vector by requiring **both** IDs to be in the user's workspace), or a row trigger asserting `formations.workspace_id = deals.workspace_id` when both are set. The hardened policy is sufficient. |
| 4 | Low | storage policy `formation_docs_workspace_*` (`20260410100100_*.sql`) — out-of-patch but newly relevant | Storage policies key off `(storage.foldername(name))[1]::uuid → formations.id`. Pre-formation docs have **no formation**, so any `deals/{dealId}/...` upload is rejected by RLS — or worse, devs may use the service role / a different bucket and bypass workspace scoping. | Pre-formation `storage_path` is currently un-protectable by the existing policy; risk of a bypass being introduced in T-21. | Out of scope for this migration, but T-21 must add a deal-branch to the storage policy (mirror the SQL change here) **before** any deal-stage upload code ships. Flag to T-21. |
| 5 | Low | `documents.ts` L60-66 vs migration L16 | Drizzle FK declares `onUpdate('cascade')` and `onDelete('set null')`, matching the migration. ✅ Consistent — no drift. | None | None. |
| 6 | Info | migration L37-103 | EXISTS with `WHERE f.id = formation_documents.formation_id` returns **false** (not unknown) when `formation_id IS NULL`, because no row satisfies `f.id = NULL`. RLS uses `EXISTS` directly so the OR collapses to the deal branch — behaviour is correct, not a bug. | None | None. |
| 7 | Info | CHECK `formation_documents_belongs_to_formation_or_deal` | Correctly prevents fully-unscoped rows; combined with hardened RLS this guarantees every row is anchored to at least one workspace the writer belongs to. | None | None. |

---

## RLS policy review

Tables modified: `formation_documents` (RLS already enabled in T-6).
Policies dropped + recreated: `select`, `insert`, `update`, `delete` — all four still cover all write paths. ✅
Missing policies: none.
Service-role / `security definer` usage in this patch: none.

---

## Required fix (smallest concrete diff)

Replace the four `CREATE POLICY` blocks in `supabase/migrations/20260421120000_t20_formation_documents_deal_link.sql` with the form below. The principle: every non-null FK must resolve to the caller's workspace; the existing CHECK guarantees at least one is set.

```sql
-- helper: a row is in scope iff every set FK belongs to the caller's workspace.
-- formation_id IS NULL  ⇒ formation branch trivially satisfied
-- deal_id      IS NULL  ⇒ deal branch trivially satisfied
-- The CHECK constraint guarantees they aren't both null.

CREATE POLICY "formation_documents_select"
ON formation_documents FOR SELECT TO authenticated
USING (
  (formation_id IS NULL OR EXISTS (
    SELECT 1 FROM formations f
    JOIN workspaces_users wu ON wu.workspace_id = f.workspace_id
    WHERE f.id = formation_documents.formation_id AND wu.user_id = auth.uid()
  ))
  AND
  (deal_id IS NULL OR EXISTS (
    SELECT 1 FROM deals d
    JOIN workspaces_users wu ON wu.workspace_id = d.workspace_id
    WHERE d.id = formation_documents.deal_id AND wu.user_id = auth.uid()
  ))
);

CREATE POLICY "formation_documents_insert"
ON formation_documents FOR INSERT TO authenticated
WITH CHECK ( /* same predicate as above */ );

CREATE POLICY "formation_documents_update"
ON formation_documents FOR UPDATE TO authenticated
USING       ( /* same predicate */ )
WITH CHECK  ( /* same predicate — required, not optional */ );

CREATE POLICY "formation_documents_delete"
ON formation_documents FOR DELETE TO authenticated
USING ( /* same predicate */ );
```

Why this works:
- **Insert/Update WITH CHECK** now requires that *each* set FK be workspace-owned by the caller → blocks finding #1 and #2.
- **Select/Delete USING** now requires the same → a row that somehow ended up cross-workspace (legacy data, future bug) is invisible to either side instead of visible to both. This is the safer failure mode (no leak) and aligns with the "fail closed" principle.
- The empty-branch short-circuit (`x IS NULL OR EXISTS …`) preserves T-20's intent that pre-formation (formation_id NULL) and post-conversion (both set) rows both work.
- Combined with the existing CHECK constraint, no row can pass without belonging to at least one workspace the caller is in.

Add an explicit `WITH CHECK` to UPDATE — relying on `USING` fall-through is fragile and was the root of finding #2.

---

## Action for ticket owner (T-20)

1. Apply the policy diff above (single migration edit — do not add a new migration; T-20 is unmerged).
2. Add a regression test: as user-A, attempt INSERT with `(formation_id = formationA.id, deal_id = dealB.id)` → expect `42501` (RLS denial).
3. Add a regression test: as user-A, attempt UPDATE setting `deal_id = dealB.id` on a row they own → expect denial.
4. Flag T-21 (storage path for deal-stage docs) to the security analyst before merge.

## Log entry for T-20

`- 2026-04-21 security-analyst: HIGH cross-workspace data poisoning via OR-permissive WITH CHECK on insert/update; required hardened policy diff documented in 2026-04-21-T-20-deal-link-rls.md. Verdict: FAIL until applied.`
