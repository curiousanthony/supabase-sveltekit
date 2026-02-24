import { pgTable, timestamp, uuid, text, uniqueIndex, unique, foreignKey } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces';

export const users = pgTable(
	'users',
	{
		firstName: text('first_name'),
		lastName: text('last_name'),
		email: text().notNull(),
		id: uuid().defaultRandom().primaryKey().notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		avatarUrl: text('avatar_url'),
		lastActiveWorkspaceId: uuid('last_active_workspace_id')
	},
	(table) => [
		uniqueIndex('email_idx').using('btree', table.email.asc().nullsLast().op('text_ops')),
		unique('users_id2_key').on(table.id),
		foreignKey({
			columns: [table.lastActiveWorkspaceId],
			foreignColumns: [workspaces.id],
			name: 'users_last_active_workspace_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('set null')
	]
);
