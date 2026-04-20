/**
 * Unit tests for the `generateForAll` server action (T-14).
 *
 * ALL TESTS FAIL in the red phase — `generateForAll` does not exist yet in
 * `actions`. They define the acceptance criteria for the implementer.
 *
 * Architect caveat 1 (write-path-review §3): `logAuditEvent` failures must NOT
 * be silently swallowed in the batch path. The dedicated test below will keep
 * failing until the implementer surfaces audit failures into `LearnerResult`.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mock factories (required: vi.mock factories are hoisted) ─────────

const {
	mockFormationsFindFirst,
	mockWorkspacesFindFirst,
	mockApprenantsFindMany,
	mockDocumentsFindMany,
	mockDbDeleteWhere,
	mockDbDelete,
	mockGetUserWorkspace,
	mockGenerateDocument,
	mockLogAuditEvent
} = vi.hoisted(() => {
	const mockDbDeleteWhere = vi.fn().mockResolvedValue(undefined);
	const mockDbDelete = vi.fn(() => ({ where: mockDbDeleteWhere }));
	return {
		mockFormationsFindFirst: vi.fn(),
		mockWorkspacesFindFirst: vi.fn(),
		mockApprenantsFindMany: vi.fn(),
		mockDocumentsFindMany: vi.fn(),
		mockDbDeleteWhere,
		mockDbDelete,
		mockGetUserWorkspace: vi.fn(),
		mockGenerateDocument: vi.fn(),
		mockLogAuditEvent: vi.fn()
	};
});

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('drizzle-orm', () => ({
	eq: vi.fn((_a, _b) => ({})),
	and: vi.fn((..._args) => ({})),
	desc: vi.fn((_a) => ({})),
	notInArray: vi.fn((_a, _b) => ({}))
}));

vi.mock('$lib/db/schema', () => ({
	formationDocuments: { id: 'id', formationId: 'formationId', type: 'type', status: 'status', relatedContactId: 'relatedContactId' },
	formationEmails: {},
	formations: { id: 'id', workspaceId: 'workspaceId' },
	formationApprenants: { formationId: 'formationId' },
	workspaces: { id: 'id' }
}));

vi.mock('$lib/db', () => ({
	db: {
		query: {
			formations: { findFirst: mockFormationsFindFirst },
			workspaces: { findFirst: mockWorkspacesFindFirst },
			formationApprenants: { findMany: mockApprenantsFindMany },
			formationDocuments: { findMany: mockDocumentsFindMany }
		},
		delete: mockDbDelete
	}
}));

vi.mock('$lib/auth', () => ({ getUserWorkspace: mockGetUserWorkspace }));

vi.mock('$lib/services/document-generator', () => ({
	generateDocument: mockGenerateDocument,
	getDocumentSignedUrl: vi.fn()
}));

vi.mock('$lib/services/audit-log', () => ({ logAuditEvent: mockLogAuditEvent }));

vi.mock('$lib/services/document-lifecycle', () => ({
	getEffectiveStatus: vi.fn(({ status }: { status: string }) => status),
	transitionStatus: vi.fn(),
	replaceDocument: vi.fn(),
	isValidTransition: vi.fn(() => false)
}));

// ── Import SUT after all mocks ────────────────────────────────────────────────
// `actions` will contain generateDocument, regenerateAll, etc. but NOT
// generateForAll (the function under test that doesn't exist yet).
import { actions } from './+page.server.js';

// ── Fixture factories ─────────────────────────────────────────────────────────

function makeFormData(fields: Record<string, string> = {}): FormData {
	const fd = new FormData();
	for (const [k, v] of Object.entries(fields)) fd.set(k, v);
	return fd;
}

type PartialEvent = {
	params?: Record<string, string>;
	formData?: Record<string, string>;
	sessionUser?: { id: string } | null;
	customSignal?: AbortSignal;
};

function makeEvent(opts: PartialEvent = {}): Parameters<(typeof actions)['generateForAll']>[0] {
	const sessionUser = opts.sessionUser !== undefined ? opts.sessionUser : { id: 'user-1' };
	const session = sessionUser ? { id: 'session-1', user: sessionUser } : null;

	return {
		params: { id: 'formation-1', ...opts.params },
		request: {
			formData: async () => makeFormData(opts.formData ?? { type: 'convocation' }),
			signal: opts.customSignal ?? new AbortController().signal
		},
		locals: {
			safeGetSession: async () => ({ session, user: sessionUser })
		}
	} as unknown as Parameters<(typeof actions)['generateForAll']>[0];
}

function makeLearnerRow(overrides: {
	contactId?: string;
	email?: string | null;
	firstName?: string;
	lastName?: string;
} = {}) {
	return {
		contactId: overrides.contactId ?? 'contact-1',
		contact: {
			email: overrides.email !== undefined ? overrides.email : 'learner@example.com',
			firstName: overrides.firstName ?? 'Jean',
			lastName: overrides.lastName ?? 'Dupont'
		}
	};
}

const BASE_FORMATION_ROW = {
	id: 'formation-1',
	clientId: 'client-1',
	companyId: null,
	typeFinancement: null,
	dateDebut: null,
	dateFin: null,
	client: { type: 'Entreprise' },
	seances: []
};

const BASE_WORKSPACE_ROW = { id: 'ws-1', nda: '11234567890' };

const BASE_DOC_ROWS = [
	{ type: 'devis', status: 'accepte' },
	{ type: 'convention', status: 'signe' }
];

function setupValidFormation(
	learnerRows: ReturnType<typeof makeLearnerRow>[],
	existingDocRows: Array<{ id: string; status: string; relatedContactId: string | null }> = []
) {
	mockFormationsFindFirst.mockResolvedValue(BASE_FORMATION_ROW);
	mockWorkspacesFindFirst.mockResolvedValue(BASE_WORKSPACE_ROW);
	mockApprenantsFindMany.mockResolvedValue(learnerRows);
	mockDocumentsFindMany
		.mockResolvedValueOnce(BASE_DOC_ROWS)
		.mockResolvedValueOnce(existingDocRows);
}

// ── Typed action caller (fails with "not a function" until implementation) ────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const callGenerateForAll = (event: ReturnType<typeof makeEvent>) =>
	(actions as Record<string, (e: typeof event) => Promise<unknown>>).generateForAll(event);

// ── Test suite ───────────────────────────────────────────────────────────────

describe('generateForAll server action', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockLogAuditEvent.mockResolvedValue(undefined);
		mockGenerateDocument.mockResolvedValue({ documentId: 'doc-new-1' });
	});

	// ── Auth & ownership guards ──────────────────────────────────────────────

	it('returns 401 when no workspace', async () => {
		mockGetUserWorkspace.mockResolvedValue(null);
		const result = await callGenerateForAll(makeEvent());
		expect(result).toMatchObject({ status: 401 });
	});

	it('returns 401 when session is missing', async () => {
		mockGetUserWorkspace.mockResolvedValue('ws-1');
		const result = await callGenerateForAll(makeEvent({ sessionUser: null }));
		expect(result).toMatchObject({ status: 401 });
	});

	it('returns 403 when formation not owned by workspace', async () => {
		mockGetUserWorkspace.mockResolvedValue('ws-1');
		mockFormationsFindFirst.mockResolvedValue(null);
		const result = await callGenerateForAll(makeEvent());
		expect(result).toMatchObject({ status: 403 });
	});

	// ── Input validation ─────────────────────────────────────────────────────

	it('returns 400 when type is not convocation or certificat', async () => {
		mockGetUserWorkspace.mockResolvedValue('ws-1');
		mockFormationsFindFirst.mockResolvedValue({ id: 'formation-1' });
		const result = await callGenerateForAll(makeEvent({ formData: { type: 'devis' } }));
		expect(result).toMatchObject({ status: 400 });
	});

	// ── Formation-level prerequisite gate ────────────────────────────────────

	it('returns 400 with formationBlocks when formation-level prereq fails (unsigned convention)', async () => {
		mockGetUserWorkspace.mockResolvedValue('ws-1');
		// Only devis accepted, convention NOT signed → convocation prerequisite fails
		mockFormationsFindFirst.mockResolvedValue(BASE_FORMATION_ROW);
		mockWorkspacesFindFirst.mockResolvedValue(BASE_WORKSPACE_ROW);
		mockApprenantsFindMany.mockResolvedValue([makeLearnerRow()]);
		mockDocumentsFindMany.mockResolvedValue([{ type: 'devis', status: 'accepte' }]);

		const result = await callGenerateForAll(makeEvent());
		expect(result).toMatchObject({ status: 400 });
		expect((result as { data?: { formationBlocks?: unknown[] } }).data?.formationBlocks).toBeDefined();
		expect(
			(result as { data: { formationBlocks: unknown[] } }).data.formationBlocks.length
		).toBeGreaterThan(0);
	});

	// ── Warning acknowledgement gate ─────────────────────────────────────────

	it('returns 400 when warnings present and not all acknowledged', async () => {
		mockGetUserWorkspace.mockResolvedValue('ws-1');
		// certificat + OPCO + no NDA → warns for NDA; ack required
		mockFormationsFindFirst.mockResolvedValue({ ...BASE_FORMATION_ROW, typeFinancement: 'OPCO' });
		mockWorkspacesFindFirst.mockResolvedValue({ id: 'ws-1', nda: null });
		mockApprenantsFindMany.mockResolvedValue([makeLearnerRow()]);
		mockDocumentsFindMany.mockResolvedValue([
			{ type: 'devis', status: 'accepte' },
			{ type: 'convention', status: 'signe' },
			{ type: 'feuille_emargement', status: 'signe' }
		]);

		const result = await callGenerateForAll(
			makeEvent({ formData: { type: 'certificat' } }) // warningsAcknowledged not set
		);
		expect(result).toMatchObject({ status: 400 });
	});

	// ── Happy path: per-learner loop ─────────────────────────────────────────

	it('loops through eligible learners and calls generateDocument for each ready learner', async () => {
		mockGetUserWorkspace.mockResolvedValue('ws-1');
		const learners = [
			makeLearnerRow({ contactId: 'c-1', email: 'a@x.fr' }),
			makeLearnerRow({ contactId: 'c-2', email: 'b@x.fr' }),
			makeLearnerRow({ contactId: 'c-3', email: 'c@x.fr' })
		];
		setupValidFormation(learners);
		mockGenerateDocument
			.mockResolvedValueOnce({ documentId: 'doc-1' })
			.mockResolvedValueOnce({ documentId: 'doc-2' })
			.mockResolvedValueOnce({ documentId: 'doc-3' });

		const result = await callGenerateForAll(makeEvent());
		expect(mockGenerateDocument).toHaveBeenCalledTimes(3);
		expect(result).toMatchObject({ totals: { done: 3, skipped: 0, failed: 0 } });
	});

	// ── Idempotency: skip envoye ─────────────────────────────────────────────

	it('skips learner with existing envoye document (status: skipped, reason: already_sent)', async () => {
		mockGetUserWorkspace.mockResolvedValue('ws-1');
		const learners = [makeLearnerRow({ contactId: 'c-1', email: 'a@x.fr' })];
		setupValidFormation(learners, [{ id: 'doc-existing', status: 'envoye', relatedContactId: 'c-1' }]);

		const result = await callGenerateForAll(makeEvent());
		expect(mockGenerateDocument).not.toHaveBeenCalled();
		expect((result as { results: Array<{ status: string; reason: string }> }).results[0]).toMatchObject({
			status: 'skipped',
			reason: 'already_sent'
		});
	});

	// ── Per-learner email check ───────────────────────────────────────────────

	it('records failed for learner with no email (blockingIds includes email_apprenant_manquant)', async () => {
		mockGetUserWorkspace.mockResolvedValue('ws-1');
		const learners = [makeLearnerRow({ contactId: 'c-1', email: null })];
		setupValidFormation(learners);

		const result = await callGenerateForAll(makeEvent());
		expect(mockGenerateDocument).not.toHaveBeenCalled();
		const r = (result as { results: Array<{ status: string; blockingIds: string[] }> }).results[0];
		expect(r.status).toBe('failed');
		expect(r.blockingIds).toContain('email_apprenant_manquant');
	});

	// ── Audit log ────────────────────────────────────────────────────────────

	it('writes one audit log row per done result with the same shared batchId', async () => {
		mockGetUserWorkspace.mockResolvedValue('ws-1');
		const learners = [
			makeLearnerRow({ contactId: 'c-1', email: 'a@x.fr' }),
			makeLearnerRow({ contactId: 'c-2', email: 'b@x.fr' })
		];
		setupValidFormation(learners);
		mockGenerateDocument
			.mockResolvedValueOnce({ documentId: 'doc-1' })
			.mockResolvedValueOnce({ documentId: 'doc-2' });

		await callGenerateForAll(makeEvent());

		expect(mockLogAuditEvent).toHaveBeenCalledTimes(2);
		const calls = mockLogAuditEvent.mock.calls as Array<[{ newValue: { batchId: string } }]>;
		const batchId0 = calls[0][0].newValue.batchId;
		const batchId1 = calls[1][0].newValue.batchId;
		expect(batchId0).toBeTruthy();
		expect(batchId0).toBe(batchId1);
	});

	// ── Architect caveat 1: audit log failure must not be silent ─────────────
	// Fails until implementer addresses write-path-review §3 caveat 1.

	it('caveat-1: when logAuditEvent rejects, result for that learner is failed with reason audit_log_failed (NOT silently ignored)', async () => {
		mockGetUserWorkspace.mockResolvedValue('ws-1');
		const learners = [makeLearnerRow({ contactId: 'c-1', email: 'a@x.fr' })];
		setupValidFormation(learners);
		mockGenerateDocument.mockResolvedValueOnce({ documentId: 'doc-1' });
		mockLogAuditEvent.mockRejectedValueOnce(new Error('DB connection lost'));

		const result = await callGenerateForAll(makeEvent());
		const r = result as { totals: { done: number; failed: number }; results: Array<{ status: string; reason: string }> };
		expect(r.totals.done).toBe(0);
		expect(r.totals.failed).toBe(1);
		expect(r.results[0]).toMatchObject({ status: 'failed', reason: 'audit_log_failed' });
	});

	// ── Cancellation ─────────────────────────────────────────────────────────

	it('cancellation: when signal is aborted, only in-flight learners are processed; remaining are not in results', async () => {
		mockGetUserWorkspace.mockResolvedValue('ws-1');
		const learners = Array.from({ length: 5 }, (_, i) =>
			makeLearnerRow({ contactId: `c-${i}`, email: `l${i}@x.fr` })
		);

		const ctrl = new AbortController();
		let callCount = 0;
		mockGenerateDocument.mockImplementation(async () => {
			callCount++;
			if (callCount === 1) ctrl.abort();
			await new Promise((r) => setTimeout(r, 2));
			return { documentId: `doc-${callCount}` };
		});

		mockFormationsFindFirst.mockResolvedValue(BASE_FORMATION_ROW);
		mockWorkspacesFindFirst.mockResolvedValue(BASE_WORKSPACE_ROW);
		mockApprenantsFindMany.mockResolvedValue(learners);
		mockDocumentsFindMany.mockResolvedValueOnce(BASE_DOC_ROWS).mockResolvedValueOnce([]);

		const event = makeEvent({ customSignal: ctrl.signal });
		const result = await callGenerateForAll(event);
		const typedResult = result as { results: unknown[] };
		expect(typedResult.results.length).toBeLessThan(5);
	});

	// ── Concurrency cap ───────────────────────────────────────────────────────

	it('concurrency: with 7 learners, peak concurrent generateDocument calls is ≤ 3', async () => {
		mockGetUserWorkspace.mockResolvedValue('ws-1');
		const learners = Array.from({ length: 7 }, (_, i) =>
			makeLearnerRow({ contactId: `c-${i}`, email: `l${i}@x.fr` })
		);
		mockFormationsFindFirst.mockResolvedValue(BASE_FORMATION_ROW);
		mockWorkspacesFindFirst.mockResolvedValue(BASE_WORKSPACE_ROW);
		mockApprenantsFindMany.mockResolvedValue(learners);
		mockDocumentsFindMany.mockResolvedValueOnce(BASE_DOC_ROWS).mockResolvedValueOnce([]);

		let inFlight = 0;
		let peakInFlight = 0;
		mockGenerateDocument.mockImplementation(async () => {
			inFlight++;
			if (inFlight > peakInFlight) peakInFlight = inFlight;
			await new Promise((r) => setTimeout(r, 5));
			inFlight--;
			return { documentId: `doc-${Math.random()}` };
		});

		await callGenerateForAll(makeEvent());
		expect(peakInFlight).toBeLessThanOrEqual(3);
	});
});
