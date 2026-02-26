import { db } from '$lib/db';
import { biblioModules } from '$lib/db/schema';
import { getUserWorkspace, ensureUserInPublicUsers } from '$lib/auth';
import { eq, desc, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load = (async ({ locals }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) {
		return { modules: [], workspaceId: null };
	}

	const rows = await db
		.select()
		.from(biblioModules)
		.where(eq(biblioModules.workspaceId, workspaceId))
		.orderBy(desc(biblioModules.updatedAt));

	return {
		modules: rows,
		workspaceId,
		header: {
			pageName: 'Bibliothèque',
			actions: [
				{ type: 'button', text: '+ Nouveau module', href: '/bibliotheque/modules/creer' }
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
		const idValue = fd.get('id');
		if (typeof idValue !== 'string') return fail(400, { message: 'ID manquant' });

		const deleted = await db
			.delete(biblioModules)
			.where(and(eq(biblioModules.id, idValue), eq(biblioModules.workspaceId, workspaceId)))
			.returning({ id: biblioModules.id });
		if (deleted.length === 0) return fail(404, { message: 'Module non trouvé' });
		return { success: true };
	},

	duplicate: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun espace de travail' });

		const fd = await request.formData();
		const idValue = fd.get('id');
		if (typeof idValue !== 'string') return fail(400, { message: 'ID manquant' });

		const original = await db.query.biblioModules.findFirst({
			where: and(eq(biblioModules.id, idValue), eq(biblioModules.workspaceId, workspaceId))
		});
		if (!original) return fail(404, { message: 'Module non trouvé' });

		try {
			await ensureUserInPublicUsers(locals);
		} catch (e) {
			console.error('[bibliotheque/modules] ensureUserInPublicUsers failed:', e);
			return fail(500, {
				message: 'Impossible de vérifier votre accès. Réessayez ou contactez le support.',
				error: true
			});
		}

		await db.insert(biblioModules).values({
			titre: `Copie de ${original.titre}`,
			contenu: original.contenu,
			objectifsPedagogiques: original.objectifsPedagogiques,
			modaliteEvaluation: original.modaliteEvaluation,
			dureeHeures: original.dureeHeures,
			workspaceId,
			createdBy: user.id
		});

		return { success: true };
	}
};
