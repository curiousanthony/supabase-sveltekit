import {
	pgTable,
	pgEnum,
	uuid,
	text,
	numeric,
	date,
	timestamp,
	foreignKey,
	index
} from 'drizzle-orm/pg-core';
import { formations } from './formations';

/**
 * Multi-source funding lines for a formation.
 *
 * Replaces the single-row financing model previously held on
 * `formations.{type_financement, financement_accorde, montant_accorde}`.
 *
 * One formation can have many funding lines (CPF + entreprise, OPCO + reste à
 * charge, etc.). Each line carries its own status lifecycle, requested vs
 * granted amounts, dossier reference, and (where applicable) a payer label.
 *
 * The legacy `formations.{type_financement, montant_accorde, financement_accorde}`
 * columns are NOT dropped here: they are kept for one release cycle to allow
 * rollback. T-51 / a follow-up cleans them up once the new model is fully
 * adopted across UI + service layer.
 */
export const fundingSourceType = pgEnum('funding_source_type', [
	'CPF',
	'CPF_Transition',
	'OPCO_PDC',
	'OPCO_Alternance',
	'OPCO_ProA',
	'OPCO_AFEST',
	'FranceTravail_AIF',
	'FranceTravail_POEI',
	'FranceTravail_POEC',
	'Region',
	'FSE',
	'FNE_Formation',
	'TransitionsPro_CTP',
	'AGEFICE',
	'FIFPL',
	'FAFCEA',
	'EmployeurDirect',
	'AutoFinancement',
	'Autre'
]);

export const fundingSourceStatus = pgEnum('funding_source_status', [
	'Pressenti',
	'Demandé',
	'Accordé',
	'Refusé',
	'Versé',
	'Annulé'
]);

/**
 * Who actually owes the money behind this funding line. Drives the per-payer
 * "Reste à charge" split on the Finances synthesis card.
 *
 * Apprenant — CPF, FranceTravail (AIF / POEI / POEC), TransitionsPro, AutoFinancement.
 * Entreprise — OPCO_*, EmployeurDirect, FNE, AGEFICE, FIFPL, FAFCEA.
 * OF — promotional / waived amounts (rare; never auto-assigned).
 */
export const payerType = pgEnum('payer_type', ['apprenant', 'entreprise', 'OF']);

export const formationFundingSources = pgTable(
	'formation_funding_sources',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		formationId: uuid('formation_id').notNull(),
		source: fundingSourceType().notNull(),
		payerType: payerType('payer_type').default('apprenant').notNull(),
		payerLabel: text('payer_label'),
		requestedAmount: numeric('requested_amount', { precision: 12, scale: 2 }),
		grantedAmount: numeric('granted_amount', { precision: 12, scale: 2 }),
		status: fundingSourceStatus().default('Pressenti').notNull(),
		decisionDate: date('decision_date'),
		expectedPaymentDate: date('expected_payment_date'),
		dossierReference: text('dossier_reference'),
		notes: text(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
	},
	(table) => [
		foreignKey({
			columns: [table.formationId],
			foreignColumns: [formations.id],
			name: 'formation_funding_sources_formation_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		index('formation_funding_sources_formation_id_idx').on(table.formationId)
	]
);
