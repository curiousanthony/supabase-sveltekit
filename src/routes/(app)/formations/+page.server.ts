import { db } from '$lib/db';
import { formations } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireRole } from '$lib/server/guards';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals, url }) => {
	const { workspaceId } = await requireRole({ ...locals, url } as Parameters<typeof requireRole>[0], 'formations');

	try {
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

		const header = {
			pageName: 'Formations',
			actions: [
				{
					type: 'button',
					icon: 'plus',
					text: 'Créer une formation',
					href: '/formations/creer',
					// className: 'bg-primary text-primary-foreground hover:bg-primary/70 hover:text-primary-foreground',
					variant: 'default'
				}
			]
		};

		// console.log("from crud/+page.server.ts → formations:\n", formations);
		return { formations: formationsData, header };
	} catch (error) {
		console.error('Error in crud/+page.server.ts → load:\n', error);
		throw error;
	}
}) satisfies PageServerLoad;
