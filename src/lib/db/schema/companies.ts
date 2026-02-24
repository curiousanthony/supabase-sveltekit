import { pgTable, uuid, text, numeric, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { legalStatus, companyIndustry, companySize } from './enums';
import { users } from './users';
import { workspaces } from './workspaces';
import { contacts } from './contacts';

/** CRM companies (prototype "Entreprises (mm)"). */
export const companies = pgTable('companies', {
	id: uuid().defaultRandom().primaryKey().notNull(),
	workspaceId: uuid('workspace_id')
		.notNull()
		.references(() => workspaces.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
	name: text('name').notNull(),
	siret: text('siret'),
	legalStatus: legalStatus('legal_status'),
	industry: companyIndustry('industry'),
	companySize: companySize('company_size'),
	websiteUrl: text('website_url'),
	address: text('address'),
	city: text('city'),
	region: text('region'),
	estimatedBudget: numeric('estimated_budget', { precision: 12, scale: 2 }),
	fundingDevices: text('funding_devices').array(),
	opcoId: uuid('opco_id'),
	ownerId: uuid('owner_id').references(() => users.id, { onUpdate: 'cascade', onDelete: 'set null' }),
	internalNotes: text('internal_notes'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
});

/** Many-to-many: contacts ↔ companies. */
export const contactCompanies = pgTable(
	'contact_companies',
	{
		contactId: uuid('contact_id')
			.notNull()
			.references(() => contacts.id, { onDelete: 'cascade' }),
		companyId: uuid('company_id')
			.notNull()
			.references(() => companies.id, { onDelete: 'cascade' })
	},
	(t) => [primaryKey({ columns: [t.contactId, t.companyId] })]
);
