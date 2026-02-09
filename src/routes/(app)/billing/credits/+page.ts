import type { PageLoad } from './$types';

export const load = (async () => {
	return {
		pageName: 'Crédits',
		header: { pageName: 'Crédits', actions: [] }
	};
}) satisfies PageLoad;
