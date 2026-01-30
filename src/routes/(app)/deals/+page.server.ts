import { db } from '$lib/db';
import { deals } from '$lib/db/schema';
import { getUserWorkspace } from '$lib/auth';
import { eq, desc } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

const STAGES = ['Lead', 'Qualification', 'Proposition', 'Négociation', 'Gagné', 'Perdu'] as const;

export const load = (async ({ locals }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) {
		return {
			deals: [],
			clients: [],
			workspaceId: null,
			stages: STAGES,
			header: {
				pageName: 'Deals',
				actions: []
			}
		};
	}

	const dealsData = await db.query.deals.findMany({
		where: eq(deals.workspaceId, workspaceId),
		orderBy: [desc(deals.updatedAt)],
		with: {
			client: { columns: { id: true, legalName: true } },
			owner: { columns: { id: true, firstName: true, lastName: true, email: true } },
			formation: { columns: { id: true, name: true, statut: true } }
		}
	});

	const clients = await db.query.clients.findMany({
		columns: { id: true, legalName: true },
		orderBy: (c, { asc: a }) => [a(c.legalName)]
	});

	const header = {
		pageName: 'Deals',
		actions: [
			{
				type: 'button' as const,
				icon: 'plus',
				text: 'Créer un deal',
				href: '/deals/creer',
				variant: 'default' as const
			}
		]
	};

	return { deals: dealsData, clients, workspaceId, stages: STAGES, header };
}) satisfies PageServerLoad;
