import type { PageLoad } from './$types';

export const load = (async () => {
    return {
        pageName: "Historique",
    };
}) satisfies PageLoad;