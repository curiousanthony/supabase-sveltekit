import { fail } from '@sveltejs/kit';
import { db } from '$lib/db';
import { formationActions } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import type { Actions } from './$types';

export const actions: Actions = {
	updateAction: async ({ request, locals }) => {
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		const formData = await request.formData();
		const actionId = formData.get('actionId') as string;
		const newStatus = formData.get('newStatus') as string;

		if (!actionId || !newStatus) return fail(400, { message: 'Données manquantes' });

		const validStatuses = ['Pas commencé', 'En cours', 'Terminé'] as const;
		if (!validStatuses.includes(newStatus as (typeof validStatuses)[number])) {
			return fail(400, { message: 'Statut invalide' });
		}

		await db
			.update(formationActions)
			.set({
				status: newStatus as (typeof validStatuses)[number],
				completedAt: newStatus === 'Terminé' ? new Date().toISOString() : null,
				completedBy: newStatus === 'Terminé' ? user.id : null
			})
			.where(eq(formationActions.id, actionId));

		return { success: true };
	}
};
