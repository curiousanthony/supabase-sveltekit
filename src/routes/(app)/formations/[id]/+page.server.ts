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
    return { formation };
}) satisfies PageServerLoad;