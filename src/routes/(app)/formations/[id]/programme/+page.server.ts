import { fail } from '@sveltejs/kit';
import { db } from '$lib/db';
import {
	modules,
	formations,
	biblioProgrammes,
	biblioProgrammeModules,
	biblioModules,
	biblioModuleSupports,
	biblioModuleQuestionnaires,
	moduleSupports,
	moduleQuestionnaires
} from '$lib/db/schema';
import { eq, and, sql, max } from 'drizzle-orm';
import { getUserWorkspace } from '$lib/auth';
import { logAuditEvent } from '$lib/services/audit-log';
import { checkModuleAutoComplete } from '$lib/services/quest-auto-complete';
import type { Actions, PageServerLoad } from './$types';

async function verifyFormationOwnership(formationId: string, workspaceId: string) {
	const formation = await db.query.formations.findFirst({
		where: and(eq(formations.id, formationId), eq(formations.workspaceId, workspaceId)),
		columns: { id: true }
	});
	return !!formation;
}

export const load = (async ({ parent, locals }) => {
	const parentData = await parent();
	const formationModules = parentData.formation?.modules ?? [];
	const programmeSource = parentData.formation?.programmeSource ?? null;

	const workspaceId = await getUserWorkspace(locals);
	let availableProgrammes: Array<{
		id: string;
		titre: string;
		description: string | null;
		modalite: string | null;
		dureeHeures: string | null;
		moduleCount: number;
		topicId: string | null;
		thematiqueName: string | null;
		derivedFromTitre: string | null;
	}> = [];

	if (workspaceId) {
		const programmes = await db.query.biblioProgrammes.findMany({
			where: eq(biblioProgrammes.workspaceId, workspaceId),
			columns: {
				id: true,
				titre: true,
				description: true,
				modalite: true,
				dureeHeures: true,
				topicId: true,
				derivedFromProgrammeId: true
			},
			with: {
				programmeModules: { columns: { id: true } },
				thematique: { columns: { name: true } },
				derivedFrom: { columns: { titre: true } }
			},
			orderBy: (p, { asc }) => [asc(p.titre)]
		});

		availableProgrammes = programmes.map((p) => ({
			id: p.id,
			titre: p.titre,
			description: p.description,
			modalite: p.modalite,
			dureeHeures: p.dureeHeures,
			moduleCount: p.programmeModules.length,
			topicId: p.topicId,
			thematiqueName: p.thematique?.name ?? null,
			derivedFromTitre: p.derivedFrom?.titre ?? null
		}));
	}

	return { formationModules, programmeSource, availableProgrammes, programmeSourceUpdatedSinceLink: parentData.programmeSourceUpdatedSinceLink };
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
		const contenu = (formData.get('contenu') as string)?.trim() || null;
		const modaliteEval = (formData.get('modaliteEvaluation') as string) || null;

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
					contenu,
					modaliteEvaluation: modaliteEval as typeof modules.$inferInsert.modaliteEvaluation,
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

			await checkModuleAutoComplete(params.id, user.id);
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
		const contenu = (formData.get('contenu') as string)?.trim() || null;
		const modaliteEval = (formData.get('modaliteEvaluation') as string) || null;

		if (!moduleId) return fail(400, { message: 'ID du module requis' });
		if (!name) return fail(400, { message: 'Le titre du module est requis' });

		try {
			await db
				.update(modules)
				.set({
					name,
					durationHours,
					objectifs,
					contenu,
					modaliteEvaluation: modaliteEval as typeof modules.$inferInsert.modaliteEvaluation
				})
				.where(and(eq(modules.id, moduleId), eq(modules.courseId, params.id)));

			await logAuditEvent({
				formationId: params.id,
				userId: user.id,
				actionType: 'module_updated',
				entityType: 'module',
				entityId: moduleId,
				newValue: { name, durationHours }
			});

			await checkModuleAutoComplete(params.id, user.id);
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

			await checkModuleAutoComplete(params.id, user.id);
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
			columns: {
				id: true,
				programmeSourceId: true,
				objectifs: true,
				prerequis: true,
				publicVise: true,
				prixPublic: true,
				modalite: true
			},
			with: {
				modules: {
					columns: {
						id: true,
						name: true,
						durationHours: true,
						objectifs: true,
						contenu: true,
						modaliteEvaluation: true,
						sourceModuleId: true,
						orderIndex: true
					},
					orderBy: (m, { asc }) => [asc(m.orderIndex)],
					with: {
						moduleSupports: { columns: { supportId: true } },
						moduleQuestionnaires: { columns: { questionnaireId: true } }
					}
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
					if (mod.sourceModuleId) {
						await tx
							.update(biblioModules)
							.set({
								titre: mod.name,
								dureeHeures: mod.durationHours,
								objectifsPedagogiques: mod.objectifs,
								contenu: mod.contenu,
								modaliteEvaluation: mod.modaliteEvaluation
							})
							.where(eq(biblioModules.id, mod.sourceModuleId));

						await tx
							.delete(biblioModuleSupports)
							.where(eq(biblioModuleSupports.moduleId, mod.sourceModuleId));
						if (mod.moduleSupports.length > 0) {
							await tx.insert(biblioModuleSupports).values(
								mod.moduleSupports.map((ms) => ({
									moduleId: mod.sourceModuleId!,
									supportId: ms.supportId
								}))
							);
						}

						await tx
							.delete(biblioModuleQuestionnaires)
							.where(eq(biblioModuleQuestionnaires.moduleId, mod.sourceModuleId));
						if (mod.moduleQuestionnaires.length > 0) {
							await tx.insert(biblioModuleQuestionnaires).values(
								mod.moduleQuestionnaires.map((mq) => ({
									moduleId: mod.sourceModuleId!,
									questionnaireId: mq.questionnaireId
								}))
							);
						}

						await tx.insert(biblioProgrammeModules).values({
							programmeId: formation.programmeSourceId!,
							moduleId: mod.sourceModuleId,
							orderIndex: mod.orderIndex ?? 0
						});
					} else {
						const [newBiblioModule] = await tx
							.insert(biblioModules)
							.values({
								titre: mod.name,
								dureeHeures: mod.durationHours,
								objectifsPedagogiques: mod.objectifs,
								contenu: mod.contenu,
								modaliteEvaluation: mod.modaliteEvaluation,
								workspaceId,
								createdBy: user.id
							})
							.returning({ id: biblioModules.id });

						await tx
							.update(modules)
							.set({ sourceModuleId: newBiblioModule.id })
							.where(eq(modules.id, mod.id));

						if (mod.moduleSupports.length > 0) {
							await tx.insert(biblioModuleSupports).values(
								mod.moduleSupports.map((ms) => ({
									moduleId: newBiblioModule.id,
									supportId: ms.supportId
								}))
							);
						}
						if (mod.moduleQuestionnaires.length > 0) {
							await tx.insert(biblioModuleQuestionnaires).values(
								mod.moduleQuestionnaires.map((mq) => ({
									moduleId: newBiblioModule.id,
									questionnaireId: mq.questionnaireId
								}))
							);
						}

						await tx.insert(biblioProgrammeModules).values({
							programmeId: formation.programmeSourceId!,
							moduleId: newBiblioModule.id,
							orderIndex: mod.orderIndex ?? 0
						});
					}
				}

				const totalHours = formation.modules.reduce(
					(sum, m) => sum + (m.durationHours ? Number(m.durationHours) : 0),
					0
				);
				await tx
					.update(biblioProgrammes)
					.set({
						dureeHeures: String(totalHours),
						objectifs: formation.objectifs,
						prerequis: formation.prerequis,
						publicVise: formation.publicVise,
						prixPublic: formation.prixPublic,
						modalite: formation.modalite
					})
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
			columns: {
				id: true,
				name: true,
				programmeSourceId: true,
				objectifs: true,
				prerequis: true,
				publicVise: true,
				prixPublic: true,
				modalite: true,
				topicId: true
			},
			with: {
				modules: {
					columns: {
						id: true,
						name: true,
						durationHours: true,
						objectifs: true,
						contenu: true,
						modaliteEvaluation: true,
						orderIndex: true
					},
					orderBy: (m, { asc }) => [asc(m.orderIndex)],
					with: {
						moduleSupports: { columns: { supportId: true } },
						moduleQuestionnaires: { columns: { questionnaireId: true } }
					}
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
					objectifs: formation.objectifs,
					prerequis: formation.prerequis,
					publicVise: formation.publicVise,
					prixPublic: formation.prixPublic,
					modalite: formation.modalite,
					topicId: formation.topicId,
					derivedFromProgrammeId: formation.programmeSourceId,
					workspaceId,
					createdBy: user.id
				})
				.returning({ id: biblioProgrammes.id });

			for (const mod of formation.modules) {
				const [newBiblioModule] = await db
					.insert(biblioModules)
					.values({
						titre: mod.name,
						dureeHeures: mod.durationHours,
						objectifsPedagogiques: mod.objectifs,
						contenu: mod.contenu,
						modaliteEvaluation: mod.modaliteEvaluation,
						workspaceId,
						createdBy: user.id
					})
					.returning({ id: biblioModules.id });

				await db.insert(biblioProgrammeModules).values({
					programmeId: programme.id,
					moduleId: newBiblioModule.id,
					orderIndex: mod.orderIndex ?? 0
				});

				if (mod.moduleSupports.length > 0) {
					await db.insert(biblioModuleSupports).values(
						mod.moduleSupports.map((ms) => ({
							moduleId: newBiblioModule.id,
							supportId: ms.supportId
						}))
					);
				}
				if (mod.moduleQuestionnaires.length > 0) {
					await db.insert(biblioModuleQuestionnaires).values(
						mod.moduleQuestionnaires.map((mq) => ({
							moduleId: newBiblioModule.id,
							questionnaireId: mq.questionnaireId
						}))
					);
				}

				await db
					.update(modules)
					.set({ sourceModuleId: newBiblioModule.id })
					.where(eq(modules.id, mod.id));
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

	attachProgramme: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		if (!(await verifyFormationOwnership(params.id, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const programmeId = formData.get('programmeId') as string;
		const collisionMode = (formData.get('collisionMode') as string) || 'replace';

		if (!programmeId) return fail(400, { message: 'ID du programme requis' });
		if (collisionMode === 'cancel') return { success: true };

		try {
			const programme = await db.query.biblioProgrammes.findFirst({
				where: and(
					eq(biblioProgrammes.id, programmeId),
					eq(biblioProgrammes.workspaceId, workspaceId)
				),
				columns: {
					id: true,
					objectifs: true,
					prerequis: true,
					publicVise: true,
					prixPublic: true,
					modalite: true,
					dureeHeures: true
				},
				with: {
					programmeModules: {
						orderBy: (pm, { asc }) => [asc(pm.orderIndex)],
						with: {
							module: {
								columns: {
									id: true,
									titre: true,
									contenu: true,
									objectifsPedagogiques: true,
									modaliteEvaluation: true,
									dureeHeures: true
								},
								with: {
									biblioModuleSupports: { columns: { supportId: true } },
									biblioModuleQuestionnaires: { columns: { questionnaireId: true } }
								}
							}
						}
					}
				}
			});

			if (!programme) return fail(404, { message: 'Programme introuvable' });

			await db.transaction(async (tx) => {
				let startIndex = 0;

				if (collisionMode === 'replace') {
					await tx.delete(modules).where(eq(modules.courseId, params.id));
				} else if (collisionMode === 'append') {
					const [maxRow] = await tx
						.select({ maxIdx: max(modules.orderIndex) })
						.from(modules)
						.where(eq(modules.courseId, params.id));
					startIndex = (maxRow?.maxIdx ?? -1) + 1;
				}

				for (let i = 0; i < programme.programmeModules.length; i++) {
					const pm = programme.programmeModules[i];
					const bm = pm.module;

					const [created] = await tx
						.insert(modules)
						.values({
							name: bm.titre,
							durationHours: bm.dureeHeures,
							objectifs: bm.objectifsPedagogiques,
							contenu: bm.contenu,
							modaliteEvaluation: bm.modaliteEvaluation,
							sourceModuleId: bm.id,
							orderIndex: startIndex + i,
							courseId: params.id,
							createdBy: user.id
						})
						.returning({ id: modules.id });

					if (bm.biblioModuleSupports.length > 0) {
						await tx.insert(moduleSupports).values(
							bm.biblioModuleSupports.map((bs) => ({
								moduleId: created.id,
								supportId: bs.supportId
							}))
						);
					}
					if (bm.biblioModuleQuestionnaires.length > 0) {
						await tx.insert(moduleQuestionnaires).values(
							bm.biblioModuleQuestionnaires.map((bq) => ({
								moduleId: created.id,
								questionnaireId: bq.questionnaireId
							}))
						);
					}
				}

				const formationUpdate: Record<string, unknown> = {
					programmeSourceId: programmeId
				};
				const currentFormation = await tx.query.formations.findFirst({
					where: eq(formations.id, params.id),
					columns: {
						objectifs: true,
						prerequis: true,
						publicVise: true,
						prixPublic: true,
						modalite: true,
						duree: true
					}
				});
				if (!currentFormation?.objectifs && programme.objectifs)
					formationUpdate.objectifs = programme.objectifs;
				if (!currentFormation?.prerequis && programme.prerequis)
					formationUpdate.prerequis = programme.prerequis;
				if (!currentFormation?.publicVise && programme.publicVise)
					formationUpdate.publicVise = programme.publicVise;
				if (!currentFormation?.prixPublic && programme.prixPublic)
					formationUpdate.prixPublic = programme.prixPublic;
				if (!currentFormation?.modalite && programme.modalite)
					formationUpdate.modalite = programme.modalite;
				if (!currentFormation?.duree && programme.dureeHeures)
					formationUpdate.duree = Number(programme.dureeHeures);

				await tx
					.update(formations)
					.set(formationUpdate)
					.where(eq(formations.id, params.id));
			});

			await logAuditEvent({
				formationId: params.id,
				userId: user.id,
				actionType: 'programme_attached',
				entityType: 'biblio_programme',
				entityId: programmeId,
				newValue: { collisionMode }
			});

			await checkModuleAutoComplete(params.id, user.id);
			return { success: true };
		} catch (e) {
			console.error('[attachProgramme]', e);
			return fail(500, { message: 'Erreur lors de l\'association du programme' });
		}
	},

	pullFromSource: async ({ locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		const formation = await db.query.formations.findFirst({
			where: and(eq(formations.id, params.id), eq(formations.workspaceId, workspaceId)),
			columns: { id: true, programmeSourceId: true }
		});

		if (!formation) return fail(403, { message: 'Accès refusé' });
		if (!formation.programmeSourceId) {
			return fail(400, { message: 'Aucun programme source lié' });
		}

		try {
			const programme = await db.query.biblioProgrammes.findFirst({
				where: eq(biblioProgrammes.id, formation.programmeSourceId),
				columns: {
					id: true,
					objectifs: true,
					prerequis: true,
					publicVise: true,
					prixPublic: true,
					modalite: true,
					dureeHeures: true
				},
				with: {
					programmeModules: {
						orderBy: (pm, { asc }) => [asc(pm.orderIndex)],
						with: {
							module: {
								columns: {
									id: true,
									titre: true,
									contenu: true,
									objectifsPedagogiques: true,
									modaliteEvaluation: true,
									dureeHeures: true
								},
								with: {
									biblioModuleSupports: { columns: { supportId: true } },
									biblioModuleQuestionnaires: { columns: { questionnaireId: true } }
								}
							}
						}
					}
				}
			});

			if (!programme) {
				return fail(404, { message: 'Programme source introuvable' });
			}

			await db.transaction(async (tx) => {
				await tx.delete(modules).where(eq(modules.courseId, params.id));

				for (let i = 0; i < programme.programmeModules.length; i++) {
					const pm = programme.programmeModules[i];
					const bm = pm.module;

					const [created] = await tx
						.insert(modules)
						.values({
							name: bm.titre,
							durationHours: bm.dureeHeures,
							objectifs: bm.objectifsPedagogiques,
							contenu: bm.contenu,
							modaliteEvaluation: bm.modaliteEvaluation,
							sourceModuleId: bm.id,
							orderIndex: i,
							courseId: params.id,
							createdBy: user.id
						})
						.returning({ id: modules.id });

					if (bm.biblioModuleSupports.length > 0) {
						await tx.insert(moduleSupports).values(
							bm.biblioModuleSupports.map((bs) => ({
								moduleId: created.id,
								supportId: bs.supportId
							}))
						);
					}
					if (bm.biblioModuleQuestionnaires.length > 0) {
						await tx.insert(moduleQuestionnaires).values(
							bm.biblioModuleQuestionnaires.map((bq) => ({
								moduleId: created.id,
								questionnaireId: bq.questionnaireId
							}))
						);
					}
				}

				await tx
					.update(formations)
					.set({
						objectifs: programme.objectifs,
						prerequis: programme.prerequis,
						publicVise: programme.publicVise,
						prixPublic: programme.prixPublic,
						modalite: programme.modalite,
						duree: programme.dureeHeures ? Number(programme.dureeHeures) : null
					})
					.where(eq(formations.id, params.id));
			});

			await logAuditEvent({
				formationId: params.id,
				userId: user.id,
				actionType: 'programme_pulled_from_source',
				entityType: 'biblio_programme',
				entityId: formation.programmeSourceId
			});

			await checkModuleAutoComplete(params.id, user.id);
			return { success: true };
		} catch (e) {
			console.error('[pullFromSource]', e);
			return fail(500, { message: 'Erreur lors de la mise à jour depuis la source' });
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
