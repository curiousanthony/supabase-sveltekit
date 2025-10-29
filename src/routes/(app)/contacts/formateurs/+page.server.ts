import { db } from '$lib/db';
import type { PageServerLoad } from './$types';

export const load = (async () => {
    try {
        const formateurs = await db.query.formateurs.findMany({
            with: {
                user: true,
                formateursThematiques: true // To refactor, returns object object atm
                
            }
        })
        // const formateurs = await db.query.formateurs.findMany({
        //     // 💡 Use the 'with' option to fetch related data
        //     with: {
        //         formateursThematiques: {
        //             columns: {
        //                 name: true
        //             }
        //         }         
        //      },
        //     orderBy: (formations, {desc}) => [
        //         desc(formations.idInWorkspace)
        //     ]
        // });

        console.log("from formateurs/+page.server.ts → formateurs:\n", formateurs);
        return { formateurs };
    } catch (error) {
        console.error("Error in crud/+page.server.ts → load:\n", error);
        throw error;
    }
}) satisfies PageServerLoad;
