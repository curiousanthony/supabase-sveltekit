import { sql } from 'drizzle-orm';
import {
	pgTable,
	foreignKey,
	timestamp,
	uuid,
	text,
	numeric,
	integer,
	unique
} from 'drizzle-orm/pg-core';
import { modalites, statutProgramme } from './enums';
import { workspaces } from './workspaces';
import { users } from './users';
import { biblioModules } from './biblio-modules';

export const biblioProgrammes = pgTable(
	'biblio_programmes',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		titre: text().notNull(),
		description: text(),
		modalite: modalites(),
		prixPublic: numeric('prix_public'),
		statut: statutProgramme().default('Brouillon').notNull(),
		prerequis: text(),
		dureeHeures: numeric('duree_heures'),
		workspaceId: uuid('workspace_id').notNull(),
		createdBy: uuid('created_by').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.$onUpdateFn(() => sql`now()`)
			.notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: 'biblio_programmes_workspace_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: 'biblio_programmes_created_by_fkey'
		})
	]
);

export const biblioProgrammeModules = pgTable(
	'biblio_programme_modules',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		programmeId: uuid('programme_id').notNull(),
		moduleId: uuid('module_id').notNull(),
		orderIndex: integer('order_index').default(0).notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.programmeId],
			foreignColumns: [biblioProgrammes.id],
			name: 'biblio_programme_modules_programme_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.moduleId],
			foreignColumns: [biblioModules.id],
			name: 'biblio_programme_modules_module_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		unique('biblio_programme_modules_unique').on(table.programmeId, table.moduleId)
	]
);
