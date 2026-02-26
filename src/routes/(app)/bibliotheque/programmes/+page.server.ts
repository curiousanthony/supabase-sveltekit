import { db } from '$lib/db';
import { biblioProgrammes, biblioProgrammeModules } from '$lib/db/schema';
import { getUserWorkspace, ensureUserInPublicUsers } from '$lib/auth';
import { eq, desc, and, sql, count } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load = (async ({ locals }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) {
		return { programmes: [], workspaceId: null };
	}

	const rows = await db
		.select({
			id: biblioProgrammes.id,
			titre: biblioProgrammes.titre,
			description: biblioProgrammes.description,
			modalite: biblioProgrammes.modalite,
			prixPublic: biblioProgrammes.prixPublic,
			statut: biblioProgrammes.statut,
			dureeHeures: biblioProgrammes.dureeHeures,
			createdAt: biblioProgrammes.createdAt,
			moduleCount: count(biblioProgrammeModules.id)
		})
		.from(biblioProgrammes)
		.leftJoin(
			biblioProgrammeModules,
			eq(biblioProgrammes.id, biblioProgrammeModules.programmeId)
		)
		.where(eq(biblioProgrammes.workspaceId, workspaceId))
		.groupBy(biblioProgrammes.id)
		.orderBy(desc(biblioProgrammes.updatedAt));

	return {
		programmes: rows,
		workspaceId,
		header: {
			pageName: 'Bibliothèque',
			actions: [
				{
					type: 'button',
					text: '+ Nouveau programme',
					href: '/bibliotheque/programmes/creer'
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
		const idRaw = fd.get('id');
		if (idRaw == null || typeof idRaw !== 'string') {
			return fail(400, { message: 'ID manquant ou invalide' });
		}
		const id = idRaw;

		try {
			await db
				.delete(biblioProgrammes)
				.where(and(eq(biblioProgrammes.id, id), eq(biblioProgrammes.workspaceId, workspaceId)));
		} catch (err) {
			console.error('Programme delete failed:', err);
			return fail(500, { message: 'Erreur serveur' });
		}

		return { success: true };
	},

	duplicate: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun espace de travail' });
		await ensureUserInPublicUsers(locals);

		const fd = await request.formData();
		const idRaw = fd.get('id');
		if (idRaw == null || typeof idRaw !== 'string') {
			return fail(400, { message: 'ID manquant ou invalide' });
		}
		const id = idRaw;

		try {
		const original = await db.query.biblioProgrammes.findFirst({
			where: and(eq(biblioProgrammes.id, id), eq(biblioProgrammes.workspaceId, workspaceId))
		});
		if (!original) return fail(404, { message: 'Programme non trouvé' });

		await db.transaction(async (tx) => {
			const [inserted] = await tx
				.insert(biblioProgrammes)
				.values({
					titre: `Copie de ${original.titre}`,
					description: original.description,
					modalite: original.modalite,
					prixPublic: original.prixPublic,
					statut: 'Brouillon',
					prerequis: original.prerequis,
					dureeHeures: original.dureeHeures,
					workspaceId,
					createdBy: user.id
				})
				.returning({ id: biblioProgrammes.id });

			if (inserted) {
				const modules = await tx
					.select()
					.from(biblioProgrammeModules)
					.where(eq(biblioProgrammeModules.programmeId, id));

				if (modules.length > 0) {
					await tx.insert(biblioProgrammeModules).values(
						modules.map((m) => ({
							programmeId: inserted.id,
							moduleId: m.moduleId,
							orderIndex: m.orderIndex
						}))
					);
				}
			}
		});

		return { success: true };
		} catch (err) {
			console.error('[duplicate programme]', err);
			return fail(500, { message: 'Erreur serveur' });
		}
	}
};
