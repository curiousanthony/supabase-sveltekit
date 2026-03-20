import { fail } from '@sveltejs/kit';
import { db } from '$lib/db';
import { formations, formationFormateurs, formateurs, seances } from '$lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { getUserWorkspace } from '$lib/auth';
import { logAuditEvent } from '$lib/services/audit-log';
import type { Actions, PageServerLoad } from './$types';

async function verifyFormationOwnership(params: { id: string }, workspaceId: string) {
	const formation = await db.query.formations.findFirst({
		where: and(eq(formations.id, params.id), eq(formations.workspaceId, workspaceId)),
		columns: { id: true }
	});
	return !!formation;
}

export const load = (async ({ locals }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) return { allFormateurs: [] };

	const allFormateurs = await db.query.formateurs.findMany({
		where: eq(formateurs.workspaceId, workspaceId),
		with: {
			user: {
				columns: {
					id: true,
					email: true,
					firstName: true,
					lastName: true,
					avatarUrl: true
				}
			}
		}
	});

	return { allFormateurs };
}) satisfies PageServerLoad;

export const actions: Actions = {
	addFormateur: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		if (!(await verifyFormationOwnership(params, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const rawFormateurId = formData.get('formateurId');
		if (!rawFormateurId || typeof rawFormateurId !== 'string') {
			return fail(400, { message: 'Formateur requis' });
		}

		try {
			await db.insert(formationFormateurs).values({
				formationId: params.id,
				formateurId: rawFormateurId
			});
		} catch (e: unknown) {
			if (e && typeof e === 'object' && 'code' in e && e.code === '23505') {
				return fail(409, { message: 'Ce formateur est déjà assigné' });
			}
			throw e;
		}

		await logAuditEvent({
			formationId: params.id,
			userId: user.id,
			actionType: 'formateur_added',
			entityType: 'formation_formateur',
			entityId: rawFormateurId
		});

		return { success: true };
	},

	removeFormateur: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		if (!(await verifyFormationOwnership(params, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const rawFormateurId = formData.get('formateurId');
		if (!rawFormateurId || typeof rawFormateurId !== 'string') {
			return fail(400, { message: 'Formateur requis' });
		}

		const result = await db
			.delete(formationFormateurs)
			.where(
				and(
					eq(formationFormateurs.formationId, params.id),
					eq(formationFormateurs.formateurId, rawFormateurId)
				)
			)
			.returning({ id: formationFormateurs.id });

		if (result.length === 0) {
			return fail(404, { message: 'Formateur non trouvé pour cette formation' });
		}

		await logAuditEvent({
			formationId: params.id,
			userId: user.id,
			actionType: 'formateur_removed',
			entityType: 'formation_formateur',
			entityId: rawFormateurId
		});

		return { success: true };
	},

	updateFormateurCosts: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		if (!(await verifyFormationOwnership(params, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const formateurId = formData.get('formateurId');
		if (!formateurId || typeof formateurId !== 'string') {
			return fail(400, { message: 'Formateur requis' });
		}

		const tjm = formData.get('tjm')?.toString() || null;
		const numberOfDays = formData.get('numberOfDays')?.toString() || null;
		const deplacementCost = formData.get('deplacementCost')?.toString() || null;
		const hebergementCost = formData.get('hebergementCost')?.toString() || null;

		const result = await db
			.update(formationFormateurs)
			.set({
				tjm,
				numberOfDays,
				deplacementCost,
				hebergementCost
			})
			.where(
				and(
					eq(formationFormateurs.formationId, params.id),
					eq(formationFormateurs.formateurId, formateurId)
				)
			)
			.returning({ id: formationFormateurs.id });

		if (result.length === 0) {
			return fail(404, { message: 'Formateur non trouvé pour cette formation' });
		}

		await logAuditEvent({
			formationId: params.id,
			userId: user.id,
			actionType: 'formateur_costs_updated',
			entityType: 'formation_formateur',
			entityId: formateurId,
			newValue: { tjm, numberOfDays, deplacementCost, hebergementCost }
		});

		return { success: true };
	},

	assignFormateurToSession: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		if (!(await verifyFormationOwnership(params, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const seanceId = formData.get('seanceId');
		const formateurId = formData.get('formateurId');
		if (!seanceId || typeof seanceId !== 'string') {
			return fail(400, { message: 'Séance requise' });
		}
		if (!formateurId || typeof formateurId !== 'string') {
			return fail(400, { message: 'Formateur requis' });
		}

		const existing = await db.query.formationFormateurs.findFirst({
			where: and(
				eq(formationFormateurs.formationId, params.id),
				eq(formationFormateurs.formateurId, formateurId)
			),
			columns: { id: true }
		});

		if (!existing) {
			try {
				await db.insert(formationFormateurs).values({
					formationId: params.id,
					formateurId
				});
			} catch (e: unknown) {
				if (!(e && typeof e === 'object' && 'code' in e && e.code === '23505')) {
					throw e;
				}
			}
		}

		await db
			.update(seances)
			.set({ formateurId })
			.where(and(eq(seances.id, seanceId), eq(seances.formationId, params.id)));

		await logAuditEvent({
			formationId: params.id,
			userId: user.id,
			actionType: 'formateur_assigned_to_session',
			entityType: 'seance',
			entityId: seanceId,
			newValue: formateurId
		});

		return { success: true };
	},

	removeFormateurFromSession: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		if (!(await verifyFormationOwnership(params, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const seanceId = formData.get('seanceId');
		if (!seanceId || typeof seanceId !== 'string') {
			return fail(400, { message: 'Séance requise' });
		}

		await db
			.update(seances)
			.set({ formateurId: null })
			.where(and(eq(seances.id, seanceId), eq(seances.formationId, params.id)));

		await logAuditEvent({
			formationId: params.id,
			userId: user.id,
			actionType: 'formateur_removed_from_session',
			entityType: 'seance',
			entityId: seanceId
		});

		return { success: true };
	}
};
