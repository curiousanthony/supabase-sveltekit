import { db } from '$lib/db';
import { companies } from '$lib/db/schema';
import { getUserWorkspace } from '$lib/auth';
import { eq, desc, and, ilike, or } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { companySchema } from '$lib/crm/company-schema';
import {
	legalStatusOptions,
	industryOptions,
	companySizeOptions
} from '$lib/crm/company-form-options';

function normalizeUrl(url: string): string {
	if (!url) return url;
	return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export const load = (async ({ locals, url }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) {
		return {
			companies: [],
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

	let companiesData = await db
		.select()
		.from(companies)
		.where(eq(companies.workspaceId, workspaceId))
		.orderBy(desc(companies.updatedAt));

	if (q) {
		const lower = q.toLowerCase();
		companiesData = companiesData.filter(
			(c) =>
				c.name.toLowerCase().includes(lower) ||
				(c.city?.toLowerCase().includes(lower) ?? false) ||
				(c.siret?.includes(q) ?? false)
		);
	}
	if (industryFilter && industryFilter !== 'all') {
		companiesData = companiesData.filter((c) => c.industry === industryFilter);
	}
	if (sizeFilter && sizeFilter !== 'all') {
		companiesData = companiesData.filter((c) => c.companySize === sizeFilter);
	}

	const editCompanyId = url.searchParams.get('editCompany');
	let editCompany: (typeof companiesData)[number] | null = null;
	if (editCompanyId) {
		const co = await db.query.companies.findFirst({
			where: and(eq(companies.id, editCompanyId), eq(companies.workspaceId, workspaceId))
		});
		if (co) editCompany = co;
	}

	return {
		companies: companiesData,
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
			return fail(400, { message: parsed.error.errors.map((e) => e.message).join(' ') });
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
			!companySizeOptions.includes(
				parsed.data.companySize as (typeof companySizeOptions)[number]
			)
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
			return fail(400, { message: parsed.error.errors.map((e) => e.message).join(' ') });
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
			!companySizeOptions.includes(
				parsed.data.companySize as (typeof companySizeOptions)[number]
			)
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
