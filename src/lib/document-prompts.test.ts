import { describe, it, expect } from 'vitest';
import {
	getDocumentPrompts,
	getTargetTab,
	type DocumentPrompt,
	type QuestActionInput,
	type DocumentInput
} from './document-prompts';

function makeQuestAction(overrides: Partial<QuestActionInput> = {}): QuestActionInput {
	return {
		questKey: 'devis',
		status: 'En cours',
		...overrides
	};
}

function makeDocument(overrides: Partial<DocumentInput> = {}): DocumentInput {
	return {
		type: 'devis',
		effectiveStatus: 'genere',
		...overrides
	};
}

// ── getDocumentPrompts ──────────────────────────────────────────────────

describe('getDocumentPrompts', () => {
	describe('prompt generation based on quest status', () => {
		it('returns a prompt when quest is "En cours" and no document exists', () => {
			const actions = [makeQuestAction({ questKey: 'devis', status: 'En cours' })];
			const result = getDocumentPrompts(actions, []);

			expect(result.has('devis')).toBe(true);
			const prompt = result.get('devis')!;
			expect(prompt.documentType).toBe('devis');
			expect(prompt.questKey).toBe('devis');
			expect(prompt.canGenerate).toBe(true);
		});

		it('returns a prompt when quest is "Pas commencé" and no document exists', () => {
			const actions = [makeQuestAction({ questKey: 'devis', status: 'Pas commencé' })];
			const result = getDocumentPrompts(actions, []);

			expect(result.has('devis')).toBe(true);
		});

		it('returns no prompt when quest is "Terminé"', () => {
			const actions = [makeQuestAction({ questKey: 'devis', status: 'Terminé' })];
			const result = getDocumentPrompts(actions, []);

			expect(result.has('devis')).toBe(false);
		});
	});

	describe('prompt suppression based on existing documents', () => {
		it('returns no prompt when a document of that type already exists with active status', () => {
			const actions = [makeQuestAction({ questKey: 'devis', status: 'En cours' })];
			const docs = [makeDocument({ type: 'devis', effectiveStatus: 'genere' })];
			const result = getDocumentPrompts(actions, docs);

			expect(result.has('devis')).toBe(false);
		});

		it('returns no prompt when document is in "envoye" status', () => {
			const actions = [makeQuestAction({ questKey: 'devis', status: 'En cours' })];
			const docs = [makeDocument({ type: 'devis', effectiveStatus: 'envoye' })];
			const result = getDocumentPrompts(actions, docs);

			expect(result.has('devis')).toBe(false);
		});

		it('returns no prompt when document is "signe"', () => {
			const actions = [makeQuestAction({ questKey: 'convention', status: 'En cours' })];
			const docs = [makeDocument({ type: 'convention', effectiveStatus: 'signe' })];
			const result = getDocumentPrompts(actions, docs);

			expect(result.has('convention')).toBe(false);
		});

		it('returns no prompt when document is "accepte"', () => {
			const actions = [makeQuestAction({ questKey: 'devis', status: 'En cours' })];
			const docs = [makeDocument({ type: 'devis', effectiveStatus: 'accepte' })];
			const result = getDocumentPrompts(actions, docs);

			expect(result.has('devis')).toBe(false);
		});

		it('returns prompt when document exists but is "remplace" (needs regeneration)', () => {
			const actions = [makeQuestAction({ questKey: 'devis', status: 'En cours' })];
			const docs = [makeDocument({ type: 'devis', effectiveStatus: 'remplace' })];
			const result = getDocumentPrompts(actions, docs);

			expect(result.has('devis')).toBe(true);
			expect(result.get('devis')!.canGenerate).toBe(true);
		});

		it('returns prompt when document exists but is "annule"', () => {
			const actions = [makeQuestAction({ questKey: 'devis', status: 'En cours' })];
			const docs = [makeDocument({ type: 'devis', effectiveStatus: 'annule' })];
			const result = getDocumentPrompts(actions, docs);

			expect(result.has('devis')).toBe(true);
		});

		it('does not suppress prompt based on documents of a different type', () => {
			const actions = [makeQuestAction({ questKey: 'devis', status: 'En cours' })];
			const docs = [makeDocument({ type: 'convention', effectiveStatus: 'genere' })];
			const result = getDocumentPrompts(actions, docs);

			expect(result.has('devis')).toBe(true);
		});
	});

	describe('French prompt messages', () => {
		const documentTypeMessages: [string, string, RegExp][] = [
			['devis', 'devis', /devis/i],
			['convention', 'convention', /convention/i],
			['convocations', 'convocation', /convocation/i],
			['ordre_mission', 'ordre_mission', /ordre de mission/i],
			['certificat_realisation', 'certificat', /certificat/i],
			['attestation', 'attestation', /attestation/i]
		];

		it.each(documentTypeMessages)(
			'returns French prompt for quest "%s" (documentType: %s)',
			(questKey, _docType, messagePattern) => {
				const actions = [makeQuestAction({ questKey, status: 'En cours' })];
				const result = getDocumentPrompts(actions, []);

				const prompt = result.values().next().value as DocumentPrompt;
				expect(prompt).toBeDefined();
				expect(prompt.message).toMatch(messagePattern);
				expect(prompt.message.length).toBeGreaterThan(10);
			}
		);
	});

	describe('quest key for deep-link protocol', () => {
		it('includes the questKey in the returned prompt', () => {
			const actions = [makeQuestAction({ questKey: 'convention', status: 'En cours' })];
			const result = getDocumentPrompts(actions, []);

			expect(result.get('convention')!.questKey).toBe('convention');
		});

		it('maps quest key to the correct document type', () => {
			const actions = [
				makeQuestAction({ questKey: 'certificat_realisation', status: 'En cours' })
			];
			const result = getDocumentPrompts(actions, []);

			expect(result.get('certificat')!.questKey).toBe('certificat_realisation');
			expect(result.get('certificat')!.documentType).toBe('certificat');
		});
	});

	describe('edge cases', () => {
		it('returns empty map when no quest actions provided', () => {
			const result = getDocumentPrompts([], []);
			expect(result.size).toBe(0);
		});

		it('returns empty map when all quests are non-document type', () => {
			const actions = [
				makeQuestAction({ questKey: 'verification_infos', status: 'En cours' }),
				makeQuestAction({ questKey: 'analyse_besoins', status: 'Pas commencé' })
			];
			const result = getDocumentPrompts(actions, []);
			expect(result.size).toBe(0);
		});

		it('ignores quests with null questKey', () => {
			const actions = [makeQuestAction({ questKey: null, status: 'En cours' })];
			const result = getDocumentPrompts(actions, []);
			expect(result.size).toBe(0);
		});

		it('handles multiple document-generating quests correctly', () => {
			const actions = [
				makeQuestAction({ questKey: 'devis', status: 'En cours' }),
				makeQuestAction({ questKey: 'convention', status: 'Pas commencé' }),
				makeQuestAction({ questKey: 'ordre_mission', status: 'En cours' }),
				makeQuestAction({ questKey: 'verification_infos', status: 'En cours' })
			];
			const result = getDocumentPrompts(actions, []);

			expect(result.size).toBe(3);
			expect(result.has('devis')).toBe(true);
			expect(result.has('convention')).toBe(true);
			expect(result.has('ordre_mission')).toBe(true);
		});

		it('suppresses only the document type that already exists', () => {
			const actions = [
				makeQuestAction({ questKey: 'devis', status: 'En cours' }),
				makeQuestAction({ questKey: 'convention', status: 'En cours' })
			];
			const docs = [makeDocument({ type: 'devis', effectiveStatus: 'genere' })];
			const result = getDocumentPrompts(actions, docs);

			expect(result.has('devis')).toBe(false);
			expect(result.has('convention')).toBe(true);
		});

		it('suppresses prompt when any active non-terminal document exists among multiples', () => {
			const actions = [makeQuestAction({ questKey: 'devis', status: 'En cours' })];
			const docs = [
				makeDocument({ type: 'devis', effectiveStatus: 'remplace' }),
				makeDocument({ type: 'devis', effectiveStatus: 'genere' })
			];
			const result = getDocumentPrompts(actions, docs);

			expect(result.has('devis')).toBe(false);
		});

		it('shows prompt when all documents of a type are terminal', () => {
			const actions = [makeQuestAction({ questKey: 'devis', status: 'En cours' })];
			const docs = [
				makeDocument({ type: 'devis', effectiveStatus: 'remplace' }),
				makeDocument({ type: 'devis', effectiveStatus: 'annule' })
			];
			const result = getDocumentPrompts(actions, docs);

			expect(result.has('devis')).toBe(true);
		});
	});
});

// ── getTargetTab ────────────────────────────────────────────────────────

describe('getTargetTab', () => {
	describe('document-centric quest keys map to "documents" tab', () => {
		const documentQuestKeys = [
			'devis',
			'convention',
			'ordre_mission',
			'convocations',
			'certificat_realisation',
			'attestation'
		];

		it.each(documentQuestKeys)('maps "%s" to "documents"', (questKey) => {
			expect(getTargetTab(questKey)).toBe('documents');
		});
	});

	describe('existing mappings remain unchanged', () => {
		const preservedMappings: [string, string][] = [
			['verification_infos', 'fiche'],
			['analyse_besoins', 'apprenants'],
			['programme_modules', 'programme'],
			['affectation_formateur', 'formateurs'],
			['preparation_logistique', 'fiche'],
			['emargement', 'seances'],
			['documents_formateur', 'formateurs'],
			['facturation', 'finances']
		];

		it.each(preservedMappings)('maps "%s" to "%s"', (questKey, expectedTab) => {
			expect(getTargetTab(questKey)).toBe(expectedTab);
		});
	});

	describe('edge cases', () => {
		it('falls back to "suivi" for unknown quest keys', () => {
			expect(getTargetTab('unknown_quest')).toBe('suivi');
		});

		it('returns "suivi" for null questKey', () => {
			expect(getTargetTab(null)).toBe('suivi');
		});
	});
});
