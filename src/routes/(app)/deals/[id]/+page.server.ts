import { db } from '$lib/db';
import { deals, formations, libraryProgrammes, modules } from '$lib/db/schema';
import { formationTargetPublics, formationPrerequisites } from '$lib/db/schema';
import { getUserWorkspace } from '$lib/auth';
import { eq, desc, and } from 'drizzle-orm';
import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load = (async ({ params, locals }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) throw redirect(303, '/deals');

	const [deal, libraryProgrammesList] = await Promise.all([
		db.query.deals.findFirst({
			where: (d, { and, eq }) => and(eq(d.id, params.id), eq(d.workspaceId, workspaceId)),
			with: {
				client: true,
				owner: { columns: { id: true, firstName: true, lastName: true, email: true } },
				formation: { columns: { id: true, name: true, statut: true } },
				libraryProgramme: { columns: { id: true, titre: true } }
			}
		}),
		db.query.libraryProgrammes.findMany({
			where: eq(libraryProgrammes.workspaceId, workspaceId),
			columns: { id: true, titre: true },
			orderBy: (p, { asc }) => [asc(p.titre)]
		})
	]);

	if (!deal) throw redirect(303, '/deals');

	const header = {
		pageName: deal.name,
		backButton: true,
		backButtonLabel: 'Deals',
		backButtonHref: '/deals',
		actions: [] as { type: 'button'; icon: string; text: string; href?: string; variant: 'default' | 'outline' }[]
	};

	if (deal.formation) {
		header.actions.push({
			type: 'button',
			icon: 'search',
			text: 'Voir la formation',
			href: `/formations/${deal.formation.id}`,
			variant: 'default'
		});
	}

	return { deal, header, libraryProgrammes: libraryProgrammesList };
}) satisfies PageServerLoad;

export const actions: Actions = {
	updateStage: async ({ request, params, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });

		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun workspace' });

		const fd = await request.formData();
		const stage = fd.get('stage') as string | null;
		type Stage = 'Lead' | 'Qualification' | 'Proposition' | 'Négociation' | 'Gagné' | 'Perdu';
		const valid: Stage[] = ['Lead', 'Qualification', 'Proposition', 'Négociation', 'Gagné', 'Perdu'];
		if (!stage || !valid.includes(stage as Stage)) return fail(400, { message: 'Étape invalide' });

		const [updated] = await db
			.update(deals)
			.set({
				stage: stage as Stage,
				updatedAt: new Date().toISOString(),
				...(stage === 'Gagné' || stage === 'Perdu' ? { closedAt: new Date().toISOString() } : {})
			})
			.where(and(eq(deals.id, params.id), eq(deals.workspaceId, workspaceId)))
			.returning({ id: deals.id });

		if (!updated) return fail(404, { message: 'Deal introuvable' });
		return { success: true, stage };
	},

	closeAndCreateFormation: async ({ params, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });

		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun workspace' });

		const deal = await db.query.deals.findFirst({
			where: (d, { and, eq }) => and(eq(d.id, params.id), eq(d.workspaceId, workspaceId)),
			with: { client: true }
		});
		if (!deal) return fail(404, { message: 'Deal introuvable' });
		if (deal.formationId) return fail(400, { message: 'Une formation est déjà liée à ce deal' });

		const maxIdResult = await db
			.select({ n: formations.idInWorkspace })
			.from(formations)
			.where(eq(formations.workspaceId, workspaceId))
			.orderBy(desc(formations.idInWorkspace))
			.limit(1);
		const nextIdInWorkspace = (maxIdResult[0]?.n ?? 0) + 1;

		if (deal.libraryProgrammeId) {
			const programme = await db.query.libraryProgrammes.findFirst({
				where: (p, { and, eq }) =>
					and(eq(p.id, deal.libraryProgrammeId!), eq(p.workspaceId, workspaceId)),
				with: {
					targetPublics: { columns: { targetPublicId: true } },
					prerequisites: { columns: { prerequisiteId: true } },
					libraryProgrammeModules: {
						with: { libraryModule: true },
						orderBy: (pm, { asc }) => [asc(pm.orderIndex)]
					}
				}
			});
			if (programme) {
				const [formation] = await db
					.insert(formations)
					.values({
						workspaceId,
						createdBy: user.id,
						name: deal.name,
						description: programme.objectifs ?? deal.description ?? undefined,
						clientId: deal.clientId,
						statut: 'En attente',
						modalite: programme.modalite,
						duree: programme.duree,
						topicId: programme.topicId,
						idInWorkspace: nextIdInWorkspace
					})
					.returning({ id: formations.id });
				if (!formation) return fail(500, { message: 'Erreur création formation' });

				for (const t of programme.targetPublics ?? []) {
					await db.insert(formationTargetPublics).values({
						formationId: formation.id,
						targetPublicId: t.targetPublicId
					});
				}
				for (const p of programme.prerequisites ?? []) {
					await db.insert(formationPrerequisites).values({
						formationId: formation.id,
						prerequisiteId: p.prerequisiteId
					});
				}
				let orderIndex = 0;
				for (const pm of programme.libraryProgrammeModules ?? []) {
					const lm = pm.libraryModule;
					if (lm)
						await db.insert(modules).values({
							courseId: formation.id,
							createdBy: user.id,
							name: lm.titre,
							durationHours: lm.dureeHours,
							orderIndex,
							objectifsPedagogiques: lm.objectifsPedagogiques,
							modaliteEvaluation: lm.modaliteEvaluation
						});
					orderIndex += 1;
				}

				await db
					.update(deals)
					.set({
						stage: 'Gagné',
						closedAt: new Date().toISOString(),
						formationId: formation.id,
						updatedAt: new Date().toISOString()
					})
					.where(and(eq(deals.id, params.id), eq(deals.workspaceId, workspaceId)));
				throw redirect(303, `/formations/${formation.id}`);
			}
		}

		// No programme or programme not found: create minimal formation
		const [formation] = await db
			.insert(formations)
			.values({
				workspaceId,
				createdBy: user.id,
				name: deal.name,
				description: deal.description ?? undefined,
				clientId: deal.clientId,
				statut: 'En attente',
				modalite: 'Présentiel',
				duree: 14,
				idInWorkspace: nextIdInWorkspace
			})
			.returning({ id: formations.id });

		if (!formation) return fail(500, { message: 'Erreur création formation' });

		await db
			.update(deals)
			.set({
				stage: 'Gagné',
				closedAt: new Date().toISOString(),
				formationId: formation.id,
				updatedAt: new Date().toISOString()
			})
			.where(and(eq(deals.id, params.id), eq(deals.workspaceId, workspaceId)));

		throw redirect(303, `/formations/${formation.id}`);
	},

	setProgramme: async ({ request, params, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun workspace' });

		const programmeId = (await request.formData()).get('programmeId') as string | null;
		await db
			.update(deals)
			.set({
				libraryProgrammeId: programmeId && programmeId.length === 36 ? programmeId : null,
				updatedAt: new Date().toISOString()
			})
			.where(and(eq(deals.id, params.id), eq(deals.workspaceId, workspaceId)));
		return { success: true };
	}
};
