import { QUEST_TEMPLATES, type GenerateDocumentConfig } from './formation-quests';

export interface QuestActionInput {
	questKey: string | null;
	status: 'Terminé' | 'En cours' | 'Pas commencé';
}

export interface DocumentInput {
	type: string;
	effectiveStatus: string;
}

export interface DocumentPrompt {
	documentType: string;
	questKey: string;
	message: string;
	canGenerate: boolean;
}

const TERMINAL_STATUSES = new Set(['remplace', 'annule']);

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
	devis: 'Le devis est prêt à être généré',
	convention: 'La convention est prête à être générée',
	convocation: 'Les convocations sont prêtes à être générées',
	ordre_mission: "L'ordre de mission est prêt à être généré",
	certificat: 'Le certificat de réalisation est prêt à être généré',
	attestation: "L'attestation est prête à être générée",
	facture: 'La facture est prête à être générée'
};

/**
 * Build quest key → document type mapping from QUEST_TEMPLATES.
 * A quest maps to a document type if it has a sub-action with
 * `inlineType: 'generate-document'`.
 */
const QUEST_TO_DOC_TYPE: ReadonlyMap<string, string> = (() => {
	const map = new Map<string, string>();
	for (const quest of QUEST_TEMPLATES) {
		for (const sub of quest.subActions) {
			if (sub.inlineType === 'generate-document' && sub.inlineConfig) {
				const docType = (sub.inlineConfig as GenerateDocumentConfig).documentType;
				if (docType) {
					map.set(quest.key, docType);
					break;
				}
			}
		}
	}
	return map;
})();

/**
 * Determines which document types need contextual generation prompts
 * based on quest state and existing documents.
 *
 * Returns a Map keyed by document type (e.g. 'devis', 'convention').
 */
export function getDocumentPrompts(
	questActions: QuestActionInput[],
	documents: DocumentInput[]
): Map<string, DocumentPrompt> {
	const prompts = new Map<string, DocumentPrompt>();

	for (const action of questActions) {
		if (!action.questKey) continue;
		if (action.status === 'Terminé') continue;

		const docType = QUEST_TO_DOC_TYPE.get(action.questKey);
		if (!docType) continue;

		const hasActiveDoc = documents.some(
			(d) => d.type === docType && !TERMINAL_STATUSES.has(d.effectiveStatus)
		);
		if (hasActiveDoc) continue;

		prompts.set(docType, {
			documentType: docType,
			questKey: action.questKey,
			message: DOCUMENT_TYPE_LABELS[docType] ?? `Le document ${docType} est prêt à être généré`,
			canGenerate: true
		});
	}

	return prompts;
}

const TAB_MAP: Record<string, string> = {
	verification_infos: 'fiche',
	analyse_besoins: 'apprenants',
	programme_modules: 'programme',
	affectation_formateur: 'formateurs',
	convocations: 'documents',
	preparation_logistique: 'fiche',
	emargement: 'seances',
	documents_formateur: 'formateurs',
	facturation: 'finances',
	devis: 'documents',
	convention: 'documents',
	ordre_mission: 'documents',
	certificat_realisation: 'documents',
	attestation: 'documents'
};

/**
 * Maps a quest key to the appropriate formation tab.
 * Document-centric quests map to 'documents'; others preserve
 * existing mappings. Falls back to 'suivi'.
 */
export function getTargetTab(questKey: string | null): string {
	if (!questKey) return 'suivi';
	return TAB_MAP[questKey] ?? 'suivi';
}
