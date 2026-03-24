import { pgTable, foreignKey, timestamp, uuid, text, numeric, boolean, unique } from 'drizzle-orm/pg-core';
import { users } from './users';
import { thematiques, sousthematiques } from './thematiques';
import { workspaces } from './workspaces';

export const formateurs = pgTable(
	'formateurs',
	{
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		tauxHoraireMin: numeric('taux_horaire_min'),
		tauxHoraireMax: numeric('taux_horaire_max'),
		description: text(),
		departement: text('departement'),
		ville: text(),
		rating: numeric(),
		disponible7J: boolean('disponible_7j'),
		userId: uuid('user_id').notNull(),
		workspaceId: uuid('workspace_id').notNull(),
		id: uuid().defaultRandom().primaryKey().notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: 'formateurs_user_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: 'formateurs_workspace_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade')
	]
);

export const formateursThematiques = pgTable(
	'formateurs_thematiques',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		thematiqueId: uuid('thematique_id').notNull(),
		formateurId: uuid('formateur_id').notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.thematiqueId],
			foreignColumns: [thematiques.id],
			name: 'formateurs_thematiques_thematique_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.formateurId],
			foreignColumns: [formateurs.id],
			name: 'formateurs_thematiques_formateur_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		unique('unique_formateur_thematique').on(table.thematiqueId, table.formateurId)
	]
);

export const formateursSousthematiques = pgTable(
	'formateurs_sousthematiques',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		sousthematiqueId: uuid('sousthematique_id').notNull(),
		formateurId: uuid('formateur_id').notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.sousthematiqueId],
			foreignColumns: [sousthematiques.id],
			name: 'formateurs_sousthematiques_sousthematique_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.formateurId],
			foreignColumns: [formateurs.id],
			name: 'formateurs_sousthematiques_formateur_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		unique('unique_formateur_sousthematique').on(table.sousthematiqueId, table.formateurId)
	]
);
