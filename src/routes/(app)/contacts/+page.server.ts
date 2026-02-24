import { db } from '$lib/db';
import { contacts, companies, contactCompanies } from '$lib/db/schema';
import { getUserWorkspace, ensureUserInPublicUsers } from '$lib/auth';
import { eq, desc, and, inArray, sql } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { contactSchema, posteOptions } from '../crm/contacts/schema';
import { companySchema } from '../crm/entreprises/schema';
import {
	legalStatusOptions,
	industryOptions,
	companySizeOptions
} from '$lib/crm/company-form-options';

export const load = (async ({ locals, url }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) {
		return {
			contacts: [],
			companies: [],
			formateurs: [],
			workspaceId: null,
			query: '',
			poste: '',
			editContact: null,
			editCompany: null,
			header: { pageName: 'CRM', actions: [] }
		};
	}

	try {
		return await loadCrm(workspaceId, url);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error('[CRM /contacts load]', message);
		// Return empty data so the page renders; show error in UI via loadError or data flag
		return {
			contacts: [],
			companies: [],
			formateurs: [],
			workspaceId,
			query: url.searchParams.get('q') ?? '',
			poste: url.searchParams.get('poste') ?? '',
			editContact: null,
			editCompany: null,
			header: { pageName: 'CRM', actions: [] },
			loadError: message
		};
	}
}) satisfies PageServerLoad;

async function loadCrm(
	workspaceId: string,
	url: URL
): Promise<Awaited<ReturnType<typeof load>>> {
	// Raw SQL for contacts to avoid Drizzle prepared-statement cache and schema mismatches (e.g. missing phone column).
	type ContactRow = {
		id: string;
		workspace_id: string;
		first_name: string | null;
		last_name: string | null;
		email: string | null;
		poste: string | null;
		linkedin_url: string | null;
		owner_id: string | null;
		internal_notes: string | null;
		created_at: string;
		updated_at: string;
		created_by: string;
	};
	const contactsResult = await db.execute<ContactRow>(sql`
		SELECT id, workspace_id, first_name, last_name, email, poste, linkedin_url, owner_id, internal_notes, created_at, updated_at, created_by
		FROM contacts
		WHERE workspace_id = ${workspaceId}
		ORDER BY updated_at DESC
	`);
	const contactsRows = Array.isArray(contactsResult) ? contactsResult : (contactsResult.rows ?? []);
	const contactIds = contactsRows.map((r) => r.id);

	const editId = url.searchParams.get('edit');
	let editContact: Awaited<ReturnType<typeof load>>['editContact'] = null;
	if (editId) {
		const c = contactsRows.find((r) => r.id === editId);
		if (c) {
			const links = await db
				.select({ companyId: contactCompanies.companyId })
				.from(contactCompanies)
				.where(eq(contactCompanies.contactId, c.id));
			editContact = {
				id: c.id,
				workspaceId: c.workspace_id,
				firstName: c.first_name,
				lastName: c.last_name,
				email: c.email,
				phone: null,
				poste: c.poste as 'Responsable RH' | 'CEO' | 'Autre' | null,
				linkedinUrl: c.linkedin_url,
				ownerId: c.owner_id,
				internalNotes: c.internal_notes,
				createdAt: c.created_at,
				updatedAt: c.updated_at,
				createdBy: c.created_by,
				contactCompanies: links
			};
		}
	}

	const editCompanyId = url.searchParams.get('editCompany');
	let editCompany: Awaited<ReturnType<typeof load>>['editCompany'] = null;
	if (editCompanyId) {
		const co = await db.query.companies.findFirst({
			where: and(eq(companies.id, editCompanyId), eq(companies.workspaceId, workspaceId))
		});
		if (co) editCompany = co;
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
		workspaceId: c.workspace_id,
		firstName: c.first_name,
		lastName: c.last_name,
		email: c.email,
		phone: null as string | null,
		poste: c.poste as 'Responsable RH' | 'CEO' | 'Autre' | null,
		linkedinUrl: c.linkedin_url,
		ownerId: c.owner_id,
		internalNotes: c.internal_notes,
		createdAt: c.created_at,
		updatedAt: c.updated_at,
		createdBy: c.created_by,
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

	// Entreprises tab
	const companiesData = await db.query.companies.findMany({
		where: eq(companies.workspaceId, workspaceId),
		orderBy: [desc(companies.updatedAt)],
		columns: { id: true, name: true, industry: true, companySize: true, city: true }
	});

	// Formateurs tab
	const formateursData = await db.query.formateurs.findMany({
		with: {
			user: true,
			formateursThematiques: {
				with: { thematique: { columns: { name: true } } }
			}
		}
	});

	const header = {
		pageName: 'CRM',
		actions: []
	};

	return {
		contacts: contactsData,
		companies: companiesData,
		formateurs: formateursData,
		workspaceId,
		query: url.searchParams.get('q') ?? '',
		poste: posteParam ?? '',
		editContact,
		editCompany,
		header,
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
			const msg = parsed.error.errors.map((e) => e.message).join(' ');
			return fail(400, { message: msg });
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
			if (!contactId) {
				return fail(500, { message: 'Création du contact échouée' });
			}

			if (parsed.data.companyIds.length > 0) {
				await db.insert(contactCompanies).values(
					parsed.data.companyIds.map((companyId) => ({ contactId, companyId }))
				);
			}
			return { success: true };
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			const cause = err instanceof Error && err.cause instanceof Error ? err.cause.message : '';
			console.error('[CRM createContact]', message, cause || '');
			return fail(500, {
				message: cause || message || 'Impossible de créer le contact. Réessayez.'
			});
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
	},

	createCompany: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun espace de travail' });

		const fd = await request.formData();
		const raw = {
			name: (fd.get('name') as string)?.trim() ?? '',
			siret: (fd.get('siret') as string)?.trim() || undefined,
			legalStatus: (fd.get('legalStatus') as string)?.trim() || undefined,
			industry: (fd.get('industry') as string)?.trim() || undefined,
			companySize: (fd.get('companySize') as string)?.trim() || undefined,
			websiteUrl: (fd.get('websiteUrl') as string)?.trim() || undefined,
			address: (fd.get('address') as string)?.trim() || undefined,
			city: (fd.get('city') as string)?.trim() || undefined,
			region: (fd.get('region') as string)?.trim() || undefined,
			internalNotes: (fd.get('internalNotes') as string)?.trim() || undefined
		};

		const parsed = companySchema.safeParse(raw);
		if (!parsed.success) {
			const msg = parsed.error.errors.map((e) => e.message).join(' ');
			return fail(400, { message: msg });
		}
		if (
			parsed.data.legalStatus &&
			!legalStatusOptions.includes(parsed.data.legalStatus as (typeof legalStatusOptions)[number])
		) {
			return fail(400, { message: 'Statut juridique invalide' });
		}
		if (
			parsed.data.industry &&
			!industryOptions.includes(parsed.data.industry as (typeof industryOptions)[number])
		) {
			return fail(400, { message: 'Industrie invalide' });
		}
		if (
			parsed.data.companySize &&
			!companySizeOptions.includes(parsed.data.companySize as (typeof companySizeOptions)[number])
		) {
			return fail(400, { message: 'Taille invalide' });
		}

		await db.insert(companies).values({
			workspaceId,
			name: parsed.data.name,
			siret: parsed.data.siret ?? null,
			legalStatus: parsed.data.legalStatus
				? (parsed.data.legalStatus as (typeof legalStatusOptions)[number])
				: null,
			industry: parsed.data.industry
				? (parsed.data.industry as (typeof industryOptions)[number])
				: null,
			companySize: parsed.data.companySize
				? (parsed.data.companySize as (typeof companySizeOptions)[number])
				: null,
			websiteUrl: parsed.data.websiteUrl ?? null,
			address: parsed.data.address ?? null,
			city: parsed.data.city ?? null,
			region: parsed.data.region ?? null,
			internalNotes: parsed.data.internalNotes ?? null
		});
		return { success: true };
	},

	updateCompany: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun espace de travail' });

		const fd = await request.formData();
		const companyId = (fd.get('companyId') as string)?.trim();
		if (!companyId) return fail(400, { message: 'Entreprise manquante' });

		const raw = {
			name: (fd.get('name') as string)?.trim() ?? '',
			siret: (fd.get('siret') as string)?.trim() || undefined,
			legalStatus: (fd.get('legalStatus') as string)?.trim() || undefined,
			industry: (fd.get('industry') as string)?.trim() || undefined,
			companySize: (fd.get('companySize') as string)?.trim() || undefined,
			websiteUrl: (fd.get('websiteUrl') as string)?.trim() || undefined,
			address: (fd.get('address') as string)?.trim() || undefined,
			city: (fd.get('city') as string)?.trim() || undefined,
			region: (fd.get('region') as string)?.trim() || undefined,
			internalNotes: (fd.get('internalNotes') as string)?.trim() || undefined
		};

		const parsed = companySchema.safeParse(raw);
		if (!parsed.success) {
			const msg = parsed.error.errors.map((e) => e.message).join(' ');
			return fail(400, { message: msg });
		}
		if (
			parsed.data.legalStatus &&
			!legalStatusOptions.includes(parsed.data.legalStatus as (typeof legalStatusOptions)[number])
		) {
			return fail(400, { message: 'Statut juridique invalide' });
		}
		if (
			parsed.data.industry &&
			!industryOptions.includes(parsed.data.industry as (typeof industryOptions)[number])
		) {
			return fail(400, { message: 'Industrie invalide' });
		}
		if (
			parsed.data.companySize &&
			!companySizeOptions.includes(parsed.data.companySize as (typeof companySizeOptions)[number])
		) {
			return fail(400, { message: 'Taille invalide' });
		}

		await db
			.update(companies)
			.set({
				name: parsed.data.name,
				siret: parsed.data.siret ?? null,
				legalStatus: parsed.data.legalStatus
					? (parsed.data.legalStatus as (typeof legalStatusOptions)[number])
					: null,
				industry: parsed.data.industry
					? (parsed.data.industry as (typeof industryOptions)[number])
					: null,
				companySize: parsed.data.companySize
					? (parsed.data.companySize as (typeof companySizeOptions)[number])
					: null,
				websiteUrl: parsed.data.websiteUrl ?? null,
				address: parsed.data.address ?? null,
				city: parsed.data.city ?? null,
				region: parsed.data.region ?? null,
				internalNotes: parsed.data.internalNotes ?? null,
				updatedAt: new Date().toISOString()
			})
			.where(and(eq(companies.id, companyId), eq(companies.workspaceId, workspaceId)));
		return { success: true };
	}
};
