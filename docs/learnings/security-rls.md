# Security / RLS Learnings

Project-specific patterns discovered during development. Read this file before auditing or writing RLS policies, Storage policies, or auth flows.

- **RLS without `workspace_id`**: When a table has no direct `workspace_id`, plan `EXISTS` chains through parent tables to `workspaces_users` (or equivalent) so every policy path stays tenant-scoped; never widen policies to avoid the JOIN.
- **Polymorphic-FK RLS — AND, never OR**: When a row can be scoped via either of two parent FKs (polymorphic), use `AND` across `(fk_a IS NULL OR EXISTS(...in my workspace))` conditions — **never `OR` between two `EXISTS`**. The OR form lets a member of workspace A write a row where their A-side FK is valid but the B-side FK points at a victim's parent; workspace B can then SELECT it through their EXISTS branch, creating a cross-tenant pivot attack surface. The AND form requires every non-null FK to resolve to the caller's workspace and fails closed on legacy/buggy cross-tenant rows.
- **Explicit `WITH CHECK` on UPDATE policies**: Always add an explicit `WITH CHECK` clause to UPDATE policies — relying on PostgreSQL's USING fall-through for the write check has historically been a foot-gun for pivot attacks where the old row passes USING but the new row targets another tenant.
- **Storage path policies**: `(storage.foldername(name))[1]::uuid` is the standard pattern to extract the entity id from the first folder segment of the path convention `{entityId}/filename.ext`.
- **Storage operations**: Object replace/remove must happen only after a successful upload + DB consistency; validate keys against expected prefixes (e.g. `workspaceId/`) before any destructive Storage call.
