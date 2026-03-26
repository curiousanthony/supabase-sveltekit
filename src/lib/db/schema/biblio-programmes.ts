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
import { thematiques, sousthematiques } from './thematiques';

export const biblioProgrammes = pgTable(
	'biblio_programmes',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		titre: text().notNull(),
		description: text(),
		objectifs: text(),
		publicVise: text('public_vise'),
		modalite: modalites(),
		prixPublic: numeric('prix_public'),
		statut: statutProgramme().default('Brouillon').notNull(),
		prerequis: text(),
		dureeHeures: numeric('duree_heures'),
		topicId: uuid('topic_id'),
		derivedFromProgrammeId: uuid('derived_from_programme_id'),
		workspaceId: uuid('workspace_id').notNull(),
		createdBy: uuid('created_by').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.$onUpdateFn(() => new Date().toISOString())
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
			.onUpdate('cascade')
			.onDelete('restrict'),
		foreignKey({
			columns: [table.topicId],
			foreignColumns: [thematiques.id],
			name: 'biblio_programmes_topic_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('set null'),
		foreignKey({
			columns: [table.derivedFromProgrammeId],
			foreignColumns: [table.id],
			name: 'biblio_programmes_derived_from_fkey'
		})
			.onUpdate('cascade')
			.onDelete('set null')
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

export const biblioProgrammeSousthematiques = pgTable(
	'biblio_programme_sousthematiques',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		programmeId: uuid('programme_id').notNull(),
		sousthematiqueId: uuid('sousthematique_id').notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.programmeId],
			foreignColumns: [biblioProgrammes.id],
			name: 'biblio_prog_sousth_programme_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.sousthematiqueId],
			foreignColumns: [sousthematiques.id],
			name: 'biblio_prog_sousth_sousthematique_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		unique('biblio_programme_sousthematiques_unique').on(
			table.programmeId,
			table.sousthematiqueId
		)
	]
);
