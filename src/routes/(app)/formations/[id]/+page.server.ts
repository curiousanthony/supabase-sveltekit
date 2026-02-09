import type { PageServerLoad } from './$types';

/** PoC: Aperçu uses layout data only. Return empty so layout's dummy formation + header are used. */
export const load = (async () => {
	return {};
}) satisfies PageServerLoad;
