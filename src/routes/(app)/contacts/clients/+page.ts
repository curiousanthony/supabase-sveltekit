import type { PageLoad } from './$types';

export const load = (async () => {
	return {
		pageName: 'Clients',
		header: { pageName: 'Clients', actions: [] }
	};
}) satisfies PageLoad;
