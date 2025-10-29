import type { PageLoad } from './$types';

export const load = (async () => {
    return {
        pageName: "Gestion qualité",
    };
}) satisfies PageLoad;