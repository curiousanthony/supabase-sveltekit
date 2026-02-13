import { redirect } from '@sveltejs/kit';
import { db } from '$lib/db';
import { libraryProgrammes } from '$lib/db/schema';
import { getUserWorkspace } from '$lib/auth';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) throw redirect(303, '/');

	const parentData = await parent();
	const canManageBibliotheque = parentData?.canManageBibliotheque ?? false;

	const items = await db.query.libraryProgrammes.findMany({
		where: eq(libraryProgrammes.workspaceId, workspaceId),
		with: {
			thematique: { columns: { name: true } },
			libraryProgrammeModules: { columns: { libraryModuleId: true } }
		},
		orderBy: (p, { asc }) => [asc(p.titre)]
	});

	return {
		libraryProgrammes: items.map((p) => ({
			...p,
			moduleCount: p.libraryProgrammeModules?.length ?? 0
		})),
		canManageBibliotheque
	};
};
