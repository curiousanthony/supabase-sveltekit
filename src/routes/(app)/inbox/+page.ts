import type { PageLoad } from './$types';

export const load = (async () => {
    return {
        pageName: "Boîte de réception",
    };
}) satisfies PageLoad;