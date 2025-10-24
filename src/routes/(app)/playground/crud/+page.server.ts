import { db } from '$lib/db';
import type { PageServerLoad } from './$types';

export const load = (async () => {
    const users = await db.query.users.findMany({
        orderBy: (users, {asc}) => [
            asc(users.firstName)
        ]
    });
    return {users};
}) satisfies PageServerLoad;