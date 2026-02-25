import { db } from '$lib/db';
import { companies, contactCompanies, contacts, deals } from '$lib/db/schema';
import { getUserWorkspace } from '$lib/auth';
import { eq, and, inArray } from 'drizzle-orm';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

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

	return {
		company,
		linkedContacts,
		linkedDeals,
		header: {
			pageName: company.name,
			backButton: true,
			backButtonLabel: 'Entreprises',
			backButtonHref: '/contacts/entreprises',
			actions: [
				{
					type: 'button' as const,
					icon: 'pencil',
					text: 'Éditer',
					href: `/contacts/entreprises?editCompany=${company.id}`,
					variant: 'secondary' as const
				}
			]
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
	}
};
