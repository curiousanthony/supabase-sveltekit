import { db } from '$lib/db';
import { deals, contacts, companies, contactCompanies, biblioProgrammes, workspacesUsers } from '$lib/db/schema';
import { getUserWorkspace, ensureUserInPublicUsers } from '$lib/auth';
import { redirect, fail } from '@sveltejs/kit';
import { eq, asc, desc } from 'drizzle-orm';
import { dealSchema, DEAL_STAGES } from '$lib/crm/deal-schema';
import { contactSchema, posteOptions } from '$lib/crm/contact-schema';
import type { PageServerLoad, Actions } from './$types';

export const load = (async ({ locals, url }) => {
	const { user } = await locals.safeGetSession();
	if (!user) throw redirect(303, '/auth/login');

	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) {
		return {
			contacts: [],
			companies: [],
			programmes: [],
			members: [],
			workspaceId: null,
			preselectedProgrammeId: null,
			currentUserId: user.id,
			header: {
				pageName: 'Nouveau deal',
				backButton: true,
				backButtonLabel: 'Deals',
				backButtonHref: '/deals'
			}
		};
	}

	const [contactsList, companiesList, programmesList, membersList] = await Promise.all([
		db.query.contacts.findMany({
			where: eq(contacts.workspaceId, workspaceId),
			columns: { id: true, firstName: true, lastName: true, email: true, phone: true },
			with: { contactCompanies: { with: { company: { columns: { id: true, name: true } } } } },
			orderBy: [asc(contacts.lastName)]
		}),
		db.query.companies.findMany({
			where: eq(companies.workspaceId, workspaceId),
			columns: { id: true, name: true },
			orderBy: [asc(companies.name)]
		}),
		db.query.biblioProgrammes.findMany({
			where: eq(biblioProgrammes.workspaceId, workspaceId),
			columns: { id: true, titre: true, modalite: true, prixPublic: true, dureeHeures: true },
			orderBy: [asc(biblioProgrammes.titre)]
		}),
		db.query.workspacesUsers.findMany({
			where: eq(workspacesUsers.workspaceId, workspaceId),
			with: { user: { columns: { id: true, firstName: true, lastName: true, email: true } } }
		})
	]);

	const preselectedProgrammeId = url.searchParams.get('programmeId');

	return {
		contacts: contactsList,
		companies: companiesList,
		programmes: programmesList,
		members: membersList.map((m) => m.user).filter(Boolean),
		workspaceId,
		preselectedProgrammeId,
		currentUserId: user.id,
		header: {
			pageName: 'Nouveau deal',
			backButton: true,
			backButtonLabel: 'Deals',
			backButtonHref: '/deals'
		}
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	createDeal: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });

		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun workspace associé' });

		const fd = await request.formData();
		const raw = {
			name: fd.get('name') as string,
			stage: (fd.get('stage') as string) || 'Suspect',
			contactId: (fd.get('contactId') as string) || null,
			companyId: (fd.get('companyId') as string) || null,
			programmeId: (fd.get('programmeId') as string) || null,
			dealAmount: fd.get('dealAmount') ? Number(fd.get('dealAmount')) : null,
			fundedAmount: fd.get('fundedAmount') ? Number(fd.get('fundedAmount')) : null,
			isFunded: fd.get('isFunded') === 'on',
			fundingType: (fd.get('fundingType') as string) || null,
			fundingStatus: (fd.get('fundingStatus') as string) || null,
			fundingReference: (fd.get('fundingReference') as string) || null,
			dealFormat: (fd.get('dealFormat') as string) || null,
			intraInter: (fd.get('intraInter') as string) || null,
			modalities: fd.getAll('modalities').map(String).filter(Boolean),
			desiredStartDate: (fd.get('desiredStartDate') as string) || null,
			desiredEndDate: (fd.get('desiredEndDate') as string) || null,
			expectedCloseDate: (fd.get('expectedCloseDate') as string) || null,
			durationHours: fd.get('durationHours') ? Number(fd.get('durationHours')) : null,
			nbApprenants: fd.get('nbApprenants') ? Number(fd.get('nbApprenants')) : null,
			probability: fd.get('probability') ? Number(fd.get('probability')) : null,
			source: (fd.get('source') as string) || null,
			commercialId: (fd.get('commercialId') as string) || null,
			description: (fd.get('description') as string) || null
		};

		const result = dealSchema.safeParse(raw);
		if (!result.success) {
			const firstError = result.error.errors[0];
			return fail(400, { message: firstError?.message ?? 'Données invalides' });
		}

		const v = result.data;

		const maxIdResult = await db
			.select({ n: deals.idInWorkspace })
			.from(deals)
			.where(eq(deals.workspaceId, workspaceId))
			.orderBy(desc(deals.idInWorkspace))
			.limit(1);
		const nextIdInWorkspace = (maxIdResult[0]?.n ?? 0) + 1;

		const [{ id: insertedId }] = await db
			.insert(deals)
			.values({
				workspaceId,
				name: v.name,
				stage: v.stage,
				contactId: v.contactId,
				companyId: v.companyId,
				programmeId: v.programmeId,
				dealAmount: v.dealAmount != null ? String(v.dealAmount) : null,
				fundedAmount: v.fundedAmount != null ? String(v.fundedAmount) : null,
				isFunded: v.isFunded,
				fundingType: v.fundingType as any,
				fundingStatus: v.fundingStatus as any,
				fundingReference: v.fundingReference,
				dealFormat: v.dealFormat as any,
				intraInter: v.intraInter as any,
				modalities: v.modalities.length > 0 ? v.modalities : null,
				desiredStartDate: v.desiredStartDate,
				desiredEndDate: v.desiredEndDate,
				expectedCloseDate: v.expectedCloseDate,
				durationHours: v.durationHours,
				nbApprenants: v.nbApprenants,
				probability: v.probability,
				source: v.source as any,
				commercialId: v.commercialId,
				description: v.description,
				ownerId: user.id,
				createdBy: user.id,
				value: v.dealAmount != null ? String(v.dealAmount) : null,
				idInWorkspace: nextIdInWorkspace
			})
			.returning({ id: deals.id });

		throw redirect(303, `/deals/${insertedId}`);
	},

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

			const allCompanyIds = [...parsed.data.companyIds];
			const newCompanyName = (fd.get('newCompanyName') as string)?.trim();
			if (newCompanyName) {
				const [newCo] = await db
					.insert(companies)
					.values({ workspaceId, name: newCompanyName })
					.returning({ id: companies.id });
				if (newCo?.id) allCompanyIds.push(newCo.id);
			}

			if (allCompanyIds.length > 0) {
				await db
					.insert(contactCompanies)
					.values(allCompanyIds.map((companyId) => ({ contactId, companyId })));
			}
			return { success: true, contactId };
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			console.error('[CRM createContact from deal creer]', message);
			return fail(500, { message: 'Impossible de créer le contact.' });
		}
	}
};
