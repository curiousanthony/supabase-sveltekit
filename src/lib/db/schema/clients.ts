import { pgTable, foreignKey, timestamp, uuid, text, integer } from 'drizzle-orm/pg-core';
import { typeClient } from './enums';
import { users } from './users';
import { workspaces } from './workspaces';

export const clients = pgTable(
	'clients',
	{
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		createdBy: uuid('created_by').notNull(),
		type: typeClient(),
		id: uuid().defaultRandom().primaryKey().notNull(),
		email: text(),
		siret: integer(),
		legalName: text('legal_name'),
		workspaceId: uuid('workspace_id')
	},
	(table) => [
		foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: 'clients_created_by_fkey'
		}),
		foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: 'clients_workspace_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('set null')
	]
);
