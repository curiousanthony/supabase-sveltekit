import type { PageServerLoad } from './$types';

export const load = (async () => {

    const header = {
        pageName : "Playground",
        actions: [
            {
                type: 'badge',
                icon: "circle",
                text: 'Un badge avec icône',
                className: 'text-green-400',
                variant: 'outline',
            },
            {
                type: 'button',
                icon: "external",
                text: 'Voir sur GitHub',
                href: 'https://github.com/shadcn-ui/ui/tree/main/apps/v4/app/(examples)/dashboard',
                variant: 'secondary',
            },
            {
                type: 'separator',
                orientation: 'vertical',
            },
            {
                type: 'button',
                icon: "plus",
                text: 'Nouvel élément',
                href: 'https://github.com/shadcn-ui/ui/tree/main/apps/v4/app/(examples)/dashboard',
                variant: 'primary',
            },
        ]
    }

    return { header };
}) satisfies PageServerLoad;