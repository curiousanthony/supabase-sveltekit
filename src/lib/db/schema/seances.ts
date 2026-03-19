import { sql } from 'drizzle-orm';
import {
	pgTable,
	foreignKey,
	timestamp,
	uuid,
	text,
	check,
	unique,
	uniqueIndex
} from 'drizzle-orm/pg-core';
import { modalites } from './enums';
import { users } from './users';
import { formations, modules } from './formations';
import { formateurs } from './formateurs';
import { contacts } from './contacts';

/** Session start/end are stored in UTC (timestamptz). Use app timezone only for display/input. */
export const seances = pgTable(
	'seances',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		createdBy: uuid('created_by').notNull(),
		formationId: uuid('formation_id').notNull(),
		moduleId: uuid('module_id'),
		startAt: timestamp('start_at', { withTimezone: true, mode: 'string' }).notNull(),
		endAt: timestamp('end_at', { withTimezone: true, mode: 'string' }).notNull(),
		location: text(),
		room: text(),
		formateurId: uuid('formateur_id'),
		modalityOverride: modalites('modality_override')
	},
	(table) => [
		foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: 'seances_created_by_fkey'
		}),
		foreignKey({
			columns: [table.formationId],
			foreignColumns: [formations.id],
			name: 'seances_formation_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.moduleId],
			foreignColumns: [modules.id],
			name: 'seances_module_id_fkey'
		}).onDelete('set null'),
		foreignKey({
			columns: [table.formateurId],
			foreignColumns: [formateurs.id],
			name: 'seances_formateur_id_fkey'
		}).onDelete('set null'),
		check('seances_end_after_start_chk', sql`${table.endAt} > ${table.startAt}`)
	]
);

export const emargements = pgTable(
	'emargements',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		seanceId: uuid('seance_id').notNull(),
		contactId: uuid('contact_id').notNull(),
		signedAt: timestamp('signed_at', { withTimezone: true, mode: 'string' }),
		signatureImageUrl: text('signature_image_url'),
		signatureToken: uuid('signature_token').defaultRandom().notNull(),
		signerIp: text('signer_ip'),
		signerUserAgent: text('signer_user_agent'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.seanceId],
			foreignColumns: [seances.id],
			name: 'emargements_seance_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.contactId],
			foreignColumns: [contacts.id],
			name: 'emargements_contact_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		unique('unique_emargement_seance_contact').on(table.seanceId, table.contactId),
		uniqueIndex('emargements_signature_token_idx').on(table.signatureToken)
	]
);
