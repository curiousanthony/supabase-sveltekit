-- Add CTA columns to quest_sub_actions for rich actionable sub-tasks
ALTER TABLE quest_sub_actions ADD COLUMN IF NOT EXISTS cta_type varchar(20);
ALTER TABLE quest_sub_actions ADD COLUMN IF NOT EXISTS cta_label text;
ALTER TABLE quest_sub_actions ADD COLUMN IF NOT EXISTS cta_target text;
ALTER TABLE quest_sub_actions ADD COLUMN IF NOT EXISTS document_required boolean NOT NULL DEFAULT false;

-- Backfill blockedByActionId for existing formations
-- For each formation_action that has a quest_key and template dependencies,
-- set blocked_by_action_id to the last dependency's action within the same formation.
DO $$
DECLARE
  fa RECORD;
  blocker_id uuid;
BEGIN
  -- Process quests with known dependency chains (last dependency as primary blocker)
  FOR fa IN
    SELECT a.id, a.formation_id, a.quest_key
    FROM formation_actions a
    WHERE a.quest_key IS NOT NULL
      AND a.blocked_by_action_id IS NULL
  LOOP
    -- Map quest_key -> last dependency quest_key
    blocker_id := NULL;

    CASE fa.quest_key
      WHEN 'analyse_besoins' THEN
        SELECT id INTO blocker_id FROM formation_actions WHERE formation_id = fa.formation_id AND quest_key = 'verification_infos' LIMIT 1;
      WHEN 'programme_modules' THEN
        SELECT id INTO blocker_id FROM formation_actions WHERE formation_id = fa.formation_id AND quest_key = 'verification_infos' LIMIT 1;
      WHEN 'devis' THEN
        SELECT id INTO blocker_id FROM formation_actions WHERE formation_id = fa.formation_id AND quest_key = 'programme_modules' LIMIT 1;
      WHEN 'convention' THEN
        SELECT id INTO blocker_id FROM formation_actions WHERE formation_id = fa.formation_id AND quest_key = 'devis' LIMIT 1;
      WHEN 'demande_financement' THEN
        SELECT id INTO blocker_id FROM formation_actions WHERE formation_id = fa.formation_id AND quest_key = 'convention' LIMIT 1;
      WHEN 'accord_opco' THEN
        SELECT id INTO blocker_id FROM formation_actions WHERE formation_id = fa.formation_id AND quest_key = 'demande_financement' LIMIT 1;
      WHEN 'session_edof' THEN
        SELECT id INTO blocker_id FROM formation_actions WHERE formation_id = fa.formation_id AND quest_key = 'convention' LIMIT 1;
      WHEN 'convocations' THEN
        SELECT id INTO blocker_id FROM formation_actions WHERE formation_id = fa.formation_id AND quest_key = 'convention' LIMIT 1;
      WHEN 'reglement_interieur' THEN
        SELECT id INTO blocker_id FROM formation_actions WHERE formation_id = fa.formation_id AND quest_key = 'convocations' LIMIT 1;
      WHEN 'test_positionnement' THEN
        SELECT id INTO blocker_id FROM formation_actions WHERE formation_id = fa.formation_id AND quest_key = 'analyse_besoins' LIMIT 1;
      WHEN 'preparation_logistique' THEN
        SELECT id INTO blocker_id FROM formation_actions WHERE formation_id = fa.formation_id AND quest_key = 'convention' LIMIT 1;
      WHEN 'affectation_formateur' THEN
        SELECT id INTO blocker_id FROM formation_actions WHERE formation_id = fa.formation_id AND quest_key = 'programme_modules' LIMIT 1;
      WHEN 'ordre_mission' THEN
        SELECT id INTO blocker_id FROM formation_actions WHERE formation_id = fa.formation_id AND quest_key = 'convention' LIMIT 1;
      WHEN 'accueil_lancement' THEN
        SELECT id INTO blocker_id FROM formation_actions WHERE formation_id = fa.formation_id AND quest_key = 'preparation_logistique' LIMIT 1;
      WHEN 'emargement' THEN
        SELECT id INTO blocker_id FROM formation_actions WHERE formation_id = fa.formation_id AND quest_key = 'accueil_lancement' LIMIT 1;
      WHEN 'animation_pedagogique' THEN
        SELECT id INTO blocker_id FROM formation_actions WHERE formation_id = fa.formation_id AND quest_key = 'accueil_lancement' LIMIT 1;
      WHEN 'evaluations_formatives' THEN
        SELECT id INTO blocker_id FROM formation_actions WHERE formation_id = fa.formation_id AND quest_key = 'animation_pedagogique' LIMIT 1;
      WHEN 'suivi_absences' THEN
        SELECT id INTO blocker_id FROM formation_actions WHERE formation_id = fa.formation_id AND quest_key = 'emargement' LIMIT 1;
      WHEN 'adaptation_formation' THEN
        SELECT id INTO blocker_id FROM formation_actions WHERE formation_id = fa.formation_id AND quest_key = 'evaluations_formatives' LIMIT 1;
      WHEN 'satisfaction_chaud' THEN
        SELECT id INTO blocker_id FROM formation_actions WHERE formation_id = fa.formation_id AND quest_key = 'emargement' LIMIT 1;
      WHEN 'evaluation_acquis_fin' THEN
        SELECT id INTO blocker_id FROM formation_actions WHERE formation_id = fa.formation_id AND quest_key = 'evaluations_formatives' LIMIT 1;
      WHEN 'certificat_realisation' THEN
        SELECT id INTO blocker_id FROM formation_actions WHERE formation_id = fa.formation_id AND quest_key = 'emargement' LIMIT 1;
      WHEN 'attestation' THEN
        SELECT id INTO blocker_id FROM formation_actions WHERE formation_id = fa.formation_id AND quest_key = 'evaluation_acquis_fin' LIMIT 1;
      WHEN 'facturation' THEN
        SELECT id INTO blocker_id FROM formation_actions WHERE formation_id = fa.formation_id AND quest_key = 'certificat_realisation' LIMIT 1;
      WHEN 'justificatifs_opco' THEN
        SELECT id INTO blocker_id FROM formation_actions WHERE formation_id = fa.formation_id AND quest_key = 'facturation' LIMIT 1;
      WHEN 'satisfaction_froid' THEN
        SELECT id INTO blocker_id FROM formation_actions WHERE formation_id = fa.formation_id AND quest_key = 'satisfaction_chaud' LIMIT 1;
      WHEN 'evaluation_transfert' THEN
        SELECT id INTO blocker_id FROM formation_actions WHERE formation_id = fa.formation_id AND quest_key = 'satisfaction_froid' LIMIT 1;
      WHEN 'bilan_formateur' THEN
        SELECT id INTO blocker_id FROM formation_actions WHERE formation_id = fa.formation_id AND quest_key = 'satisfaction_chaud' LIMIT 1;
      WHEN 'amelioration_continue' THEN
        SELECT id INTO blocker_id FROM formation_actions WHERE formation_id = fa.formation_id AND quest_key = 'bilan_formateur' LIMIT 1;
      WHEN 'cloture_archivage' THEN
        SELECT id INTO blocker_id FROM formation_actions WHERE formation_id = fa.formation_id AND quest_key = 'amelioration_continue' LIMIT 1;
      ELSE
        NULL;
    END CASE;

    IF blocker_id IS NOT NULL THEN
      UPDATE formation_actions SET blocked_by_action_id = blocker_id WHERE id = fa.id;
    END IF;
  END LOOP;
END $$;
