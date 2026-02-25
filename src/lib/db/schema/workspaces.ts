import { pgTable, timestamp, uuid, varchar, text, unique } from 'drizzle-orm/pg-core';

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
		siret: varchar('siret', { length: 14 })
	},
	(table) => [unique('workspaces_id2_key').on(table.id)]
);
