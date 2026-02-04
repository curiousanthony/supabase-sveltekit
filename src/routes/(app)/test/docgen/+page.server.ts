import { dummyFormationDocData } from '$lib/docgen/dummy-data.js';
import type { FormationDocData } from '$lib/docgen/types.js';
import type { PageServerLoad } from './$types';

export const load = (async () => {
	// Expose dummy data so the page can show which values are used in the template
	const formationDocData: FormationDocData = dummyFormationDocData;
	const header = {
		pageName: 'Test Docgen – Convention',
		actions: []
	};
	return { formationDocData, header };
}) satisfies PageServerLoad;
