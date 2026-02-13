import { redirect } from '@sveltejs/kit';
import { db } from '$lib/db';
import { formations } from '$lib/db/schema';
import { getUserWorkspace } from '$lib/auth';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

const header = {
	pageName: 'Formations',
	actions: [
		{
			type: 'button' as const,
			icon: 'plus',
			text: 'Créer une formation',
			href: '/formations/creer',
			variant: 'default' as const
		},
		{
			type: 'button' as const,
			icon: 'book',
			text: "Créer à partir d'un programme",
			href: '/bibliotheque/programmes',
			variant: 'outline' as const
		}
	]
};

export const load = (async ({ locals }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) {
		throw redirect(303, '/');
	}

	const formationsData = await db.query.formations.findMany({
		where: eq(formations.workspaceId, workspaceId),
		with: {
			thematique: {
				columns: { name: true }
			},
			client: {
				columns: { legalName: true }
			},
			modules: {
				columns: { id: true }
			}
		},
		orderBy: (formations, { desc }) => [desc(formations.idInWorkspace)]
	});

	return { formations: formationsData, header };
}) satisfies PageServerLoad;
