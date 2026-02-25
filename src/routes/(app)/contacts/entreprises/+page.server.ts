import { db } from '$lib/db';
import { companies, contacts, contactCompanies } from '$lib/db/schema';
import { getUserWorkspace, ensureUserInPublicUsers } from '$lib/auth';
import { eq, desc, and, ilike, or, type SQL } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { companySchema, type CompanySchema } from '$lib/crm/company-schema';
import {
	legalStatusOptions,
	industryOptions,
	companySizeOptions
} from '$lib/crm/company-form-options';
import { posteOptions } from '$lib/crm/contact-schema';

function normalizeUrl(url: string): string {
	if (!url) return url;
	return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

type ParseCompanyResult =
	| { success: true; data: CompanySchema }
	| { success: false; error: { message: string } };

function parseCompanyForm(fd: FormData): ParseCompanyResult {
	const rawWebsite = (fd.get('websiteUrl') as string)?.trim() || undefined;
	const raw = {
		name: (fd.get('name') as string)?.trim() ?? '',
		siret: (fd.get('siret') as string)?.trim() || undefined,
		legalStatus: (fd.get('legalStatus') as string)?.trim() || undefined,
		industry: (fd.get('industry') as string)?.trim() || undefined,
		companySize: (fd.get('companySize') as string)?.trim() || undefined,
		websiteUrl: rawWebsite ? normalizeUrl(rawWebsite) : undefined,
		address: (fd.get('address') as string)?.trim() || undefined,
		city: (fd.get('city') as string)?.trim() || undefined,
		region: (fd.get('region') as string)?.trim() || undefined,
		internalNotes: (fd.get('internalNotes') as string)?.trim() || undefined
	};

	const parsed = companySchema.safeParse(raw);
	if (!parsed.success) {
		return {
			success: false,
			error: { message: parsed.error.errors.map((e) => e.message).join(' ') }
		};
	}
	if (
		parsed.data.legalStatus &&
		!legalStatusOptions.includes(parsed.data.legalStatus as (typeof legalStatusOptions)[number])
	) {
		return { success: false, error: { message: 'Statut juridique invalide' } };
	}
	if (
		parsed.data.industry &&
		!industryOptions.includes(parsed.data.industry as (typeof industryOptions)[number])
	) {
		return { success: false, error: { message: 'Industrie invalide' } };
	}
	if (
		parsed.data.companySize &&
		!companySizeOptions.includes(
			parsed.data.companySize as (typeof companySizeOptions)[number]
		)
	) {
		return { success: false, error: { message: 'Taille invalide' } };
	}
	return { success: true, data: parsed.data };
}

export const load = (async ({ locals, url }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) {
		return {
			companies: [],
			allContacts: [],
			workspaceId: null,
			editCompany: null,
			query: '',
			industry: '',
			size: '',
			openNewModal: false,
			header: {
				pageName: 'Entreprises',
				actions: [{ type: 'button', text: '+ Nouvelle entreprise', href: '/contacts/entreprises?new=true' }]
			}
		};
	}

	const q = url.searchParams.get('q')?.trim() ?? '';
	const industryFilter = url.searchParams.get('industry') ?? '';
	const sizeFilter = url.searchParams.get('size') ?? '';
	const openNewModal = url.searchParams.has('new');

	type CompanySelect = typeof companies.$inferSelect;
	const conditions: SQL[] = [eq(companies.workspaceId, workspaceId)];
	if (q) {
		const qCond = or(
			ilike(companies.name, `%${q}%`),
			ilike(companies.city, `%${q}%`),
			ilike(companies.siret, `%${q}%`)
		);
		if (qCond) conditions.push(qCond);
	}
	if (industryFilter && industryFilter !== 'all') {
		conditions.push(
			eq(companies.industry, industryFilter as NonNullable<CompanySelect['industry']>)
		);
	}
	if (sizeFilter && sizeFilter !== 'all') {
		conditions.push(
			eq(companies.companySize, sizeFilter as NonNullable<CompanySelect['companySize']>)
		);
	}

	const companiesData = await db
		.select()
		.from(companies)
		.where(and(...conditions))
		.orderBy(desc(companies.updatedAt));

	const editCompanyId = url.searchParams.get('editCompany');
	let editCompany: (typeof companiesData)[number] | null = null;
	if (editCompanyId) {
		const co = await db.query.companies.findFirst({
			where: and(eq(companies.id, editCompanyId), eq(companies.workspaceId, workspaceId))
		});
		if (co) editCompany = co;
	}

	const allContacts = await db
		.select({
			id: contacts.id,
			firstName: contacts.firstName,
			lastName: contacts.lastName,
			email: contacts.email
		})
		.from(contacts)
		.where(eq(contacts.workspaceId, workspaceId))
		.orderBy(contacts.firstName, contacts.lastName);

	return {
		companies: companiesData,
		allContacts,
		workspaceId,
		editCompany,
		query: q,
		industry: industryFilter,
		size: sizeFilter,
		openNewModal,
		header: {
			pageName: 'Entreprises',
			actions: [{ type: 'button', text: '+ Nouvelle entreprise', href: '/contacts/entreprises?new=true' }]
		}
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	createCompany: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun espace de travail' });

		const fd = await request.formData();
		const parsed = parseCompanyForm(fd);
		if (!parsed.success) return fail(400, { message: parsed.error.message });

		let insertedCompany: { id: string } | undefined;
		try {
			[insertedCompany] = await db
				.insert(companies)
				.values({
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
				})
				.returning({ id: companies.id });
		} catch (err) {
			console.error('[createCompany] db.insert(companies) failed', err);
			const error =
				err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string'
					? (err as { message: string }).message
					: 'Création de l\'entreprise échouée';
			return fail(500, { success: false, error, message: error });
		}

		const companyId = insertedCompany?.id;
		if (!companyId) return fail(500, { message: 'Création de l\'entreprise échouée' });

		// Collect all contact IDs to link (existing + newly created)
		const allContactIds = fd
			.getAll('contactIds')
			.filter((v): v is string => typeof v === 'string' && v.length > 0);

		// Create a new contact inline if requested
		const newContactFirstName = (fd.get('newContactFirstName') as string)?.trim();
		const newContactLastName = (fd.get('newContactLastName') as string)?.trim();
		const newContactEmail = (fd.get('newContactEmail') as string)?.trim();
		const newContactPoste = (fd.get('newContactPoste') as string)?.trim();

		if (newContactFirstName || newContactEmail) {
			await ensureUserInPublicUsers(locals);
			const [newContact] = await db
				.insert(contacts)
				.values({
					workspaceId,
					firstName: newContactFirstName || null,
					lastName: newContactLastName || null,
					email: newContactEmail || null,
					poste: newContactPoste ? (newContactPoste as (typeof posteOptions)[number]) : null,
					createdBy: user.id
				})
				.returning({ id: contacts.id });
			if (newContact?.id) allContactIds.push(newContact.id);
		}

		if (allContactIds.length > 0) {
			await db
				.insert(contactCompanies)
				.values(allContactIds.map((contactId) => ({ contactId, companyId })));
		}

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

		const parsed = parseCompanyForm(fd);
		if (!parsed.success) return fail(400, { message: parsed.error.message });

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
