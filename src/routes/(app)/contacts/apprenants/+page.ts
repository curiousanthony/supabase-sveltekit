import type { PageLoad } from './$types';

export const load = (async () => {
	return {
		pageName: 'Apprenants',
		header: { pageName: 'Apprenants', actions: [] }
	};
}) satisfies PageLoad;
