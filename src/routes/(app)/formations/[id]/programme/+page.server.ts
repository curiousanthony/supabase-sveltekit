import { fail } from '@sveltejs/kit';
import { db } from '$lib/db';
import {
	modules,
	formations,
	biblioProgrammes,
	biblioProgrammeModules,
	biblioModules
} from '$lib/db/schema';
import { eq, and, sql, max } from 'drizzle-orm';
import { getUserWorkspace } from '$lib/auth';
import { logAuditEvent } from '$lib/services/audit-log';
import type { Actions, PageServerLoad } from './$types';

async function verifyFormationOwnership(formationId: string, workspaceId: string) {
	const formation = await db.query.formations.findFirst({
		where: and(eq(formations.id, formationId), eq(formations.workspaceId, workspaceId)),
		columns: { id: true }
	});
	return !!formation;
}

export const load = (async ({ parent }) => {
	const parentData = await parent();
	const formationModules = parentData.formation?.modules ?? [];
	const programmeSource = parentData.formation?.programmeSource ?? null;
	return { formationModules, programmeSource };
}) satisfies PageServerLoad;

export const actions: Actions = {
	addModule: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		if (!(await verifyFormationOwnership(params.id, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const name = (formData.get('name') as string)?.trim();
		const durationHours = (formData.get('durationHours') as string) || null;
		const objectifs = (formData.get('objectifs') as string)?.trim() || null;

		if (!name) return fail(400, { message: 'Le titre du module est requis' });

		try {
			const [maxRow] = await db
				.select({ maxIdx: max(modules.orderIndex) })
				.from(modules)
				.where(eq(modules.courseId, params.id));
			const nextIndex = (maxRow?.maxIdx ?? -1) + 1;

			const [created] = await db
				.insert(modules)
				.values({
					name,
					durationHours,
					objectifs,
					orderIndex: nextIndex,
					courseId: params.id,
					createdBy: user.id
				})
				.returning({ id: modules.id });

			await logAuditEvent({
				formationId: params.id,
				userId: user.id,
				actionType: 'module_created',
				entityType: 'module',
				entityId: created.id,
				newValue: { name, durationHours }
			});

			return { success: true, moduleId: created.id };
		} catch (e) {
			console.error('[addModule]', e);
			return fail(500, { message: 'Erreur lors de la création du module' });
		}
	},

	updateModule: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		if (!(await verifyFormationOwnership(params.id, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const moduleId = formData.get('moduleId') as string;
		const name = (formData.get('name') as string)?.trim();
		const durationHours = (formData.get('durationHours') as string) || null;
		const objectifs = (formData.get('objectifs') as string)?.trim() || null;

		if (!moduleId) return fail(400, { message: 'ID du module requis' });
		if (!name) return fail(400, { message: 'Le titre du module est requis' });

		try {
			await db
				.update(modules)
				.set({ name, durationHours, objectifs })
				.where(and(eq(modules.id, moduleId), eq(modules.courseId, params.id)));

			await logAuditEvent({
				formationId: params.id,
				userId: user.id,
				actionType: 'module_updated',
				entityType: 'module',
				entityId: moduleId,
				newValue: { name, durationHours }
			});

			return { success: true };
		} catch (e) {
			console.error('[updateModule]', e);
			return fail(500, { message: 'Erreur lors de la mise à jour du module' });
		}
	},

	deleteModule: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		if (!(await verifyFormationOwnership(params.id, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const moduleId = formData.get('moduleId') as string;
		if (!moduleId) return fail(400, { message: 'ID du module requis' });

		try {
			const affectedSessions = await db
				.select({ id: sql<string>`id` })
				.from(sql`seances`)
				.where(sql`module_id = ${moduleId}`);

			await db
				.delete(modules)
				.where(and(eq(modules.id, moduleId), eq(modules.courseId, params.id)));

			await logAuditEvent({
				formationId: params.id,
				userId: user.id,
				actionType: 'module_deleted',
				entityType: 'module',
				entityId: moduleId
			});

			return { success: true, affectedSessionsCount: affectedSessions.length };
		} catch (e) {
			console.error('[deleteModule]', e);
			return fail(500, { message: 'Erreur lors de la suppression du module' });
		}
	},

	reorderModules: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		if (!(await verifyFormationOwnership(params.id, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const rawOrder = formData.get('order') as string;
		if (!rawOrder) return fail(400, { message: 'Ordre requis' });

		let order: Array<{ id: string; orderIndex: number }>;
		try {
			order = JSON.parse(rawOrder);
		} catch {
			return fail(400, { message: 'Format invalide' });
		}

		try {
			await db.transaction(async (tx) => {
				for (const item of order) {
					await tx
						.update(modules)
						.set({ orderIndex: item.orderIndex })
						.where(and(eq(modules.id, item.id), eq(modules.courseId, params.id)));
				}
			});

			await logAuditEvent({
				formationId: params.id,
				userId: user.id,
				actionType: 'modules_reordered',
				entityType: 'module'
			});

			return { success: true };
		} catch (e) {
			console.error('[reorderModules]', e);
			return fail(500, { message: 'Erreur lors du réordonnancement' });
		}
	},

	syncToSource: async ({ locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		const formation = await db.query.formations.findFirst({
			where: and(eq(formations.id, params.id), eq(formations.workspaceId, workspaceId)),
			columns: { id: true, programmeSourceId: true },
			with: {
				modules: {
					columns: { id: true, name: true, durationHours: true, objectifs: true, orderIndex: true },
					orderBy: (m, { asc }) => [asc(m.orderIndex)]
				}
			}
		});

		if (!formation) return fail(403, { message: 'Accès refusé' });
		if (!formation.programmeSourceId) {
			return fail(400, { message: 'Aucun programme source lié' });
		}

		try {
			await db.transaction(async (tx) => {
				await tx
					.delete(biblioProgrammeModules)
					.where(eq(biblioProgrammeModules.programmeId, formation.programmeSourceId!));

				for (const mod of formation.modules) {
					let [existing] = await tx
						.select({ id: biblioModules.id })
						.from(biblioModules)
						.where(
							and(
								eq(biblioModules.titre, mod.name),
								eq(biblioModules.workspaceId, workspaceId)
							)
						)
						.limit(1);

					if (!existing) {
						[existing] = await tx
							.insert(biblioModules)
							.values({
								titre: mod.name,
								dureeHeures: mod.durationHours,
								objectifsPedagogiques: mod.objectifs,
								workspaceId,
								createdBy: user.id
							})
							.returning({ id: biblioModules.id });
					}

					await tx.insert(biblioProgrammeModules).values({
						programmeId: formation.programmeSourceId!,
						moduleId: existing.id,
						orderIndex: mod.orderIndex ?? 0
					});
				}

				const totalHours = formation.modules.reduce(
					(sum, m) => sum + (m.durationHours ? Number(m.durationHours) : 0),
					0
				);
				await tx
					.update(biblioProgrammes)
					.set({ dureeHeures: String(totalHours) })
					.where(eq(biblioProgrammes.id, formation.programmeSourceId!));
			});

			await logAuditEvent({
				formationId: params.id,
				userId: user.id,
				actionType: 'programme_synced_to_source',
				entityType: 'biblio_programme',
				entityId: formation.programmeSourceId
			});

			return { success: true };
		} catch (e) {
			console.error('[syncToSource]', e);
			return fail(500, { message: 'Erreur lors de la synchronisation' });
		}
	},

	createNewProgramme: async ({ locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		const formation = await db.query.formations.findFirst({
			where: and(eq(formations.id, params.id), eq(formations.workspaceId, workspaceId)),
			columns: { id: true, name: true },
			with: {
				modules: {
					columns: { id: true, name: true, durationHours: true, objectifs: true, orderIndex: true },
					orderBy: (m, { asc }) => [asc(m.orderIndex)]
				}
			}
		});

		if (!formation) return fail(403, { message: 'Accès refusé' });
		if (formation.modules.length === 0) {
			return fail(400, { message: 'Aucun module à sauvegarder' });
		}

		try {
			const totalHours = formation.modules.reduce(
				(sum, m) => sum + (m.durationHours ? Number(m.durationHours) : 0),
				0
			);

			const [programme] = await db
				.insert(biblioProgrammes)
				.values({
					titre: formation.name ?? 'Programme sans titre',
					dureeHeures: String(totalHours),
					workspaceId,
					createdBy: user.id
				})
				.returning({ id: biblioProgrammes.id });

			for (const mod of formation.modules) {
				let [existing] = await db
					.select({ id: biblioModules.id })
					.from(biblioModules)
					.where(
						and(
							eq(biblioModules.titre, mod.name),
							eq(biblioModules.workspaceId, workspaceId)
						)
					)
					.limit(1);

				if (!existing) {
					[existing] = await db
						.insert(biblioModules)
						.values({
							titre: mod.name,
							dureeHeures: mod.durationHours,
							objectifsPedagogiques: mod.objectifs,
							workspaceId,
							createdBy: user.id
						})
						.returning({ id: biblioModules.id });
				}

				await db.insert(biblioProgrammeModules).values({
					programmeId: programme.id,
					moduleId: existing.id,
					orderIndex: mod.orderIndex ?? 0
				});
			}

			await db
				.update(formations)
				.set({ programmeSourceId: programme.id })
				.where(eq(formations.id, params.id));

			await logAuditEvent({
				formationId: params.id,
				userId: user.id,
				actionType: 'programme_created_from_formation',
				entityType: 'biblio_programme',
				entityId: programme.id
			});

			return { success: true, programmeId: programme.id };
		} catch (e) {
			console.error('[createNewProgramme]', e);
			return fail(500, { message: 'Erreur lors de la création du programme' });
		}
	},

	detachProgramme: async ({ locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		if (!(await verifyFormationOwnership(params.id, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		try {
			await db
				.update(formations)
				.set({ programmeSourceId: null })
				.where(eq(formations.id, params.id));

			await logAuditEvent({
				formationId: params.id,
				userId: user.id,
				actionType: 'programme_detached',
				entityType: 'formation',
				entityId: params.id
			});

			return { success: true };
		} catch (e) {
			console.error('[detachProgramme]', e);
			return fail(500, { message: 'Erreur lors du détachement' });
		}
	}
};
