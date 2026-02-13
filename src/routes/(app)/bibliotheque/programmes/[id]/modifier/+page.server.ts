import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/db';
import {
	libraryProgrammes,
	libraryProgrammeTargetPublics,
	libraryProgrammePrerequisites,
	libraryProgrammeModules,
	targetPublics,
	prerequisites,
	libraryModules,
	thematiques
} from '$lib/db/schema';
import { getUserWorkspace } from '$lib/auth';
import { canManageBibliotheque } from '$lib/server/permissions';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { z } from 'zod';

const MODALITES = ['Distanciel', 'Présentiel', 'Hybride', 'E-Learning'] as const;

const updateSchema = z.object({
	titre: z.string().min(1, 'Le titre est requis'),
	duree: z.coerce.number().min(1, 'La durée est requise'),
	topicId: z.string().optional(),
	modalite: z.enum(MODALITES),
	objectifs: z.string().optional(),
	targetPublicIds: z.array(z.string()).default([]),
	prerequisiteIds: z.array(z.string()).default([]),
	moduleIds: z.array(z.string()).default([])
});

export const load: PageServerLoad = async ({ params, locals, parent }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) throw redirect(303, '/');

	const parentData = (await parent()) as { role?: string | null };
	if (!canManageBibliotheque(parentData?.role ?? null)) throw redirect(303, '/bibliotheque/programmes');

	const programme = await db.query.libraryProgrammes.findFirst({
		where: and(
			eq(libraryProgrammes.id, params.id),
			eq(libraryProgrammes.workspaceId, workspaceId)
		),
		with: {
			thematique: { columns: { id: true, name: true } },
			targetPublics: { with: { targetPublic: true } },
			prerequisites: { with: { prerequisite: true } },
			libraryProgrammeModules: { with: { libraryModule: true }, orderBy: (pm, { asc }) => [asc(pm.orderIndex)] }
		}
	});

	if (!programme) throw redirect(303, '/bibliotheque/programmes');

	const [topics, targetPublicsList, prerequisitesList, modulesList] = await Promise.all([
		db.query.thematiques.findMany({ orderBy: (t, { asc }) => [asc(t.name)] }),
		db.query.targetPublics.findMany({
			where: eq(targetPublics.workspaceId, workspaceId),
			orderBy: (t, { asc }) => [asc(t.name)]
		}),
		db.query.prerequisites.findMany({
			where: eq(prerequisites.workspaceId, workspaceId),
			orderBy: (p, { asc }) => [asc(p.name)]
		}),
		db.query.libraryModules.findMany({
			where: eq(libraryModules.workspaceId, workspaceId),
			orderBy: (m, { asc }) => [asc(m.titre)]
		})
	]);

	return {
		libraryProgramme: programme,
		topics,
		targetPublics: targetPublicsList,
		prerequisites: prerequisitesList,
		libraryModules: modulesList
	};
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun workspace' });

		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });

		const role = (await import('$lib/server/workspace').then((m) =>
			m.getUserRoleInWorkspace(user.id, workspaceId)
		)) as string | null;
		if (!canManageBibliotheque(role)) return fail(403, { message: 'Droits insuffisants' });

		const programme = await db.query.libraryProgrammes.findFirst({
			where: and(
				eq(libraryProgrammes.id, params.id),
				eq(libraryProgrammes.workspaceId, workspaceId)
			)
		});
		if (!programme) return fail(404, { message: 'Programme introuvable' });

		const formData = await request.formData();
		const titre = formData.get('titre') as string;
		const duree = Number(formData.get('duree'));
		const topicId = (formData.get('topicId') as string) || null;
		const modalite = formData.get('modalite') as string;
		const objectifs = (formData.get('objectifs') as string) || null;
		const targetPublicIds = (formData.get('targetPublicIds') as string)?.split(',').filter(Boolean) ?? [];
		const prerequisiteIds = (formData.get('prerequisiteIds') as string)?.split(',').filter(Boolean) ?? [];
		const moduleIds = (formData.get('moduleIds') as string)?.split(',').filter(Boolean) ?? [];

		const parsed = updateSchema.safeParse({
			titre,
			duree,
			topicId: topicId || undefined,
			modalite,
			objectifs: objectifs || undefined,
			targetPublicIds,
			prerequisiteIds,
			moduleIds
		});

		if (!parsed.success) {
			const msg = Object.values(parsed.error.flatten().fieldErrors).flat().join(' ');
			return fail(400, { message: msg || 'Données invalides' });
		}

		await db
			.update(libraryProgrammes)
			.set({
				titre: parsed.data.titre,
				duree: parsed.data.duree,
				topicId: parsed.data.topicId || null,
				modalite: parsed.data.modalite,
				objectifs: parsed.data.objectifs || null
			})
			.where(and(eq(libraryProgrammes.id, params.id), eq(libraryProgrammes.workspaceId, workspaceId)));

		await db.delete(libraryProgrammeTargetPublics).where(eq(libraryProgrammeTargetPublics.libraryProgrammeId, params.id));
		await db.delete(libraryProgrammePrerequisites).where(eq(libraryProgrammePrerequisites.libraryProgrammeId, params.id));
		await db.delete(libraryProgrammeModules).where(eq(libraryProgrammeModules.libraryProgrammeId, params.id));

		for (const id of parsed.data.targetPublicIds) {
			await db.insert(libraryProgrammeTargetPublics).values({
				libraryProgrammeId: params.id,
				targetPublicId: id
			});
		}
		for (const id of parsed.data.prerequisiteIds) {
			await db.insert(libraryProgrammePrerequisites).values({
				libraryProgrammeId: params.id,
				prerequisiteId: id
			});
		}
		await Promise.all(
			parsed.data.moduleIds.map((libraryModuleId, index) =>
				db.insert(libraryProgrammeModules).values({
					libraryProgrammeId: params.id,
					libraryModuleId,
					orderIndex: index
				})
			)
		);

		throw redirect(303, '/bibliotheque/programmes');
	}
};
