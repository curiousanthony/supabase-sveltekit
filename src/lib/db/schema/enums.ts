import { pgEnum } from 'drizzle-orm/pg-core';

export const modalites = pgEnum('modalites', [
	'Distanciel',
	'Présentiel',
	'Hybride',
	'E-Learning'
]);
export const contactRole = pgEnum('contact_role', [
	'PDG / Président',
	'Directeur Général',
	'Directeur des Ressources Humaines',
	'Responsable RH',
	'Responsable Formation',
	'Directeur Commercial',
	'Responsable Commercial',
	'Directeur Marketing',
	'Directeur Financier',
	'Directeur des Opérations',
	'Directeur Technique',
	'Office Manager',
	'Assistant(e) de Direction',
	'Chef de Projet',
	'Responsable des Achats',
	'Consultant',
	'Gérant',
	'Associé',
	'Autre'
]);
export const statutsFormation = pgEnum('statuts_formation', [
	'À traiter',
	'Signature convention',
	'Financement',
	'Planification',
	'En cours',
	'Terminée',
	'Archivée'
]);
export const formationType = pgEnum('formation_type', ['Intra', 'Inter', 'CPF']);
export const actionStatus = pgEnum('action_status', ['Pas commencé', 'En cours', 'Terminé']);
export const actionEtape = pgEnum('action_etape', [
	'Récapitulatif',
	'Convention et programme',
	'Audit des besoins',
	'Convocations',
	'Test de positionnement',
	'Certificat de réalisation',
	'Questionnaires de satisfaction',
	'Émargement',
	'Ordre de mission',
	'Formateur',
	'Facturation',
	'Récap final'
]);
export const typeClient = pgEnum('type_client', ['Entreprise', 'Particulier']);
export const typesFinancement = pgEnum('types_financement', ['CPF', 'OPCO', 'Inter', 'Intra']);
export const dealStage = pgEnum('deal_stage', [
	'Suspect',
	'Prospect',
	'Négociation',
	'Admin',
	'Signature',
	'Financement',
	'Gagné',
	'Perdu'
]);
export const dealSource = pgEnum('deal_source', [
	'Site web',
	'Bouche-à-oreille',
	'Salon / Événement',
	'Ancien client',
	'Appel entrant',
	'LinkedIn',
	'Partenaire',
	'Prospecté',
	'Autre'
]);
export const dealLossReason = pgEnum('deal_loss_reason', [
	'Prix trop élevé',
	'Concurrent choisi',
	'Report / Pas le bon moment',
	'Budget annulé',
	'Sans réponse',
	'Autre'
]);
export const dealFundingStatus = pgEnum('deal_funding_status', [
	'En attente',
	'Demande envoyée',
	'Accord reçu',
	'Refusé'
]);
export const dealFundingType = pgEnum('deal_funding_type', [
	'Financement fonds propres (Client)',
	'Financement public (OPCO; CPF...)',
	'Co-financement (OPCO + Client)'
]);
export const dealFormat = pgEnum('deal_format', ['Individuel', 'Collectif']);
export const dealIntraInter = pgEnum('deal_intra_inter', ['Intra', 'Inter']);
export const workspaceRole = pgEnum('workspace_role', ['owner', 'admin', 'sales', 'secretary']);
export const legalStatus = pgEnum('legal_status', ['Indépendant', 'Entreprise']);
export const companySize = pgEnum('company_size', [
	'0 - Solo',
	'1-10 - TPE',
	'11-49 - PME',
	'50-249',
	'250+'
]);
export const modaliteEvaluation = pgEnum('modalite_evaluation', [
	'QCM',
	'QCU',
	'Pratique',
	'Projet'
]);
export const statutProgramme = pgEnum('statut_programme', [
	'Brouillon',
	'En cours',
	'Publié',
	'Archivé'
]);
export const typeQuestionnaire = pgEnum('type_questionnaire', [
	'Test de niveau',
	'Quiz / Exercice',
	'Audit des besoins'
]);
export const questPhase = pgEnum('quest_phase', ['conception', 'deploiement', 'evaluation']);
export const emargementSignerType = pgEnum('emargement_signer_type', ['apprenant', 'formateur']);
