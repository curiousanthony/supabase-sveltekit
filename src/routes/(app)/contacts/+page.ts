import type { PageLoad } from './$types';

export const load = (async () => {
    return {
        pageName: "Contacts",
    };
}) satisfies PageLoad;