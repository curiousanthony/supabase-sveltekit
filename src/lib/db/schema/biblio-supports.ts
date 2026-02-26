import { pgTable, foreignKey, timestamp, uuid, text, integer, unique } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces';
import { users } from './users';
import { biblioProgrammes } from './biblio-programmes';
import { biblioModules } from './biblio-modules';

export const biblioSupports = pgTable(
	'biblio_supports',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		titre: text().notNull(),
		url: text(),
		filePath: text('file_path'),
		fileName: text('file_name'),
		fileSize: integer('file_size'),
		mimeType: text('mime_type'),
		workspaceId: uuid('workspace_id').notNull(),
		createdBy: uuid('created_by').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.$onUpdate(() => new Date().toISOString())
			.notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: 'biblio_supports_workspace_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: 'biblio_supports_created_by_fkey'
		})
			.onUpdate('cascade')
			.onDelete('restrict')
	]
);

export const biblioProgrammeSupports = pgTable(
	'biblio_programme_supports',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		programmeId: uuid('programme_id').notNull(),
		supportId: uuid('support_id').notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.programmeId],
			foreignColumns: [biblioProgrammes.id],
			name: 'biblio_prog_supp_programme_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.supportId],
			foreignColumns: [biblioSupports.id],
			name: 'biblio_prog_supp_support_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		unique('biblio_programme_supports_unique').on(table.programmeId, table.supportId)
	]
);

export const biblioModuleSupports = pgTable(
	'biblio_module_supports',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		moduleId: uuid('module_id').notNull(),
		supportId: uuid('support_id').notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.moduleId],
			foreignColumns: [biblioModules.id],
			name: 'biblio_mod_supp_module_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.supportId],
			foreignColumns: [biblioSupports.id],
			name: 'biblio_mod_supp_support_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		unique('biblio_module_supports_unique').on(table.moduleId, table.supportId)
	]
);
