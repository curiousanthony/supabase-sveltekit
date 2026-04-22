-- Wave 2: Add emargement period (AM/PM) and module-formateur linking
-- Qualiopi Q11 requires twice-daily attendance signatures (demi-journée)
-- Module-formateur linking enables auto-assignment on séance creation

-- 1. Create emargement_period enum
DO $$ BEGIN
  CREATE TYPE emargement_period AS ENUM ('morning', 'afternoon');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add period column to emargements (default 'morning' for existing rows)
ALTER TABLE emargements
  ADD COLUMN IF NOT EXISTS period emargement_period NOT NULL DEFAULT 'morning';

-- 3. Drop old unique constraints and create new ones that include period
-- The old constraints don't account for AM/PM splitting (one row per contact per séance).
-- The new constraints allow 2 rows per contact per séance (one per period).
ALTER TABLE emargements
  DROP CONSTRAINT IF EXISTS unique_emargement_seance_contact;
ALTER TABLE emargements
  DROP CONSTRAINT IF EXISTS unique_emargement_seance_formateur;

ALTER TABLE emargements
  ADD CONSTRAINT unique_emargement_seance_contact_period
    UNIQUE (seance_id, contact_id, period);
ALTER TABLE emargements
  ADD CONSTRAINT unique_emargement_seance_formateur_period
    UNIQUE (seance_id, formateur_id, period);

-- 4. Add formateur_id to modules (formation-specific, NOT biblio_modules)
ALTER TABLE modules
  ADD COLUMN IF NOT EXISTS formateur_id UUID
    REFERENCES formateurs(id) ON DELETE SET NULL;
