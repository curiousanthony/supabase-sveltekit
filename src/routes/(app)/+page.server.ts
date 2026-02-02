import { db } from '$lib/db';
import { formations, deals } from '$lib/db/schema';
import { requireWorkspace } from '$lib/server/guards';
import { eq, desc, and, notInArray } from 'drizzle-orm';
import { isFormationQualiopiComplete } from '$lib/formation-workflow';
import type { PageServerLoad } from './$types';

const RECENT_FORMATIONS_LIMIT = 5;
const RECENT_DEALS_LIMIT = 5;
const ACTIVE_DEALS_FOR_COUNT = 500;

export const load = (async ({ locals, url }) => {
	const header = {
		pageName: 'Accueil',
		actions: []
	};

	// Use same current workspace as layout (from lastActiveWorkspaceId / cookie), not first workspace in DB
	const { workspaceId } = await requireWorkspace({ ...locals, url });

	const [formationsData, activeDealsFull, allFormationsForQualiopi] = await Promise.all([
		db.query.formations.findMany({
			where: eq(formations.workspaceId, workspaceId),
			with: {
				thematique: { columns: { name: true } },
				client: { columns: { legalName: true } }
			},
			orderBy: [desc(formations.idInWorkspace)],
			limit: RECENT_FORMATIONS_LIMIT
		}),
		db.query.deals.findMany({
			where: and(eq(deals.workspaceId, workspaceId), notInArray(deals.stage, ['Gagné', 'Perdu'])),
			orderBy: [desc(deals.updatedAt)],
			limit: ACTIVE_DEALS_FOR_COUNT,
			with: {
				client: { columns: { legalName: true } },
				formation: { columns: { id: true, name: true, statut: true } }
			}
		}),
		db.query.formations.findMany({
			where: eq(formations.workspaceId, workspaceId),
			columns: {
				id: true,
				name: true,
				description: true,
				modalite: true,
				duree: true
			}
		})
	]);

	const conformityByFormation = allFormationsForQualiopi.map((f) => ({
		...f,
		...isFormationQualiopiComplete(f)
	}));
	const qualiopiConformCount = conformityByFormation.filter((c) => c.ok).length;
	const qualiopiTotal = allFormationsForQualiopi.length;
	const qualiopiPercent =
		qualiopiTotal > 0 ? Math.round((qualiopiConformCount / qualiopiTotal) * 100) : 0;
	const qualiopiToComplete = conformityByFormation.filter((c) => !c.ok).length;

	const stats = {
		formationsCount: allFormationsForQualiopi.length,
		dealsCount: activeDealsFull.length,
		qualiopiPercent,
		qualiopiToComplete
	};

	const activeDeals = activeDealsFull.slice(0, RECENT_DEALS_LIMIT);

	// Expose recent formations for layout command palette when on home
	return {
		header,
		formations: formationsData,
		recentFormations: formationsData,
		activeDeals,
		stats
	};
}) satisfies PageServerLoad;
