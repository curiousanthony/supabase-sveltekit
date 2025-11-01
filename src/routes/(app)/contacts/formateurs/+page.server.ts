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
            actions: [
                {
                    type: 'button',
                    icon: "plus",
                    text: 'Inviter un formateur',
                    href: '/contacts/formateurs/ajouter',
                    // className: 'bg-primary text-primary-foreground hover:bg-primary/70 hover:text-primary-foreground',
                    variant: 'default',
                },
                {
                    type: 'button',
                    icon: "search",
                    text: 'Trouver un formateur',
                    href: '/contacts/formateurs/rechercher',
                    // className: 'bg-primary text-primary-foreground hover:bg-primary/70 hover:text-primary-foreground',
                    variant: 'default',
                }
            ]
        }

        return { formateurs, pageName: "Formateurs", header };
    } catch (error) {
        console.error("Error in contacts/formateurs/+page.server.ts → load:\n", error);
        throw error;
    }
}) satisfies PageServerLoad;
