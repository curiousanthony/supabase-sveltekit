import { db } from '$lib/db';
import { biblioModules } from '$lib/db/schema';
import { getUserWorkspace } from '$lib/auth';
import { eq, and } from 'drizzle-orm';
import { fail, redirect, error } from '@sveltejs/kit';
import { moduleSchema } from '$lib/bibliotheque/module-schema';
import type { PageServerLoad, Actions } from './$types';

export const load = (async ({ params, locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) throw error(403, 'Non autorisé');
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) throw error(403, 'Aucun espace de travail');

	const mod = await db.query.biblioModules.findFirst({
		where: and(eq(biblioModules.id, params.id), eq(biblioModules.workspaceId, workspaceId))
	});

	if (!mod) throw error(404, 'Module non trouvé');

	return {
		module: mod,
		header: {
			pageName: mod.titre,
			backButton: true,
			backButtonHref: '/bibliotheque/modules',
			backButtonLabel: 'Modules',
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
		const raw = {
			titre: (fd.get('titre') as string)?.trim() ?? '',
			contenu: (fd.get('contenu') as string)?.trim() || undefined,
			objectifsPedagogiques: (fd.get('objectifsPedagogiques') as string)?.trim() || undefined,
			modaliteEvaluation: (fd.get('modaliteEvaluation') as string) || undefined,
			modaliteEvaluation: (fd.get('modaliteEvaluation') as string)?.trim() || undefined
		};

		const parsed = moduleSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, { message: parsed.error.errors.map((e) => e.message).join(', ') });
		}

		await db
			.update(biblioModules)
			.set({
				titre: parsed.data.titre,
				contenu: parsed.data.contenu ?? null,
				objectifsPedagogiques: parsed.data.objectifsPedagogiques ?? null,
				modaliteEvaluation: parsed.data.modaliteEvaluation ?? null,
				dureeHeures: parsed.data.dureeHeures?.toString() ?? null
			})
			.where(and(eq(biblioModules.id, params.id), eq(biblioModules.workspaceId, workspaceId)));

		return { success: true };
	},

	delete: async ({ locals, params }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun espace de travail' });

		await db
			.delete(biblioModules)
			.where(and(eq(biblioModules.id, params.id), eq(biblioModules.workspaceId, workspaceId)));

		throw redirect(303, '/bibliotheque/modules');
	}
};
