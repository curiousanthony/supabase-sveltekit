-- T-52: per-payer reste-à-charge split needs an explicit payer_type on each
-- funding source. This was overlooked in T-63 (foundation) and is added here
-- before the new finances loader/actions land in the same release.
--
-- Idempotent: safe to re-run in CI / preview / production.

------------------------------------------------------------------------------
-- 1. Enum
------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payer_type') THEN
    CREATE TYPE payer_type AS ENUM ('apprenant', 'entreprise', 'OF');
  END IF;
END$$;

------------------------------------------------------------------------------
-- 2. Column on formation_funding_sources
------------------------------------------------------------------------------
ALTER TABLE formation_funding_sources
  ADD COLUMN IF NOT EXISTS payer_type payer_type;

-- Backfill: derive a sensible default from `source` for existing rows.
-- Mapping rules (V1, can be overridden via the funding-source dialog):
--   • OPCO_*, EmployeurDirect, FNE_Formation, AGEFICE, FIFPL, FAFCEA → entreprise
--   • everything else (CPF, CPF_Transition, FranceTravail_*, Region, FSE,
--     TransitionsPro_CTP, AutoFinancement, Autre)                     → apprenant
-- The `OF` payer is never auto-assigned (rare, promotional only).
UPDATE formation_funding_sources
SET payer_type = CASE
  WHEN source IN (
    'OPCO_PDC', 'OPCO_Alternance', 'OPCO_ProA', 'OPCO_AFEST',
    'EmployeurDirect', 'FNE_Formation',
    'AGEFICE', 'FIFPL', 'FAFCEA'
  ) THEN 'entreprise'::payer_type
  ELSE 'apprenant'::payer_type
END
WHERE payer_type IS NULL;

ALTER TABLE formation_funding_sources
  ALTER COLUMN payer_type SET DEFAULT 'apprenant';

ALTER TABLE formation_funding_sources
  ALTER COLUMN payer_type SET NOT NULL;
