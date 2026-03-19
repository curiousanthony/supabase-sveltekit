import { db } from '$lib/db';
import { formationActions, questSubActions, formations } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { getUserWorkspace } from '$lib/auth';
import { shouldAutoAdvanceStatus } from '$lib/formation-quests';
import type { Actions } from './$types';

export const actions: Actions = {
	updateQuestStatus: async ({ request, params, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		const formData = await request.formData();
		const actionId = formData.get('actionId') as string;
		const newStatus = formData.get('newStatus') as string;
		if (!actionId || !newStatus) return fail(400, { message: 'Données manquantes' });

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
			where: eq(formations.id, params.id),
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
		const subActionId = formData.get('subActionId') as string;
		const completed = formData.get('completed') === 'true';
		if (!subActionId) return fail(400, { message: 'Données manquantes' });

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

		const formData = await request.formData();
		const actionId = formData.get('actionId') as string;
		const assigneeId = formData.get('assigneeId') as string;
		if (!actionId) return fail(400, { message: 'Données manquantes' });

		await db.update(formationActions).set({
			assigneeId: assigneeId || null
		}).where(eq(formationActions.id, actionId));

		return { success: true };
	},

	updateDueDate: async ({ request, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });

		const formData = await request.formData();
		const actionId = formData.get('actionId') as string;
		const dueDate = formData.get('dueDate') as string;
		if (!actionId) return fail(400, { message: 'Données manquantes' });

		await db.update(formationActions).set({
			dueDate: dueDate || null
		}).where(eq(formationActions.id, actionId));

		return { success: true };
	},

	dismissGuidance: async ({ request, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });

		const formData = await request.formData();
		const actionId = formData.get('actionId') as string;
		if (!actionId) return fail(400, { message: 'Données manquantes' });

		await db.update(formationActions).set({
			guidanceDismissed: true
		}).where(eq(formationActions.id, actionId));

		return { success: true };
	}
};
