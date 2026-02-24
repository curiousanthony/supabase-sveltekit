import { db } from '$lib/db';
import { contacts } from '$lib/db/schema';
import { getUserWorkspace } from '$lib/auth';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ params, locals }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) throw error(404, 'Espace non trouvé');

	const contact = await db.query.contacts.findFirst({
		where: eq(contacts.id, params.id),
		with: {
			contactCompanies: { with: { company: true } },
			owner: { columns: { id: true, firstName: true, lastName: true, email: true } }
		}
	});

	if (!contact || contact.workspaceId !== workspaceId) throw error(404, 'Contact non trouvé');

	return {
		contact,
		header: {
			pageName: [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Contact',
			backButton: true,
			backButtonLabel: 'CRM',
			backButtonHref: '/contacts',
			actions: [
				{
					type: 'button' as const,
					icon: 'pencil',
					text: 'Éditer',
					href: `/contacts?edit=${contact.id}`,
					variant: 'secondary' as const
				}
			]
		}
	};
}) satisfies PageServerLoad;
