/**
 * Pure derivation of the Finances "synthesis" totals from a formation's
 * funding lines. Reused by the Finances page loader (T-52) and the
 * formation-header financing chip (T-57).
 *
 * No DB access — caller passes already-loaded rows. Numeric columns come back
 * from postgres-js as strings; this module parses them with `Number()` and
 * defaults `null` / unparseable values to 0.
 *
 * The per-payer reste à charge split lets Marie see at a glance who owes
 * what (apprenant / entreprise / OF) without leaving the page, per the V1
 * Fiche+Finances UX review.
 */

import type { InferSelectModel } from 'drizzle-orm';
import type { formationFundingSources } from '$lib/db/schema';

export type FundingSourceRow = InferSelectModel<typeof formationFundingSources>;
export type PayerType = 'apprenant' | 'entreprise' | 'OF';

export type StatutGlobal =
	| 'Entièrement financé'
	| 'Partiellement financé'
	| 'En attente'
	| 'Sans financement';

export interface ResteAChargeBreakdown {
	total: number;
	byPayer: Record<PayerType, number>;
}

export interface FundingSummary {
	totalRequested: number;
	totalGranted: number;
	resteACharge: ResteAChargeBreakdown;
	percentCovered: number;
	statutGlobal: StatutGlobal;
}

/**
 * Sources whose status removes them from the financed total but keeps them
 * visible in the list (refusé / annulé). They contribute 0 financed and
 * 0 unfunded — Marie may convert them to a different source later.
 */
const INACTIVE_STATUSES = new Set(['Refusé', 'Annulé']);

function toNumber(value: string | number | null | undefined): number {
	if (value === null || value === undefined || value === '') return 0;
	const parsed = typeof value === 'number' ? value : Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Each active source's "unfunded portion" is what its payer still owes:
 *   - status Refusé / Annulé      → 0 (the source was rejected/cancelled)
 *   - granted > 0                 → max(0, requested - granted)
 *   - granted = 0 and requested>0 → requested  (the full ask is still pending)
 *   - granted = 0 and requested=0 → 0          (no claim declared)
 */
function unfundedPortion(source: FundingSourceRow): number {
	if (INACTIVE_STATUSES.has(source.status)) return 0;
	const requested = toNumber(source.requestedAmount);
	const granted = toNumber(source.grantedAmount);
	if (granted > 0) return Math.max(0, requested - granted);
	return requested;
}

/**
 * Compute the synthesis totals for a formation's funding lines.
 *
 * @param fundingSources rows from `formation_funding_sources` for one formation
 * @param prixConvenu    formation.prixConvenu (postgres numeric string or null)
 *                       — falls back to 0 when null; the caller is expected
 *                       to gate UI on `prixConvenu` being set before showing
 *                       a meaningful "reste à charge".
 */
export function getFundingSummary(
	fundingSources: FundingSourceRow[],
	prixConvenu: string | number | null | undefined
): FundingSummary {
	const totalFormation = toNumber(prixConvenu);

	let totalRequested = 0;
	let totalGranted = 0;
	const byPayer: Record<PayerType, number> = { apprenant: 0, entreprise: 0, OF: 0 };

	for (const source of fundingSources) {
		const requested = toNumber(source.requestedAmount);
		const granted = toNumber(source.grantedAmount);
		if (!INACTIVE_STATUSES.has(source.status)) {
			totalRequested += requested;
			totalGranted += granted;
		}
		const unfunded = unfundedPortion(source);
		if (unfunded > 0) {
			byPayer[source.payerType as PayerType] += unfunded;
		}
	}

	// Total reste à charge anchored to the contract price. If the per-source
	// attribution doesn't account for the full gap (typical when payers haven't
	// declared requested amounts yet), the unallocated remainder defaults to
	// `apprenant` — the worst-case for Marie's planning, surfacing the gap
	// rather than hiding it under "OF".
	const totalGap = Math.max(0, totalFormation - totalGranted);
	const allocated = byPayer.apprenant + byPayer.entreprise + byPayer.OF;
	if (totalGap > allocated) {
		byPayer.apprenant += totalGap - allocated;
	}

	const resteAChargeTotal = byPayer.apprenant + byPayer.entreprise + byPayer.OF;

	const percentCovered = totalFormation > 0 ? (totalGranted / totalFormation) * 100 : 0;

	return {
		totalRequested,
		totalGranted,
		resteACharge: { total: resteAChargeTotal, byPayer },
		percentCovered,
		statutGlobal: deriveStatutGlobal(fundingSources, totalFormation, totalGranted)
	};
}

/**
 * Status hierarchy (in this exact order — first match wins):
 *   1. No sources → Sans financement
 *   2. All active sources Versé AND total ≥ formation total → Entièrement financé
 *   3. At least one Pressenti / Demandé AND nothing Accordé/Versé → En attente
 *   4. Otherwise → Partiellement financé
 */
function deriveStatutGlobal(
	sources: FundingSourceRow[],
	totalFormation: number,
	totalGranted: number
): StatutGlobal {
	const active = sources.filter((s) => !INACTIVE_STATUSES.has(s.status));
	if (active.length === 0) return 'Sans financement';

	const allVerse = active.every((s) => s.status === 'Versé');
	if (allVerse && totalGranted >= totalFormation && totalFormation > 0) {
		return 'Entièrement financé';
	}

	const hasAwarded = active.some((s) => s.status === 'Accordé' || s.status === 'Versé');
	const hasPending = active.some((s) => s.status === 'Pressenti' || s.status === 'Demandé');
	if (hasPending && !hasAwarded) return 'En attente';

	return 'Partiellement financé';
}
