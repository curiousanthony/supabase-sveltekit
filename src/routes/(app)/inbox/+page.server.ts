import type { PageServerLoad } from './$types';

export const load = (async () => {

    const header = {
        pageName : "Boîte de réception",
        actions: [
        ]
    }

    return { header };
}) satisfies PageServerLoad;