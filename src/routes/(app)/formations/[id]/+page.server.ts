import { db } from '$lib/db';
import type { PageServerLoad } from './$types';

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

    const header = {
        pageName: formation.name,
        actions: [
            {

            }
        ]
    }

    return { formation, pageName, header };
}) satisfies PageServerLoad;