import { sql } from 'drizzle-orm';
import { pgTable, foreignKey, timestamp, uuid, text, unique } from 'drizzle-orm/pg-core';
import { contactRole } from './enums';
import { users } from './users';
import { workspaces } from './workspaces';

/** CRM contact persons (prototype "Clients (mm)"). */
export const contacts = pgTable(
	'contacts',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		workspaceId: uuid('workspace_id').notNull(),
		firstName: text('first_name'),
		lastName: text('last_name'),
		email: text(),
		phone: text('phone'),
		poste: contactRole('poste'),
		linkedinUrl: text('linkedin_url'),
		ownerId: uuid('owner_id'),
		internalNotes: text('internal_notes'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.$onUpdateFn(() => sql`now()`)
			.notNull(),
		createdBy: uuid('created_by').notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: 'contacts_workspace_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.ownerId],
			foreignColumns: [users.id],
			name: 'contacts_owner_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('set null'),
		foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: 'contacts_created_by_fkey'
		}),
		unique('unique_contact_workspace_email').on(table.workspaceId, table.email)
	]
);
