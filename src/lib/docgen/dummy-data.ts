import type { FormationDocData } from './types.js';

/**
 * Dummy formation data for docgen testing.
 * When integrating into the Formation page, this will be built from real Formation + Client + Workspace.
 */
export const dummyFormationDocData: FormationDocData = {
	formation_title: 'Conduite de réunions et animation de groupes',
	formation_duration: '2 jours (14 heures)',
	formation_modality: 'Présentiel',
	formation_code_rncp: 'RS5154',
	formation_financement: 'OPCO',
	client_name: 'ACME Formation SARL',
	client_address: '12 rue des Lilas, 75011 Paris',
	client_siret: '123 456 789 00012',
	client_email: 'contact@acme-formation.fr',
	organisme_name: 'Mentore',
	organisme_legal_name: 'Mentore SAS',
	organisme_siret: '987 654 321 00098',
	organisme_address: '5 avenue de la République, 69002 Lyon',
	date_signature: '04/02/2026',
	lieu: 'Lyon'
};
