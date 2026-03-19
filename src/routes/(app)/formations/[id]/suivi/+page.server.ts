import { db } from '$lib/db';
import { formationActions, questSubActions, formations } from '$lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { getUserWorkspace } from '$lib/auth';
import { shouldAutoAdvanceStatus } from '$lib/formation-quests';
import type { Actions } from './$types';

async function verifyActionOwnership(actionId: string, workspaceId: string) {
	const action = await db.query.formationActions.findFirst({
		where: eq(formationActions.id, actionId),
		columns: { id: true, formationId: true },
		with: { formation: { columns: { workspaceId: true } } }
	});
	if (!action?.formation || action.formation.workspaceId !== workspaceId) return null;
	return action;
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

		const updateData: Record<string, unknown> = { status: newStatus };
		if (newStatus === 'Terminé') {
			updateData.completedAt = new Date().toISOString();
			updateData.completedBy = user.id;
		} else {
			updateData.completedAt = null;
			updateData.completedBy = null;
		}

		await db.update(formationActions).set(updateData).where(eq(formationActions.id, actionId));

		const allActions = await db.query.formationActions.findMany({
			where: eq(formationActions.formationId, params.id),
			columns: { status: true, questKey: true, phase: true }
		});

		const formation = await db.query.formations.findFirst({
			where: and(eq(formations.id, params.id), eq(formations.workspaceId, workspaceId)),
			columns: { statut: true, typeFinancement: true }
		});

		if (formation) {
			const hasFunding = !!formation.typeFinancement && ['OPCO', 'CPF'].includes(formation.typeFinancement);
			const newFormationStatus = shouldAutoAdvanceStatus(allActions, formation.statut as any, hasFunding);
			if (newFormationStatus) {
				await db.update(formations).set({ statut: newFormationStatus }).where(eq(formations.id, params.id));
			}
		}

		return { success: true };
	},

	toggleSubAction: async ({ request, locals }) => {
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

		await db.update(questSubActions).set({
			completed,
			completedAt: completed ? new Date().toISOString() : null,
			completedBy: completed ? user.id : null
		}).where(eq(questSubActions.id, subActionId));

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

		await db.update(formationActions).set({
			assigneeId: (assigneeId && typeof assigneeId === 'string' ? assigneeId : null) || null
		}).where(eq(formationActions.id, actionId));

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

		await db.update(formationActions).set({
			dueDate: (dueDate && typeof dueDate === 'string' ? dueDate : null) || null
		}).where(eq(formationActions.id, actionId));

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

		await db.update(formationActions).set({
			guidanceDismissed: true
		}).where(eq(formationActions.id, actionId));

		return { success: true };
	}
};
