import { db } from '$lib/db';
import { contacts } from '$lib/db/schema';
import { getUserWorkspace } from '$lib/auth';
import { and, eq } from 'drizzle-orm';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load = (async ({ params, locals }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) throw error(404, 'Espace non trouvé');

	const contact = await db.query.contacts.findFirst({
		where: and(eq(contacts.id, params.id), eq(contacts.workspaceId, workspaceId)),
		with: {
			contactCompanies: { with: { company: true } },
			owner: { columns: { id: true, firstName: true, lastName: true, email: true } },
			deals: {
				with: {
					formation: {
						columns: { id: true, name: true, statut: true, createdAt: true }
					}
				}
			}
		}
	});

	if (!contact) throw error(404, 'Contact non trouvé');

	const pageName = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Contact';

	return {
		contact,
		header: {
			pageName,
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

export const actions: Actions = {
	deleteContact: async ({ params, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) throw error(403, 'Espace non trouvé');
		const [contact] = await db
			.select({ id: contacts.id })
			.from(contacts)
			.where(and(eq(contacts.id, params.id), eq(contacts.workspaceId, workspaceId)))
			.limit(1);
		if (!contact) throw error(404, 'Contact non trouvé');
		await db.delete(contacts).where(eq(contacts.id, contact.id));
		throw redirect(303, '/contacts');
	}
};
