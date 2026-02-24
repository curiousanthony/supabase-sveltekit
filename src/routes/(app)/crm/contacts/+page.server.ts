import { db } from '$lib/db';
import { contacts, contactCompanies, companies } from '$lib/db/schema';
import { getUserWorkspace } from '$lib/auth';
import { and, eq, desc, inArray } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { contactSchema, posteOptions } from './schema';

type EditContact = {
	id: string;
	firstName: string | null;
	lastName: string | null;
	email: string | null;
	phone: string | null;
	poste: string | null;
	linkedinUrl: string | null;
	internalNotes: string | null;
	contactCompanies: { companyId: string }[];
};

export const load = (async ({ locals, url }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) {
		return {
			contacts: [],
			companies: [],
			workspaceId: null,
			editContact: null as EditContact | null,
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

	const editId = url.searchParams.get('edit');
	let editContact: EditContact | null = null;
	if (editId) {
		const c = await db.query.contacts.findFirst({
			where: and(eq(contacts.id, editId), eq(contacts.workspaceId, workspaceId)),
			columns: {
				id: true,
				firstName: true,
				lastName: true,
				email: true,
				phone: true,
				poste: true,
				linkedinUrl: true,
				internalNotes: true
			}
		});
		if (c) {
			const links = await db
				.select({ companyId: contactCompanies.companyId })
				.from(contactCompanies)
				.where(eq(contactCompanies.contactId, c.id));
			editContact = {
				id: c.id,
				firstName: c.firstName,
				lastName: c.lastName,
				email: c.email,
				phone: c.phone,
				poste: c.poste,
				linkedinUrl: c.linkedinUrl,
				internalNotes: c.internalNotes,
				contactCompanies: links
			};
		}
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
		editContact,
		header,
		query: url.searchParams.get('q') ?? '',
		poste: posteParam ?? ''
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	updateContact: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun espace de travail' });

		const fd = await request.formData();
		const contactId = (fd.get('contactId') as string)?.trim();
		if (!contactId) return fail(400, { message: 'Contact manquant' });

		const raw = {
			firstName: (fd.get('firstName') as string)?.trim() ?? '',
			lastName: (fd.get('lastName') as string)?.trim() ?? '',
			email: (fd.get('email') as string)?.trim() ?? '',
			phone: (fd.get('phone') as string)?.trim() || undefined,
			poste: (fd.get('poste') as string) || undefined,
			linkedinUrl: (fd.get('linkedinUrl') as string)?.trim() || undefined,
			internalNotes: (fd.get('internalNotes') as string)?.trim() || undefined,
			companyIds: fd.getAll('companyIds').filter((v): v is string => typeof v === 'string')
		};

		const parsed = contactSchema.safeParse(raw);
		if (!parsed.success) {
			const msg = parsed.error.errors.map((e) => e.message).join(' ');
			return fail(400, { message: msg });
		}
		const poste = parsed.data.poste?.trim();
		if (poste && !posteOptions.includes(poste as (typeof posteOptions)[number])) {
			return fail(400, { message: 'Poste invalide' });
		}

		await db
			.update(contacts)
			.set({
				firstName: parsed.data.firstName,
				lastName: parsed.data.lastName,
				email: parsed.data.email,
				phone: parsed.data.phone ?? null,
				poste: poste ? (poste as (typeof posteOptions)[number]) : null,
				linkedinUrl: parsed.data.linkedinUrl ?? null,
				internalNotes: parsed.data.internalNotes ?? null,
				updatedAt: new Date().toISOString()
			})
			.where(and(eq(contacts.id, contactId), eq(contacts.workspaceId, workspaceId)));

		await db.delete(contactCompanies).where(eq(contactCompanies.contactId, contactId));
		if (parsed.data.companyIds.length > 0) {
			await db.insert(contactCompanies).values(
				parsed.data.companyIds.map((companyId) => ({ contactId, companyId }))
			);
		}
		return { success: true };
	}
};
