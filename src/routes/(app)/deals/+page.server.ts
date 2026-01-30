import { db } from '$lib/db';
import { deals, clients } from '$lib/db/schema';
import { requireRole } from '$lib/server/guards';
import { eq, desc, asc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

const STAGES = ['Lead', 'Qualification', 'Proposition', 'Négociation', 'Gagné', 'Perdu'] as const;

export const load = (async ({ locals, url }) => {
	const { workspaceId } = await requireRole({ ...locals, url } as Parameters<typeof requireRole>[0], 'deals');

	const [dealsData, clientsData] = await Promise.all([
		db.query.deals.findMany({
			where: eq(deals.workspaceId, workspaceId),
			orderBy: [desc(deals.updatedAt)],
			with: {
				client: { columns: { id: true, legalName: true } },
				owner: { columns: { id: true, firstName: true, lastName: true, email: true } },
				formation: { columns: { id: true, name: true, statut: true } }
			}
		}),
		db.query.clients.findMany({
			where: eq(clients.workspaceId, workspaceId),
			columns: { id: true, legalName: true },
			orderBy: [asc(clients.legalName)]
		})
	]);

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

	return { deals: dealsData, clients: clientsData, workspaceId, stages: STAGES, header };
}) satisfies PageServerLoad;
