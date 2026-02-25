import { db } from '$lib/db';
import {
	biblioProgrammes,
	biblioProgrammeModules,
	biblioProgrammeSupports,
	biblioModules,
	biblioSupports
} from '$lib/db/schema';
import { getUserWorkspace } from '$lib/auth';
import { eq, and, desc, asc, inArray } from 'drizzle-orm';
import { fail, redirect, error } from '@sveltejs/kit';
import { programmeSchema } from '$lib/bibliotheque/programme-schema';
import type { PageServerLoad, Actions } from './$types';

export const load = (async ({ params, locals }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) throw error(403, 'Aucun espace de travail');

	const programme = await db.query.biblioProgrammes.findFirst({
		where: and(eq(biblioProgrammes.id, params.id), eq(biblioProgrammes.workspaceId, workspaceId))
	});
	if (!programme) throw error(404, 'Programme non trouvé');

	const linkedModules = await db
		.select({
			moduleId: biblioProgrammeModules.moduleId,
			orderIndex: biblioProgrammeModules.orderIndex,
			titre: biblioModules.titre,
			dureeHeures: biblioModules.dureeHeures
		})
		.from(biblioProgrammeModules)
		.innerJoin(biblioModules, eq(biblioProgrammeModules.moduleId, biblioModules.id))
		.where(eq(biblioProgrammeModules.programmeId, params.id))
		.orderBy(asc(biblioProgrammeModules.orderIndex));

	const allModules = await db
		.select({
			id: biblioModules.id,
			titre: biblioModules.titre,
			dureeHeures: biblioModules.dureeHeures
		})
		.from(biblioModules)
		.where(eq(biblioModules.workspaceId, workspaceId))
		.orderBy(desc(biblioModules.updatedAt));

	const linkedSupports = await db
		.select({ supportId: biblioProgrammeSupports.supportId })
		.from(biblioProgrammeSupports)
		.where(eq(biblioProgrammeSupports.programmeId, params.id));

	const allSupports = await db
		.select({
			id: biblioSupports.id,
			titre: biblioSupports.titre,
			url: biblioSupports.url,
			filePath: biblioSupports.filePath
		})
		.from(biblioSupports)
		.where(eq(biblioSupports.workspaceId, workspaceId))
		.orderBy(desc(biblioSupports.updatedAt));

	return {
		programme,
		linkedModules,
		availableModules: allModules,
		linkedSupports,
		availableSupports: allSupports,
		header: {
			pageName: programme.titre,
			backButton: true,
			backButtonHref: '/bibliotheque/programmes',
			backButtonLabel: 'Programmes',
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
		const moduleIdsRaw = fd.get('moduleIds') as string;
		const supportIdsRaw = fd.get('supportIds') as string;

		let supportIds: string[];
		try {
			supportIds = supportIdsRaw ? JSON.parse(supportIdsRaw) : [];
		} catch {
			return fail(400, { message: 'supportIds invalide (JSON attendu)' });
		}

		let moduleIds: string[];
		try {
			moduleIds = moduleIdsRaw ? JSON.parse(moduleIdsRaw) : [];
		} catch {
			return fail(400, { message: 'moduleIds invalide (JSON attendu)' });
		}

		const raw = {
			titre: (fd.get('titre') as string)?.trim() ?? '',
			description: (fd.get('description') as string)?.trim() || undefined,
			modalite: (fd.get('modalite') as string) || undefined,
			prixPublic: fd.get('prixPublic') ? Number(fd.get('prixPublic')) : undefined,
			statut: (fd.get('statut') as string) || 'Brouillon',
			prerequis: (fd.get('prerequis') as string)?.trim() || undefined,
			dureeHeures: fd.get('dureeHeures') ? Number(fd.get('dureeHeures')) : undefined,
			moduleIds
		};

		const parsed = programmeSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, { message: parsed.error.errors.map((e) => e.message).join(', ') });
		}

		try {
			await db.transaction(async (tx) => {
				await tx
					.update(biblioProgrammes)
					.set({
						titre: parsed.data.titre,
						description: parsed.data.description ?? null,
						modalite: parsed.data.modalite ?? null,
						prixPublic: parsed.data.prixPublic?.toString() ?? null,
						statut: parsed.data.statut,
						prerequis:
							parsed.data.prerequis?.length ? JSON.stringify(parsed.data.prerequis) : null,
						dureeHeures: parsed.data.dureeHeures?.toString() ?? null
					})
					.where(
						and(eq(biblioProgrammes.id, params.id), eq(biblioProgrammes.workspaceId, workspaceId))
					);

				await tx
					.delete(biblioProgrammeModules)
					.where(eq(biblioProgrammeModules.programmeId, params.id));

				await tx
					.delete(biblioProgrammeSupports)
					.where(eq(biblioProgrammeSupports.programmeId, params.id));

				if (parsed.data.moduleIds.length > 0) {
					const allowedModules = await tx
						.select({ id: biblioModules.id })
						.from(biblioModules)
						.where(
							and(
								eq(biblioModules.workspaceId, workspaceId),
								inArray(biblioModules.id, parsed.data.moduleIds)
							)
						);
					const allowedModuleIds = new Set(allowedModules.map((r) => r.id));
					const invalid =
						allowedModuleIds.size !== parsed.data.moduleIds.length ||
						parsed.data.moduleIds.some((id) => !allowedModuleIds.has(id));
					if (invalid) {
						throw new Error('INVALID_MODULES');
					}
				}

				if (supportIds.length > 0) {
					const allowedSupports = await tx
						.select({ id: biblioSupports.id })
						.from(biblioSupports)
						.where(
							and(
								eq(biblioSupports.workspaceId, workspaceId),
								inArray(biblioSupports.id, supportIds)
							)
						);
					const allowedSupportIds = new Set(allowedSupports.map((r) => r.id));
					const invalid =
						allowedSupportIds.size !== supportIds.length ||
						supportIds.some((id) => !allowedSupportIds.has(id));
					if (invalid) {
						throw new Error('INVALID_SUPPORTS');
					}
				}

				if (parsed.data.moduleIds.length > 0) {
					await tx.insert(biblioProgrammeModules).values(
						parsed.data.moduleIds.map((moduleId, index) => ({
							programmeId: params.id,
							moduleId,
							orderIndex: index
						}))
					);
				}

				if (supportIds.length > 0) {
					await tx.insert(biblioProgrammeSupports).values(
						supportIds.map((supportId) => ({
							programmeId: params.id,
							supportId
						}))
					);
				}
			});
		} catch (err) {
			const msg = err instanceof Error ? err.message : '';
			if (msg === 'INVALID_MODULES') {
				return fail(400, {
					message: 'Un ou plusieurs modules n’appartiennent pas à cet espace de travail.'
				});
			}
			if (msg === 'INVALID_SUPPORTS') {
				return fail(400, {
					message: 'Un ou plusieurs supports n’appartiennent pas à cet espace de travail.'
				});
			}
			console.error('[programmes update] transaction failed', {
				error: err,
				programmeId: params.id,
				workspaceId
			});
			return fail(500, { message: 'Erreur lors de la mise à jour du programme.' });
		}

		return { success: true };
	},

	delete: async ({ locals, params }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun espace de travail' });

		await db
			.delete(biblioProgrammes)
			.where(
				and(eq(biblioProgrammes.id, params.id), eq(biblioProgrammes.workspaceId, workspaceId))
			);

		throw redirect(303, '/bibliotheque/programmes');
	}
};
