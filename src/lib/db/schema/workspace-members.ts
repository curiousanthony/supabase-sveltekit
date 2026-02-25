import {
	pgTable,
	foreignKey,
	timestamp,
	uuid,
	text,
	uniqueIndex
} from 'drizzle-orm/pg-core';
import { workspaceRole } from './enums';
import { users } from './users';
import { workspaces } from './workspaces';

export const workspacesUsers = pgTable(
	'workspaces_users',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		workspaceId: uuid('workspace_id').notNull(),
		userId: uuid('user_id').notNull(),
		role: workspaceRole().default('sales').notNull()
	},
	(table) => [
		uniqueIndex('unique_workspace_user').using(
			'btree',
			table.workspaceId.asc().nullsLast().op('uuid_ops'),
			table.userId.asc().nullsLast().op('uuid_ops')
		),
		foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: 'workspaces_users_workspace_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: 'workspaces_users_user_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade')
	]
);

export const workspaceInvites = pgTable(
	'workspace_invites',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		workspaceId: uuid('workspace_id').notNull(),
		email: text().notNull(),
		role: workspaceRole().notNull().default('sales'),
		invitedBy: uuid('invited_by').notNull(),
		tokenDigest: text('token_digest').notNull(),
		expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull()
	},
	(table) => [
		uniqueIndex('idx_workspace_invites_token_digest').on(table.tokenDigest),
		foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: 'workspace_invites_workspace_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.invitedBy],
			foreignColumns: [users.id],
			name: 'workspace_invites_invited_by_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade')
	]
);
