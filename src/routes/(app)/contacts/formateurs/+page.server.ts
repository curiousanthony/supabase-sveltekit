import { db } from '$lib/db';
import type { PageServerLoad } from './$types';

const header = {
    actions: [
        { type: 'button', icon: 'plus', text: 'Inviter un formateur', href: '/contacts/formateurs/ajouter', variant: 'default' as const },
        { type: 'button', icon: 'search', text: 'Trouver un formateur', href: '/contacts/formateurs/rechercher', variant: 'default' as const }
    ]
};

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
        });
        return { formateurs, pageName: 'Formateurs', header };
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const stack = err instanceof Error ? err.stack : '';
        const cause = err instanceof Error && err.cause ? String(err.cause) : '';
        console.error('[formateurs load]', msg, stack || '', cause || '');
        return { formateurs: [], pageName: 'Formateurs', header };
    }
}) satisfies PageServerLoad;
