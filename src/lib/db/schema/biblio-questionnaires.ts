import { sql } from 'drizzle-orm';
import { pgTable, foreignKey, timestamp, uuid, text, unique } from 'drizzle-orm/pg-core';
import { typeQuestionnaire } from './enums';
import { workspaces } from './workspaces';
import { users } from './users';
import { biblioProgrammes } from './biblio-programmes';
import { biblioModules } from './biblio-modules';

export const biblioQuestionnaires = pgTable(
	'biblio_questionnaires',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		titre: text().notNull(),
		type: typeQuestionnaire(),
		urlTest: text('url_test'),
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
			name: 'biblio_questionnaires_workspace_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: 'biblio_questionnaires_created_by_fkey'
		})
	]
);

export const biblioProgrammeQuestionnaires = pgTable(
	'biblio_programme_questionnaires',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		programmeId: uuid('programme_id').notNull(),
		questionnaireId: uuid('questionnaire_id').notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.programmeId],
			foreignColumns: [biblioProgrammes.id],
			name: 'biblio_prog_quest_programme_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.questionnaireId],
			foreignColumns: [biblioQuestionnaires.id],
			name: 'biblio_prog_quest_questionnaire_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		unique('biblio_programme_questionnaires_unique').on(table.programmeId, table.questionnaireId)
	]
);

export const biblioModuleQuestionnaires = pgTable(
	'biblio_module_questionnaires',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		moduleId: uuid('module_id').notNull(),
		questionnaireId: uuid('questionnaire_id').notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.moduleId],
			foreignColumns: [biblioModules.id],
			name: 'biblio_mod_quest_module_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.questionnaireId],
			foreignColumns: [biblioQuestionnaires.id],
			name: 'biblio_mod_quest_questionnaire_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		unique('biblio_module_questionnaires_unique').on(table.moduleId, table.questionnaireId)
	]
);
