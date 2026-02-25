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
export const statutsFormation = pgEnum('statuts_formation', ['En attente', 'En cours', 'Terminée']);
export const typeClient = pgEnum('type_client', ['Entreprise', 'Particulier']);
export const typesFinancement = pgEnum('types_financement', ['CPF', 'OPCO', 'Inter', 'Intra']);
export const dealStage = pgEnum('deal_stage', [
	'Lead',
	'Qualification',
	'Proposition',
	'Négociation',
	'Gagné',
	'Perdu'
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
export const companyIndustry = pgEnum('company_industry', [
	'Éducation et formation',
	'Restauration',
	'Autre'
]);
export const companySize = pgEnum('company_size', [
	'0 - Solo',
	'1-10 - TPE',
	'11-49 - PME',
	'50-249',
	'250+'
]);
