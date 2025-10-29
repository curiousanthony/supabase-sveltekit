import type { PageLoad } from './$types';

export const load = (async () => {
    return {
        pageName: "Tableau de bord",
    };
}) satisfies PageLoad;