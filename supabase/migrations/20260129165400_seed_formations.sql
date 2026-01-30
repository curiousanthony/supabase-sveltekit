-- Seed dummy formations for Kanban view (only if workspace + user exist)
WITH one AS (
  SELECT w.id AS workspace_id, wu.user_id
  FROM workspaces w
  JOIN workspaces_users wu ON wu.workspace_id = w.id
  LIMIT 1
)
INSERT INTO formations (workspace_id, created_by, name, duree, modalite, statut, id_in_workspace, evaluation_mode, suivi_assiduite)
SELECT one.workspace_id, one.user_id, n.name, n.duree, n.modalite::modalites, n.statut::statuts_formation, n.id_in_workspace, n.evaluation_mode, n.suivi_assiduite
FROM one
CROSS JOIN (VALUES
  ('Formation pilot 1', 14, 'Présentiel', 'En attente', 1, 'QCM de fin de formation', 'Feuille d''émargement signée par demi-journée'),
  ('Formation pilot 2', 21, 'Hybride', 'En cours', 2, 'Mise en situation pratique', 'Émargement numérique via l''application'),
  ('Formation pilot 3', 7, 'Distanciel', 'Terminée', 3, 'QCM de fin de formation', 'Logs de connexion (pour distanciel)')
) AS n(name, duree, modalite, statut, id_in_workspace, evaluation_mode, suivi_assiduite);
