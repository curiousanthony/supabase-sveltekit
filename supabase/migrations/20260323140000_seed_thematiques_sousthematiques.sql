-- Phase 11: Seed thematiques and sous_thematiques with comprehensive French professional training categories
-- These are global reference data (not workspace-scoped).

-- Idempotency: unique indexes enable ON CONFLICT for re-runs (e.g. db reset / migration replay).
CREATE UNIQUE INDEX IF NOT EXISTS thematiques_name_unique ON public.thematiques (name);
CREATE UNIQUE INDEX IF NOT EXISTS sousthematiques_parent_topic_name_unique
  ON public.sousthematiques (parent_topic_id, name);

DO $$
DECLARE
  t_id uuid;
BEGIN

  -- 1. Management et Leadership
  INSERT INTO thematiques (id, name) VALUES (gen_random_uuid(), 'Management et Leadership')
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO t_id;
  INSERT INTO sousthematiques (name, parent_topic_id) VALUES
    ('Management d''équipe', t_id),
    ('Leadership et posture managériale', t_id),
    ('Gestion des conflits', t_id),
    ('Conduite du changement', t_id),
    ('Management à distance', t_id),
    ('Management intergénérationnel', t_id),
    ('Délégation et responsabilisation', t_id),
    ('Prise de décision', t_id)
  ON CONFLICT (parent_topic_id, name) DO NOTHING;

  -- 2. Communication
  INSERT INTO thematiques (id, name) VALUES (gen_random_uuid(), 'Communication')
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO t_id;
  INSERT INTO sousthematiques (name, parent_topic_id) VALUES
    ('Communication interpersonnelle', t_id),
    ('Prise de parole en public', t_id),
    ('Communication écrite professionnelle', t_id),
    ('Communication non violente (CNV)', t_id),
    ('Argumentation et négociation', t_id),
    ('Communication digitale', t_id),
    ('Relations presse et médias', t_id)
  ON CONFLICT (parent_topic_id, name) DO NOTHING;

  -- 3. Ressources Humaines
  INSERT INTO thematiques (id, name) VALUES (gen_random_uuid(), 'Ressources Humaines')
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO t_id;
  INSERT INTO sousthematiques (name, parent_topic_id) VALUES
    ('Recrutement et intégration', t_id),
    ('Gestion des compétences (GPEC)', t_id),
    ('Entretiens professionnels et annuels', t_id),
    ('Droit du travail appliqué', t_id),
    ('Paie et administration du personnel', t_id),
    ('Qualité de vie au travail (QVT)', t_id),
    ('Diversité et inclusion', t_id),
    ('Gestion des relations sociales (CSE)', t_id)
  ON CONFLICT (parent_topic_id, name) DO NOTHING;

  -- 4. Comptabilité et Finance
  INSERT INTO thematiques (id, name) VALUES (gen_random_uuid(), 'Comptabilité et Finance')
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO t_id;
  INSERT INTO sousthematiques (name, parent_topic_id) VALUES
    ('Comptabilité générale', t_id),
    ('Comptabilité analytique', t_id),
    ('Gestion financière et trésorerie', t_id),
    ('Fiscalité des entreprises', t_id),
    ('Contrôle de gestion', t_id),
    ('Normes IFRS', t_id),
    ('Gestion de la paie', t_id)
  ON CONFLICT (parent_topic_id, name) DO NOTHING;

  -- 5. Marketing et Commercial
  INSERT INTO thematiques (id, name) VALUES (gen_random_uuid(), 'Marketing et Commercial')
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO t_id;
  INSERT INTO sousthematiques (name, parent_topic_id) VALUES
    ('Techniques de vente', t_id),
    ('Prospection commerciale', t_id),
    ('Marketing digital et réseaux sociaux', t_id),
    ('Stratégie marketing', t_id),
    ('Relation client et fidélisation', t_id),
    ('E-commerce', t_id),
    ('Négociation commerciale', t_id),
    ('Expérience client (CX)', t_id)
  ON CONFLICT (parent_topic_id, name) DO NOTHING;

  -- 6. Informatique et Numérique
  INSERT INTO thematiques (id, name) VALUES (gen_random_uuid(), 'Informatique et Numérique')
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO t_id;
  INSERT INTO sousthematiques (name, parent_topic_id) VALUES
    ('Développement web et mobile', t_id),
    ('Cybersécurité', t_id),
    ('Intelligence artificielle et data', t_id),
    ('Cloud computing', t_id),
    ('Administration systèmes et réseaux', t_id),
    ('DevOps et CI/CD', t_id),
    ('UX/UI Design', t_id),
    ('Transformation digitale', t_id)
  ON CONFLICT (parent_topic_id, name) DO NOTHING;

  -- 7. Langues
  INSERT INTO thematiques (id, name) VALUES (gen_random_uuid(), 'Langues')
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO t_id;
  INSERT INTO sousthematiques (name, parent_topic_id) VALUES
    ('Anglais professionnel', t_id),
    ('Français Langue Étrangère (FLE)', t_id),
    ('Espagnol professionnel', t_id),
    ('Allemand professionnel', t_id),
    ('Italien professionnel', t_id),
    ('Chinois (mandarin)', t_id),
    ('Préparation TOEIC / TOEFL / BULATS', t_id)
  ON CONFLICT (parent_topic_id, name) DO NOTHING;

  -- 8. Droit et Juridique
  INSERT INTO thematiques (id, name) VALUES (gen_random_uuid(), 'Droit et Juridique')
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO t_id;
  INSERT INTO sousthematiques (name, parent_topic_id) VALUES
    ('Droit des affaires', t_id),
    ('Droit du travail', t_id),
    ('RGPD et protection des données', t_id),
    ('Droit des contrats', t_id),
    ('Propriété intellectuelle', t_id),
    ('Droit de la formation professionnelle', t_id)
  ON CONFLICT (parent_topic_id, name) DO NOTHING;

  -- 9. Sécurité et Prévention
  INSERT INTO thematiques (id, name) VALUES (gen_random_uuid(), 'Sécurité et Prévention')
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO t_id;
  INSERT INTO sousthematiques (name, parent_topic_id) VALUES
    ('Sécurité au travail et prévention des risques', t_id),
    ('Habilitations électriques', t_id),
    ('CACES et conduite d''engins', t_id),
    ('Sauveteur Secouriste du Travail (SST)', t_id),
    ('Incendie et évacuation', t_id),
    ('Document Unique (DUERP)', t_id),
    ('Travail en hauteur', t_id),
    ('Gestes et postures (PRAP)', t_id)
  ON CONFLICT (parent_topic_id, name) DO NOTHING;

  -- 10. Qualité et Amélioration continue
  INSERT INTO thematiques (id, name) VALUES (gen_random_uuid(), 'Qualité et Amélioration continue')
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO t_id;
  INSERT INTO sousthematiques (name, parent_topic_id) VALUES
    ('ISO 9001 et management de la qualité', t_id),
    ('Lean Management', t_id),
    ('Six Sigma', t_id),
    ('Audit qualité interne', t_id),
    ('Qualiopi (organismes de formation)', t_id),
    ('Amélioration continue (Kaizen)', t_id)
  ON CONFLICT (parent_topic_id, name) DO NOTHING;

  -- 11. Logistique et Supply Chain
  INSERT INTO thematiques (id, name) VALUES (gen_random_uuid(), 'Logistique et Supply Chain')
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO t_id;
  INSERT INTO sousthematiques (name, parent_topic_id) VALUES
    ('Gestion des stocks et approvisionnements', t_id),
    ('Transport et distribution', t_id),
    ('Logistique internationale', t_id),
    ('Supply Chain Management', t_id),
    ('Gestion d''entrepôt', t_id)
  ON CONFLICT (parent_topic_id, name) DO NOTHING;

  -- 12. Environnement et Développement durable
  INSERT INTO thematiques (id, name) VALUES (gen_random_uuid(), 'Environnement et Développement durable')
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO t_id;
  INSERT INTO sousthematiques (name, parent_topic_id) VALUES
    ('RSE (Responsabilité Sociétale des Entreprises)', t_id),
    ('Bilan carbone et empreinte environnementale', t_id),
    ('Économie circulaire', t_id),
    ('ISO 14001 et management environnemental', t_id),
    ('Transition énergétique', t_id),
    ('Achats responsables', t_id)
  ON CONFLICT (parent_topic_id, name) DO NOTHING;

  -- 13. Santé et Médico-social
  INSERT INTO thematiques (id, name) VALUES (gen_random_uuid(), 'Santé et Médico-social')
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO t_id;
  INSERT INTO sousthematiques (name, parent_topic_id) VALUES
    ('Accompagnement des personnes âgées', t_id),
    ('Handicap et accessibilité', t_id),
    ('Bientraitance et prévention de la maltraitance', t_id),
    ('Hygiène et sécurité alimentaire (HACCP)', t_id),
    ('Gestion du stress et prévention du burn-out', t_id),
    ('Premiers secours et gestes d''urgence', t_id)
  ON CONFLICT (parent_topic_id, name) DO NOTHING;

  -- 14. BTP et Immobilier
  INSERT INTO thematiques (id, name) VALUES (gen_random_uuid(), 'BTP et Immobilier')
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO t_id;
  INSERT INTO sousthematiques (name, parent_topic_id) VALUES
    ('Gestion de chantier', t_id),
    ('Réglementation thermique (RE2020)', t_id),
    ('Amiante et plomb (SS3/SS4)', t_id),
    ('Transaction immobilière (loi Alur)', t_id),
    ('Gestion locative et copropriété', t_id),
    ('BIM (Building Information Modeling)', t_id)
  ON CONFLICT (parent_topic_id, name) DO NOTHING;

  -- 15. Industrie et Production
  INSERT INTO thematiques (id, name) VALUES (gen_random_uuid(), 'Industrie et Production')
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO t_id;
  INSERT INTO sousthematiques (name, parent_topic_id) VALUES
    ('Maintenance industrielle', t_id),
    ('Automatisme et robotique', t_id),
    ('Gestion de production', t_id),
    ('Méthodes et industrialisation', t_id),
    ('Soudure et assemblage', t_id)
  ON CONFLICT (parent_topic_id, name) DO NOTHING;

  -- 16. Restauration et Hôtellerie
  INSERT INTO thematiques (id, name) VALUES (gen_random_uuid(), 'Restauration et Hôtellerie')
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO t_id;
  INSERT INTO sousthematiques (name, parent_topic_id) VALUES
    ('Hygiène alimentaire (HACCP)', t_id),
    ('Management hôtelier', t_id),
    ('Sommellerie et œnologie', t_id),
    ('Cuisine et pâtisserie', t_id),
    ('Accueil et service en salle', t_id),
    ('Permis d''exploitation', t_id)
  ON CONFLICT (parent_topic_id, name) DO NOTHING;

  -- 17. Commerce et Distribution
  INSERT INTO thematiques (id, name) VALUES (gen_random_uuid(), 'Commerce et Distribution')
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO t_id;
  INSERT INTO sousthematiques (name, parent_topic_id) VALUES
    ('Merchandising et agencement', t_id),
    ('Gestion de point de vente', t_id),
    ('Grande distribution', t_id),
    ('Commerce international', t_id),
    ('Franchise et réseau', t_id)
  ON CONFLICT (parent_topic_id, name) DO NOTHING;

  -- 18. Transport
  INSERT INTO thematiques (id, name) VALUES (gen_random_uuid(), 'Transport')
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO t_id;
  INSERT INTO sousthematiques (name, parent_topic_id) VALUES
    ('Formation Initiale Minimale Obligatoire (FIMO)', t_id),
    ('Formation Continue Obligatoire (FCO)', t_id),
    ('Transport de matières dangereuses (ADR)', t_id),
    ('Réglementation du transport routier', t_id),
    ('Éco-conduite', t_id)
  ON CONFLICT (parent_topic_id, name) DO NOTHING;

  -- 19. Agriculture et Agroalimentaire
  INSERT INTO thematiques (id, name) VALUES (gen_random_uuid(), 'Agriculture et Agroalimentaire')
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO t_id;
  INSERT INTO sousthematiques (name, parent_topic_id) VALUES
    ('Agriculture biologique', t_id),
    ('Agroécologie', t_id),
    ('Transformation alimentaire', t_id),
    ('Sécurité sanitaire des aliments', t_id),
    ('Viticulture et œnologie', t_id)
  ON CONFLICT (parent_topic_id, name) DO NOTHING;

  -- 20. Art et Culture
  INSERT INTO thematiques (id, name) VALUES (gen_random_uuid(), 'Art et Culture')
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO t_id;
  INSERT INTO sousthematiques (name, parent_topic_id) VALUES
    ('Photographie et vidéo', t_id),
    ('Design graphique et PAO', t_id),
    ('Rédaction et écriture créative', t_id),
    ('Médiation culturelle', t_id),
    ('Audiovisuel et cinéma', t_id)
  ON CONFLICT (parent_topic_id, name) DO NOTHING;

  -- 21. Pédagogie et Formation de formateurs
  INSERT INTO thematiques (id, name) VALUES (gen_random_uuid(), 'Pédagogie et Formation de formateurs')
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO t_id;
  INSERT INTO sousthematiques (name, parent_topic_id) VALUES
    ('Ingénierie pédagogique', t_id),
    ('Animation de formation', t_id),
    ('E-learning et digital learning', t_id),
    ('Évaluation des acquis', t_id),
    ('Tutorat et mentorat', t_id),
    ('Certification Qualiopi', t_id)
  ON CONFLICT (parent_topic_id, name) DO NOTHING;

  -- 22. Développement personnel
  INSERT INTO thematiques (id, name) VALUES (gen_random_uuid(), 'Développement personnel')
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO t_id;
  INSERT INTO sousthematiques (name, parent_topic_id) VALUES
    ('Gestion du temps et des priorités', t_id),
    ('Confiance en soi et assertivité', t_id),
    ('Intelligence émotionnelle', t_id),
    ('Gestion du stress', t_id),
    ('Créativité et innovation', t_id),
    ('Efficacité professionnelle', t_id)
  ON CONFLICT (parent_topic_id, name) DO NOTHING;

  -- 23. Bureautique
  INSERT INTO thematiques (id, name) VALUES (gen_random_uuid(), 'Bureautique')
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO t_id;
  INSERT INTO sousthematiques (name, parent_topic_id) VALUES
    ('Microsoft Excel (tous niveaux)', t_id),
    ('Microsoft Word', t_id),
    ('Microsoft PowerPoint', t_id),
    ('Microsoft Outlook et Teams', t_id),
    ('Google Workspace (Docs, Sheets, Slides)', t_id),
    ('Préparation TOSA / ICDL', t_id)
  ON CONFLICT (parent_topic_id, name) DO NOTHING;

  -- 24. Gestion de projet
  INSERT INTO thematiques (id, name) VALUES (gen_random_uuid(), 'Gestion de projet')
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO t_id;
  INSERT INTO sousthematiques (name, parent_topic_id) VALUES
    ('Méthodologies agiles (Scrum, Kanban)', t_id),
    ('Gestion de projet classique (cycle en V, PMP)', t_id),
    ('Outils de gestion de projet (MS Project, Jira)', t_id),
    ('Pilotage et reporting', t_id),
    ('Gestion des risques projet', t_id),
    ('Certification PMP / Prince2 / PSM', t_id)
  ON CONFLICT (parent_topic_id, name) DO NOTHING;

  -- 25. Entrepreneuriat et Création d'entreprise
  INSERT INTO thematiques (id, name) VALUES (gen_random_uuid(), 'Entrepreneuriat et Création d''entreprise')
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO t_id;
  INSERT INTO sousthematiques (name, parent_topic_id) VALUES
    ('Business plan et modèle économique', t_id),
    ('Statuts juridiques et formalités', t_id),
    ('Financement et levée de fonds', t_id),
    ('Marketing et commercial pour startups', t_id),
    ('Comptabilité du créateur d''entreprise', t_id)
  ON CONFLICT (parent_topic_id, name) DO NOTHING;

END $$;
