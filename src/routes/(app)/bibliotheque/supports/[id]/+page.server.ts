import { db } from '$lib/db';
import { biblioSupports } from '$lib/db/schema';
import { getUserWorkspace } from '$lib/auth';
import { eq, and } from 'drizzle-orm';
import { fail, redirect, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load = (async ({ params, locals }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) throw error(403, 'Aucun espace de travail');

	const support = await db.query.biblioSupports.findFirst({
		where: and(eq(biblioSupports.id, params.id), eq(biblioSupports.workspaceId, workspaceId))
	});
	if (!support) throw error(404, 'Support non trouvé');

	return {
		support,
		header: {
			pageName: support.titre,
			backButton: true,
			backButtonHref: '/bibliotheque/supports',
			backButtonLabel: 'Supports',
			actions: []
		}
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	update: async ({ request, locals, params }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun espace de travail' });

		const fd = await request.formData();
		const titre = (fd.get('titre') as string)?.trim();
		const url = (fd.get('url') as string)?.trim();

		if (!titre) return fail(400, { message: 'Titre requis' });

		await db
			.update(biblioSupports)
			.set({ titre, url: url || null })
			.where(
				and(eq(biblioSupports.id, params.id), eq(biblioSupports.workspaceId, workspaceId))
			);

		return { success: true };
	},

	delete: async ({ locals, params }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun espace de travail' });

		const support = await db.query.biblioSupports.findFirst({
			where: and(
				eq(biblioSupports.id, params.id),
				eq(biblioSupports.workspaceId, workspaceId)
			)
		});

		if (support?.filePath) {
			const { supabase } = locals;
			await supabase.storage.from('bibliotheque-supports').remove([support.filePath]);
		}

		await db
			.delete(biblioSupports)
			.where(
				and(eq(biblioSupports.id, params.id), eq(biblioSupports.workspaceId, workspaceId))
			);

		throw redirect(303, '/bibliotheque/supports');
	}
};
