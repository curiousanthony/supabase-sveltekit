import type { PageServerLoad } from './$types';

export const load = (async () => {
	const header = {
		pageName: 'Notifications',
		actions: []
	};

	return { header };
}) satisfies PageServerLoad;
