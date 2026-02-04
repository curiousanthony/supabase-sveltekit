/**
 * Data shape used to fill document templates (e.g. Convention de formation).
 * Can be built from Formation + Client + Workspace when integrated into the app.
 */
export interface FormationDocData {
	formation_title: string;
	formation_duration: string;
	formation_modality: string;
	formation_code_rncp: string;
	formation_financement: string;
	client_name: string;
	client_address: string;
	client_siret: string;
	client_email: string;
	organisme_name: string;
	organisme_legal_name: string;
	organisme_siret: string;
	organisme_address: string;
	date_signature: string;
	lieu: string;
}
