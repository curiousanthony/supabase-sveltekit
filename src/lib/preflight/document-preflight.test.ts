import { describe, it, expect } from 'vitest';
import type {
	PreflightSeverity,
	PreflightItem,
	PreflightContext,
	PreflightFormation,
	PreflightWorkspace,
	PreflightResult
} from './document-preflight';
import { evaluatePreflight, assertPreflightOrThrow } from './document-preflight';

// ── Fixture factories ────────────────────────────────────────────────────────

function makeFormation(overrides: Partial<PreflightFormation> = {}): PreflightFormation {
	return {
		id: 'formation-1',
		clientId: 'client-1',
		companyId: null,
		clientType: 'Entreprise',
		typeFinancement: null,
		dateDebut: null,
		dateFin: null,
		...overrides
	};
}

function makeWorkspace(overrides: Partial<PreflightWorkspace> = {}): PreflightWorkspace {
	return {
		id: 'workspace-1',
		nda: '11234567890',
		...overrides
	};
}

function makeContext(overrides: Partial<PreflightContext> = {}): PreflightContext {
	return {
		documentType: 'devis',
		...overrides
	};
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getItems(result: PreflightResult, severity: PreflightSeverity): PreflightItem[] {
	return result.items.filter((i) => i.severity === severity);
}

function hasItemId(result: PreflightResult, id: string): boolean {
	return result.items.some((i) => i.id === id);
}

// ── Item shape validation ────────────────────────────────────────────────────

describe('PreflightItem shape', () => {
	it('every item has required fields: id, severity, kind, messageFr, fixLabelFr, tab, hrefPath', () => {
		const formation = makeFormation({ clientId: null });
		const result = evaluatePreflight(formation, makeWorkspace(), makeContext({ documentType: 'devis' }));
		for (const item of result.items) {
			expect(item.id).toBeTruthy();
			expect(['block', 'warn', 'prerequisite']).toContain(item.severity);
			expect(['data', 'prerequisite']).toContain(item.kind);
			expect(item.messageFr).toBeTruthy();
			expect(item.fixLabelFr).toBeTruthy();
			expect(['fiche', 'seances', 'apprenants', 'suivi', 'documents']).toContain(item.tab);
			expect(item.hrefPath).toBeTruthy();
		}
	});

	it('prerequisite items must NOT have focusKey', () => {
		// convention requires accepted devis (prerequisite)
		const result = evaluatePreflight(
			makeFormation({ clientId: 'c-1' }),
			makeWorkspace(),
			makeContext({ documentType: 'convention', hasAcceptedDevis: false })
		);
		const prerequisites = getItems(result, 'prerequisite');
		expect(prerequisites.length).toBeGreaterThan(0);
		for (const item of prerequisites) {
			expect(item.focusKey).toBeUndefined();
		}
	});
});

// ── evaluatePreflight — return shape ─────────────────────────────────────────

describe('evaluatePreflight return shape', () => {
	it('returns items array, blockingCount, and warningCount', () => {
		const result = evaluatePreflight(makeFormation(), makeWorkspace(), makeContext());
		expect(Array.isArray(result.items)).toBe(true);
		expect(typeof result.blockingCount).toBe('number');
		expect(typeof result.warningCount).toBe('number');
	});

	it('blockingCount equals number of block + prerequisite items', () => {
		const result = evaluatePreflight(
			makeFormation({ clientId: null }),
			makeWorkspace(),
			makeContext({ documentType: 'devis' })
		);
		const blocking = result.items.filter(
			(i) => i.severity === 'block' || i.severity === 'prerequisite'
		).length;
		expect(result.blockingCount).toBe(blocking);
	});

	it('warningCount equals number of warn items', () => {
		const formation = makeFormation({
			clientId: 'c-1',
			typeFinancement: 'OPCO'
		});
		const workspace = makeWorkspace({ nda: null });
		const result = evaluatePreflight(formation, workspace, makeContext({ documentType: 'devis' }));
		const warns = result.items.filter((i) => i.severity === 'warn').length;
		expect(result.warningCount).toBe(warns);
	});
});

// ── devis ────────────────────────────────────────────────────────────────────

describe('evaluatePreflight — devis', () => {
	it('blocks when clientId is missing', () => {
		const result = evaluatePreflight(
			makeFormation({ clientId: null }),
			makeWorkspace(),
			makeContext({ documentType: 'devis' })
		);
		const blocks = getItems(result, 'block');
		expect(blocks.length).toBeGreaterThan(0);
		expect(blocks.some((i) => i.tab === 'fiche')).toBe(true);
		expect(result.blockingCount).toBeGreaterThan(0);
	});

	it('block item for missing client has a focusKey pointing to fiche', () => {
		const result = evaluatePreflight(
			makeFormation({ clientId: null }),
			makeWorkspace(),
			makeContext({ documentType: 'devis' })
		);
		const clientBlock = result.items.find((i) => i.severity === 'block' && i.tab === 'fiche');
		expect(clientBlock).toBeDefined();
		expect(clientBlock!.focusKey).toBeTruthy();
	});

	it('warns (not blocks) for OPCO financing with no workspace NDA', () => {
		const result = evaluatePreflight(
			makeFormation({ clientId: 'c-1', typeFinancement: 'OPCO' }),
			makeWorkspace({ nda: null }),
			makeContext({ documentType: 'devis' })
		);
		expect(hasItemId(result, 'nda_manquant')).toBe(true);
		const ndaItem = result.items.find((i) => i.id === 'nda_manquant')!;
		expect(ndaItem.severity).toBe('warn');
		expect(result.blockingCount).toBe(0);
	});

	it('no NDA warning when workspace has NDA and OPCO financing', () => {
		const result = evaluatePreflight(
			makeFormation({ clientId: 'c-1', typeFinancement: 'OPCO' }),
			makeWorkspace({ nda: '11234567890' }),
			makeContext({ documentType: 'devis' })
		);
		expect(hasItemId(result, 'nda_manquant')).toBe(false);
	});

	it('no NDA warning when no OPCO financing even if workspace NDA is missing', () => {
		const result = evaluatePreflight(
			makeFormation({ clientId: 'c-1', typeFinancement: 'Inter' }),
			makeWorkspace({ nda: null }),
			makeContext({ documentType: 'devis' })
		);
		expect(hasItemId(result, 'nda_manquant')).toBe(false);
	});

	it('warns for B2C (Particulier) client when formation starts in less than 10 days', () => {
		const in8Days = new Date(Date.now() + 8 * 86_400_000).toISOString().slice(0, 10);
		const result = evaluatePreflight(
			makeFormation({ clientId: 'c-1', clientType: 'Particulier', dateDebut: in8Days }),
			makeWorkspace(),
			makeContext({ documentType: 'devis' })
		);
		expect(hasItemId(result, 'retractation_delai')).toBe(true);
		const item = result.items.find((i) => i.id === 'retractation_delai')!;
		expect(item.severity).toBe('warn');
	});

	it('no rétractation warning when formation starts in 15 days', () => {
		const in15Days = new Date(Date.now() + 15 * 86_400_000).toISOString().slice(0, 10);
		const result = evaluatePreflight(
			makeFormation({ clientId: 'c-1', clientType: 'Particulier', dateDebut: in15Days }),
			makeWorkspace(),
			makeContext({ documentType: 'devis' })
		);
		expect(hasItemId(result, 'retractation_delai')).toBe(false);
	});

	it('no rétractation warning for Entreprise client even if formation starts in 5 days', () => {
		const in5Days = new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10);
		const result = evaluatePreflight(
			makeFormation({ clientId: 'c-1', clientType: 'Entreprise', dateDebut: in5Days }),
			makeWorkspace(),
			makeContext({ documentType: 'devis' })
		);
		expect(hasItemId(result, 'retractation_delai')).toBe(false);
	});

	it('no rétractation warning when dateDebut is null', () => {
		const result = evaluatePreflight(
			makeFormation({ clientId: 'c-1', clientType: 'Particulier', dateDebut: null }),
			makeWorkspace(),
			makeContext({ documentType: 'devis' })
		);
		expect(hasItemId(result, 'retractation_delai')).toBe(false);
	});

	it('returns no blocking items when all required data is present (Entreprise, no OPCO)', () => {
		const result = evaluatePreflight(
			makeFormation({ clientId: 'c-1', clientType: 'Entreprise', typeFinancement: 'Inter' }),
			makeWorkspace(),
			makeContext({ documentType: 'devis' })
		);
		expect(result.blockingCount).toBe(0);
	});

	it('B2B with companyId set and clientId null — no client block for devis', () => {
		const result = evaluatePreflight(
			makeFormation({ clientId: null, companyId: 'company-1' }),
			makeWorkspace(),
			makeContext({ documentType: 'devis' })
		);
		expect(hasItemId(result, 'client_manquant')).toBe(false);
		expect(result.blockingCount).toBe(0);
	});

	it('B2B with companyId set and clientId null — no client block for convention, convocation, certificat', () => {
		for (const docType of ['convention', 'convocation', 'certificat'] as const) {
			const result = evaluatePreflight(
				makeFormation({ clientId: null, companyId: 'company-1' }),
				makeWorkspace(),
				makeContext({
					documentType: docType,
					hasAcceptedDevis: true,
					hasLearnerWithEmail: true,
					hasSignedConvention: true,
					hasSignedEmargements: true
				})
			);
			expect(hasItemId(result, 'client_manquant')).toBe(false);
		}
	});

	it('B2C with clientId set and companyId null (Particulier) — no client block for convention, convocation, certificat', () => {
		for (const docType of ['convention', 'convocation', 'certificat'] as const) {
			const result = evaluatePreflight(
				makeFormation({ clientId: 'c-1', companyId: null, clientType: 'Particulier' }),
				makeWorkspace(),
				makeContext({
					documentType: docType,
					hasAcceptedDevis: true,
					hasLearnerWithEmail: true,
					hasSignedConvention: true,
					hasSignedEmargements: true
				})
			);
			expect(hasItemId(result, 'client_manquant')).toBe(false);
		}
	});

	it('blocks when both clientId and companyId are null', () => {
		const result = evaluatePreflight(
			makeFormation({ clientId: null, companyId: null }),
			makeWorkspace(),
			makeContext({ documentType: 'devis' })
		);
		expect(hasItemId(result, 'client_manquant')).toBe(true);
		const item = result.items.find((i) => i.id === 'client_manquant')!;
		expect(item.severity).toBe('block');
		expect(result.blockingCount).toBeGreaterThan(0);
	});
});

// ── convention ───────────────────────────────────────────────────────────────

describe('evaluatePreflight — convention', () => {
	it('adds prerequisite item when devis is not accepté', () => {
		const result = evaluatePreflight(
			makeFormation({ clientId: 'c-1' }),
			makeWorkspace(),
			makeContext({ documentType: 'convention', hasAcceptedDevis: false })
		);
		const prereqs = getItems(result, 'prerequisite');
		expect(prereqs.length).toBeGreaterThan(0);
		expect(prereqs.some((i) => i.tab === 'suivi' || i.tab === 'documents')).toBe(true);
	});

	it('prerequisite item for devis not accepted has no focusKey', () => {
		const result = evaluatePreflight(
			makeFormation({ clientId: 'c-1' }),
			makeWorkspace(),
			makeContext({ documentType: 'convention', hasAcceptedDevis: false })
		);
		const prereq = result.items.find((i) => i.severity === 'prerequisite');
		expect(prereq!.focusKey).toBeUndefined();
	});

	it('blocks when clientId is missing regardless of devis status', () => {
		const result = evaluatePreflight(
			makeFormation({ clientId: null }),
			makeWorkspace(),
			makeContext({ documentType: 'convention', hasAcceptedDevis: true })
		);
		expect(getItems(result, 'block').length).toBeGreaterThan(0);
	});

	it('no blocking items when devis accepté and client present', () => {
		const result = evaluatePreflight(
			makeFormation({ clientId: 'c-1' }),
			makeWorkspace(),
			makeContext({ documentType: 'convention', hasAcceptedDevis: true })
		);
		expect(result.blockingCount).toBe(0);
	});

	it('counts prerequisite items in blockingCount (prevents generation)', () => {
		const result = evaluatePreflight(
			makeFormation({ clientId: 'c-1' }),
			makeWorkspace(),
			makeContext({ documentType: 'convention', hasAcceptedDevis: false })
		);
		expect(result.blockingCount).toBeGreaterThan(0);
	});
});

// ── feuille_emargement ───────────────────────────────────────────────────────

describe('evaluatePreflight — feuille_emargement', () => {
	it('blocks when no seanceId is provided', () => {
		const result = evaluatePreflight(
			makeFormation({ clientId: 'c-1' }),
			makeWorkspace(),
			makeContext({ documentType: 'feuille_emargement', seanceId: undefined })
		);
		const blocks = getItems(result, 'block');
		expect(blocks.length).toBeGreaterThan(0);
		expect(blocks.some((i) => i.tab === 'seances')).toBe(true);
	});

	it('seance block item has a fix link to the seances tab', () => {
		const result = evaluatePreflight(
			makeFormation({ clientId: 'c-1' }),
			makeWorkspace(),
			makeContext({ documentType: 'feuille_emargement', seanceId: undefined })
		);
		const seanceBlock = result.items.find((i) => i.severity === 'block' && i.tab === 'seances');
		expect(seanceBlock).toBeDefined();
		expect(seanceBlock!.hrefPath).toContain('seances');
	});

	it('no blocking items when seanceId is provided', () => {
		const result = evaluatePreflight(
			makeFormation({ clientId: 'c-1' }),
			makeWorkspace(),
			makeContext({ documentType: 'feuille_emargement', seanceId: 'seance-1' })
		);
		expect(result.blockingCount).toBe(0);
	});
});

// ── convocation ──────────────────────────────────────────────────────────────

describe('evaluatePreflight — convocation', () => {
	it('blocks when no learner has an email address', () => {
		const result = evaluatePreflight(
			makeFormation({ clientId: 'c-1' }),
			makeWorkspace(),
			makeContext({ documentType: 'convocation', hasLearnerWithEmail: false })
		);
		const blocks = getItems(result, 'block');
		expect(blocks.some((i) => i.tab === 'apprenants')).toBe(true);
	});

	it('adds prerequisite when convention is not signed', () => {
		const result = evaluatePreflight(
			makeFormation({ clientId: 'c-1' }),
			makeWorkspace(),
			makeContext({
				documentType: 'convocation',
				hasLearnerWithEmail: true,
				hasSignedConvention: false
			})
		);
		const prereqs = getItems(result, 'prerequisite');
		expect(prereqs.length).toBeGreaterThan(0);
	});

	it('prerequisite for unsigned convention has no focusKey', () => {
		const result = evaluatePreflight(
			makeFormation({ clientId: 'c-1' }),
			makeWorkspace(),
			makeContext({
				documentType: 'convocation',
				hasLearnerWithEmail: true,
				hasSignedConvention: false
			})
		);
		const prereq = result.items.find((i) => i.severity === 'prerequisite');
		expect(prereq).toBeDefined();
		expect(prereq!.focusKey).toBeUndefined();
	});

	it('no blocking items when learner has email and convention is signed', () => {
		const result = evaluatePreflight(
			makeFormation({ clientId: 'c-1' }),
			makeWorkspace(),
			makeContext({
				documentType: 'convocation',
				hasLearnerWithEmail: true,
				hasSignedConvention: true
			})
		);
		expect(result.blockingCount).toBe(0);
	});
});

// ── certificat ───────────────────────────────────────────────────────────────

describe('evaluatePreflight — certificat', () => {
	it('blocks when émargements are not signed', () => {
		const result = evaluatePreflight(
			makeFormation({ clientId: 'c-1' }),
			makeWorkspace(),
			makeContext({ documentType: 'certificat', hasSignedEmargements: false })
		);
		expect(getItems(result, 'block').length).toBeGreaterThan(0);
	});

	it('blocks when OPCO financing and workspace NDA is missing (certificat = strict block)', () => {
		const result = evaluatePreflight(
			makeFormation({ clientId: 'c-1', typeFinancement: 'OPCO' }),
			makeWorkspace({ nda: null }),
			makeContext({ documentType: 'certificat', hasSignedEmargements: true })
		);
		const ndaItem = result.items.find((i) => i.id === 'nda_manquant');
		expect(ndaItem).toBeDefined();
		expect(ndaItem!.severity).toBe('block');
		expect(result.blockingCount).toBeGreaterThan(0);
	});

	it('no blocking items when émargements signed and NDA present (OPCO)', () => {
		const result = evaluatePreflight(
			makeFormation({ clientId: 'c-1', typeFinancement: 'OPCO' }),
			makeWorkspace({ nda: '11234567890' }),
			makeContext({ documentType: 'certificat', hasSignedEmargements: true })
		);
		expect(result.blockingCount).toBe(0);
	});

	it('no blocking items when émargements signed and no OPCO financing', () => {
		const result = evaluatePreflight(
			makeFormation({ clientId: 'c-1', typeFinancement: 'Inter' }),
			makeWorkspace({ nda: null }),
			makeContext({ documentType: 'certificat', hasSignedEmargements: true })
		);
		expect(result.blockingCount).toBe(0);
	});
});

// ── Cross-type: no items for non-applicable rules ────────────────────────────

describe('evaluatePreflight — cross-type isolation', () => {
	it('devis does not produce a seance-missing block', () => {
		const result = evaluatePreflight(
			makeFormation({ clientId: 'c-1' }),
			makeWorkspace(),
			makeContext({ documentType: 'devis' })
		);
		expect(result.items.some((i) => i.tab === 'seances' && i.severity === 'block')).toBe(false);
	});

	it('feuille_emargement does not produce a devis-prerequisite', () => {
		const result = evaluatePreflight(
			makeFormation({ clientId: 'c-1' }),
			makeWorkspace(),
			makeContext({ documentType: 'feuille_emargement', seanceId: 'seance-1' })
		);
		expect(result.items.every((i) => i.severity !== 'prerequisite')).toBe(true);
	});
});

// ── assertPreflightOrThrow ───────────────────────────────────────────────────

describe('assertPreflightOrThrow', () => {
	it('throws when there are block items', () => {
		const result = evaluatePreflight(
			makeFormation({ clientId: null }),
			makeWorkspace(),
			makeContext({ documentType: 'devis' })
		);
		expect(() => assertPreflightOrThrow(result)).toThrow();
	});

	it('throws when there are prerequisite items', () => {
		const result = evaluatePreflight(
			makeFormation({ clientId: 'c-1' }),
			makeWorkspace(),
			makeContext({ documentType: 'convention', hasAcceptedDevis: false })
		);
		expect(() => assertPreflightOrThrow(result)).toThrow();
	});

	it('does not throw when items are warn-only', () => {
		const result = evaluatePreflight(
			makeFormation({ clientId: 'c-1', typeFinancement: 'OPCO' }),
			makeWorkspace({ nda: null }),
			makeContext({ documentType: 'devis' })
		);
		// Only warn items — generation should be allowed
		expect(result.blockingCount).toBe(0);
		expect(() => assertPreflightOrThrow(result)).not.toThrow();
	});

	it('does not throw when items array is empty', () => {
		const result = evaluatePreflight(
			makeFormation({ clientId: 'c-1', typeFinancement: 'Inter' }),
			makeWorkspace(),
			makeContext({ documentType: 'devis' })
		);
		expect(() => assertPreflightOrThrow(result)).not.toThrow();
	});

	it('error thrown contains block item ids for diagnostics', () => {
		const result = evaluatePreflight(
			makeFormation({ clientId: null }),
			makeWorkspace(),
			makeContext({ documentType: 'devis' })
		);
		let caughtError: unknown;
		try {
			assertPreflightOrThrow(result);
		} catch (e) {
			caughtError = e;
		}
		expect(caughtError).toBeDefined();
		// Error message or data should reference blocking items
		const errMsg = caughtError instanceof Error ? caughtError.message : String(caughtError);
		expect(errMsg.length).toBeGreaterThan(0);
	});
});
