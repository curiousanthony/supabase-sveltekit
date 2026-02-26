import { db } from '$lib/db';
import { biblioModules } from '$lib/db/schema';
import { getUserWorkspace, ensureUserInPublicUsers } from '$lib/auth';
import { fail, redirect } from '@sveltejs/kit';
import { moduleSchema } from '$lib/bibliotheque/module-schema';
import type { PageServerLoad, Actions } from './$types';

export const load = (async () => {
	return {
		header: {
			pageName: 'Nouveau module',
			backButton: true,
			backButtonHref: '/bibliotheque/modules',
			backButtonLabel: 'Modules',
			actions: []
		}
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun espace de travail' });
		await ensureUserInPublicUsers(locals);

		const fd = await request.formData();
		const raw = {
			titre: (fd.get('titre') as string)?.trim() ?? '',
			contenu: (fd.get('contenu') as string)?.trim() || undefined,
			objectifsPedagogiques: (fd.get('objectifsPedagogiques') as string)?.trim() || undefined,
			modaliteEvaluation: (fd.get('modaliteEvaluation') as string)?.trim() || undefined,
			dureeHeures: fd.get('dureeHeures')
				? isNaN(Number(fd.get('dureeHeures')))
					? undefined
					: Number(fd.get('dureeHeures'))
				: undefined
		};

		const parsed = moduleSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, {
				message: parsed.error.errors.map((e) => e.message).join(', '),
				values: raw
			});
		}

		let inserted: { id: string } | undefined;
		try {
			[inserted] = await db
				.insert(biblioModules)
				.values({
					titre: parsed.data.titre,
					contenu: parsed.data.contenu ?? null,
					objectifsPedagogiques: parsed.data.objectifsPedagogiques ?? null,
					modaliteEvaluation: parsed.data.modaliteEvaluation ?? null,
					dureeHeures: parsed.data.dureeHeures?.toString() ?? null,
					workspaceId,
					createdBy: user.id
				})
				.returning({ id: biblioModules.id });
		} catch (err) {
			console.error('[modules/creer] insert failed', {
				workspaceId,
				userId: user.id,
				values: parsed.data,
				error: err
			});
			return fail(500, {
				message: 'La création du module a échoué. Veuillez réessayer.',
				values: raw
			});
		}

		if (!inserted) {
			return fail(500, {
				message: 'La création du module a échoué. Veuillez réessayer.',
				values: raw
			});
		}
		throw redirect(303, `/bibliotheque/modules/${inserted.id}`);
	}
};
