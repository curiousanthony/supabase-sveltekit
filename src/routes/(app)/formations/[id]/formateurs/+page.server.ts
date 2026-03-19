import { fail } from '@sveltejs/kit';
import { db } from '$lib/db';
import { formations, formationFormateurs } from '$lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { getUserWorkspace } from '$lib/auth';
import type { Actions } from './$types';

async function verifyFormationOwnership(params: { id: string }, workspaceId: string) {
	const formation = await db.query.formations.findFirst({
		where: and(eq(formations.id, params.id), eq(formations.workspaceId, workspaceId)),
		columns: { id: true }
	});
	return !!formation;
}

export const actions: Actions = {
	addFormateur: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		if (!(await verifyFormationOwnership(params, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const rawFormateurId = formData.get('formateurId');
		if (!rawFormateurId || typeof rawFormateurId !== 'string') {
			return fail(400, { message: 'Formateur requis' });
		}

		try {
			await db.insert(formationFormateurs).values({
				formationId: params.id,
				formateurId: rawFormateurId
			});
		} catch (e: unknown) {
			if (e && typeof e === 'object' && 'code' in e && e.code === '23505') {
				return fail(409, { message: 'Ce formateur est déjà assigné' });
			}
			throw e;
		}

		return { success: true };
	},

	removeFormateur: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		if (!(await verifyFormationOwnership(params, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const rawFormateurId = formData.get('formateurId');
		if (!rawFormateurId || typeof rawFormateurId !== 'string') {
			return fail(400, { message: 'Formateur requis' });
		}

		const result = await db
			.delete(formationFormateurs)
			.where(
				and(
					eq(formationFormateurs.formationId, params.id),
					eq(formationFormateurs.formateurId, rawFormateurId)
				)
			)
			.returning({ id: formationFormateurs.id });

		if (result.length === 0) {
			return fail(404, { message: 'Formateur non trouvé pour cette formation' });
		}

		return { success: true };
	}
};
