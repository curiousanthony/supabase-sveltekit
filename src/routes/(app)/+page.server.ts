import type { PageServerLoad } from './$types';

export const load = (async () => {
    const header = {
        pageName : "Tableau de bord",
        actions: [
            {
                type: 'button',
                icon: "external",
                text: 'Voir sur GitHub',
                href: 'https://github.com/shadcn-ui/ui/tree/main/apps/v4/app/(examples)/dashboard',
                variant: 'secondary',
            },
        ]
    }
    return {header};
}) satisfies PageServerLoad;