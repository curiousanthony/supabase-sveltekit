import { fail } from '@sveltejs/kit';
import { db } from '$lib/db';
import { formations, seances, emargements } from '$lib/db/schema';
import { eq, and, inArray, isNull } from 'drizzle-orm';
import { getUserWorkspace } from '$lib/auth';
import { logAuditEvent } from '$lib/services/audit-log';
import type { Actions } from './$types';

async function verifyFormationOwnership(params: { id: string }, workspaceId: string) {
	const formation = await db.query.formations.findFirst({
		where: and(eq(formations.id, params.id), eq(formations.workspaceId, workspaceId)),
		columns: { id: true }
	});
	return !!formation;
}

export const actions: Actions = {
	createSession: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		if (!(await verifyFormationOwnership(params, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const moduleId = formData.get('moduleId') as string | null;
		const startAt = formData.get('startAt') as string | null;
		const endAt = formData.get('endAt') as string | null;
		const location = (formData.get('location') as string | null) || null;
		const room = (formData.get('room') as string | null) || null;
		const formateurId = (formData.get('formateurId') as string | null) || null;
		const modalityOverride =
			(formData.get('modalityOverride') as string | null) || null;
		const contactIds = formData.getAll('contactIds') as string[];

		if (!moduleId) return fail(400, { message: 'Module requis' });
		if (!startAt || !endAt) return fail(400, { message: 'Dates requises' });

		if (new Date(endAt) <= new Date(startAt)) {
			return fail(400, { message: 'La fin doit être après le début' });
		}

		try {
			const [created] = await db
				.insert(seances)
				.values({
					formationId: params.id,
					createdBy: user.id,
					moduleId,
					startAt,
					endAt,
					location,
					room,
					formateurId,
					modalityOverride: modalityOverride as typeof seances.$inferInsert.modalityOverride
				})
				.returning({ id: seances.id });

			if (contactIds.length > 0) {
				await db.insert(emargements).values(
					contactIds.map((contactId) => ({
						seanceId: created.id,
						contactId
					}))
				);
			}

			await logAuditEvent({
				formationId: params.id,
				userId: user.id,
				actionType: 'session_created',
				entityType: 'seance',
				entityId: created.id
			});

			return { success: true, seanceId: created.id };
		} catch (e: unknown) {
			console.error('[createSession]', e);
			return fail(500, { message: 'Erreur lors de la création' });
		}
	},

	updateSession: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		if (!(await verifyFormationOwnership(params, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const seanceId = formData.get('seanceId') as string | null;
		if (!seanceId) return fail(400, { message: 'ID séance requis' });

		const moduleId = formData.get('moduleId') as string | null;
		const startAt = formData.get('startAt') as string | null;
		const endAt = formData.get('endAt') as string | null;
		const location = (formData.get('location') as string | null) || null;
		const room = (formData.get('room') as string | null) || null;
		const formateurId = (formData.get('formateurId') as string | null) || null;
		const modalityOverride =
			(formData.get('modalityOverride') as string | null) || null;

		if (!moduleId) return fail(400, { message: 'Module requis' });
		if (!startAt || !endAt) return fail(400, { message: 'Dates requises' });

		if (new Date(endAt) <= new Date(startAt)) {
			return fail(400, { message: 'La fin doit être après le début' });
		}

		try {
			const result = await db
				.update(seances)
				.set({
					moduleId,
					startAt,
					endAt,
					location,
					room,
					formateurId,
					modalityOverride: modalityOverride as typeof seances.$inferInsert.modalityOverride
				})
				.where(and(eq(seances.id, seanceId), eq(seances.formationId, params.id)))
				.returning({ id: seances.id });

			if (result.length === 0) {
				return fail(404, { message: 'Séance introuvable' });
			}

			await logAuditEvent({
				formationId: params.id,
				userId: user.id,
				actionType: 'session_updated',
				entityType: 'seance',
				entityId: seanceId
			});

			return { success: true };
		} catch (e: unknown) {
			console.error('[updateSession]', e);
			return fail(500, { message: 'Erreur lors de la mise à jour' });
		}
	},

	deleteSession: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		if (!(await verifyFormationOwnership(params, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const seanceId = formData.get('seanceId') as string | null;
		if (!seanceId) return fail(400, { message: 'ID séance requis' });

		try {
			const result = await db
				.delete(seances)
				.where(and(eq(seances.id, seanceId), eq(seances.formationId, params.id)))
				.returning({ id: seances.id });

			if (result.length === 0) {
				return fail(404, { message: 'Séance introuvable' });
			}

			await logAuditEvent({
				formationId: params.id,
				userId: user.id,
				actionType: 'session_deleted',
				entityType: 'seance',
				entityId: seanceId
			});

			return { success: true };
		} catch (e: unknown) {
			console.error('[deleteSession]', e);
			return fail(500, { message: 'Erreur lors de la suppression' });
		}
	},

	updateEmargementParticipants: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		if (!(await verifyFormationOwnership(params, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const seanceId = formData.get('seanceId') as string | null;
		if (!seanceId) return fail(400, { message: 'ID séance requis' });

		const selectedContactIds = formData.getAll('contactIds') as string[];

		try {
			const existing = await db
				.select({
					id: emargements.id,
					contactId: emargements.contactId,
					signedAt: emargements.signedAt
				})
				.from(emargements)
				.where(eq(emargements.seanceId, seanceId));

			const existingContactIds = existing.map((e) => e.contactId);

			const toAdd = selectedContactIds.filter((id) => !existingContactIds.includes(id));
			const toRemove = existing.filter(
				(e) => !selectedContactIds.includes(e.contactId) && e.signedAt === null
			);

			if (toAdd.length > 0) {
				await db.insert(emargements).values(
					toAdd.map((contactId) => ({
						seanceId,
						contactId
					}))
				);
			}

			if (toRemove.length > 0) {
				await db.delete(emargements).where(
					and(
						eq(emargements.seanceId, seanceId),
						inArray(
							emargements.contactId,
							toRemove.map((e) => e.contactId)
						),
						isNull(emargements.signedAt)
					)
				);
			}

			await logAuditEvent({
				formationId: params.id,
				userId: user.id,
				actionType: 'emargement_participants_updated',
				entityType: 'seance',
				entityId: seanceId,
				newValue: { added: toAdd.length, removed: toRemove.length }
			});

			return { success: true };
		} catch (e: unknown) {
			console.error('[updateEmargementParticipants]', e);
			return fail(500, { message: 'Erreur lors de la mise à jour des participants' });
		}
	}
};
