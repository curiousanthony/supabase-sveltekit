import { db } from '$lib/db';
import type { PageServerLoad } from './$types';
import Button from '$lib/components/ui/button/button.svelte';
import Badge from '$lib/components/ui/badge/badge.svelte';

export const load = (async ({params}) => {

    // Get the formation object from the ID in the URL, from the database
    const formation = await db.query.formations.findFirst({
        where: (formations, { eq }) => eq(formations.id, params.id),
        with: {
            thematique: {
                columns: {
                    name: true
                }
            },
            sousthematique: {
                columns: {
                    name: true
                }
            },
            user: true,
            modules: true
        }
    });

    const pageName = formation?.name ?? "Formation";

    if (!formation) {
        throw new Error('Formation not found');
    }

    // console.log("from formations/[id]/+page.server.ts → formation:\n", formation);

    // const header = {
    //     actions: {
    //         label: "Modifier la formation",
    //         href: `/formations/modifier/${formation.id}`
    //     }
    // }

    // const header = {
    //     actions: [
    //         {
    //             label: "Modifier la formation",
    //             href: `/formations/modifier/${formation.id}`,
    //             component: Button
    //         },
    //         {
    //             label: "Modifier la formation",
    //             href: `/formations/modifier/${formation.id}`,
    //             component: Badge
    //         },
    //         {
    //         label: "Modifier la formation",
    //         href: `/formations/modifier/${formation.id}`,
    //         component: {
    //         name: "Button",
    //         props: {
    //             color: "primary"
    //         }
    //     }
    // }
    //     ]
    // }

    return { formation, pageName };
}) satisfies PageServerLoad;