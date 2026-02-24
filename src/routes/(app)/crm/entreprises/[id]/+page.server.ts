import { db } from '$lib/db';
import { companies } from '$lib/db/schema';
import { getUserWorkspace } from '$lib/auth';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ params, locals }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) throw error(404, 'Espace non trouvé');

	const company = await db.query.companies.findFirst({
		where: eq(companies.id, params.id)
	});

	if (!company || company.workspaceId !== workspaceId) throw error(404, 'Entreprise non trouvée');

	return {
		company,
		header: {
			pageName: company.name,
			backButton: true,
			backButtonLabel: 'CRM',
			backButtonHref: '/contacts',
			actions: [
				{
					type: 'button' as const,
					icon: 'pencil',
					text: 'Éditer',
					href: `/contacts?editCompany=${company.id}`,
					variant: 'secondary' as const
				}
			]
		}
	};
}) satisfies PageServerLoad;
