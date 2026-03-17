import {
	pgTable,
	foreignKey,
	timestamp,
	uuid,
	text,
	varchar,
	numeric,
	integer,
	smallint,
	date,
	boolean,
	primaryKey,
	unique
} from 'drizzle-orm/pg-core';
import {
	dealStage,
	dealFundingType,
	dealFormat,
	dealIntraInter,
	dealSource,
	dealLossReason,
	dealFundingStatus
} from './enums';
import { workspaces } from './workspaces';
import { clients } from './clients';
import { users } from './users';
import { formations } from './formations';
import { contacts } from './contacts';
import { companies } from './companies';
import { biblioProgrammes } from './biblio-programmes';

export const deals = pgTable(
	'deals',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		workspaceId: uuid('workspace_id').notNull(),
		clientId: uuid('client_id'),
		name: text().notNull(),
		description: text(),
		stage: dealStage().default('Suspect').notNull(),
		value: numeric('value', { precision: 12, scale: 2 }),
		currency: varchar('currency', { length: 3 }).default('EUR').notNull(),
		ownerId: uuid('owner_id').notNull(),
		createdBy: uuid('created_by').notNull(),
		closedAt: timestamp('closed_at', { withTimezone: true, mode: 'string' }),
		formationId: uuid('formation_id'),
		contactId: uuid('contact_id').references(() => contacts.id, {
			onUpdate: 'cascade',
			onDelete: 'set null'
		}),
		companyId: uuid('company_id').references(() => companies.id, {
			onUpdate: 'cascade',
			onDelete: 'set null'
		}),
		programmeId: uuid('programme_id').references(() => biblioProgrammes.id, {
			onUpdate: 'cascade',
			onDelete: 'set null'
		}),
		fundingType: dealFundingType('funding_type'),
		dealFormat: dealFormat('deal_format'),
		intraInter: dealIntraInter('intra_inter'),
		modalities: text('modalities').array(),
		dealAmount: numeric('deal_amount', { precision: 12, scale: 2 }),
		fundedAmount: numeric('funded_amount', { precision: 12, scale: 2 }),
		isFunded: boolean('is_funded').default(false),
		fundingStatus: dealFundingStatus('funding_status'),
		fundingReference: text('funding_reference'),
		durationHours: integer('duration_hours'),
		nbApprenants: smallint('nb_apprenants'),
		desiredStartDate: date('desired_start_date'),
		desiredEndDate: date('desired_end_date'),
		expectedCloseDate: date('expected_close_date'),
		probability: smallint('probability'),
		source: dealSource('source'),
		lossReason: dealLossReason('loss_reason'),
		lossReasonDetail: text('loss_reason_detail'),
		commercialId: uuid('commercial_id').references(() => users.id, {
			onUpdate: 'cascade',
			onDelete: 'set null'
		}),
		idInWorkspace: integer('id_in_workspace')
	},
	(table) => [
		foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: 'deals_workspace_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: 'deals_client_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('restrict'),
		foreignKey({
			columns: [table.ownerId],
			foreignColumns: [users.id],
			name: 'deals_owner_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('restrict'),
		foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: 'deals_created_by_fkey'
		})
			.onUpdate('cascade')
			.onDelete('restrict'),
		foreignKey({
			columns: [table.formationId],
			foreignColumns: [formations.id],
			name: 'deals_formation_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('set null'),
		unique('deals_workspace_id_in_workspace_unique').on(
			table.workspaceId,
			table.idInWorkspace
		)
	]
);

export const dealCompanies = pgTable(
	'deal_companies',
	{
		dealId: uuid('deal_id')
			.notNull()
			.references(() => deals.id, { onDelete: 'cascade' }),
		companyId: uuid('company_id')
			.notNull()
			.references(() => companies.id, { onDelete: 'cascade' })
	},
	(t) => [primaryKey({ columns: [t.dealId, t.companyId] })]
);
