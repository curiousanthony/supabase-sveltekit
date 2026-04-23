-- T-56: Accessibilité (Qualiopi indicateur 26)
--
-- Workspace-level defaults (référent handicap + dispositions standard) and
-- per-formation overrides. Empty per-formation values mean "use workspace
-- default" — the read-side resolution handles the fallback. All nullable so
-- existing data is unaffected.

ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS default_referent_handicap text,
  ADD COLUMN IF NOT EXISTS default_dispositions_handicap text;

ALTER TABLE formations
  ADD COLUMN IF NOT EXISTS referent_handicap text,
  ADD COLUMN IF NOT EXISTS dispositions_handicap text;

COMMENT ON COLUMN workspaces.default_referent_handicap IS
  'T-56: Default Qualiopi ind. 26 referent (name, contact). Used when formation override is null.';
COMMENT ON COLUMN workspaces.default_dispositions_handicap IS
  'T-56: Default accessibility provisions text. Used when formation override is null.';
COMMENT ON COLUMN formations.referent_handicap IS
  'T-56: Per-formation override of workspace default_referent_handicap (rare: subcontracted formateur with own provisions).';
COMMENT ON COLUMN formations.dispositions_handicap IS
  'T-56: Per-formation override of workspace default_dispositions_handicap.';
