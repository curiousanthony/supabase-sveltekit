import { db } from '$lib/db';
import { workspaceFormateurs, formateurs } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireRole } from '$lib/server/guards';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals, url }) => {
	const { workspaceId } = await requireRole({ ...locals, url } as Parameters<typeof requireRole>[0], 'formateurs');

	try {
		const formateursInWorkspace = await db.query.workspaceFormateurs.findMany({
			where: eq(workspaceFormateurs.workspaceId, workspaceId),
			columns: { formateurId: true }
		});

		const formateurIds = formateursInWorkspace.map((f) => f.formateurId);

		const formateurs =
			formateurIds.length === 0
				? []
				: await db.query.formateurs.findMany({
						where: (f, { inArray }) => inArray(f.id, formateurIds),
						with: {
							user: true,
							formateursThematiques: {
								with: {
									thematique: {
										columns: { name: true }
									}
								}
							}
						}
					});

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
