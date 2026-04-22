-- T-63: multi-source funding model for formations.
--
-- Replaces the single-row financing fields on `formations`
-- (`type_financement`, `montant_accorde`, `financement_accorde`) with a
-- dedicated `formation_funding_sources` table that captures one row per
-- payer / mechanism, each with its own status lifecycle, requested vs
-- granted amounts, dossier reference, and decision/payment dates.
--
-- The legacy columns are NOT dropped here. They stay for one release cycle
-- so we can roll back without data loss; a follow-up ticket drops them once
-- the UI + service layer are fully on the new model.
--
-- All sections are idempotent: re-running the migration in CI / preview
-- branches must be a no-op.

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'funding_source_type') THEN
    CREATE TYPE funding_source_type AS ENUM (
      'CPF',
      'CPF_Transition',
      'OPCO_PDC',
      'OPCO_Alternance',
      'OPCO_ProA',
      'OPCO_AFEST',
      'FranceTravail_AIF',
      'FranceTravail_POEI',
      'FranceTravail_POEC',
      'Region',
      'FSE',
      'FNE_Formation',
      'TransitionsPro_CTP',
      'AGEFICE',
      'FIFPL',
      'FAFCEA',
      'EmployeurDirect',
      'AutoFinancement',
      'Autre'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'funding_source_status') THEN
    CREATE TYPE funding_source_status AS ENUM (
      'Pressenti',
      'Demandé',
      'Accordé',
      'Refusé',
      'Versé',
      'Annulé'
    );
  END IF;
END$$;

-- ---------------------------------------------------------------------------
-- 2. Table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS formation_funding_sources (
  id                     uuid                   PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id           uuid                   NOT NULL,
  source                 funding_source_type    NOT NULL,
  payer_label            text,
  requested_amount       numeric(12, 2),
  granted_amount         numeric(12, 2),
  status                 funding_source_status  NOT NULL DEFAULT 'Pressenti',
  decision_date          date,
  expected_payment_date  date,
  dossier_reference      text,
  notes                  text,
  created_at             timestamptz            NOT NULL DEFAULT now(),
  updated_at             timestamptz,
  CONSTRAINT formation_funding_sources_formation_id_fkey
    FOREIGN KEY (formation_id) REFERENCES formations(id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS formation_funding_sources_formation_id_idx
  ON formation_funding_sources (formation_id);

-- ---------------------------------------------------------------------------
-- 3. Invoice FK column
-- ---------------------------------------------------------------------------

ALTER TABLE formation_invoices
  ADD COLUMN IF NOT EXISTS funding_source_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'formation_invoices_funding_source_id_fkey'
      AND conrelid = 'formation_invoices'::regclass
  ) THEN
    ALTER TABLE formation_invoices
      ADD CONSTRAINT formation_invoices_funding_source_id_fkey
      FOREIGN KEY (funding_source_id)
      REFERENCES formation_funding_sources(id)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS formation_invoices_funding_source_id_idx
  ON formation_invoices (funding_source_id);

-- ---------------------------------------------------------------------------
-- 4. Backfill from legacy single-row financing on `formations`
-- ---------------------------------------------------------------------------
-- For each formation with a non-null `type_financement` that does not yet
-- have any funding-source rows, create one canonical row mapping the legacy
-- enum to the new one and copying the granted amount / status flag.
--
-- The NOT EXISTS guard keeps this idempotent across re-runs.

INSERT INTO formation_funding_sources (
  id,
  formation_id,
  source,
  granted_amount,
  status,
  created_at
)
SELECT
  gen_random_uuid(),
  f.id,
  CASE f.type_financement::text
    WHEN 'CPF'  THEN 'CPF'::funding_source_type
    WHEN 'OPCO' THEN 'OPCO_PDC'::funding_source_type
    ELSE 'EmployeurDirect'::funding_source_type
  END,
  f.montant_accorde,
  CASE
    WHEN f.financement_accorde THEN 'Accordé'::funding_source_status
    ELSE 'Demandé'::funding_source_status
  END,
  now()
FROM formations f
WHERE f.type_financement IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM formation_funding_sources fs
    WHERE fs.formation_id = f.id
  );

-- ---------------------------------------------------------------------------
-- 5. RLS
-- ---------------------------------------------------------------------------
-- Inherit workspace scoping from the parent formation. A row is visible /
-- mutable iff the caller belongs to the formation's workspace.

ALTER TABLE formation_funding_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "formation_funding_sources_select" ON formation_funding_sources;
DROP POLICY IF EXISTS "formation_funding_sources_insert" ON formation_funding_sources;
DROP POLICY IF EXISTS "formation_funding_sources_update" ON formation_funding_sources;
DROP POLICY IF EXISTS "formation_funding_sources_delete" ON formation_funding_sources;

CREATE POLICY "formation_funding_sources_select"
ON formation_funding_sources FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM formations f
    JOIN workspaces_users wu ON wu.workspace_id = f.workspace_id
    WHERE f.id = formation_funding_sources.formation_id
      AND wu.user_id = auth.uid()
  )
);

CREATE POLICY "formation_funding_sources_insert"
ON formation_funding_sources FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM formations f
    JOIN workspaces_users wu ON wu.workspace_id = f.workspace_id
    WHERE f.id = formation_funding_sources.formation_id
      AND wu.user_id = auth.uid()
  )
);

CREATE POLICY "formation_funding_sources_update"
ON formation_funding_sources FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM formations f
    JOIN workspaces_users wu ON wu.workspace_id = f.workspace_id
    WHERE f.id = formation_funding_sources.formation_id
      AND wu.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM formations f
    JOIN workspaces_users wu ON wu.workspace_id = f.workspace_id
    WHERE f.id = formation_funding_sources.formation_id
      AND wu.user_id = auth.uid()
  )
);

CREATE POLICY "formation_funding_sources_delete"
ON formation_funding_sources FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM formations f
    JOIN workspaces_users wu ON wu.workspace_id = f.workspace_id
    WHERE f.id = formation_funding_sources.formation_id
      AND wu.user_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------------
-- 6. updated_at trigger (mirrors existing per-row pattern)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'formation_funding_sources_updated_at'
  ) THEN
    CREATE TRIGGER formation_funding_sources_updated_at
      BEFORE UPDATE ON formation_funding_sources
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;
