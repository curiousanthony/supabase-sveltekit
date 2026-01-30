import { db } from '$lib/db';
import { deals } from '$lib/db/schema';
import { getUserWorkspace } from '$lib/auth';
import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

const STAGES = ['Lead', 'Qualification', 'Proposition', 'Négociation', 'Gagné', 'Perdu'] as const;

export const load = (async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) throw redirect(303, '/auth/login');

	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) {
		return {
			clients: [],
			workspaceId: null,
			header: { pageName: 'Créer un deal', backButton: true, backButtonLabel: 'Deals', backButtonHref: '/deals' }
		};
	}

	const clients = await db.query.clients.findMany({
		columns: { id: true, legalName: true },
		orderBy: (c, { asc }) => [asc(c.legalName)]
	});

	return {
		clients,
		workspaceId,
		header: { pageName: 'Créer un deal', backButton: true, backButtonLabel: 'Deals', backButtonHref: '/deals' }
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });

		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun workspace associé' });

		const fd = await request.formData();
		const name = (fd.get('name') as string)?.trim();
		const clientId = (fd.get('clientId') as string)?.trim();
		const stage = (fd.get('stage') as string) || 'Lead';
		const valueRaw = (fd.get('value') as string)?.trim();
		const description = (fd.get('description') as string)?.trim() || null;

		if (!name) return fail(400, { message: 'Le nom du deal est requis' });
		if (!clientId) return fail(400, { message: 'Le client est requis' });
		if (!STAGES.includes(stage as (typeof STAGES)[number])) return fail(400, { message: 'Étape invalide' });

		let valueNum: number | null = null;
		if (valueRaw) {
			valueNum = Number(valueRaw);
			if (Number.isNaN(valueNum) || valueNum < 0) return fail(400, { message: 'Montant invalide' });
		}

		const userId = user.id;
		const [{ id: insertedId }] = await db
			.insert(deals)
			.values({
				workspaceId,
				clientId,
				name,
				stage: stage as (typeof STAGES)[number],
				value: valueNum != null ? String(valueNum) : null,
				description,
				ownerId: userId,
				createdBy: userId
			})
			.returning({ id: deals.id });

		throw redirect(303, `/deals/${insertedId}`);
	}
};
