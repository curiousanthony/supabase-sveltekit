import { db } from '$lib/db';
import type { PageServerLoad } from './$types';

export const load = (async () => {
    try {
        const users = await db.query.users.findMany({
            orderBy: (users, {asc}) => [
                asc(users.firstName)
            ]
        });
        // console.log("from crud/+page.server.ts → users:\n", users);

        const header = {
            pageName: "CRUD Playground",
            actions: [
                {
                    type: 'button',
                    icon: "plus",
                    text: 'Ajouter',
                    href: '/playground/crud/ajouter',
                    className: 'text-muted-foreground',
                    variant: 'secondary',
                }
            ]
        }

        return { users, header };
    } catch (error) {
        console.error("Error in crud/+page.server.ts → load:\n", error);
        throw error;
    }
}) satisfies PageServerLoad;
