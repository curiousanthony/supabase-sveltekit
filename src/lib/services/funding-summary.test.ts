import { describe, it, expect, vi } from 'vitest';

// The service only needs the funding-sources table object as a *type* anchor
// for `InferSelectModel`. Stubbing it with a Symbol avoids pulling the full
// drizzle schema graph (and postgres types) into the unit-test runtime.
vi.mock('$lib/db/schema', () => ({
	formationFundingSources: Symbol('formationFundingSources')
}));

import {
	getFundingSummary,
	type FundingSourceRow,
	type PayerType
} from './funding-summary';

function makeSource(overrides: Partial<FundingSourceRow>): FundingSourceRow {
	return {
		id: overrides.id ?? 'fs-' + Math.random().toString(36).slice(2, 8),
		formationId: overrides.formationId ?? 'formation-1',
		source: overrides.source ?? 'CPF',
		payerType: (overrides.payerType ?? 'apprenant') as PayerType,
		payerLabel: overrides.payerLabel ?? null,
		requestedAmount: overrides.requestedAmount ?? null,
		grantedAmount: overrides.grantedAmount ?? null,
		status: overrides.status ?? 'Pressenti',
		decisionDate: overrides.decisionDate ?? null,
		expectedPaymentDate: overrides.expectedPaymentDate ?? null,
		dossierReference: overrides.dossierReference ?? null,
		notes: overrides.notes ?? null,
		createdAt: overrides.createdAt ?? '2026-04-21T00:00:00Z',
		updatedAt: overrides.updatedAt ?? null
	} as FundingSourceRow;
}

describe('getFundingSummary', () => {
	describe('zero sources', () => {
		it('returns Sans financement and zero totals when no funding lines exist', () => {
			const summary = getFundingSummary([], '3000');
			expect(summary.statutGlobal).toBe('Sans financement');
			expect(summary.totalRequested).toBe(0);
			expect(summary.totalGranted).toBe(0);
			expect(summary.percentCovered).toBe(0);
			// With no sources but a contract price, the full amount is reste à
			// charge — defaulted to apprenant since no payer is declared.
			expect(summary.resteACharge.total).toBe(3000);
			expect(summary.resteACharge.byPayer.apprenant).toBe(3000);
			expect(summary.resteACharge.byPayer.entreprise).toBe(0);
			expect(summary.resteACharge.byPayer.OF).toBe(0);
		});

		it('handles null prixConvenu by treating it as 0', () => {
			const summary = getFundingSummary([], null);
			expect(summary.statutGlobal).toBe('Sans financement');
			expect(summary.resteACharge.total).toBe(0);
			expect(summary.percentCovered).toBe(0);
		});
	});

	describe('single source', () => {
		it('marks Entièrement financé when a single Versé source covers the full price', () => {
			const summary = getFundingSummary(
				[
					makeSource({
						source: 'OPCO_PDC',
						payerType: 'entreprise',
						requestedAmount: '3000',
						grantedAmount: '3000',
						status: 'Versé'
					})
				],
				'3000'
			);
			expect(summary.statutGlobal).toBe('Entièrement financé');
			expect(summary.totalGranted).toBe(3000);
			expect(summary.resteACharge.total).toBe(0);
			expect(summary.percentCovered).toBe(100);
		});

		it('marks En attente when only a Pressenti / Demandé source exists', () => {
			const summary = getFundingSummary(
				[
					makeSource({
						source: 'CPF',
						payerType: 'apprenant',
						requestedAmount: '2500',
						grantedAmount: null,
						status: 'Demandé'
					})
				],
				'3000'
			);
			expect(summary.statutGlobal).toBe('En attente');
			expect(summary.totalRequested).toBe(2500);
			expect(summary.totalGranted).toBe(0);
			// 2500 demandé + 500 unallocated → all attributed to apprenant
			expect(summary.resteACharge.byPayer.apprenant).toBe(3000);
		});
	});

	describe('multi-source partial', () => {
		it('splits reste à charge per payer when two sources partially cover the price', () => {
			const summary = getFundingSummary(
				[
					makeSource({
						source: 'OPCO_PDC',
						payerType: 'entreprise',
						requestedAmount: '2000',
						grantedAmount: '1500', // 500 unfunded for entreprise
						status: 'Accordé'
					}),
					makeSource({
						source: 'CPF',
						payerType: 'apprenant',
						requestedAmount: '1000',
						grantedAmount: '800', // 200 unfunded for apprenant
						status: 'Accordé'
					})
				],
				'3000'
			);
			expect(summary.statutGlobal).toBe('Partiellement financé');
			expect(summary.totalRequested).toBe(3000);
			expect(summary.totalGranted).toBe(2300);
			// per-source attribution: entreprise 500, apprenant 200 → 700 allocated
			// global gap = 3000 - 2300 = 700 → fully allocated, no fallback
			expect(summary.resteACharge.byPayer.entreprise).toBe(500);
			expect(summary.resteACharge.byPayer.apprenant).toBe(200);
			expect(summary.resteACharge.byPayer.OF).toBe(0);
			expect(summary.resteACharge.total).toBe(700);
		});
	});

	describe('refused source', () => {
		it('ignores a Refusé source in totals and reste à charge attribution', () => {
			const summary = getFundingSummary(
				[
					makeSource({
						source: 'OPCO_PDC',
						payerType: 'entreprise',
						requestedAmount: '2000',
						grantedAmount: null,
						status: 'Refusé'
					}),
					makeSource({
						source: 'EmployeurDirect',
						payerType: 'entreprise',
						requestedAmount: '3000',
						grantedAmount: '3000',
						status: 'Versé'
					})
				],
				'3000'
			);
			expect(summary.statutGlobal).toBe('Entièrement financé');
			expect(summary.totalRequested).toBe(3000);
			expect(summary.totalGranted).toBe(3000);
			expect(summary.resteACharge.total).toBe(0);
			// The Refusé OPCO line must NOT add 2000 to entreprise reste à charge.
			expect(summary.resteACharge.byPayer.entreprise).toBe(0);
		});
	});

	describe('mixed payer types', () => {
		it('attributes per-source unfunded portions across all three payer types', () => {
			const summary = getFundingSummary(
				[
					makeSource({
						source: 'OPCO_PDC',
						payerType: 'entreprise',
						requestedAmount: '1500',
						grantedAmount: '1000', // 500 entreprise unfunded
						status: 'Accordé'
					}),
					makeSource({
						source: 'CPF',
						payerType: 'apprenant',
						requestedAmount: '1000',
						grantedAmount: '600', // 400 apprenant unfunded
						status: 'Accordé'
					}),
					makeSource({
						source: 'AutoFinancement',
						payerType: 'OF',
						payerLabel: 'Geste commercial',
						requestedAmount: '500',
						grantedAmount: '300', // 200 OF unfunded
						status: 'Accordé'
					})
				],
				'4000'
			);
			expect(summary.statutGlobal).toBe('Partiellement financé');
			expect(summary.totalGranted).toBe(1900);
			// per-source: entreprise 500, apprenant 400, OF 200 → 1100 allocated
			// global gap = 4000 - 1900 = 2100 → 1000 leftover unallocated → apprenant
			expect(summary.resteACharge.byPayer.entreprise).toBe(500);
			expect(summary.resteACharge.byPayer.apprenant).toBe(1400);
			expect(summary.resteACharge.byPayer.OF).toBe(200);
			expect(summary.resteACharge.total).toBe(2100);
		});

		it('exposes percentCovered above 100 when over-funded (no cap)', () => {
			const summary = getFundingSummary(
				[
					makeSource({
						source: 'OPCO_PDC',
						payerType: 'entreprise',
						requestedAmount: '4000',
						grantedAmount: '4000',
						status: 'Versé'
					})
				],
				'3000'
			);
			expect(summary.percentCovered).toBeCloseTo(133.33, 1);
			expect(summary.resteACharge.total).toBe(0);
			expect(summary.statutGlobal).toBe('Entièrement financé');
		});
	});
});
