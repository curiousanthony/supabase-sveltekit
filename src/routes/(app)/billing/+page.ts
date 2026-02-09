import type { PageLoad } from './$types';

export const load = (async () => {
	return {
		pageName: 'Facturation',
		header: { pageName: 'Facturation', actions: [] }
	};
}) satisfies PageLoad;
