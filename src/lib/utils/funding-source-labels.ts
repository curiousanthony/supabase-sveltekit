/**
 * French labels + smart defaults for `funding_source_type` / `payer_type` /
 * `funding_source_status` enums. Shared by the Finances tab (T-53) and the
 * read-only header financing chip (T-57).
 *
 * Pure: no DB, no Svelte. Safe to import from both server load and client UI.
 */

import type { PayerType } from '$lib/services/funding-summary';

export type FundingSourceCode =
	| 'CPF'
	| 'CPF_Transition'
	| 'OPCO_PDC'
	| 'OPCO_Alternance'
	| 'OPCO_ProA'
	| 'OPCO_AFEST'
	| 'FranceTravail_AIF'
	| 'FranceTravail_POEI'
	| 'FranceTravail_POEC'
	| 'Region'
	| 'FSE'
	| 'FNE_Formation'
	| 'TransitionsPro_CTP'
	| 'AGEFICE'
	| 'FIFPL'
	| 'FAFCEA'
	| 'EmployeurDirect'
	| 'AutoFinancement'
	| 'Autre';

export type FundingSourceStatusCode =
	| 'Pressenti'
	| 'Demandé'
	| 'Accordé'
	| 'Refusé'
	| 'Versé'
	| 'Annulé';

export interface FundingSourceDescriptor {
	value: FundingSourceCode;
	label: string;
	short: string;
	defaultPayerType: PayerType;
	/** `null` = no sensible default (Marie must fill manually, e.g. the OPCO name). */
	defaultPayerLabel: string | null;
	group: 'Publique' | 'Entreprise' | 'Autre';
}

/**
 * Ordered canonical list — kept stable so UI grouping in the Select dropdown
 * matches Marie's mental model (public money → employer → autre).
 */
export const FUNDING_SOURCE_DESCRIPTORS: FundingSourceDescriptor[] = [
	{ value: 'CPF', label: 'CPF — Compte Personnel de Formation', short: 'CPF', defaultPayerType: 'apprenant', defaultPayerLabel: 'Caisse des Dépôts', group: 'Publique' },
	{ value: 'CPF_Transition', label: 'CPF de Transition Professionnelle', short: 'CPF Transition', defaultPayerType: 'apprenant', defaultPayerLabel: 'Transitions Pro', group: 'Publique' },
	{ value: 'FranceTravail_AIF', label: 'France Travail — AIF (Aide Individuelle à la Formation)', short: 'AIF', defaultPayerType: 'apprenant', defaultPayerLabel: 'France Travail', group: 'Publique' },
	{ value: 'FranceTravail_POEI', label: 'France Travail — POEI (Préparation Opérationnelle à l\'Emploi Individuelle)', short: 'POEI', defaultPayerType: 'apprenant', defaultPayerLabel: 'France Travail', group: 'Publique' },
	{ value: 'FranceTravail_POEC', label: 'France Travail — POEC (Préparation Opérationnelle à l\'Emploi Collective)', short: 'POEC', defaultPayerType: 'apprenant', defaultPayerLabel: 'France Travail', group: 'Publique' },
	{ value: 'TransitionsPro_CTP', label: 'Transitions Pro — CTP (Contrat de Transition Professionnelle)', short: 'CTP', defaultPayerType: 'apprenant', defaultPayerLabel: 'Transitions Pro', group: 'Publique' },
	{ value: 'Region', label: 'Conseil Régional', short: 'Région', defaultPayerType: 'apprenant', defaultPayerLabel: 'Région', group: 'Publique' },
	{ value: 'FSE', label: 'FSE — Fonds Social Européen', short: 'FSE', defaultPayerType: 'entreprise', defaultPayerLabel: 'Fonds Social Européen', group: 'Publique' },

	{ value: 'OPCO_PDC', label: 'OPCO — Plan de Développement des Compétences', short: 'OPCO PDC', defaultPayerType: 'entreprise', defaultPayerLabel: null, group: 'Entreprise' },
	{ value: 'OPCO_Alternance', label: 'OPCO — Alternance (apprentissage / pro)', short: 'OPCO Alternance', defaultPayerType: 'entreprise', defaultPayerLabel: null, group: 'Entreprise' },
	{ value: 'OPCO_ProA', label: 'OPCO — Pro-A (reconversion ou promotion par alternance)', short: 'OPCO Pro-A', defaultPayerType: 'entreprise', defaultPayerLabel: null, group: 'Entreprise' },
	{ value: 'OPCO_AFEST', label: 'OPCO — AFEST (Action de Formation En Situation de Travail)', short: 'OPCO AFEST', defaultPayerType: 'entreprise', defaultPayerLabel: null, group: 'Entreprise' },
	{ value: 'FNE_Formation', label: 'FNE-Formation (Fonds National de l\'Emploi)', short: 'FNE', defaultPayerType: 'entreprise', defaultPayerLabel: 'État — FNE Formation', group: 'Entreprise' },
	{ value: 'EmployeurDirect', label: 'Employeur — paiement direct', short: 'Employeur', defaultPayerType: 'entreprise', defaultPayerLabel: null, group: 'Entreprise' },
	{ value: 'AGEFICE', label: 'AGEFICE (dirigeants non salariés du commerce)', short: 'AGEFICE', defaultPayerType: 'entreprise', defaultPayerLabel: 'AGEFICE', group: 'Entreprise' },
	{ value: 'FIFPL', label: 'FIF-PL (professions libérales)', short: 'FIF-PL', defaultPayerType: 'entreprise', defaultPayerLabel: 'FIF-PL', group: 'Entreprise' },
	{ value: 'FAFCEA', label: 'FAFCEA (artisans)', short: 'FAFCEA', defaultPayerType: 'entreprise', defaultPayerLabel: 'FAFCEA', group: 'Entreprise' },

	{ value: 'AutoFinancement', label: 'Autofinancement (apprenant)', short: 'Autofinancement', defaultPayerType: 'apprenant', defaultPayerLabel: 'Apprenant — autofinancement', group: 'Autre' },
	{ value: 'Autre', label: 'Autre source de financement', short: 'Autre', defaultPayerType: 'apprenant', defaultPayerLabel: null, group: 'Autre' }
];

const BY_CODE = new Map(FUNDING_SOURCE_DESCRIPTORS.map((d) => [d.value, d]));

export function describeFundingSource(value: string | null | undefined): FundingSourceDescriptor | null {
	if (!value) return null;
	return BY_CODE.get(value as FundingSourceCode) ?? null;
}

export function fundingSourceLabel(value: string | null | undefined): string {
	return describeFundingSource(value)?.label ?? (value ?? '');
}

export function fundingSourceShort(value: string | null | undefined): string {
	return describeFundingSource(value)?.short ?? (value ?? '');
}

/**
 * Group descriptors for rendering the dropdown with Select.Group headings.
 * Order is stable: Publique → Entreprise → Autre.
 */
export function groupedFundingSources(): Array<{
	group: FundingSourceDescriptor['group'];
	options: FundingSourceDescriptor[];
}> {
	const out: Record<FundingSourceDescriptor['group'], FundingSourceDescriptor[]> = {
		Publique: [],
		Entreprise: [],
		Autre: []
	};
	for (const d of FUNDING_SOURCE_DESCRIPTORS) out[d.group].push(d);
	return [
		{ group: 'Publique', options: out.Publique },
		{ group: 'Entreprise', options: out.Entreprise },
		{ group: 'Autre', options: out.Autre }
	];
}

export const PAYER_TYPE_LABELS: Record<PayerType, string> = {
	apprenant: 'Apprenant',
	entreprise: 'Entreprise',
	OF: 'Organisme de formation'
};

export const FUNDING_STATUS_LABELS: Record<FundingSourceStatusCode, string> = {
	Pressenti: 'Pressenti',
	Demandé: 'Demandé',
	Accordé: 'Accordé',
	Refusé: 'Refusé',
	Versé: 'Versé',
	Annulé: 'Annulé'
};
