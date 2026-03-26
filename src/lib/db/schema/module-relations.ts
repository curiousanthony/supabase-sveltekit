import { pgTable, foreignKey, uuid, unique } from 'drizzle-orm/pg-core';
import { modules } from './formations';
import { biblioSupports } from './biblio-supports';
import { biblioQuestionnaires } from './biblio-questionnaires';

export const moduleSupports = pgTable(
	'module_supports',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		moduleId: uuid('module_id').notNull(),
		supportId: uuid('support_id').notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.moduleId],
			foreignColumns: [modules.id],
			name: 'module_supports_module_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.supportId],
			foreignColumns: [biblioSupports.id],
			name: 'module_supports_support_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		unique('module_supports_unique').on(table.moduleId, table.supportId)
	]
);

export const moduleQuestionnaires = pgTable(
	'module_questionnaires',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		moduleId: uuid('module_id').notNull(),
		questionnaireId: uuid('questionnaire_id').notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.moduleId],
			foreignColumns: [modules.id],
			name: 'module_questionnaires_module_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.questionnaireId],
			foreignColumns: [biblioQuestionnaires.id],
			name: 'module_questionnaires_questionnaire_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		unique('module_questionnaires_unique').on(table.moduleId, table.questionnaireId)
	]
);
