import {
	pgTable,
	foreignKey,
	timestamp,
	uuid,
	text,
	jsonb,
	index
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { formations } from './formations';
import { users } from './users';
import { contacts } from './contacts';
import { formateurs } from './formateurs';
import { seances } from './seances';

export const formationDocuments = pgTable(
	'formation_documents',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		formationId: uuid('formation_id').notNull(),
		type: text().notNull(),
		title: text().notNull(),
		status: text().default('genere').notNull(),
		storagePath: text('storage_path'),
		generatedAt: timestamp('generated_at', { withTimezone: true, mode: 'string' }),
		generatedBy: uuid('generated_by'),
		signedAt: timestamp('signed_at', { withTimezone: true, mode: 'string' }),
		sentAt: timestamp('sent_at', { withTimezone: true, mode: 'string' }),
		sentTo: text('sent_to').array(),
		acceptedAt: timestamp('accepted_at', { withTimezone: true, mode: 'string' }),
		refusedAt: timestamp('refused_at', { withTimezone: true, mode: 'string' }),
		expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }),
		archivedAt: timestamp('archived_at', { withTimezone: true, mode: 'string' }),
		statusChangedAt: timestamp('status_changed_at', { withTimezone: true, mode: 'string' }),
		statusChangedBy: uuid('status_changed_by'),
		replacesDocumentId: uuid('replaces_document_id'),
		relatedContactId: uuid('related_contact_id'),
		relatedFormateurId: uuid('related_formateur_id'),
		relatedSeanceId: uuid('related_seance_id'),
		metadata: jsonb().default({}).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.formationId],
			foreignColumns: [formations.id],
			name: 'formation_documents_formation_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.generatedBy],
			foreignColumns: [users.id],
			name: 'formation_documents_generated_by_fkey'
		}).onDelete('set null'),
		foreignKey({
			columns: [table.statusChangedBy],
			foreignColumns: [users.id],
			name: 'formation_documents_status_changed_by_fkey'
		}).onDelete('set null'),
		foreignKey({
			columns: [table.replacesDocumentId],
			foreignColumns: [table.id],
			name: 'formation_documents_replaces_document_id_fkey'
		}).onDelete('set null'),
		foreignKey({
			columns: [table.relatedContactId],
			foreignColumns: [contacts.id],
			name: 'formation_documents_related_contact_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('set null'),
		foreignKey({
			columns: [table.relatedFormateurId],
			foreignColumns: [formateurs.id],
			name: 'formation_documents_related_formateur_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('set null'),
		foreignKey({
			columns: [table.relatedSeanceId],
			foreignColumns: [seances.id],
			name: 'formation_documents_related_seance_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('set null'),
		index('formation_documents_formation_id_idx').on(table.formationId),
		index('formation_documents_type_idx').on(table.type),
		index('formation_documents_status_idx').on(table.status),
		index('formation_documents_formation_type_status_idx').on(
			table.formationId,
			table.type,
			table.status
		),
		index('formation_documents_expires_at_idx')
			.on(table.expiresAt)
			.where(sql`expires_at IS NOT NULL`),
		index('formation_documents_replaces_document_id_idx')
			.on(table.replacesDocumentId)
			.where(sql`replaces_document_id IS NOT NULL`)
	]
);

export const formationEmails = pgTable(
	'formation_emails',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		formationId: uuid('formation_id').notNull(),
		documentId: uuid('document_id'),
		type: text().notNull(),
		subject: text().notNull(),
		recipientEmail: text('recipient_email').notNull(),
		recipientName: text('recipient_name'),
		recipientType: text('recipient_type'),
		status: text().default('pending').notNull(),
		sentAt: timestamp('sent_at', { withTimezone: true, mode: 'string' }),
		postmarkMessageId: text('postmark_message_id'),
		bodyPreview: text('body_preview'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		createdBy: uuid('created_by')
	},
	(table) => [
		foreignKey({
			columns: [table.formationId],
			foreignColumns: [formations.id],
			name: 'formation_emails_formation_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.documentId],
			foreignColumns: [formationDocuments.id],
			name: 'formation_emails_document_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('set null'),
		foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: 'formation_emails_created_by_fkey'
		}).onDelete('set null'),
		index('formation_emails_formation_id_idx').on(table.formationId),
		index('formation_emails_status_idx').on(table.status),
		index('formation_emails_type_idx').on(table.type)
	]
);
