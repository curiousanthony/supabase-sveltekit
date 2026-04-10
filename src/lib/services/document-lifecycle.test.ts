import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DocumentType, DocumentStatus, TransitionContext } from './document-lifecycle';

// ── Mock variables ──────────────────────────────────────────────────────

let mockDbFindFirst: ReturnType<typeof vi.fn>;
let mockDbReturning: ReturnType<typeof vi.fn>;
let mockTxFindFirst: ReturnType<typeof vi.fn>;
let mockTxFindMany: ReturnType<typeof vi.fn>;
let mockTxReturning: ReturnType<typeof vi.fn>;
let mockLogAuditEvent: ReturnType<typeof vi.fn>;

// ── Mocks (vi.mock is hoisted) ──────────────────────────────────────────

vi.mock('drizzle-orm', () => ({
	eq: vi.fn((...a: unknown[]) => a),
	and: vi.fn((...a: unknown[]) => a),
	notInArray: vi.fn((...a: unknown[]) => a)
}));

vi.mock('./audit-log', () => ({
	logAuditEvent: (...args: unknown[]) => mockLogAuditEvent(...args)
}));

vi.mock('$lib/db/schema', () => ({
	formationDocuments: {
		id: 'col_id',
		formationId: 'col_formationId',
		status: 'col_status',
		type: 'col_type',
		replacesDocumentId: 'col_replacesDocumentId'
	}
}));

function makeUpdateChain(returningFn: ReturnType<typeof vi.fn>) {
	return {
		set: vi.fn().mockReturnValue({
			where: vi.fn().mockReturnValue({
				returning: returningFn,
				then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
					return Promise.resolve(undefined).then(resolve, reject);
				}
			})
		})
	};
}

mockDbFindFirst = vi.fn();
mockDbReturning = vi.fn();
mockTxFindFirst = vi.fn();
mockTxFindMany = vi.fn();
mockTxReturning = vi.fn();
mockLogAuditEvent = vi.fn().mockResolvedValue(undefined);

vi.mock('$lib/db', () => ({
	db: {
		query: {
			formationDocuments: {
				findFirst: (...args: unknown[]) => mockDbFindFirst(...args)
			}
		},
		update: vi.fn(() => makeUpdateChain(mockDbReturning)),
		transaction: vi.fn(async (cb: Function) => {
			const tx = {
				query: {
					formationDocuments: {
						findFirst: (...args: unknown[]) => mockTxFindFirst(...args),
						findMany: (...args: unknown[]) => mockTxFindMany(...args)
					}
				},
				update: vi.fn(() => makeUpdateChain(mockTxReturning))
			};
			return cb(tx);
		})
	}
}));

const {
	getValidTransitions,
	isValidTransition,
	isTerminalStatus,
	getValidStatuses,
	isValidStatus,
	computeDevisExpiry,
	getEffectiveStatus,
	transitionStatus,
	cancelFormationDocuments,
	replaceDocument
} = await import('./document-lifecycle');

// ── Helpers ─────────────────────────────────────────────────────────────

function makeCtx(overrides: Partial<TransitionContext> = {}): TransitionContext {
	return {
		documentId: 'doc-1',
		formationId: 'formation-1',
		userId: 'user-1',
		...overrides
	};
}

const ALL_TYPES: DocumentType[] = [
	'convention',
	'convocation',
	'feuille_emargement',
	'certificat',
	'attestation',
	'devis',
	'ordre_mission'
];

const TERMINAL: DocumentStatus[] = ['annule', 'remplace', 'archive'];

// ═══════════════════════════════════════════════════════════════════════
// Pure function tests
// ═══════════════════════════════════════════════════════════════════════

describe('getValidTransitions', () => {
	it('returns non-empty array for non-terminal statuses', () => {
		expect(getValidTransitions('devis', 'genere').length).toBeGreaterThan(0);
		expect(getValidTransitions('convention', 'envoye').length).toBeGreaterThan(0);
	});

	it('returns empty array for all terminal statuses across all types', () => {
		for (const type of ALL_TYPES) {
			for (const status of TERMINAL) {
				expect(getValidTransitions(type, status)).toEqual([]);
			}
		}
	});

	it('returns empty array for unknown type', () => {
		expect(getValidTransitions('unknown' as DocumentType, 'genere')).toEqual([]);
	});

	it('returns empty array for unknown status', () => {
		expect(getValidTransitions('devis', 'nonexistent' as DocumentStatus)).toEqual([]);
	});

	it('devis genere → envoye, archive, annule, remplace (not signe)', () => {
		const result = getValidTransitions('devis', 'genere');
		expect(result).toContain('envoye');
		expect(result).toContain('archive');
		expect(result).toContain('annule');
		expect(result).toContain('remplace');
		expect(result).not.toContain('signe');
	});

	it('devis envoye → accepte, refuse, archive, annule, remplace', () => {
		const result = getValidTransitions('devis', 'envoye');
		expect(result).toContain('accepte');
		expect(result).toContain('refuse');
		expect(result).toContain('annule');
		expect(result).toContain('remplace');
	});

	it('convention envoye → signe (not accepte)', () => {
		const result = getValidTransitions('convention', 'envoye');
		expect(result).toContain('signe');
		expect(result).not.toContain('accepte');
	});

	it('feuille_emargement genere → signatures_en_cours (not envoye)', () => {
		const result = getValidTransitions('feuille_emargement', 'genere');
		expect(result).toContain('signatures_en_cours');
		expect(result).not.toContain('envoye');
	});

	it('feuille_emargement signatures_en_cours → signe, archive, annule (not remplace)', () => {
		const result = getValidTransitions('feuille_emargement', 'signatures_en_cours');
		expect(result).toContain('signe');
		expect(result).toContain('archive');
		expect(result).toContain('annule');
		expect(result).not.toContain('remplace');
	});
});

describe('isValidTransition', () => {
	it('returns true for valid forward transitions', () => {
		expect(isValidTransition('devis', 'genere', 'envoye')).toBe(true);
		expect(isValidTransition('devis', 'envoye', 'accepte')).toBe(true);
		expect(isValidTransition('convention', 'envoye', 'signe')).toBe(true);
		expect(isValidTransition('feuille_emargement', 'genere', 'signatures_en_cours')).toBe(true);
	});

	it('returns false for backward transitions', () => {
		expect(isValidTransition('devis', 'envoye', 'genere')).toBe(false);
		expect(isValidTransition('convention', 'signe', 'envoye')).toBe(false);
	});

	it('returns false for transitions out of terminal states', () => {
		for (const type of ALL_TYPES) {
			for (const terminal of TERMINAL) {
				expect(isValidTransition(type, terminal, 'genere')).toBe(false);
			}
		}
	});

	it('returns false for self-transitions', () => {
		expect(isValidTransition('devis', 'genere', 'genere')).toBe(false);
		expect(isValidTransition('convention', 'envoye', 'envoye')).toBe(false);
	});

	it('returns true for annule from genere for all types', () => {
		for (const type of ALL_TYPES) {
			expect(isValidTransition(type, 'genere', 'annule')).toBe(true);
		}
	});

	it('returns true for remplace from genere for all types', () => {
		for (const type of ALL_TYPES) {
			expect(isValidTransition(type, 'genere', 'remplace')).toBe(true);
		}
	});
});

describe('isTerminalStatus', () => {
	it.each(TERMINAL)('identifies %s as terminal', (status) => {
		expect(isTerminalStatus(status)).toBe(true);
	});

	it.each([
		'genere',
		'envoye',
		'signe',
		'accepte',
		'refuse',
		'expire',
		'signatures_en_cours'
	] as DocumentStatus[])('identifies %s as non-terminal', (status) => {
		expect(isTerminalStatus(status)).toBe(false);
	});
});

describe('getValidStatuses', () => {
	it('returns all valid statuses for devis', () => {
		const statuses = getValidStatuses('devis');
		expect(statuses).toContain('genere');
		expect(statuses).toContain('envoye');
		expect(statuses).toContain('accepte');
		expect(statuses).toContain('refuse');
		expect(statuses).toContain('expire');
		expect(statuses).toContain('annule');
		expect(statuses).toContain('remplace');
		expect(statuses).toContain('archive');
		expect(statuses).toHaveLength(8);
	});

	it('convention includes signe but not signatures_en_cours or accepte', () => {
		const statuses = getValidStatuses('convention');
		expect(statuses).toContain('signe');
		expect(statuses).not.toContain('signatures_en_cours');
		expect(statuses).not.toContain('accepte');
	});

	it('feuille_emargement includes signatures_en_cours', () => {
		const statuses = getValidStatuses('feuille_emargement');
		expect(statuses).toContain('signatures_en_cours');
	});

	it('returns empty array for unknown type', () => {
		expect(getValidStatuses('unknown' as DocumentType)).toEqual([]);
	});
});

describe('isValidStatus', () => {
	it('returns true for valid statuses per type', () => {
		expect(isValidStatus('devis', 'genere')).toBe(true);
		expect(isValidStatus('devis', 'expire')).toBe(true);
		expect(isValidStatus('convention', 'signe')).toBe(true);
		expect(isValidStatus('feuille_emargement', 'signatures_en_cours')).toBe(true);
	});

	it('returns false for statuses that belong to a different type', () => {
		expect(isValidStatus('devis', 'signe')).toBe(false);
		expect(isValidStatus('convention', 'accepte')).toBe(false);
		expect(isValidStatus('convention', 'signatures_en_cours')).toBe(false);
		expect(isValidStatus('convocation', 'signe')).toBe(false);
	});

	it('returns false for unknown type', () => {
		expect(isValidStatus('unknown' as DocumentType, 'genere')).toBe(false);
	});

	it('returns false for empty string', () => {
		expect(isValidStatus('devis', '')).toBe(false);
	});

	it('returns false for arbitrary string', () => {
		expect(isValidStatus('devis', 'deleted')).toBe(false);
	});
});

describe('computeDevisExpiry', () => {
	it('returns expire when status is envoye and past expiresAt', () => {
		const pastDate = new Date(Date.now() - 86_400_000).toISOString();
		expect(computeDevisExpiry('envoye', pastDate)).toBe('expire');
	});

	it('returns null when envoye but not yet expired', () => {
		const futureDate = new Date(Date.now() + 86_400_000).toISOString();
		expect(computeDevisExpiry('envoye', futureDate)).toBeNull();
	});

	it('returns null when status is not envoye', () => {
		const pastDate = new Date(Date.now() - 86_400_000).toISOString();
		expect(computeDevisExpiry('genere', pastDate)).toBeNull();
		expect(computeDevisExpiry('accepte', pastDate)).toBeNull();
		expect(computeDevisExpiry('archive', pastDate)).toBeNull();
	});

	it('returns null when expiresAt is null', () => {
		expect(computeDevisExpiry('envoye', null)).toBeNull();
	});
});

describe('getEffectiveStatus', () => {
	it('returns expire for devis that is envoye and past expiresAt', () => {
		const pastDate = new Date(Date.now() - 86_400_000).toISOString();
		expect(
			getEffectiveStatus({ type: 'devis', status: 'envoye', expiresAt: pastDate })
		).toBe('expire');
	});

	it('returns raw status for devis that is envoye but not expired', () => {
		const futureDate = new Date(Date.now() + 86_400_000).toISOString();
		expect(
			getEffectiveStatus({ type: 'devis', status: 'envoye', expiresAt: futureDate })
		).toBe('envoye');
	});

	it('returns raw status for non-devis documents regardless of expiresAt', () => {
		const pastDate = new Date(Date.now() - 86_400_000).toISOString();
		expect(
			getEffectiveStatus({ type: 'convention', status: 'envoye', expiresAt: pastDate })
		).toBe('envoye');
	});

	it('returns raw status when expiresAt is null', () => {
		expect(
			getEffectiveStatus({ type: 'devis', status: 'envoye', expiresAt: null })
		).toBe('envoye');
	});

	it('returns raw status for non-envoye devis', () => {
		expect(
			getEffectiveStatus({ type: 'devis', status: 'accepte', expiresAt: null })
		).toBe('accepte');
	});
});

// ═══════════════════════════════════════════════════════════════════════
// Transition matrix coverage
// ═══════════════════════════════════════════════════════════════════════

describe('transition matrix coverage', () => {
	describe('devis lifecycle', () => {
		it('genere → envoye → accepte', () => {
			expect(isValidTransition('devis', 'genere', 'envoye')).toBe(true);
			expect(isValidTransition('devis', 'envoye', 'accepte')).toBe(true);
		});

		it('genere → envoye → refuse', () => {
			expect(isValidTransition('devis', 'genere', 'envoye')).toBe(true);
			expect(isValidTransition('devis', 'envoye', 'refuse')).toBe(true);
		});

		it('refuse can be archived or replaced but not annulé', () => {
			expect(isValidTransition('devis', 'refuse', 'archive')).toBe(true);
			expect(isValidTransition('devis', 'refuse', 'remplace')).toBe(true);
			expect(isValidTransition('devis', 'refuse', 'annule')).toBe(false);
		});

		it('expire can be archived or replaced but not annulé', () => {
			expect(isValidTransition('devis', 'expire', 'archive')).toBe(true);
			expect(isValidTransition('devis', 'expire', 'remplace')).toBe(true);
			expect(isValidTransition('devis', 'expire', 'annule')).toBe(false);
		});

		it('devis does not support signe or signatures_en_cours', () => {
			expect(isValidStatus('devis', 'signe')).toBe(false);
			expect(isValidStatus('devis', 'signatures_en_cours')).toBe(false);
		});
	});

	describe('convention lifecycle', () => {
		it('genere → envoye → signe → archive', () => {
			expect(isValidTransition('convention', 'genere', 'envoye')).toBe(true);
			expect(isValidTransition('convention', 'envoye', 'signe')).toBe(true);
			expect(isValidTransition('convention', 'signe', 'archive')).toBe(true);
		});

		it('does not support accepte, refuse, or expire', () => {
			expect(isValidStatus('convention', 'accepte')).toBe(false);
			expect(isValidStatus('convention', 'refuse')).toBe(false);
			expect(isValidStatus('convention', 'expire')).toBe(false);
		});
	});

	describe('ordre_mission lifecycle', () => {
		it('mirrors convention: genere → envoye → signe → archive', () => {
			expect(isValidTransition('ordre_mission', 'genere', 'envoye')).toBe(true);
			expect(isValidTransition('ordre_mission', 'envoye', 'signe')).toBe(true);
			expect(isValidTransition('ordre_mission', 'signe', 'archive')).toBe(true);
		});
	});

	describe('feuille_emargement lifecycle', () => {
		it('genere → signatures_en_cours → signe → archive', () => {
			expect(isValidTransition('feuille_emargement', 'genere', 'signatures_en_cours')).toBe(
				true
			);
			expect(isValidTransition('feuille_emargement', 'signatures_en_cours', 'signe')).toBe(
				true
			);
			expect(isValidTransition('feuille_emargement', 'signe', 'archive')).toBe(true);
		});

		it('cannot skip signatures_en_cours: genere → signe is invalid', () => {
			expect(isValidTransition('feuille_emargement', 'genere', 'signe')).toBe(false);
		});

		it('does not support envoye', () => {
			expect(isValidStatus('feuille_emargement', 'envoye')).toBe(false);
		});

		it('signatures_en_cours cannot be remplacé', () => {
			expect(isValidTransition('feuille_emargement', 'signatures_en_cours', 'remplace')).toBe(
				false
			);
		});
	});

	describe('simple lifecycle (convocation, certificat, attestation)', () => {
		const simpleTypes: DocumentType[] = ['convocation', 'certificat', 'attestation'];

		it.each(simpleTypes)('%s: genere → envoye → archive', (type) => {
			expect(isValidTransition(type, 'genere', 'envoye')).toBe(true);
			expect(isValidTransition(type, 'envoye', 'archive')).toBe(true);
		});

		it.each(simpleTypes)('%s: envoye does not support signe or accepte', (type) => {
			expect(isValidTransition(type, 'envoye', 'signe')).toBe(false);
			expect(isValidTransition(type, 'envoye', 'accepte')).toBe(false);
		});
	});

	describe('universal rules', () => {
		it('all types support genere → annule', () => {
			for (const type of ALL_TYPES) {
				expect(isValidTransition(type, 'genere', 'annule')).toBe(true);
			}
		});

		it('all types support genere → archive', () => {
			for (const type of ALL_TYPES) {
				expect(isValidTransition(type, 'genere', 'archive')).toBe(true);
			}
		});

		it('no transitions out of any terminal state for any type', () => {
			for (const type of ALL_TYPES) {
				for (const terminal of TERMINAL) {
					expect(getValidTransitions(type, terminal)).toEqual([]);
				}
			}
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════
// DB function tests (mocked)
// ═══════════════════════════════════════════════════════════════════════

describe('transitionStatus', () => {
	beforeEach(() => {
		mockDbFindFirst.mockReset();
		mockDbReturning.mockReset();
		mockLogAuditEvent.mockReset().mockResolvedValue(undefined);
	});

	it('succeeds for a valid transition and calls logAuditEvent', async () => {
		mockDbFindFirst.mockResolvedValue({ id: 'doc-1', type: 'devis', status: 'genere' });
		mockDbReturning.mockResolvedValue([{ id: 'doc-1' }]);

		const result = await transitionStatus(makeCtx(), 'envoye');

		expect(result).toEqual({ success: true });
		expect(mockLogAuditEvent).toHaveBeenCalledOnce();
		expect(mockLogAuditEvent).toHaveBeenCalledWith(
			expect.objectContaining({
				formationId: 'formation-1',
				userId: 'user-1',
				actionType: 'document_status_change',
				entityType: 'formation_document',
				entityId: 'doc-1',
				fieldName: 'status',
				oldValue: 'genere',
				newValue: 'envoye'
			})
		);
	});

	it('returns error when document is not found', async () => {
		mockDbFindFirst.mockResolvedValue(undefined);

		const result = await transitionStatus(makeCtx(), 'envoye');

		expect(result.success).toBe(false);
		expect(result.error).toBe('Document introuvable');
		expect(mockLogAuditEvent).not.toHaveBeenCalled();
	});

	it('returns error when current status is invalid for the document type', async () => {
		mockDbFindFirst.mockResolvedValue({
			id: 'doc-1',
			type: 'convention',
			status: 'accepte'
		});

		const result = await transitionStatus(makeCtx(), 'archive');

		expect(result.success).toBe(false);
		expect(result.error).toContain('invalide');
		expect(mockLogAuditEvent).not.toHaveBeenCalled();
	});

	it('returns error when transition is not allowed', async () => {
		mockDbFindFirst.mockResolvedValue({ id: 'doc-1', type: 'devis', status: 'genere' });

		const result = await transitionStatus(makeCtx(), 'signe');

		expect(result.success).toBe(false);
		expect(result.error).toContain('interdite');
		expect(mockLogAuditEvent).not.toHaveBeenCalled();
	});

	it('returns error on transitions out of terminal state', async () => {
		mockDbFindFirst.mockResolvedValue({ id: 'doc-1', type: 'devis', status: 'annule' });

		const result = await transitionStatus(makeCtx(), 'envoye');

		expect(result.success).toBe(false);
		expect(result.error).toContain('interdite');
	});

	it('handles optimistic locking failure (race condition)', async () => {
		mockDbFindFirst.mockResolvedValue({ id: 'doc-1', type: 'devis', status: 'genere' });
		mockDbReturning.mockResolvedValue([]);

		const result = await transitionStatus(makeCtx(), 'envoye');

		expect(result.success).toBe(false);
		expect(result.error).toContain('entre-temps');
		expect(mockLogAuditEvent).not.toHaveBeenCalled();
	});
});

describe('cancelFormationDocuments', () => {
	beforeEach(() => {
		mockTxFindMany.mockReset();
		mockTxReturning.mockReset();
		mockLogAuditEvent.mockReset().mockResolvedValue(undefined);
	});

	it('cancels all in-flight documents and logs audit for each', async () => {
		const inFlightDocs = [
			{ id: 'doc-1', status: 'genere', type: 'devis' },
			{ id: 'doc-2', status: 'envoye', type: 'convention' }
		];
		mockTxFindMany.mockResolvedValue(inFlightDocs);

		const result = await cancelFormationDocuments('formation-1', 'user-1');

		expect(result).toEqual({ cancelled: 2 });
		expect(mockLogAuditEvent).toHaveBeenCalledTimes(2);
		expect(mockLogAuditEvent).toHaveBeenCalledWith(
			expect.objectContaining({
				entityId: 'doc-1',
				oldValue: 'genere',
				newValue: 'annule'
			})
		);
		expect(mockLogAuditEvent).toHaveBeenCalledWith(
			expect.objectContaining({
				entityId: 'doc-2',
				oldValue: 'envoye',
				newValue: 'annule'
			})
		);
	});

	it('returns 0 when no in-flight documents exist', async () => {
		mockTxFindMany.mockResolvedValue([]);

		const result = await cancelFormationDocuments('formation-1', 'user-1');

		expect(result).toEqual({ cancelled: 0 });
		expect(mockLogAuditEvent).not.toHaveBeenCalled();
	});

	it('passes correct audit metadata for each cancelled document', async () => {
		mockTxFindMany.mockResolvedValue([
			{ id: 'doc-a', status: 'signatures_en_cours', type: 'feuille_emargement' }
		]);

		await cancelFormationDocuments('form-x', 'user-y');

		expect(mockLogAuditEvent).toHaveBeenCalledWith(
			expect.objectContaining({
				formationId: 'form-x',
				userId: 'user-y',
				actionType: 'document_status_change',
				entityType: 'formation_document',
				entityId: 'doc-a',
				fieldName: 'status',
				oldValue: 'signatures_en_cours',
				newValue: 'annule'
			})
		);
	});
});

describe('replaceDocument', () => {
	beforeEach(() => {
		mockTxFindFirst.mockReset();
		mockTxReturning.mockReset();
		mockLogAuditEvent.mockReset().mockResolvedValue(undefined);
	});

	it('marks old doc as remplace and logs audit event on success', async () => {
		mockTxFindFirst
			.mockResolvedValueOnce({ id: 'doc-old', type: 'devis', status: 'genere' })
			.mockResolvedValueOnce({ id: 'doc-new', replacesDocumentId: null });
		mockTxReturning.mockResolvedValue([{ id: 'doc-old' }]);

		const result = await replaceDocument(makeCtx({ documentId: 'doc-old' }), 'doc-new');

		expect(result).toEqual({ success: true });
		expect(mockLogAuditEvent).toHaveBeenCalledWith(
			expect.objectContaining({
				actionType: 'document_replaced',
				entityType: 'formation_document',
				entityId: 'doc-old',
				oldValue: 'genere',
				newValue: 'remplace'
			})
		);
	});

	it('returns error when old document is not found', async () => {
		mockTxFindFirst.mockResolvedValueOnce(undefined);

		const result = await replaceDocument(makeCtx(), 'doc-new');

		expect(result.success).toBe(false);
		expect(result.error).toBe('Document original introuvable');
	});

	it('returns error when new document is not found in the formation', async () => {
		mockTxFindFirst
			.mockResolvedValueOnce({ id: 'doc-old', type: 'devis', status: 'genere' })
			.mockResolvedValueOnce(undefined);

		const result = await replaceDocument(makeCtx({ documentId: 'doc-old' }), 'doc-new');

		expect(result.success).toBe(false);
		expect(result.error).toBe('Nouveau document introuvable dans cette formation');
	});

	it('blocks replacement of signed documents with specific message', async () => {
		mockTxFindFirst
			.mockResolvedValueOnce({ id: 'doc-old', type: 'convention', status: 'signe' })
			.mockResolvedValueOnce({ id: 'doc-new', replacesDocumentId: null });

		const result = await replaceDocument(makeCtx({ documentId: 'doc-old' }), 'doc-new');

		expect(result.success).toBe(false);
		expect(result.error).toContain('signé');
		expect(result.error).toContain('avenant');
		expect(mockLogAuditEvent).not.toHaveBeenCalled();
	});

	it('fails when transition to remplace is invalid (terminal status)', async () => {
		mockTxFindFirst
			.mockResolvedValueOnce({ id: 'doc-old', type: 'devis', status: 'annule' })
			.mockResolvedValueOnce({ id: 'doc-new', replacesDocumentId: null });

		const result = await replaceDocument(makeCtx({ documentId: 'doc-old' }), 'doc-new');

		expect(result.success).toBe(false);
		expect(result.error).toContain('interdit');
	});

	it('handles optimistic locking failure during replacement', async () => {
		mockTxFindFirst
			.mockResolvedValueOnce({ id: 'doc-old', type: 'devis', status: 'genere' })
			.mockResolvedValueOnce({ id: 'doc-new', replacesDocumentId: null });
		mockTxReturning.mockResolvedValue([]);

		const result = await replaceDocument(makeCtx({ documentId: 'doc-old' }), 'doc-new');

		expect(result.success).toBe(false);
		expect(result.error).toContain('entre-temps');
		expect(mockLogAuditEvent).not.toHaveBeenCalled();
	});

	it('succeeds for envoye devis replacement', async () => {
		mockTxFindFirst
			.mockResolvedValueOnce({ id: 'doc-old', type: 'devis', status: 'envoye' })
			.mockResolvedValueOnce({ id: 'doc-new', replacesDocumentId: null });
		mockTxReturning.mockResolvedValue([{ id: 'doc-old' }]);

		const result = await replaceDocument(makeCtx({ documentId: 'doc-old' }), 'doc-new');

		expect(result).toEqual({ success: true });
	});
});
