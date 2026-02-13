import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/db';
import {
	libraryModules,
	formations,
	modules
} from '$lib/db/schema';
import { getUserWorkspace } from '$lib/auth';
import { eq, and, inArray } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

const STATUTS_ADDABLE = ['En attente', 'En cours'] as const;

export const load: PageServerLoad = async ({ params, locals }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) throw redirect(303, '/');

	const libraryModule = await db.query.libraryModules.findFirst({
		where: and(
			eq(libraryModules.id, params.id),
			eq(libraryModules.workspaceId, workspaceId)
		)
	});

	if (!libraryModule) throw redirect(303, '/bibliotheque/modules');

	const formationsList = await db.query.formations.findMany({
		where: and(
			eq(formations.workspaceId, workspaceId),
			inArray(formations.statut, STATUTS_ADDABLE)
		),
		columns: { id: true, name: true, idInWorkspace: true, statut: true },
		with: { modules: { columns: { id: true }, orderBy: (m, { asc }) => [asc(m.orderIndex)] } },
		orderBy: (f, { desc }) => [desc(f.idInWorkspace)]
	});

	return { libraryModule, formations: formationsList };
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun workspace' });

		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });

		const libraryModule = await db.query.libraryModules.findFirst({
			where: and(
				eq(libraryModules.id, params.id),
				eq(libraryModules.workspaceId, workspaceId)
			)
		});

		if (!libraryModule) return fail(404, { message: 'Module introuvable' });

		const formData = await request.formData();
		const formationId = formData.get('formationId') as string | null;
		if (!formationId) return fail(400, { message: 'Choisissez une formation' });

		const formation = await db.query.formations.findFirst({
			where: and(
				eq(formations.id, formationId),
				eq(formations.workspaceId, workspaceId),
				inArray(formations.statut, STATUTS_ADDABLE)
			),
			with: { modules: { columns: { orderIndex: true } } }
		});

		if (!formation) return fail(400, { message: 'Formation introuvable ou non modifiable' });

		const maxOrder =
			formation.modules.length > 0
				? Math.max(...formation.modules.map((m) => m.orderIndex ?? 0))
				: -1;
		const nextOrder = maxOrder + 1;

		await db.insert(modules).values({
			courseId: formationId,
			createdBy: user.id,
			name: libraryModule.titre,
			durationHours: libraryModule.dureeHours,
			orderIndex: nextOrder,
			objectifsPedagogiques: libraryModule.objectifsPedagogiques,
			modaliteEvaluation: libraryModule.modaliteEvaluation
		});

		throw redirect(303, `/formations/${formationId}?from=library-module`);
	}
};
