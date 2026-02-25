import { sql } from 'drizzle-orm';
import { pgTable, foreignKey, timestamp, uuid, text, numeric } from 'drizzle-orm/pg-core';
import { modaliteEvaluation } from './enums';
import { workspaces } from './workspaces';
import { users } from './users';

export const biblioModules = pgTable(
	'biblio_modules',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		titre: text().notNull(),
		contenu: text(),
		objectifsPedagogiques: text('objectifs_pedagogiques'),
		modaliteEvaluation: modaliteEvaluation('modalite_evaluation'),
		dureeHeures: numeric('duree_heures', { precision: 6, scale: 2 }),
		workspaceId: uuid('workspace_id').notNull(),
		createdBy: uuid('created_by').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		// updated_at is also maintained by DB trigger (trg_set_updated_at) for direct SQL writes
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.$onUpdateFn(() => sql`now()`)
			.notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: 'biblio_modules_workspace_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: 'biblio_modules_created_by_fkey'
		})
			.onDelete('restrict')
			.onUpdate('cascade')
	]
);
