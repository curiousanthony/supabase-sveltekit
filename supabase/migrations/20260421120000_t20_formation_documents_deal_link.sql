-- T-20: link formation_documents to a deal so pre-formation documents (e.g. devis)
-- can be created at the deal stage and carried over when the formation is created.
--
-- Schema changes:
--   1. formation_id becomes nullable (a doc may live on a deal before any formation exists)
--   2. deal_id added (nullable, FK to deals.id, ON DELETE SET NULL — orphan rows kept
--      so the formation history is preserved if the deal record is removed)
--   3. CHECK constraint: a row must belong to a formation, a deal, or both (never neither)
--   4. RLS policies extended with a deal-aware predicate (see below)

ALTER TABLE formation_documents
  ALTER COLUMN formation_id DROP NOT NULL;

ALTER TABLE formation_documents
  ADD COLUMN deal_id uuid REFERENCES deals(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE formation_documents
  ADD CONSTRAINT formation_documents_belongs_to_formation_or_deal
  CHECK (formation_id IS NOT NULL OR deal_id IS NOT NULL);

CREATE INDEX formation_documents_deal_id_idx
  ON formation_documents (deal_id)
  WHERE deal_id IS NOT NULL;

-- RLS predicate: "every set FK must resolve to a workspace the caller belongs to"
-- (formation_id IS NULL  ⇒ formation branch trivially satisfied)
-- (deal_id      IS NULL  ⇒ deal branch trivially satisfied)
-- The CHECK constraint guarantees they aren't both NULL.
--
-- Crucially this is AND across the two branches (NOT OR). An OR predicate would
-- let a member of workspace A insert a row with `formation_id` ∈ workspace A
-- AND `deal_id` ∈ workspace B (only one branch needs to pass), poisoning the
-- victim deal with attacker-controlled title/metadata/storage_path. The AND form
-- requires the row to belong fully to the caller's workspace — fail closed.
-- (Audit: docs/team-artifacts/security/2026-04-21-T-20-deal-link-rls.md)

DROP POLICY IF EXISTS "formation_documents_select" ON formation_documents;
DROP POLICY IF EXISTS "formation_documents_insert" ON formation_documents;
DROP POLICY IF EXISTS "formation_documents_update" ON formation_documents;
DROP POLICY IF EXISTS "formation_documents_delete" ON formation_documents;

CREATE POLICY "formation_documents_select"
ON formation_documents FOR SELECT TO authenticated
USING (
  (formation_id IS NULL OR EXISTS (
    SELECT 1 FROM formations f
    JOIN workspaces_users wu ON wu.workspace_id = f.workspace_id
    WHERE f.id = formation_documents.formation_id
    AND wu.user_id = auth.uid()
  ))
  AND
  (deal_id IS NULL OR EXISTS (
    SELECT 1 FROM deals d
    JOIN workspaces_users wu ON wu.workspace_id = d.workspace_id
    WHERE d.id = formation_documents.deal_id
    AND wu.user_id = auth.uid()
  ))
);

CREATE POLICY "formation_documents_insert"
ON formation_documents FOR INSERT TO authenticated
WITH CHECK (
  (formation_id IS NULL OR EXISTS (
    SELECT 1 FROM formations f
    JOIN workspaces_users wu ON wu.workspace_id = f.workspace_id
    WHERE f.id = formation_documents.formation_id
    AND wu.user_id = auth.uid()
  ))
  AND
  (deal_id IS NULL OR EXISTS (
    SELECT 1 FROM deals d
    JOIN workspaces_users wu ON wu.workspace_id = d.workspace_id
    WHERE d.id = formation_documents.deal_id
    AND wu.user_id = auth.uid()
  ))
);

-- UPDATE: USING gates which existing rows the caller may modify;
-- WITH CHECK gates the post-update row shape (required, not optional —
-- without it PG re-applies USING to the new row, which has historically
-- been a foot-gun for pivot attacks).
CREATE POLICY "formation_documents_update"
ON formation_documents FOR UPDATE TO authenticated
USING (
  (formation_id IS NULL OR EXISTS (
    SELECT 1 FROM formations f
    JOIN workspaces_users wu ON wu.workspace_id = f.workspace_id
    WHERE f.id = formation_documents.formation_id
    AND wu.user_id = auth.uid()
  ))
  AND
  (deal_id IS NULL OR EXISTS (
    SELECT 1 FROM deals d
    JOIN workspaces_users wu ON wu.workspace_id = d.workspace_id
    WHERE d.id = formation_documents.deal_id
    AND wu.user_id = auth.uid()
  ))
)
WITH CHECK (
  (formation_id IS NULL OR EXISTS (
    SELECT 1 FROM formations f
    JOIN workspaces_users wu ON wu.workspace_id = f.workspace_id
    WHERE f.id = formation_documents.formation_id
    AND wu.user_id = auth.uid()
  ))
  AND
  (deal_id IS NULL OR EXISTS (
    SELECT 1 FROM deals d
    JOIN workspaces_users wu ON wu.workspace_id = d.workspace_id
    WHERE d.id = formation_documents.deal_id
    AND wu.user_id = auth.uid()
  ))
);

CREATE POLICY "formation_documents_delete"
ON formation_documents FOR DELETE TO authenticated
USING (
  (formation_id IS NULL OR EXISTS (
    SELECT 1 FROM formations f
    JOIN workspaces_users wu ON wu.workspace_id = f.workspace_id
    WHERE f.id = formation_documents.formation_id
    AND wu.user_id = auth.uid()
  ))
  AND
  (deal_id IS NULL OR EXISTS (
    SELECT 1 FROM deals d
    JOIN workspaces_users wu ON wu.workspace_id = d.workspace_id
    WHERE d.id = formation_documents.deal_id
    AND wu.user_id = auth.uid()
  ))
);
