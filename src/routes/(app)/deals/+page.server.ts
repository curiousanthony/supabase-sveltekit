import { db } from '$lib/db';
import { deals, workspacesUsers } from '$lib/db/schema';
import { getUserWorkspace } from '$lib/auth';
import { eq, desc, and, sql } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { DEAL_STAGES } from '$lib/crm/deal-schema';
import { PERMISSIONS } from '$lib/server/permissions';
import type { PageServerLoad, Actions } from './$types';

export const load = (async ({ locals }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) {
		return {
			deals: [],
			workspaceId: null,
			stages: DEAL_STAGES,
			members: [],
			header: { pageName: 'Deals', actions: [] }
		};
	}

	const [dealsData, membersList] = await Promise.all([
		db.query.deals.findMany({
			where: eq(deals.workspaceId, workspaceId),
			orderBy: [desc(deals.updatedAt)],
			with: {
				contact: {
					columns: { id: true, firstName: true, lastName: true, email: true },
					with: {
						contactCompanies: {
							with: { company: { columns: { id: true, name: true } } }
						}
					}
				},
				company: { columns: { id: true, name: true } },
				programme: { columns: { id: true, titre: true } },
				owner: { columns: { id: true, firstName: true, lastName: true, email: true } },
				commercial: { columns: { id: true, firstName: true, lastName: true, email: true } },
				formation: { columns: { id: true, name: true, statut: true } }
			}
		}),
		db.query.workspacesUsers.findMany({
			where: eq(workspacesUsers.workspaceId, workspaceId),
			columns: { role: true },
			with: { user: { columns: { id: true, firstName: true, lastName: true, email: true } } }
		})
	]);

	const dealsRoles = PERMISSIONS.deals;
	const members = membersList
		.filter((m) => m.user && dealsRoles.includes(m.role))
		.map((m) => m.user!);

	const header = {
		pageName: 'Deals',
		actions: [
			{
				type: 'button' as const,
				icon: 'plus',
				text: 'Nouveau deal',
				href: '/deals/creer',
				variant: 'default' as const
			}
		]
	};

	return { deals: dealsData, workspaceId, stages: DEAL_STAGES, members, header };
}) satisfies PageServerLoad;

export const actions: Actions = {
	updateStage: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });

		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun workspace' });

		const fd = await request.formData();
		const dealId = fd.get('dealId') as string;
		const stage = fd.get('stage') as string;
		const lossReason = fd.get('lossReason') as string | null;
		const lossReasonDetail = fd.get('lossReasonDetail') as string | null;

		if (!dealId || !stage) return fail(400, { message: 'Paramètres manquants' });
		if (!DEAL_STAGES.includes(stage as (typeof DEAL_STAGES)[number])) {
			return fail(400, { message: 'Étape invalide' });
		}

		const isClosed = stage === 'Gagné' || stage === 'Perdu';
		const updateData: Record<string, unknown> = {
			stage: stage as (typeof DEAL_STAGES)[number],
			updatedAt: new Date().toISOString(),
			...(isClosed ? { closedAt: new Date().toISOString() } : { closedAt: null })
		};

		if (stage === 'Perdu') {
			updateData.lossReason = lossReason || null;
			updateData.lossReasonDetail = lossReasonDetail || null;
		} else {
			updateData.lossReason = null;
			updateData.lossReasonDetail = null;
		}

		const [updated] = await db
			.update(deals)
			.set(updateData)
			.where(and(eq(deals.id, dealId), eq(deals.workspaceId, workspaceId)))
			.returning({ id: deals.id });

		if (!updated) return fail(404, { message: 'Deal introuvable' });
		return { success: true, dealId, stage };
	},

	assignCommercial: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });

		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun workspace' });

		const fd = await request.formData();
		const dealId = fd.get('dealId') as string;
		const commercialId = fd.get('commercialId') as string;

		if (!dealId || !commercialId) return fail(400, { message: 'Paramètres manquants' });

		const commercialInWorkspace = await db.query.workspacesUsers.findFirst({
			where: and(
				eq(workspacesUsers.userId, commercialId),
				eq(workspacesUsers.workspaceId, workspaceId)
			),
			columns: { userId: true }
		});
		if (!commercialInWorkspace) {
			return fail(403, { message: 'Commercial non membre de cet espace de travail' });
		}

		const [updated] = await db
			.update(deals)
			.set({ commercialId, updatedAt: new Date().toISOString() })
			.where(and(eq(deals.id, dealId), eq(deals.workspaceId, workspaceId)))
			.returning({ id: deals.id });

		if (!updated) return fail(404, { message: 'Deal introuvable' });
		return { success: true, dealId, commercialId };
	},

	duplicateDeal: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });

		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun workspace' });

		const fd = await request.formData();
		const dealId = fd.get('dealId') as string;
		if (!dealId) return fail(400, { message: 'Paramètre manquant' });

		const source = await db.query.deals.findFirst({
			where: and(eq(deals.id, dealId), eq(deals.workspaceId, workspaceId))
		});
		if (!source) return fail(404, { message: 'Deal introuvable' });

		const nullIfEmpty = <T>(v: T): T | null => (v === '' || v == null ? null : v);

		const result = await db.transaction(async (tx) => {
			// Lock workspace-scoped to prevent concurrent idInWorkspace allocation
			await tx.execute(
				sql`SELECT pg_advisory_xact_lock(726, hashtext(${workspaceId}))`
			);

			const maxIdResult = await tx
				.select({ n: sql<number>`COALESCE(MAX(${deals.idInWorkspace}), 0)` })
				.from(deals)
				.where(eq(deals.workspaceId, workspaceId));
			const nextIdInWorkspace = (maxIdResult[0]?.n ?? 0) + 1;

			return tx
				.insert(deals)
				.values({
					workspaceId,
					name: `${source.name} (copie)`,
					stage: 'Suspect',
					contactId: nullIfEmpty(source.contactId),
					companyId: nullIfEmpty(source.companyId),
					programmeId: nullIfEmpty(source.programmeId),
					dealAmount: nullIfEmpty(source.dealAmount),
					fundedAmount: nullIfEmpty(source.fundedAmount),
					isFunded: source.isFunded ?? false,
					fundingType: nullIfEmpty(source.fundingType),
					fundingStatus: nullIfEmpty(source.fundingStatus),
					fundingReference: nullIfEmpty(source.fundingReference),
					dealFormat: nullIfEmpty(source.dealFormat),
					intraInter: nullIfEmpty(source.intraInter),
					modalities: source.modalities ?? [],
					desiredStartDate: nullIfEmpty(source.desiredStartDate),
					desiredEndDate: nullIfEmpty(source.desiredEndDate),
					expectedCloseDate: nullIfEmpty(source.expectedCloseDate),
					durationHours: nullIfEmpty(source.durationHours),
					nbApprenants: nullIfEmpty(source.nbApprenants),
					probability: nullIfEmpty(source.probability),
					source: nullIfEmpty(source.source),
					commercialId: nullIfEmpty(source.commercialId),
					description: nullIfEmpty(source.description),
					value: nullIfEmpty(source.value),
					ownerId: user.id,
					createdBy: user.id,
					idInWorkspace: nextIdInWorkspace
				})
				.returning({ id: deals.id });
		});

		const inserted = result[0];
		if (!inserted) return fail(500, { message: 'Erreur lors de la duplication' });
		throw redirect(303, `/deals/${inserted.id}`);
	},

	deleteDeal: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });

		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun workspace' });

		const fd = await request.formData();
		const dealId = fd.get('dealId') as string;
		if (!dealId) return fail(400, { message: 'Paramètre manquant' });

		const [deleted] = await db
			.delete(deals)
			.where(and(eq(deals.id, dealId), eq(deals.workspaceId, workspaceId)))
			.returning({ id: deals.id });

		if (!deleted) return fail(404, { message: 'Deal introuvable' });
		return { success: true, dealId };
	}
};
