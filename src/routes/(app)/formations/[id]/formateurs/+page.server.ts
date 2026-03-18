import { fail } from '@sveltejs/kit';
import { db } from '$lib/db';
import { formationFormateurs } from '$lib/db/schema';
import { and, eq } from 'drizzle-orm';
import type { Actions } from './$types';

export const actions: Actions = {
	addFormateur: async ({ request, locals, params }) => {
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		const formData = await request.formData();
		const formateurId = formData.get('formateurId') as string;
		if (!formateurId) return fail(400, { message: 'Formateur requis' });

		try {
			await db.insert(formationFormateurs).values({
				formationId: params.id,
				formateurId
			});
		} catch (e: any) {
			if (e?.code === '23505') {
				return fail(409, { message: 'Ce formateur est déjà assigné' });
			}
			throw e;
		}

		return { success: true };
	},

	removeFormateur: async ({ request, locals, params }) => {
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		const formData = await request.formData();
		const formateurId = formData.get('formateurId') as string;
		if (!formateurId) return fail(400, { message: 'Formateur requis' });

		await db
			.delete(formationFormateurs)
			.where(
				and(
					eq(formationFormateurs.formationId, params.id),
					eq(formationFormateurs.formateurId, formateurId)
				)
			);

		return { success: true };
	}
};
