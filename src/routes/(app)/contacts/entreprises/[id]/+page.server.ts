import { db } from '$lib/db';

function normalizeUrl(url: string): string {
	if (!url) return url;
	return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

import { companies, contactCompanies, contacts, deals } from '$lib/db/schema';
import { getUserWorkspace } from '$lib/auth';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
	legalStatusOptions,
	industryOptions,
	companySizeOptions
} from '$lib/crm/company-form-options';

const ALLOWED_FIELDS = [
	'name',
	'siret',
	'legalStatus',
	'industry',
	'companySize',
	'websiteUrl',
	'address',
	'city',
	'region',
	'internalNotes'
] as const;

type AllowedField = (typeof ALLOWED_FIELDS)[number];

export const load = (async ({ params, locals }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) throw error(404, 'Espace non trouvé');

	const [company] = await db
		.select()
		.from(companies)
		.where(and(eq(companies.id, params.id), eq(companies.workspaceId, workspaceId)))
		.limit(1);

	if (!company) throw error(404, 'Entreprise non trouvée');

	const links = await db
		.select({ contactId: contactCompanies.contactId })
		.from(contactCompanies)
		.where(eq(contactCompanies.companyId, company.id));
	const contactIds = links.map((l) => l.contactId);
	const linkedContacts =
		contactIds.length > 0
			? await db
					.select({
						id: contacts.id,
						firstName: contacts.firstName,
						lastName: contacts.lastName,
						email: contacts.email,
						phone: contacts.phone,
						poste: contacts.poste
					})
					.from(contacts)
					.where(and(eq(contacts.workspaceId, workspaceId), inArray(contacts.id, contactIds)))
			: [];

	const linkedDeals = await db
		.select({
			id: deals.id,
			name: deals.name,
			stage: deals.stage,
			value: deals.value,
			dealAmount: deals.dealAmount,
			updatedAt: deals.updatedAt
		})
		.from(deals)
		.where(and(eq(deals.companyId, company.id), eq(deals.workspaceId, workspaceId)));

	// All workspace contacts for the link combobox
	const allContacts = await db
		.select({
			id: contacts.id,
			firstName: contacts.firstName,
			lastName: contacts.lastName,
			email: contacts.email
		})
		.from(contacts)
		.where(eq(contacts.workspaceId, workspaceId))
		.orderBy(desc(contacts.updatedAt));

	return {
		company,
		linkedContacts,
		linkedDeals,
		allContacts,
		header: {
			pageName: company.name,
			backButton: true,
			backButtonLabel: 'Entreprises',
			backButtonHref: '/contacts/entreprises',
			actions: []
		}
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	deleteCompany: async ({ params, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) throw error(403, 'Espace non trouvé');
		const [company] = await db
			.select({ id: companies.id })
			.from(companies)
			.where(and(eq(companies.id, params.id), eq(companies.workspaceId, workspaceId)))
			.limit(1);
		if (!company) throw error(404, 'Entreprise non trouvée');
		await db.delete(companies).where(eq(companies.id, company.id));
		throw redirect(303, '/contacts/entreprises');
	},

	updateField: async ({ params, request, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });

		const fd = await request.formData();
		const field = (fd.get('field') as string)?.trim() as AllowedField;
		const value = (fd.get('value') as string)?.trim() ?? '';

		if (!ALLOWED_FIELDS.includes(field)) {
			return fail(400, { message: 'Champ invalide' });
		}

		// Validate enum values
		if (field === 'legalStatus' && value && !legalStatusOptions.includes(value as (typeof legalStatusOptions)[number])) {
			return fail(400, { message: 'Statut juridique invalide' });
		}
		if (field === 'industry' && value && !industryOptions.includes(value as (typeof industryOptions)[number])) {
			return fail(400, { message: 'Industrie invalide' });
		}
		if (field === 'companySize' && value && !companySizeOptions.includes(value as (typeof companySizeOptions)[number])) {
			return fail(400, { message: 'Taille invalide' });
		}
		// SIRET: exactly 14 digits
		if (field === 'siret' && value && !/^\d{14}$/.test(value)) {
			return fail(400, { message: 'Le SIRET doit contenir exactement 14 chiffres' });
		}

		const saveValue = field === 'websiteUrl' && value ? normalizeUrl(value) : (value || null);

		await db
			.update(companies)
			.set({ [field]: saveValue, updatedAt: new Date().toISOString() })
			.where(and(eq(companies.id, params.id), eq(companies.workspaceId, workspaceId)));

		return { success: true };
	},

	linkContact: async ({ params, request, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });

		const fd = await request.formData();
		const contactId = (fd.get('contactId') as string)?.trim();
		if (!contactId) return fail(400, { message: 'Contact manquant' });

		// Verify contact belongs to same workspace
		const [contact] = await db
			.select({ id: contacts.id })
			.from(contacts)
			.where(and(eq(contacts.id, contactId), eq(contacts.workspaceId, workspaceId)))
			.limit(1);
		if (!contact) return fail(404, { message: 'Contact non trouvé' });

		await db
			.insert(contactCompanies)
			.values({ contactId, companyId: params.id })
			.onConflictDoNothing();

		return { success: true };
	},

	unlinkContact: async ({ params, request, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });

		const fd = await request.formData();
		const contactId = (fd.get('contactId') as string)?.trim();
		if (!contactId) return fail(400, { message: 'Contact manquant' });

		await db
			.delete(contactCompanies)
			.where(
				and(
					eq(contactCompanies.contactId, contactId),
					eq(contactCompanies.companyId, params.id)
				)
			);

		return { success: true };
	}
};
