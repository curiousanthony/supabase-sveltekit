import { db } from '$lib/db';
import type { PageServerLoad } from './$types';

export const load = (async () => {
    try {
        // const formations = await db.query.formations.findMany({
        //     orderBy: (formations, {desc}) => [
        //         desc(formations.idInWorkspace)
        //     ]
        // });

        const formations = await db.query.formations.findMany({
            // 💡 Use the 'with' option to fetch related data
            with: {
                thematique: {
                    columns: {
                        name: true
                    }
                }         
             },
            orderBy: (formations, {desc}) => [
                desc(formations.idInWorkspace)
            ]
        });

        // console.log("from crud/+page.server.ts → formations:\n", formations);
        return { formations, pageName: "Formations" };
    } catch (error) {
        console.error("Error in crud/+page.server.ts → load:\n", error);
        throw error;
    }
}) satisfies PageServerLoad;
