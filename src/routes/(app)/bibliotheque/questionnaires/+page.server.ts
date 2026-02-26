import { db } from '$lib/db';
import { biblioQuestionnaires } from '$lib/db/schema';
import { getUserWorkspace, ensureUserInPublicUsers } from '$lib/auth';
import { eq, desc, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load = (async ({ locals }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) {
		return {
			questionnaires: [],
			workspaceId: null,
			header: { pageName: 'Bibliothèque', actions: [] }
		};
	}

	const rows = await db
		.select()
		.from(biblioQuestionnaires)
		.where(eq(biblioQuestionnaires.workspaceId, workspaceId))
		.orderBy(desc(biblioQuestionnaires.updatedAt));

	return {
		questionnaires: rows,
		workspaceId,
		header: {
			pageName: 'Bibliothèque',
			actions: [
				{
					type: 'button',
					text: '+ Nouveau questionnaire',
					href: '/bibliotheque/questionnaires/creer'
				}
			]
		}
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	delete: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun espace de travail' });

		const fd = await request.formData();
		const id = fd.get('id') as string;
		if (!id) return fail(400, { message: 'ID manquant' });

		await db
			.delete(biblioQuestionnaires)
			.where(
				and(eq(biblioQuestionnaires.id, id), eq(biblioQuestionnaires.workspaceId, workspaceId))
			);

		return { success: true };
	},

	duplicate: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun espace de travail' });
		await ensureUserInPublicUsers(locals);

		const fd = await request.formData();
		const id = fd.get('id') as string;
		if (!id) return fail(400, { message: 'ID manquant' });

		const original = await db.query.biblioQuestionnaires.findFirst({
			where: and(eq(biblioQuestionnaires.id, id), eq(biblioQuestionnaires.workspaceId, workspaceId))
		});
		if (!original) return fail(404, { message: 'Questionnaire non trouvé' });

		await db.insert(biblioQuestionnaires).values({
			titre: `Copie de ${original.titre}`,
			type: original.type,
			urlTest: original.urlTest,
			workspaceId,
			createdBy: user.id
		});

		return { success: true };
	}
};
