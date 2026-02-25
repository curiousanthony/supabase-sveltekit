import { db } from '$lib/db';
import { contacts, companies, contactCompanies } from '$lib/db/schema';
import { getUserWorkspace, ensureUserInPublicUsers } from '$lib/auth';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { contactSchema, posteOptions } from '$lib/crm/contact-schema';

export const load = (async ({ locals, url }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) {
		return {
			contacts: [],
			companies: [],
			workspaceId: null,
			query: '',
			poste: '',
			editContact: null,
			header: { pageName: 'CRM', actions: [] }
		};
	}

	try {
		return await loadClients(workspaceId, url);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error('[CRM /contacts load]', message);
		return {
			contacts: [],
			companies: [],
			workspaceId,
			query: url.searchParams.get('q') ?? '',
			poste: url.searchParams.get('poste') ?? '',
			editContact: null,
			header: { pageName: 'CRM', actions: [] },
			loadError: message
		};
	}
}) satisfies PageServerLoad;

type EditContact = {
	id: string;
	workspaceId: string;
	firstName: string | null;
	lastName: string | null;
	email: string | null;
	phone: string | null;
	poste: 'Responsable RH' | 'CEO' | 'Autre' | null;
	linkedinUrl: string | null;
	ownerId: string | null;
	internalNotes: string | null;
	createdAt: string;
	updatedAt: string;
	createdBy: string;
	contactCompanies: { companyId: string }[];
};

async function loadClients(workspaceId: string, url: URL) {
	const contactsRows = await db
		.select()
		.from(contacts)
		.where(eq(contacts.workspaceId, workspaceId))
		.orderBy(desc(contacts.updatedAt));

	const contactIds = contactsRows.map((r) => r.id);

	const editId = url.searchParams.get('edit');
	let editContact: EditContact | null = null;
	if (editId) {
		const c = contactsRows.find((r) => r.id === editId);
		if (c) {
			const links = await db
				.select({ companyId: contactCompanies.companyId })
				.from(contactCompanies)
				.where(eq(contactCompanies.contactId, c.id));
			editContact = {
				id: c.id,
				workspaceId: c.workspaceId,
				firstName: c.firstName,
				lastName: c.lastName,
				email: c.email,
				phone: c.phone,
				poste: c.poste,
				linkedinUrl: c.linkedinUrl,
				ownerId: c.ownerId,
				internalNotes: c.internalNotes,
				createdAt: c.createdAt,
				updatedAt: c.updatedAt,
				createdBy: c.createdBy,
				contactCompanies: links
			};
		}
	}

	const posteParam = url.searchParams.get('poste');
	const posteFilter = posteParam && posteParam !== 'all' ? posteParam : undefined;
	const search = url.searchParams.get('q')?.trim();

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
		id: c.id,
		workspaceId: c.workspaceId,
		firstName: c.firstName,
		lastName: c.lastName,
		email: c.email,
		phone: c.phone,
		poste: c.poste,
		linkedinUrl: c.linkedinUrl,
		ownerId: c.ownerId,
		internalNotes: c.internalNotes,
		createdAt: c.createdAt,
		updatedAt: c.updatedAt,
		createdBy: c.createdBy,
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

	const companiesData = await db.query.companies.findMany({
		where: eq(companies.workspaceId, workspaceId),
		orderBy: [desc(companies.updatedAt)],
		columns: { id: true, name: true }
	});

	return {
		contacts: contactsData,
		companies: companiesData,
		workspaceId,
		query: url.searchParams.get('q') ?? '',
		poste: posteParam ?? '',
		editContact,
		header: { pageName: 'CRM', actions: [] },
		loadError: undefined
	};
}

export const actions: Actions = {
	createContact: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun espace de travail' });

		const fd = await request.formData();
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
			return fail(400, { message: parsed.error.errors.map((e) => e.message).join(' ') });
		}
		const poste = parsed.data.poste?.trim();
		if (poste && !posteOptions.includes(poste as (typeof posteOptions)[number])) {
			return fail(400, { message: 'Poste invalide' });
		}

		await ensureUserInPublicUsers(locals);

		try {
			const inserted = await db
				.insert(contacts)
				.values({
					workspaceId,
					firstName: parsed.data.firstName,
					lastName: parsed.data.lastName,
					email: parsed.data.email,
					phone: parsed.data.phone ?? null,
					poste: poste ? (poste as (typeof posteOptions)[number]) : null,
					linkedinUrl: parsed.data.linkedinUrl ?? null,
					internalNotes: parsed.data.internalNotes ?? null,
					createdBy: user.id
				})
				.returning({ id: contacts.id });

			const contactId = inserted[0]?.id;
			if (!contactId) return fail(500, { message: 'Création du contact échouée' });

			if (parsed.data.companyIds.length > 0) {
				await db
					.insert(contactCompanies)
					.values(parsed.data.companyIds.map((companyId) => ({ contactId, companyId })));
			}
			return { success: true };
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			const cause = err instanceof Error && err.cause instanceof Error ? err.cause.message : '';
			console.error('[CRM createContact]', message, cause || '');
			return fail(500, { message: cause || message || 'Impossible de créer le contact.' });
		}
	},

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
			return fail(400, { message: parsed.error.errors.map((e) => e.message).join(' ') });
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
			await db
				.insert(contactCompanies)
				.values(parsed.data.companyIds.map((companyId) => ({ contactId, companyId })));
		}
		return { success: true };
	}
};
