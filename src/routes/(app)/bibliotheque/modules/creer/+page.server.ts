import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/db';
import { libraryModules } from '$lib/db/schema';
import { getUserWorkspace } from '$lib/auth';
import { canManageBibliotheque } from '$lib/server/permissions';
import { eq } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { z } from 'zod';

const createSchema = z.object({
	titre: z.string().min(1, 'Le titre est requis'),
	dureeHours: z.coerce.number().min(0.5, 'Durée minimale 0,5 h'),
	objectifsPedagogiques: z.string().min(1, 'Les objectifs pédagogiques sont requis'),
	modaliteEvaluation: z.enum([
		'QCM de fin de formation',
		'Mise en situation pratique',
		'Étude de cas complexe',
		'Entretien avec le formateur'
	])
});

export const load: PageServerLoad = async ({ locals, parent }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) throw redirect(303, '/');

	const parentData = await parent();
	const role = (parentData as { role?: string | null })?.role ?? null;
	if (!canManageBibliotheque(role)) throw redirect(303, '/bibliotheque/modules');

	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun workspace' });

		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });

		const role = (await import('$lib/server/workspace').then((m) =>
			m.getUserRoleInWorkspace(user.id, workspaceId)
		)) as string | null;
		if (!canManageBibliotheque(role)) return fail(403, { message: 'Droits insuffisants' });

		const formData = Object.fromEntries(await request.formData());
		const parsed = createSchema.safeParse({
			titre: formData.titre,
			dureeHours: formData.dureeHours,
			objectifsPedagogiques: formData.objectifsPedagogiques,
			modaliteEvaluation: formData.modaliteEvaluation
		});

		if (!parsed.success) {
			const first = parsed.error.flatten().fieldErrors;
			const msg = Object.values(first).flat().join(' ');
			return fail(400, { message: msg || 'Données invalides' });
		}

		await db.insert(libraryModules).values({
			workspaceId,
			createdBy: user.id,
			titre: parsed.data.titre,
			dureeHours: String(parsed.data.dureeHours),
			objectifsPedagogiques: parsed.data.objectifsPedagogiques,
			modaliteEvaluation: parsed.data.modaliteEvaluation
		});

		throw redirect(303, '/bibliotheque/modules');
	}
};
