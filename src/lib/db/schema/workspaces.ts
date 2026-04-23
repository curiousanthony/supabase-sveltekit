import { pgTable, timestamp, uuid, varchar, text, unique, boolean, numeric, integer } from 'drizzle-orm/pg-core';

export const workspaces = pgTable(
	'workspaces',
	{
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		name: varchar().notNull(),
		id: uuid().defaultRandom().primaryKey().notNull(),
		logoUrl: text('logo_url'),
		legalName: text('legal_name'),
		siret: varchar('siret', { length: 14 }),
		address: text(),
		city: text(),
		postalCode: varchar('postal_code', { length: 10 }),
		phone: varchar({ length: 20 }),
		email: text(),
		website: text(),
		nda: varchar({ length: 20 }),
		signatoryName: text('signatory_name'),
		signatoryRole: text('signatory_role'),
		showReferralCta: boolean('show_referral_cta').default(true).notNull(),
		tvaRate: numeric('tva_rate', { precision: 5, scale: 2 }).default('20.00'),
		defaultPaymentTerms: text('default_payment_terms').default('30 jours fin de mois, par virement bancaire'),
		defaultDevisValidityDays: integer('default_devis_validity_days').default(30),
		defaultCancellationTerms: text('default_cancellation_terms'),
		defaultReferentHandicap: text('default_referent_handicap'),
		defaultDispositionsHandicap: text('default_dispositions_handicap')
	},
	(table) => [unique('workspaces_id2_key').on(table.id)]
);
