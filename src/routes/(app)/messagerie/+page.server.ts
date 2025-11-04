import type { PageServerLoad } from './$types';

export const load = (async () => {

    const header = {
        pageName : "Messagerie",
        actions: [
        ]
    }

    return { header };
}) satisfies PageServerLoad;