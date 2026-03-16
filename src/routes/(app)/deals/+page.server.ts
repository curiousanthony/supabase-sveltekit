import { db } from '$lib/db';
import { deals } from '$lib/db/schema';
import { getUserWorkspace } from '$lib/auth';
import { eq, desc, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { DEAL_STAGES } from '$lib/crm/deal-schema';
import type { PageServerLoad, Actions } from './$types';

export const load = (async ({ locals }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) {
		return {
			deals: [],
			workspaceId: null,
			stages: DEAL_STAGES,
			header: { pageName: 'Deals', actions: [] }
		};
	}

	const dealsData = await db.query.deals.findMany({
		where: eq(deals.workspaceId, workspaceId),
		orderBy: [desc(deals.updatedAt)],
		with: {
			contact: {
				columns: { id: true, firstName: true, lastName: true, email: true },
				with: { contactCompanies: { with: { company: { columns: { id: true, name: true } } } } }
			},
			company: { columns: { id: true, name: true } },
			programme: { columns: { id: true, titre: true } },
			owner: { columns: { id: true, firstName: true, lastName: true, email: true } },
			commercial: { columns: { id: true, firstName: true, lastName: true, email: true } },
			formation: { columns: { id: true, name: true, statut: true } }
		}
	});

	const header = {
		pageName: 'Deals',
		actions: [
			{
				type: 'button' as const,
				icon: 'plus',
				text: 'Nouveau deal',
				href: '/deals/creer',
				variant: 'default' as const
			}
		]
	};

	return { deals: dealsData, workspaceId, stages: DEAL_STAGES, header };
}) satisfies PageServerLoad;

export const actions: Actions = {
	updateStage: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });

		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun workspace' });

		const fd = await request.formData();
		const dealId = fd.get('dealId') as string;
		const stage = fd.get('stage') as string;

		if (!dealId || !stage) return fail(400, { message: 'Paramètres manquants' });
		if (!DEAL_STAGES.includes(stage as (typeof DEAL_STAGES)[number])) {
			return fail(400, { message: 'Étape invalide' });
		}

		const isClosed = stage === 'Gagné' || stage === 'Perdu';
		const [updated] = await db
			.update(deals)
			.set({
				stage: stage as (typeof DEAL_STAGES)[number],
				updatedAt: new Date().toISOString(),
				...(isClosed ? { closedAt: new Date().toISOString() } : { closedAt: null })
			})
			.where(and(eq(deals.id, dealId), eq(deals.workspaceId, workspaceId)))
			.returning({ id: deals.id });

		if (!updated) return fail(404, { message: 'Deal introuvable' });
		return { success: true, dealId, stage };
	}
};
