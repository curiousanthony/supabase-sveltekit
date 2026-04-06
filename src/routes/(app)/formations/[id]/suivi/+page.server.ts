import { db } from '$lib/db';
import {
	formationActions,
	questSubActions,
	questDocuments,
	questComments,
	formations,
	formationFormateurs,
	workspaces
} from '$lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { getUserWorkspace } from '$lib/auth';
import { shouldAutoAdvanceStatus, getQuestTemplate } from '$lib/formation-quests';
import { getDependencyLockType } from '$lib/formation-quest-locks';
import {
	uploadQuestDocument,
	deleteQuestDocument,
	getQuestDocumentUrl,
	validateFileType
} from '$lib/services/document-service';
import { generateDocument, type DocumentType } from '$lib/services/document-generator';
import { sendFormationTemplateEmail, EMAIL_TYPE_TO_TEMPLATE } from '$lib/services/email-service';
import type { Actions } from './$types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function verifyActionOwnership(actionId: string, workspaceId: string) {
	const action = await db.query.formationActions.findFirst({
		where: eq(formationActions.id, actionId),
		columns: { id: true, formationId: true },
		with: { formation: { columns: { workspaceId: true } } }
	});
	if (!action?.formation || action.formation.workspaceId !== workspaceId) return null;
	return action;
}

async function ensureActionStarted(actionId: string) {
	const action = await db.query.formationActions.findFirst({
		where: eq(formationActions.id, actionId),
		columns: { id: true, status: true }
	});
	if (action?.status === 'Pas commencé') {
		await db
			.update(formationActions)
			.set({ status: 'En cours' })
			.where(eq(formationActions.id, actionId));
	}
}

async function autoCompleteQuestIfDone(
	actionId: string,
	userId: string,
	formationId: string,
	workspaceId: string
) {
	const subs = await db.query.questSubActions.findMany({
		where: eq(questSubActions.formationActionId, actionId),
		columns: { completed: true }
	});
	if (subs.length > 0 && subs.every((s) => s.completed)) {
		await db
			.update(formationActions)
			.set({
				status: 'Terminé',
				completedAt: new Date().toISOString(),
				completedBy: userId
			})
			.where(eq(formationActions.id, actionId));

		await tryAdvanceFormationStatus(formationId, workspaceId);
	}
}

async function tryAdvanceFormationStatus(formationId: string, workspaceId: string) {
	const allActions = await db.query.formationActions.findMany({
		where: eq(formationActions.formationId, formationId),
		columns: { status: true, questKey: true, phase: true }
	});
	const formation = await db.query.formations.findFirst({
		where: and(eq(formations.id, formationId), eq(formations.workspaceId, workspaceId)),
		columns: { statut: true, typeFinancement: true }
	});
	if (formation) {
		const hasFunding =
			!!formation.typeFinancement && ['OPCO', 'CPF'].includes(formation.typeFinancement);
		const next = shouldAutoAdvanceStatus(
			allActions,
			formation.statut as Parameters<typeof shouldAutoAdvanceStatus>[1],
			hasFunding
		);
		if (next) {
			await db.update(formations).set({ statut: next }).where(eq(formations.id, formationId));
		}
	}
}

async function markSubActionComplete(subActionId: string, userId: string) {
	await db
		.update(questSubActions)
		.set({
			completed: true,
			completedAt: new Date().toISOString(),
			completedBy: userId
		})
		.where(eq(questSubActions.id, subActionId));
}

export const actions: Actions = {
	updateQuestStatus: async ({ request, params, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		const formData = await request.formData();
		const actionId = formData.get('actionId');
		const newStatus = formData.get('newStatus');
		if (!actionId || typeof actionId !== 'string' || !newStatus || typeof newStatus !== 'string') {
			return fail(400, { message: 'Données manquantes' });
		}

		const action = await verifyActionOwnership(actionId, workspaceId);
		if (!action) return fail(403, { message: 'Accès refusé' });

		const currentAction = await db.query.formationActions.findFirst({
			where: eq(formationActions.id, actionId),
			columns: { questKey: true, formationId: true, status: true }
		});

		const isReopening = currentAction?.status === 'Terminé' && newStatus === 'En cours';

		if (
			currentAction?.questKey &&
			(newStatus === 'En cours' || newStatus === 'Terminé') &&
			!isReopening
		) {
			const template = getQuestTemplate(currentAction.questKey);
			if (template && template.dependencies.length > 0) {
				const siblingActions = await db.query.formationActions.findMany({
					where: eq(formationActions.formationId, currentAction.formationId),
					columns: { questKey: true, status: true, title: true, softLockOverriddenAt: true }
				});

				const currentSibling = siblingActions.find((a) => a.questKey === currentAction.questKey);
				const isSoftLockOverridden = !!currentSibling?.softLockOverriddenAt;

				for (const depKey of template.dependencies) {
					const dep = siblingActions.find((a) => a.questKey === depKey);
					if (dep && dep.status !== 'Terminé') {
						const lockType = getDependencyLockType(currentAction.questKey, depKey);
						if (lockType === 'hard') {
							return fail(400, { message: `Prérequis non terminé : ${dep.title}` });
						}
						if (lockType === 'soft' && !isSoftLockOverridden) {
							return fail(400, { message: `Prérequis non terminé : ${dep.title}` });
						}
					}
				}
			}
		}

		let isAnticipated = false;
		if (newStatus === 'Terminé' && currentAction?.questKey) {
			const template = getQuestTemplate(currentAction.questKey);
			if (template) {
				const siblingActions = await db.query.formationActions.findMany({
					where: eq(formationActions.formationId, currentAction.formationId),
					columns: { questKey: true, status: true, softLockOverriddenAt: true }
				});
				const currentSibling = siblingActions.find((a) => a.questKey === currentAction.questKey);
				if (currentSibling?.softLockOverriddenAt) {
					const hasUnmetSoftDep = template.dependencies.some((depKey) => {
						const dep = siblingActions.find((a) => a.questKey === depKey);
						const lockType = getDependencyLockType(currentAction.questKey!, depKey);
						return dep && dep.status !== 'Terminé' && lockType === 'soft';
					});
					if (hasUnmetSoftDep) isAnticipated = true;
				}
			}
		}

		const forceComplete = formData.get('forceComplete') === 'true';

		if (newStatus === 'Terminé') {
			const subs = await db.query.questSubActions.findMany({
				where: eq(questSubActions.formationActionId, actionId),
				columns: { id: true, completed: true }
			});
			if (subs.length > 0 && !subs.every((s) => s.completed)) {
				if (forceComplete) {
					for (const sub of subs.filter((s) => !s.completed)) {
						await db
							.update(questSubActions)
							.set({ completed: true })
							.where(eq(questSubActions.id, sub.id));
					}
				} else {
					return fail(400, { message: 'Toutes les sous-tâches doivent être complétées' });
				}
			}
		}

		const updateData: Record<string, unknown> = { status: newStatus };
		if (newStatus === 'Terminé') {
			updateData.completedAt = new Date().toISOString();
			updateData.completedBy = user.id;
			updateData.anticipatedAt = isAnticipated ? new Date().toISOString() : undefined;
		} else {
			updateData.completedAt = null;
			updateData.completedBy = null;
		}

		await db.update(formationActions).set(updateData).where(eq(formationActions.id, actionId));
		await tryAdvanceFormationStatus(params.id, workspaceId);

		return { success: true };
	},

	overrideSoftLock: async ({ request, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const formData = await request.formData();
		const actionId = formData.get('actionId')?.toString();
		if (!actionId || !UUID_RE.test(actionId)) return fail(400, { message: 'ID action invalide' });
		const action = await verifyActionOwnership(actionId, workspaceId);
		if (!action) return fail(404, { message: 'Action non trouvée' });

		await db
			.update(formationActions)
			.set({ softLockOverriddenAt: new Date().toISOString() })
			.where(eq(formationActions.id, actionId));

		return { success: true };
	},

	markWaiting: async ({ request, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const formData = await request.formData();
		const actionId = formData.get('actionId')?.toString();
		if (!actionId || !UUID_RE.test(actionId)) return fail(400, { message: 'ID action invalide' });
		const action = await verifyActionOwnership(actionId, workspaceId);
		if (!action) return fail(404, { message: 'Action non trouvée' });

		await db
			.update(formationActions)
			.set({ waitStartedAt: new Date().toISOString(), status: 'En cours' })
			.where(eq(formationActions.id, actionId));

		return { success: true };
	},

	recordReminder: async ({ request, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const formData = await request.formData();
		const actionId = formData.get('actionId')?.toString();
		if (!actionId || !UUID_RE.test(actionId)) return fail(400, { message: 'ID action invalide' });
		const action = await verifyActionOwnership(actionId, workspaceId);
		if (!action) return fail(404, { message: 'Action non trouvée' });

		await db
			.update(formationActions)
			.set({ lastRemindedAt: new Date().toISOString() })
			.where(eq(formationActions.id, actionId));

		return { success: true };
	},

	clearWaiting: async ({ request, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const formData = await request.formData();
		const actionId = formData.get('actionId')?.toString();
		if (!actionId || !UUID_RE.test(actionId)) return fail(400, { message: 'ID action invalide' });
		const action = await verifyActionOwnership(actionId, workspaceId);
		if (!action) return fail(404, { message: 'Action non trouvée' });

		await db
			.update(formationActions)
			.set({ waitStartedAt: null })
			.where(eq(formationActions.id, actionId));

		return { success: true };
	},

	toggleSubAction: async ({ request, params, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		const formData = await request.formData();
		const subActionId = formData.get('subActionId');
		const completed = formData.get('completed') === 'true';
		if (!subActionId || typeof subActionId !== 'string') {
			return fail(400, { message: 'Données manquantes' });
		}

		const subAction = await db.query.questSubActions.findFirst({
			where: eq(questSubActions.id, subActionId),
			columns: { id: true, formationActionId: true }
		});
		if (!subAction) return fail(404, { message: 'Sous-action introuvable' });

		const ownerCheck = await verifyActionOwnership(subAction.formationActionId, workspaceId);
		if (!ownerCheck) return fail(403, { message: 'Accès refusé' });

		const parentAction = await db.query.formationActions.findFirst({
			where: eq(formationActions.id, subAction.formationActionId),
			columns: { status: true }
		});
		if (parentAction?.status === 'Terminé') {
			return fail(400, { message: "Rouvrez l'action avant de modifier les sous-tâches" });
		}

		await ensureActionStarted(subAction.formationActionId);

		await db
			.update(questSubActions)
			.set({
				completed,
				completedAt: completed ? new Date().toISOString() : null,
				completedBy: completed ? user.id : null
			})
			.where(eq(questSubActions.id, subActionId));

		if (completed) {
			await autoCompleteQuestIfDone(subAction.formationActionId, user.id, params.id, workspaceId);
		}

		return { success: true };
	},

	updateFormationField: async ({ request, params, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		const formData = await request.formData();
		const field = formData.get('field');
		const rawValue = formData.get('value');
		const subActionId = formData.get('subActionId');

		if (!field || typeof field !== 'string') {
			return fail(400, { message: 'Champ requis' });
		}

		const allowedFields = [
			'name',
			'description',
			'type',
			'modalite',
			'duree',
			'codeRncp',
			'dateDebut',
			'dateFin',
			'location',
			'clientId',
			'companyId',
			'topicId',
			'subtopicsIds',
			'typeFinancement',
			'montantAccorde',
			'financementAccorde',
			'tjmFormateur'
		];

		if (!allowedFields.includes(field)) {
			return fail(400, { message: 'Champ non autorisé' });
		}

		const existing = await db.query.formations.findFirst({
			where: eq(formations.id, params.id),
			columns: { workspaceId: true }
		});
		if (!existing || existing.workspaceId !== workspaceId) {
			return fail(404, { message: 'Formation introuvable' });
		}

		const value = rawValue != null && typeof rawValue === 'string' ? rawValue : null;
		let processedValue: string | number | boolean | null = value;
		if (field === 'duree') {
			processedValue = value
				? Number.isFinite(parseInt(value, 10))
					? parseInt(value, 10)
					: null
				: null;
		}
		if (field === 'financementAccorde') processedValue = value === 'true';
		if (field === 'montantAccorde' || field === 'tjmFormateur') {
			const num = value ? parseFloat(value) : NaN;
			processedValue = Number.isFinite(num) ? num : null;
		}
		if (['dateDebut', 'dateFin'].includes(field)) processedValue = value || null;
		if (['clientId', 'companyId', 'topicId', 'subtopicsIds'].includes(field)) {
			processedValue = value && UUID_RE.test(value) ? value : null;
		}
		if (value === '' || value === null) processedValue = null;

		await db
			.update(formations)
			.set({ [field]: processedValue })
			.where(eq(formations.id, params.id));

		if (subActionId && typeof subActionId === 'string') {
			const sa = await db.query.questSubActions.findFirst({
				where: eq(questSubActions.id, subActionId),
				columns: { id: true, formationActionId: true, completed: true }
			});
			if (sa && !sa.completed) {
				await ensureActionStarted(sa.formationActionId);
				await markSubActionComplete(subActionId, user.id);
				await autoCompleteQuestIfDone(sa.formationActionId, user.id, params.id, workspaceId);
			}
		}

		return { success: true };
	},

	generateQuestDocument: async ({ request, params, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		const formation = await db.query.formations.findFirst({
			where: and(eq(formations.id, params.id), eq(formations.workspaceId, workspaceId)),
			columns: { id: true }
		});
		if (!formation) return fail(404, { message: 'Formation introuvable' });

		const formData = await request.formData();
		const documentType = formData.get('documentType') as DocumentType | null;
		const subActionId = formData.get('subActionId');
		const contactId = formData.get('contactId');
		const formateurId = formData.get('formateurId');

		if (!documentType || typeof documentType !== 'string') {
			return fail(400, { message: 'Type de document requis' });
		}

		try {
			const result = await generateDocument(documentType as DocumentType, params.id, user.id, {
				contactId: contactId && typeof contactId === 'string' ? contactId : undefined,
				formateurId: formateurId && typeof formateurId === 'string' ? formateurId : undefined
			});

			if (subActionId && typeof subActionId === 'string') {
				const sa = await db.query.questSubActions.findFirst({
					where: eq(questSubActions.id, subActionId),
					columns: { id: true, formationActionId: true, completed: true }
				});
				if (sa && !sa.completed) {
					await ensureActionStarted(sa.formationActionId);
					await markSubActionComplete(subActionId, user.id);
					await autoCompleteQuestIfDone(sa.formationActionId, user.id, params.id, workspaceId);
				}
			}

			return { success: true, documentId: result.documentId };
		} catch (err) {
			return fail(500, {
				message: err instanceof Error ? err.message : 'Erreur lors de la génération'
			});
		}
	},

	sendQuestEmail: async ({ request, params, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		const formData = await request.formData();
		const emailType = formData.get('emailType');
		const recipientType = formData.get('recipientType');
		const recipientEmail = formData.get('recipientEmail');
		const recipientName = formData.get('recipientName');
		const subject = formData.get('subject');
		const subActionId = formData.get('subActionId');

		if (
			!emailType ||
			typeof emailType !== 'string' ||
			!recipientType ||
			typeof recipientType !== 'string' ||
			!recipientEmail ||
			typeof recipientEmail !== 'string'
		) {
			return fail(400, { message: 'Données manquantes' });
		}

		const formation = await db.query.formations.findFirst({
			where: and(eq(formations.id, params.id), eq(formations.workspaceId, workspaceId)),
			columns: { name: true, dateDebut: true }
		});
		if (!formation) return fail(404, { message: 'Formation introuvable' });

		const ws = await db.query.workspaces.findFirst({
			where: eq(workspaces.id, workspaceId),
			columns: { name: true, logoUrl: true, address: true, city: true, postalCode: true }
		});
		const workspaceName = ws?.name ?? '';
		const workspaceLogoUrl = ws?.logoUrl ?? '';
		const workspaceAddress = [ws?.address, ws?.postalCode, ws?.city].filter(Boolean).join(', ');

		const templateAlias = EMAIL_TYPE_TO_TEMPLATE[emailType];

		try {
			const sendResult = await sendFormationTemplateEmail(
				{
					to: recipientEmail,
					toName: typeof recipientName === 'string' ? recipientName : undefined,
					templateAlias: templateAlias ?? 'analyse-besoins',
					templateModel: {
						recipientName: (typeof recipientName === 'string' ? recipientName : null) ?? 'Madame, Monsieur',
						formationName: formation.name ?? 'Formation',
						sessionDate: formation.dateDebut
							? new Date(formation.dateDebut).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
							: '',
						workspaceName,
						workspaceLogoUrl,
						workspaceAddress,
						hasAttachment: false
					},
					tag: emailType
				},
				params.id,
				{ type: emailType, recipientType, createdBy: user.id }
			);

			if (sendResult.sendStatus !== 'sent') {
				return fail(502, {
					message:
						sendResult.providerError?.slice(0, 280) ??
						(sendResult.sendStatus === 'logged'
							? 'Envoi e-mail non configuré (jeton Postmark manquant).'
							: "L'e-mail n'a pas pu être envoyé.")
				});
			}

			if (subActionId && typeof subActionId === 'string') {
				const sa = await db.query.questSubActions.findFirst({
					where: eq(questSubActions.id, subActionId),
					columns: { id: true, formationActionId: true, completed: true }
				});
				if (sa && !sa.completed) {
					await ensureActionStarted(sa.formationActionId);
					await markSubActionComplete(subActionId, user.id);
					await autoCompleteQuestIfDone(sa.formationActionId, user.id, params.id, workspaceId);
				}
			}

			return { success: true };
		} catch (err) {
			return fail(500, {
				message: err instanceof Error ? err.message : "Erreur lors de l'envoi"
			});
		}
	},

	assignFormateur: async ({ request, params, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		const formData = await request.formData();
		const formateurId = formData.get('formateurId');
		const subActionId = formData.get('subActionId');

		if (!formateurId || typeof formateurId !== 'string') {
			return fail(400, { message: 'Formateur requis' });
		}

		const existing = await db.query.formations.findFirst({
			where: and(eq(formations.id, params.id), eq(formations.workspaceId, workspaceId)),
			columns: { id: true }
		});
		if (!existing) return fail(404, { message: 'Formation introuvable' });

		await db
			.insert(formationFormateurs)
			.values({ formationId: params.id, formateurId })
			.onConflictDoNothing();

		if (subActionId && typeof subActionId === 'string') {
			const sa = await db.query.questSubActions.findFirst({
				where: eq(questSubActions.id, subActionId),
				columns: { id: true, formationActionId: true, completed: true }
			});
			if (sa && !sa.completed) {
				await ensureActionStarted(sa.formationActionId);
				await markSubActionComplete(subActionId, user.id);
				await autoCompleteQuestIfDone(sa.formationActionId, user.id, params.id, workspaceId);
			}
		}

		return { success: true };
	},

	updateAssignee: async ({ request, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		const formData = await request.formData();
		const actionId = formData.get('actionId');
		const assigneeId = formData.get('assigneeId');
		if (!actionId || typeof actionId !== 'string') {
			return fail(400, { message: 'Données manquantes' });
		}

		const action = await verifyActionOwnership(actionId, workspaceId);
		if (!action) return fail(403, { message: 'Accès refusé' });

		await db
			.update(formationActions)
			.set({
				assigneeId: (assigneeId && typeof assigneeId === 'string' ? assigneeId : null) || null
			})
			.where(eq(formationActions.id, actionId));

		return { success: true };
	},

	updateDueDate: async ({ request, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		const formData = await request.formData();
		const actionId = formData.get('actionId');
		const dueDate = formData.get('dueDate');
		if (!actionId || typeof actionId !== 'string') {
			return fail(400, { message: 'Données manquantes' });
		}

		const action = await verifyActionOwnership(actionId, workspaceId);
		if (!action) return fail(403, { message: 'Accès refusé' });

		await db
			.update(formationActions)
			.set({
				dueDate: (dueDate && typeof dueDate === 'string' ? dueDate : null) || null
			})
			.where(eq(formationActions.id, actionId));

		return { success: true };
	},

	dismissGuidance: async ({ request, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		const formData = await request.formData();
		const actionId = formData.get('actionId');
		if (!actionId || typeof actionId !== 'string') {
			return fail(400, { message: 'Données manquantes' });
		}

		const action = await verifyActionOwnership(actionId, workspaceId);
		if (!action) return fail(403, { message: 'Accès refusé' });

		await db
			.update(formationActions)
			.set({ guidanceDismissed: true })
			.where(eq(formationActions.id, actionId));

		return { success: true };
	},

	uploadDocument: async ({ request, params, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		const formData = await request.formData();
		const subActionId = formData.get('subActionId');
		const file = formData.get('file');
		if (!subActionId || typeof subActionId !== 'string') {
			return fail(400, { message: 'Données manquantes' });
		}
		if (!file || !(file instanceof File) || file.size === 0) {
			return fail(400, { message: 'Fichier manquant' });
		}

		const subAction = await db.query.questSubActions.findFirst({
			where: eq(questSubActions.id, subActionId),
			columns: {
				id: true,
				formationActionId: true,
				documentRequired: true,
				acceptedFileTypes: true,
				completed: true
			}
		});
		if (!subAction) return fail(404, { message: 'Sous-action introuvable' });

		const ownerCheck = await verifyActionOwnership(subAction.formationActionId, workspaceId);
		if (!ownerCheck) return fail(403, { message: 'Accès refusé' });

		if (!validateFileType(file, subAction.acceptedFileTypes)) {
			return fail(400, { message: 'Type de fichier non accepté' });
		}

		const { storagePath } = await uploadQuestDocument(file, subActionId);

		await db
			.insert(questDocuments)
			.values({
				subActionId,
				fileName: file.name,
				fileType: file.type,
				fileSize: file.size,
				storagePath,
				uploadedBy: user.id
			})
			.onConflictDoUpdate({
				target: questDocuments.subActionId,
				set: {
					fileName: file.name,
					fileType: file.type,
					fileSize: file.size,
					storagePath,
					uploadedBy: user.id,
					uploadedAt: new Date().toISOString()
				}
			});

		await ensureActionStarted(subAction.formationActionId);
		if (!subAction.completed) {
			await markSubActionComplete(subActionId, user.id);
			await autoCompleteQuestIfDone(subAction.formationActionId, user.id, params.id, workspaceId);
		}

		return { success: true };
	},

	deleteDocument: async ({ request, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		const formData = await request.formData();
		const documentId = formData.get('documentId');
		if (!documentId || typeof documentId !== 'string') {
			return fail(400, { message: 'Données manquantes' });
		}

		const doc = await db.query.questDocuments.findFirst({
			where: eq(questDocuments.id, documentId),
			columns: { id: true, subActionId: true, storagePath: true }
		});
		if (!doc) return fail(404, { message: 'Document introuvable' });

		const subAction = await db.query.questSubActions.findFirst({
			where: eq(questSubActions.id, doc.subActionId),
			columns: { id: true, formationActionId: true, documentRequired: true }
		});
		if (!subAction) return fail(404, { message: 'Sous-action introuvable' });

		const ownerCheck = await verifyActionOwnership(subAction.formationActionId, workspaceId);
		if (!ownerCheck) return fail(403, { message: 'Accès refusé' });

		try {
			await deleteQuestDocument(doc.storagePath);
		} catch {
			// Storage file may already be gone
		}

		await db.delete(questDocuments).where(eq(questDocuments.id, documentId));

		if (subAction.documentRequired) {
			await db
				.update(questSubActions)
				.set({ completed: false, completedAt: null, completedBy: null })
				.where(eq(questSubActions.id, doc.subActionId));
		}

		return { success: true };
	},

	downloadDocument: async ({ request, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session } = await locals.safeGetSession();
		if (!session) return fail(401, { message: 'Non autorisé' });

		const formData = await request.formData();
		const documentId = formData.get('documentId');
		if (!documentId || typeof documentId !== 'string') {
			return fail(400, { message: 'Données manquantes' });
		}

		const doc = await db.query.questDocuments.findFirst({
			where: eq(questDocuments.id, documentId),
			columns: { id: true, subActionId: true, storagePath: true }
		});
		if (!doc) return fail(404, { message: 'Document introuvable' });

		const subAction = await db.query.questSubActions.findFirst({
			where: eq(questSubActions.id, doc.subActionId),
			columns: { formationActionId: true }
		});
		if (!subAction) return fail(404, { message: 'Sous-action introuvable' });

		const ownerCheck = await verifyActionOwnership(subAction.formationActionId, workspaceId);
		if (!ownerCheck) return fail(403, { message: 'Accès refusé' });

		const url = await getQuestDocumentUrl(doc.storagePath);
		return { success: true, url };
	},

	addComment: async ({ request, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		const formData = await request.formData();
		const actionId = formData.get('actionId');
		const content = formData.get('content');
		if (!actionId || typeof actionId !== 'string' || !content || typeof content !== 'string') {
			return fail(400, { message: 'Données manquantes' });
		}
		const trimmed = content.trim();
		if (!trimmed) return fail(400, { message: 'Le commentaire ne peut pas être vide' });

		const action = await verifyActionOwnership(actionId, workspaceId);
		if (!action) return fail(403, { message: 'Accès refusé' });

		await db.insert(questComments).values({
			formationActionId: actionId,
			userId: user.id,
			content: trimmed
		});

		return { success: true };
	}
};
