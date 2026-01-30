import type { WorkflowStepKey } from '$lib/db/schema';

export interface WorkflowStepDef {
	key: WorkflowStepKey;
	label: string;
	shortLabel: string;
	/** Tab to open when "Faire" is clicked, or action id for Documents. */
	actionTab?: 'Informations' | 'Documents' | 'Formateurs' | 'Séances' | 'Paramètres';
	/** For Documents tab: document type to generate (convention, programme, etc.). */
	documentAction?: 'convention' | 'programme' | 'convocation' | 'mission_order' | 'end_certificate';
}

export const WORKFLOW_STEPS: WorkflowStepDef[] = [
	{
		key: 'info_verification',
		label: 'Vérifications des informations',
		shortLabel: 'Infos & apprenants',
		actionTab: 'Informations'
	},
	{
		key: 'convention_program',
		label: 'Convention et programme',
		shortLabel: 'Convention & programme',
		actionTab: 'Documents',
		documentAction: 'convention'
	},
	{
		key: 'needs_analysis',
		label: 'Analyse des besoins',
		shortLabel: 'Analyse des besoins',
		actionTab: 'Informations'
	},
	{
		key: 'convocation',
		label: 'Convocation',
		shortLabel: 'Convocations',
		actionTab: 'Documents',
		documentAction: 'convocation'
	},
	{
		key: 'mission_order',
		label: 'Ordre de mission',
		shortLabel: 'Ordre de mission',
		actionTab: 'Documents',
		documentAction: 'mission_order'
	},
	{
		key: 'end_certificate',
		label: 'Attestation de fin de mission',
		shortLabel: 'Attestations',
		actionTab: 'Documents',
		documentAction: 'end_certificate'
	},
	{
		key: 'satisfaction_questionnaires',
		label: 'Questionnaires de satisfaction',
		shortLabel: 'Questionnaires',
		actionTab: 'Paramètres'
	},
	{
		key: 'instructor_documents',
		label: 'Documents formateur',
		shortLabel: 'Docs formateur',
		actionTab: 'Formateurs'
	},
	{ key: 'billing', label: 'Facturation', shortLabel: 'Facturation', actionTab: 'Paramètres' },
	{
		key: 'complete_file',
		label: 'Dossier complet',
		shortLabel: 'Dossier complet',
		actionTab: 'Documents'
	}
];

export function getStepDef(key: WorkflowStepKey): WorkflowStepDef | undefined {
	return WORKFLOW_STEPS.find((s) => s.key === key);
}

/** Qualiopi: key fields for criteria 2 & 3. Works with or without evaluationMode/suiviAssiduite on schema. */
export function isFormationQualiopiComplete(
	f: Record<string, unknown> & {
		name?: string | null;
		description?: string | null;
		modalite?: string | null;
		duree?: number | null;
	}
) {
	const hasName = Boolean(f.name && String(f.name).trim());
	const hasDescription = Boolean(f.description && String(f.description).trim());
	const hasModalite = Boolean(f.modalite);
	const hasDuree = f.duree != null && Number(f.duree) > 0;
	const hasEvaluationMode = f.evaluationMode != null && Boolean(String(f.evaluationMode).trim());
	const hasSuiviAssiduite = f.suiviAssiduite != null && Boolean(String(f.suiviAssiduite).trim());
	const ok =
		hasName && hasDescription && hasModalite && hasDuree && hasEvaluationMode && hasSuiviAssiduite;
	const missing: string[] = [];
	if (!hasName) missing.push('nom');
	if (!hasDescription) missing.push('description');
	if (!hasModalite) missing.push('modalité');
	if (!hasDuree) missing.push('durée');
	if (!hasEvaluationMode) missing.push("mode d'évaluation");
	if (!hasSuiviAssiduite) missing.push("suivi d'assiduité");
	return { ok, missing };
}
