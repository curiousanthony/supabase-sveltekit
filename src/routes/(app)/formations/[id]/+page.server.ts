import { fail } from '@sveltejs/kit';
import { db } from '$lib/db';
import { libraryModules, modules, formations } from '$lib/db/schema';
import { getUserWorkspace } from '$lib/auth';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, parent, locals }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) return { libraryModules: [] };

	const formation = (await parent()).formation;
	if (!formation || formation.workspaceId !== workspaceId) return { libraryModules: [] };

	const list = await db.query.libraryModules.findMany({
		where: eq(libraryModules.workspaceId, workspaceId),
		columns: { id: true, titre: true, dureeHours: true, modaliteEvaluation: true },
		orderBy: (m, { asc }) => [asc(m.titre)]
	});
	return { libraryModules: list };
};

export const actions: Actions = {
	addModuleFromLibrary: async ({ request, params, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun workspace' });

		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });

		const formData = await request.formData();
		const libraryModuleId = formData.get('libraryModuleId') as string | null;
		if (!libraryModuleId) return fail(400, { message: 'Choisissez un module' });

		const formation = await db.query.formations.findFirst({
			where: and(eq(formations.id, params.id), eq(formations.workspaceId, workspaceId)),
			with: { modules: { columns: { orderIndex: true } } }
		});
		if (!formation) return fail(404, { message: 'Formation introuvable' });

		const libraryModule = await db.query.libraryModules.findFirst({
			where: and(
				eq(libraryModules.id, libraryModuleId),
				eq(libraryModules.workspaceId, workspaceId)
			)
		});
		if (!libraryModule) return fail(404, { message: 'Module introuvable' });

		const maxOrder =
			formation.modules.length > 0
				? Math.max(...formation.modules.map((m) => m.orderIndex ?? 0))
				: -1;

		await db.insert(modules).values({
			courseId: params.id,
			createdBy: user.id,
			name: libraryModule.titre,
			durationHours: libraryModule.dureeHours,
			orderIndex: maxOrder + 1,
			objectifsPedagogiques: libraryModule.objectifsPedagogiques,
			modaliteEvaluation: libraryModule.modaliteEvaluation
		});

		return { success: true };
	}
};
