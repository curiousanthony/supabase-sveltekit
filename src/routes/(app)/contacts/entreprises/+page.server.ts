import { db } from '$lib/db';
import { companies, contacts, contactCompanies, industries } from '$lib/db/schema';
import { getUserWorkspace, ensureUserInPublicUsers } from '$lib/auth';
import { eq, desc, and, ilike, or, inArray, type SQL, asc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { companySchema, type CompanySchema } from '$lib/crm/company-schema';
import {
	legalStatusOptions,
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
		industryId: (fd.get('industryId') as string)?.trim() || undefined,
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
	// industryId validated in action against DB industries list
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

	const industriesList = await db
		.select({ id: industries.id, name: industries.name })
		.from(industries)
		.orderBy(asc(industries.displayOrder), asc(industries.name));

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
		const validIds = new Set(industriesList.map((i) => i.id));
		if (validIds.has(industryFilter)) {
			conditions.push(eq(companies.industryId, industryFilter));
		}
	}
	if (
		sizeFilter &&
		sizeFilter !== 'all' &&
		companySizeOptions.includes(sizeFilter as (typeof companySizeOptions)[number])
	) {
		conditions.push(
			eq(companies.companySize, sizeFilter as NonNullable<(typeof companies.$inferSelect)['companySize']>)
		);
	}

	const companiesData = await db.query.companies.findMany({
		where: and(...conditions),
		orderBy: desc(companies.updatedAt),
		columns: {
			id: true,
			workspaceId: true,
			name: true,
			siret: true,
			legalStatus: true,
			industryId: true,
			companySize: true,
			websiteUrl: true,
			address: true,
			city: true,
			region: true,
			estimatedBudget: true,
			fundingDevices: true,
			opcoId: true,
			ownerId: true,
			internalNotes: true,
			createdAt: true,
			updatedAt: true
		},
		with: { industry: { columns: { id: true, name: true } } }
	});

	const editCompanyId = url.searchParams.get('editCompany');
	let editCompany: (typeof companiesData)[number] | null = null;
	if (editCompanyId) {
		const co = await db.query.companies.findFirst({
			where: and(eq(companies.id, editCompanyId), eq(companies.workspaceId, workspaceId)),
			with: { industry: { columns: { id: true, name: true } } }
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
		industries: industriesList,
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

		const validIndustryIds = new Set(
			(await db.select({ id: industries.id }).from(industries)).map((r) => r.id)
		);
		if (
			parsed.data.industryId &&
			!validIndustryIds.has(parsed.data.industryId)
		) {
			return fail(400, { message: 'Industrie invalide' });
		}

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
					industryId: parsed.data.industryId ?? null,
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
		const rawNewContactPoste = (fd.get('newContactPoste') as string)?.trim();
		const newContactPoste =
			rawNewContactPoste && posteOptions.includes(rawNewContactPoste as (typeof posteOptions)[number])
				? (rawNewContactPoste as (typeof posteOptions)[number])
				: null;

		if (newContactFirstName || newContactEmail) {
			await ensureUserInPublicUsers(locals);
			const [newContact] = await db
				.insert(contacts)
				.values({
					workspaceId,
					firstName: newContactFirstName || null,
					lastName: newContactLastName || null,
					email: newContactEmail || null,
					poste: newContactPoste,
					createdBy: user.id
				})
				.returning({ id: contacts.id });
			if (newContact?.id) allContactIds.push(newContact.id);
		}

		if (allContactIds.length > 0) {
			const validContacts = await db
				.select({ id: contacts.id })
				.from(contacts)
				.where(
					and(eq(contacts.workspaceId, workspaceId), inArray(contacts.id, allContactIds))
				);
			const validContactIds = validContacts.map((c) => c.id);
			if (validContactIds.length > 0) {
				await db
					.insert(contactCompanies)
					.values(validContactIds.map((contactId) => ({ contactId, companyId })));
			}
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

		if (parsed.data.industryId) {
			const validIndustryIds = new Set(
				(await db.select({ id: industries.id }).from(industries)).map((r) => r.id)
			);
			if (!validIndustryIds.has(parsed.data.industryId)) {
				return fail(400, { message: 'Industrie invalide' });
			}
		}

		try {
			await db
				.update(companies)
				.set({
					name: parsed.data.name,
					siret: parsed.data.siret ?? null,
					legalStatus: parsed.data.legalStatus
						? (parsed.data.legalStatus as (typeof legalStatusOptions)[number])
						: null,
					industryId: parsed.data.industryId ?? null,
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
		} catch (e) {
			console.error('[updateCompany] db.update(companies) failed', e);
			return fail(500, {
				success: false,
				message: 'Could not update company',
				error: e && typeof e === 'object' && 'message' in e ? (e as { message: string }).message : undefined
			});
		}
	}
};
