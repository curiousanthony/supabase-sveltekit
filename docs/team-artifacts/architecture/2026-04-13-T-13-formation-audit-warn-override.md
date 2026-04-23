# T-13 Task 5 — Warning override audit (`formation_audit_log`)

## Summary

`formation_audit_log` **already exists** in Drizzle (`src/lib/db/schema/formations.ts` → `formationAuditLog`) and was created in `supabase/migrations/20260319100000_quest_system.sql`. Columns **`action_type`**, **`entity_type`**, **`new_value`** (text) match the plan: store `document_generation_warnings_overridden` and JSON payload via text. **`logAuditEvent`** in `src/lib/services/audit-log.ts` already `JSON.stringify`s `newValue` / `oldValue`.

**Gap**: No **RLS** on `formation_audit_log` today (only `CREATE TABLE` + index). For workspace isolation when using the `authenticated` role, add policies mirroring `20260410100000_rls_formation_documents_workspace_scope.sql` (join `formations` → `workspaces_users`).

## Schema design (current — no column changes)

| Column (DB)        | Drizzle              | Use for Task 5 |
|--------------------|----------------------|----------------|
| `formation_id`     | `formationId`        | Required on insert (FK to `formations`) |
| `user_id`          | `userId`             | Actor (`auth` user id) |
| `action_type`      | `actionType`         | `'document_generation_warnings_overridden'` |
| `entity_type`      | `entityType`         | Prefer `'formation'` + `entityId = formationId` for a generation event scoped to the formation; use `'formation_document'` + document UUID only if a concrete `formation_documents.id` exists and should be tied to the log line |
| `entity_id`        | `entityId`           | Optional UUID per choice above |
| `field_name`       | `fieldName`          | `null` |
| `old_value`        | `oldValue`           | `null` |
| `new_value`        | `newValue`           | Object → serialized JSON, e.g. `{ documentType, warningIds: string[] }` (small payload) |
| `created_at`       | `createdAt`          | default now |

Index: `idx_formation_audit_log_formation` on `formation_id` (exists).

## Migration plan

1. **RLS only** (reversible: `DROP POLICY` + `DISABLE ROW LEVEL SECURITY`):

   - `ALTER TABLE formation_audit_log ENABLE ROW LEVEL SECURITY;`
   - **`formation_audit_log_select`** — `FOR SELECT TO authenticated` `USING (EXISTS (...))` where `f.id = formation_audit_log.formation_id` and `wu.user_id = auth.uid()`.
   - **`formation_audit_log_insert`** — `FOR INSERT TO authenticated` with same predicate in `WITH CHECK`.

   Do **not** grant `UPDATE`/`DELETE` on audit rows to members unless a separate admin story exists.

2. **No new Drizzle fields** unless product later adds `jsonb` for `new_value` (optional; text is sufficient and matches existing service).

## API surface

- After successful `generateDocument` when `warningsAcknowledged.length > 0`, call:

  `logAuditEvent({ formationId, userId, actionType: 'document_generation_warnings_overridden', entityType: 'formation', entityId: formationId, newValue: { documentType, warningIds } })`

- Degraded behavior: `logAuditEvent` without a transaction client already swallows errors and logs to console (`audit-log.ts`); aligns with plan “if insert fails, still allow generation”.

## Service extraction

- **Reuse** `logAuditEvent`; optional thin wrapper in `audit-log.ts` (e.g. `logDocumentGenerationWarningsOverridden`) for typed payload and stable action string — not required for correctness.

## TypeScript

- Add a **const** for the action type literal (e.g. `export const AUDIT_ACTION_DOCUMENT_WARNINGS_OVERRIDDEN = 'document_generation_warnings_overridden' as const`) next to `AuditEntry` to avoid typos; optional `zod` or interface for `newValue` payload if desired.

## Questions

- None blocking: choose **`entityType: 'formation'`** unless implementer has a strong need to point at a specific `formation_documents` row immediately after insert.
