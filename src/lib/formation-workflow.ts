import type { WorkflowStepKey } from '$lib/db/schema';

export interface WorkflowStepDef {
	key: WorkflowStepKey;
	label: string;
	shortLabel: string;
	/** Tab to open when "Faire" is clicked. */
	actionTab?: 'Aperçu' | 'Suivi' | 'Formateurs' | 'Séances' | 'Programme';
}

export const WORKFLOW_STEPS: WorkflowStepDef[] = [
	{
		key: 'info_verification',
		label: 'Vérifier les informations',
		shortLabel: 'Infos & apprenants',
		actionTab: 'Aperçu'
	},
	{
		key: 'convention_program',
		label: 'Générer la convention',
		shortLabel: 'Convention & programme',
		actionTab: 'Programme'
	},
	{
		key: 'needs_analysis',
		label: 'Envoyer le questionnaire de besoins',
		shortLabel: 'Audit des besoins',
		actionTab: 'Suivi'
	},
	{
		key: 'convocation',
		label: 'Envoyer les convocations',
		shortLabel: 'Convocations',
		actionTab: 'Suivi'
	},
	{
		key: 'mission_order',
		label: "Créer l'ordre de mission",
		shortLabel: 'Ordre de mission',
		actionTab: 'Formateurs'
	},
	{
		key: 'end_certificate',
		label: 'Générer les attestations',
		shortLabel: 'Attestations',
		actionTab: 'Suivi'
	},
	{
		key: 'satisfaction_questionnaires',
		label: 'Envoyer les questionnaires de satisfaction',
		shortLabel: 'Questionnaires',
		actionTab: 'Suivi'
	},
	{
		key: 'instructor_documents',
		label: 'Collecter les documents formateur',
		shortLabel: 'Docs formateur',
		actionTab: 'Formateurs'
	},
	{ key: 'billing', label: 'Émettre la facturation', shortLabel: 'Facturation', actionTab: 'Suivi' },
	{
		key: 'complete_file',
		label: 'Clôturer le dossier',
		shortLabel: 'Clôture',
		actionTab: 'Suivi'
	}
];

export function getStepDef(key: WorkflowStepKey): WorkflowStepDef | undefined {
	return WORKFLOW_STEPS.find((s) => s.key === key);
}

/** Default actions created when a new formation is initialized. */
export const DEFAULT_FORMATION_ACTIONS = [
	{ title: 'Vérifier les informations de la formation', etape: 'Récapitulatif' as const, order: 0 },
	{ title: 'Vérifier le programme associé', etape: 'Convention et programme' as const, order: 1 },
	{ title: 'Assigner un formateur', etape: 'Formateur' as const, order: 2 },
	{ title: 'Planifier les séances', etape: 'Convocations' as const, order: 3 },
	{ title: 'Envoyer le questionnaire de besoins', etape: 'Audit des besoins' as const, order: 4 },
	{ title: 'Envoyer les convocations', etape: 'Convocations' as const, order: 5 },
	{ title: 'Collecter les documents formateur', etape: 'Formateur' as const, order: 6 },
	{ title: 'Émettre la facturation', etape: 'Facturation' as const, order: 7 },
	{ title: 'Vérifier les émargements', etape: 'Émargement' as const, order: 8 },
	{ title: 'Envoyer les questionnaires de satisfaction', etape: 'Questionnaires de satisfaction' as const, order: 9 },
	{ title: 'Générer le certificat de réalisation', etape: 'Certificat de réalisation' as const, order: 10 },
	{ title: 'Clôturer le dossier', etape: 'Récap final' as const, order: 11 }
];

/** Qualiopi: key fields for criteria 2 & 3. */
export function isFormationQualiopiComplete(
	f: Record<string, unknown> & {
		name?: string | null;
		description?: string | null;
		modalite?: string | null;
		duree?: number | null;
		evaluationMode?: string | null;
		suiviAssiduite?: string | null;
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
