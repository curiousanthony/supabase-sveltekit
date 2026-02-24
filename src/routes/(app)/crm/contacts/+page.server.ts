import { db } from '$lib/db';
import { contacts, contactCompanies, companies } from '$lib/db/schema';
import { getUserWorkspace } from '$lib/auth';
import { eq, desc, inArray } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals, url }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) {
		return {
			contacts: [],
			companies: [],
			workspaceId: null,
			header: { pageName: 'Contacts', actions: [] }
		};
	}

	const posteParam = url.searchParams.get('poste');
	const posteFilter = posteParam && posteParam !== 'all' ? posteParam : undefined;
	const search = url.searchParams.get('q')?.trim();

	const contactsRows = await db
		.select()
		.from(contacts)
		.where(eq(contacts.workspaceId, workspaceId))
		.orderBy(desc(contacts.updatedAt));
	const contactIds = contactsRows.map((r) => r.id);
	const contactCompaniesRows =
		contactIds.length > 0
			? await db
					.select({ contactId: contactCompanies.contactId, companyId: contactCompanies.companyId })
					.from(contactCompanies)
					.where(inArray(contactCompanies.contactId, contactIds))
			: [];
	const companyIdsByContactId = new Map<string, { companyId: string }[]>();
	for (const row of contactCompaniesRows) {
		const list = companyIdsByContactId.get(row.contactId) ?? [];
		list.push({ companyId: row.companyId });
		companyIdsByContactId.set(row.contactId, list);
	}
	let contactsData = contactsRows.map((c) => ({
		...c,
		contactCompanies: companyIdsByContactId.get(c.id) ?? []
	}));

	if (posteFilter) {
		contactsData = contactsData.filter((c) => c.poste === posteFilter);
	}
	if (search) {
		const lower = search.toLowerCase();
		contactsData = contactsData.filter(
			(c) =>
				(c.firstName?.toLowerCase().includes(lower) ?? false) ||
				(c.lastName?.toLowerCase().includes(lower) ?? false) ||
				(c.email?.toLowerCase().includes(lower) ?? false)
		);
	}

	const header = {
		pageName: 'Contacts',
		actions: [
			{
				type: 'button' as const,
				icon: 'plus',
				text: 'Nouveau contact',
				href: '/crm/contacts/creer',
				variant: 'default' as const
			}
		]
	};

	const companiesData = await db
		.select({ id: companies.id, name: companies.name })
		.from(companies)
		.where(eq(companies.workspaceId, workspaceId));

	return {
		contacts: contactsData,
		companies: companiesData,
		workspaceId,
		header,
		query: url.searchParams.get('q') ?? '',
		poste: posteParam ?? ''
	};
}) satisfies PageServerLoad;
