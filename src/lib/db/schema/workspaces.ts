import { pgTable, timestamp, uuid, varchar, text, unique, boolean } from 'drizzle-orm/pg-core';

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
		showReferralCta: boolean('show_referral_cta').default(true).notNull()
	},
	(table) => [unique('workspaces_id2_key').on(table.id)]
);
