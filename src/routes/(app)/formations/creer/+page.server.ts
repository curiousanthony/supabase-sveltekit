import { db } from '$lib/db';
import { formations, workspacesUsers } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { formationSchema } from './schema';
import type { PageServerLoad, Actions } from './$types';

export const load = (async () => {
	const [thematiques] = await Promise.all([
		db.query.thematiques.findMany({
			orderBy: (thematiques, { asc }) => [asc(thematiques.name)]
		})
	]);

	const form = await superValidate(
		{
			name: '',
			topicId: null,
			modalite: 'Distanciel',
			duree: 0,
			typeFinancement: 'OPCO',
			codeRncp: ''
		},
		formationSchema
	);

	return {
		form,
		thematiques,
		header: {
			pageName: 'Créer une formation',
			backButton: true
		}
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) {
			return fail(401, { message: 'Non autorisé' });
		}

		const form = await superValidate(request, formationSchema);

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			// Find workspace for user
			const workspaceUser = await db.query.workspacesUsers.findFirst({
				where: eq(workspacesUsers.userId, user.id)
			});

			if (!workspaceUser) {
				return fail(400, { form, message: 'Aucun espace de travail trouvé.' });
			}

			const [newFormation] = await db
				.insert(formations)
				.values({
					name: form.data.name,
					topicId: form.data.topicId || null,
					modalite: form.data.modalite,
					duree: form.data.duree,
					typeFinancement: form.data.typeFinancement,
					codeRncp: form.data.codeRncp || null,
					workspaceId: workspaceUser.workspaceId,
					createdBy: user.id,
					statut: 'En attente'
				})
				.returning();

			if (!newFormation) {
				return fail(500, { form, message: 'Erreur lors de la création.' });
			}

			// Redirect to the new formation page
			throw redirect(303, `/formations/${newFormation.id}`);
		} catch (error) {
			if (error instanceof Response) throw error; // Re-throw redirects
			console.error('Error creating formation:', error);
			return fail(500, { form, message: 'Une erreur est survenue.' });
		}
	}
};
