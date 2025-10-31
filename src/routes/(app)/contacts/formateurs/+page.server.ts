import { db } from '$lib/db';
import type { PageServerLoad } from './$types';

export const load = (async () => {
    try {
        const formateurs = await db.query.formateurs.findMany({
            with: {
                user: true,
                formateursThematiques: {
                    with: {
                        thematique: {
                            columns: {
                                name: true
                            }
                        }
                    }}
                
            }
        })

        // console.log("from formateurs/+page.server.ts → formateurs:\n", formateurs);

        const header = {
            actions: {
                label: "Ajouter un formateur",
                href: "/contacts/formateurs/ajouter"
            }
        }

        return { formateurs, pageName: "Formateurs", header };
    } catch (error) {
        console.error("Error in contacts/formateurs/+page.server.ts → load:\n", error);
        throw error;
    }
}) satisfies PageServerLoad;
