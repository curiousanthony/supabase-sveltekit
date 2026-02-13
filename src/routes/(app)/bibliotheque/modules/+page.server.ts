import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/db';
import { libraryModules, formations, modules } from '$lib/db/schema';
import { getUserWorkspace } from '$lib/auth';
import { eq, and, inArray } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

const STATUTS_ADDABLE = ['En attente', 'En cours'] as const;

export const load: PageServerLoad = async ({ locals, parent }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) throw redirect(303, '/');

	const parentData = await parent();
	const canManageBibliotheque = parentData?.canManageBibliotheque ?? false;

	const [items, formationsList] = await Promise.all([
		db.query.libraryModules.findMany({
			where: eq(libraryModules.workspaceId, workspaceId),
			orderBy: (m, { asc }) => [asc(m.titre)]
		}),
		db.query.formations.findMany({
			where: and(
				eq(formations.workspaceId, workspaceId),
				inArray(formations.statut, STATUTS_ADDABLE)
			),
			columns: { id: true, name: true, idInWorkspace: true, statut: true },
			with: { modules: { columns: { id: true }, orderBy: (m, { asc }) => [asc(m.orderIndex)] } },
			orderBy: (f, { desc }) => [desc(f.idInWorkspace)]
		})
	]);

	return {
		libraryModules: items,
		formations: formationsList,
		canManageBibliotheque
	};
};

export const actions: Actions = {
	addModuleToFormation: async ({ request, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun workspace' });

		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });

		const formData = await request.formData();
		const libraryModuleId = formData.get('libraryModuleId') as string | null;
		const formationId = formData.get('formationId') as string | null;
		if (!libraryModuleId || !formationId) return fail(400, { message: 'Choisissez une formation' });

		const libraryModule = await db.query.libraryModules.findFirst({
			where: and(
				eq(libraryModules.id, libraryModuleId),
				eq(libraryModules.workspaceId, workspaceId)
			)
		});
		if (!libraryModule) return fail(404, { message: 'Module introuvable' });

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

		await db.insert(modules).values({
			courseId: formationId,
			createdBy: user.id,
			name: libraryModule.titre,
			durationHours: libraryModule.dureeHours,
			orderIndex: maxOrder + 1,
			objectifsPedagogiques: libraryModule.objectifsPedagogiques,
			modaliteEvaluation: libraryModule.modaliteEvaluation
		});

		return { success: true, formationId };
	}
};
