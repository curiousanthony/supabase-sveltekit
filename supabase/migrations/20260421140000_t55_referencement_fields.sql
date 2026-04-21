-- T-55: missing référencement / certification fields on formations.
--
-- Code RNCP alone covers only a minority of certifying OFs. We add:
--   - code_rs                    Répertoire Spécifique (TOSA, PIX, SST, PCIE…)
--   - code_cpf_fiche             Numéro de fiche Mon Compte Formation
--   - niveau_qualification       EQF / RNCP scale 1–8 (CHECK enforced)
--   - certificateur              Free-text certifier label
--   - date_enregistrement_rncp   Original RNCP registration date
--
-- All nullable — most formations won't fill them. The Fiche Référencement
-- card (T-54) renders these behind a "Cette formation prépare-t-elle à une
-- certification ?" toggle.

ALTER TABLE formations
  ADD COLUMN IF NOT EXISTS code_rs                  text,
  ADD COLUMN IF NOT EXISTS code_cpf_fiche           text,
  ADD COLUMN IF NOT EXISTS niveau_qualification     integer,
  ADD COLUMN IF NOT EXISTS certificateur            text,
  ADD COLUMN IF NOT EXISTS date_enregistrement_rncp date;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'formations_niveau_qualification_check'
      AND conrelid = 'formations'::regclass
  ) THEN
    ALTER TABLE formations
      ADD CONSTRAINT formations_niveau_qualification_check
      CHECK (niveau_qualification IS NULL OR (niveau_qualification BETWEEN 1 AND 8));
  END IF;
END$$;
