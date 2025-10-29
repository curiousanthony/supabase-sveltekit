import type { PageLoad } from './$types';

export const load = (async () => {
    return {
        pageName: "Bibliothèque",
    };
}) satisfies PageLoad;