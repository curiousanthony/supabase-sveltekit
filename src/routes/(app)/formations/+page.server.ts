import { db } from '$lib/db';
import type { PageServerLoad } from './$types';

export const load = (async () => {
	try {
		// const formations = await db.query.formations.findMany({
		//     orderBy: (formations, {desc}) => [
		//         desc(formations.idInWorkspace)
		//     ]
		// });

		const formationsData = await db.query.formations.findMany({
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
