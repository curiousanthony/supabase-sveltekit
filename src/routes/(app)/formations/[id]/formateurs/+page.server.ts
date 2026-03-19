import { fail } from '@sveltejs/kit';
import { db } from '$lib/db';
import { formations, formationFormateurs, seances, formateurs } from '$lib/db/schema';
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

/** Value, or `null` when field was sent empty (clear), or `undefined` when not applicable. */
function parseOptMoney(
	raw: FormDataEntryValue | null,
	allowClear: boolean
): number | null | undefined {
	if (raw === null || raw === undefined) return undefined;
	if (typeof raw !== 'string') return undefined;
	if (raw.trim() === '') return allowClear ? null : undefined;
	const n = parseFloat(raw.replace(',', '.'));
	if (!Number.isFinite(n) || n < 0) return undefined;
	return n;
}

function parseOptDays(
	raw: FormDataEntryValue | null,
	allowClear: boolean
): number | null | undefined {
	if (raw === null || raw === undefined) return undefined;
	if (typeof raw !== 'string') return undefined;
	if (raw.trim() === '') return allowClear ? null : undefined;
	const n = parseFloat(raw.replace(',', '.'));
	if (!Number.isFinite(n) || n < 0) return undefined;
	return n;
}

export const load = (async ({ params, locals }) => {
	void params.id;
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) return { allFormateurs: [] };
	const allFormateurs = await db.query.formateurs.findMany({
		where: eq(formateurs.workspaceId, workspaceId),
		with: {
			user: { columns: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true } }
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
		const rawFormateurId = formData.get('formateurId');
		if (!rawFormateurId || typeof rawFormateurId !== 'string' || rawFormateurId.trim() === '') {
			return fail(400, { message: 'Formateur requis' });
		}
		const formateurId = rawFormateurId.trim();

		const patch: {
			tjm?: string | null;
			numberOfDays?: string | null;
			deplacementCost?: string | null;
			hebergementCost?: string | null;
		} = {};

		if (formData.has('tjm')) {
			const v = parseOptMoney(formData.get('tjm'), true);
			if (v === undefined) {
				return fail(400, { message: 'TJM invalide' });
			}
			patch.tjm = v === null ? null : v.toFixed(2);
		}
		if (formData.has('numberOfDays')) {
			const v = parseOptDays(formData.get('numberOfDays'), true);
			if (v === undefined) {
				return fail(400, { message: 'Nombre de jours invalide' });
			}
			patch.numberOfDays = v === null ? null : v.toFixed(1);
		}
		if (formData.has('deplacementCost')) {
			const v = parseOptMoney(formData.get('deplacementCost'), true);
			if (v === undefined) {
				return fail(400, { message: 'Montant déplacement invalide' });
			}
			patch.deplacementCost = v === null ? null : v.toFixed(2);
		}
		if (formData.has('hebergementCost')) {
			const v = parseOptMoney(formData.get('hebergementCost'), true);
			if (v === undefined) {
				return fail(400, { message: 'Montant hébergement invalide' });
			}
			patch.hebergementCost = v === null ? null : v.toFixed(2);
		}

		if (Object.keys(patch).length === 0) {
			return fail(400, { message: 'Aucun champ à mettre à jour' });
		}

		const existing = await db.query.formationFormateurs.findFirst({
			where: and(
				eq(formationFormateurs.formationId, params.id),
				eq(formationFormateurs.formateurId, formateurId)
			),
			columns: {
				id: true,
				tjm: true,
				numberOfDays: true,
				deplacementCost: true,
				hebergementCost: true
			}
		});

		if (!existing) {
			return fail(404, { message: 'Formateur introuvable pour cette formation' });
		}

		const updated = await db
			.update(formationFormateurs)
			.set(patch)
			.where(
				and(
					eq(formationFormateurs.formationId, params.id),
					eq(formationFormateurs.formateurId, formateurId)
				)
			)
			.returning({
				id: formationFormateurs.id,
				tjm: formationFormateurs.tjm,
				numberOfDays: formationFormateurs.numberOfDays,
				deplacementCost: formationFormateurs.deplacementCost,
				hebergementCost: formationFormateurs.hebergementCost
			});

		const row = updated[0];
		if (!row) {
			return fail(404, { message: 'Mise à jour impossible' });
		}

		await logAuditEvent({
			formationId: params.id,
			userId: user.id,
			actionType: 'cost_updated',
			entityType: 'formation_formateur',
			entityId: existing.id,
			oldValue: JSON.stringify({
				tjm: existing.tjm,
				numberOfDays: existing.numberOfDays,
				deplacementCost: existing.deplacementCost,
				hebergementCost: existing.hebergementCost
			}),
			newValue: JSON.stringify({
				tjm: row.tjm,
				numberOfDays: row.numberOfDays,
				deplacementCost: row.deplacementCost,
				hebergementCost: row.hebergementCost
			})
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
		const formateurIdRaw = formData.get('formateurId');
		const sessionIdRaw = formData.get('sessionId');
		if (typeof formateurIdRaw !== 'string' || formateurIdRaw.trim() === '') {
			return fail(400, { message: 'Formateur requis' });
		}
		if (typeof sessionIdRaw !== 'string' || sessionIdRaw.trim() === '') {
			return fail(400, { message: 'Séance requise' });
		}
		const formateurId = formateurIdRaw.trim();
		const sessionId = sessionIdRaw.trim();

		const formateurOk = await db.query.formateurs.findFirst({
			where: and(eq(formateurs.id, formateurId), eq(formateurs.workspaceId, workspaceId)),
			columns: { id: true }
		});
		if (!formateurOk) {
			return fail(400, { message: 'Formateur invalide' });
		}

		const seanceRow = await db.query.seances.findFirst({
			where: and(eq(seances.id, sessionId), eq(seances.formationId, params.id)),
			columns: { id: true, formateurId: true, startAt: true }
		});
		if (!seanceRow) {
			return fail(404, { message: 'Séance introuvable' });
		}

		try {
			await db.insert(formationFormateurs).values({
				formationId: params.id,
				formateurId
			});
		} catch (e: unknown) {
			if (e && typeof e === 'object' && 'code' in e && e.code === '23505') {
				// already linked
			} else {
				throw e;
			}
		}

		await db
			.update(seances)
			.set({ formateurId })
			.where(and(eq(seances.id, sessionId), eq(seances.formationId, params.id)));

		await logAuditEvent({
			formationId: params.id,
			userId: user.id,
			actionType: 'session_updated',
			entityType: 'seance',
			entityId: sessionId,
			oldValue: seanceRow.formateurId ?? '',
			newValue: formateurId,
			fieldName: 'formateurId'
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
		const sessionIdRaw = formData.get('sessionId');
		const formateurIdRaw = formData.get('formateurId');
		if (typeof sessionIdRaw !== 'string' || sessionIdRaw.trim() === '') {
			return fail(400, { message: 'Séance requise' });
		}
		if (typeof formateurIdRaw !== 'string' || formateurIdRaw.trim() === '') {
			return fail(400, { message: 'Formateur requis' });
		}
		const sessionId = sessionIdRaw.trim();
		const formateurId = formateurIdRaw.trim();

		const seanceRow = await db.query.seances.findFirst({
			where: and(eq(seances.id, sessionId), eq(seances.formationId, params.id)),
			columns: { id: true, formateurId: true, startAt: true }
		});
		if (!seanceRow) {
			return fail(404, { message: 'Séance introuvable' });
		}
		if (seanceRow.formateurId !== formateurId) {
			return fail(409, { message: "Cette séance n'est pas assignée à ce formateur" });
		}

		await db
			.update(seances)
			.set({ formateurId: null })
			.where(and(eq(seances.id, sessionId), eq(seances.formationId, params.id)));

		await logAuditEvent({
			formationId: params.id,
			userId: user.id,
			actionType: 'session_updated',
			entityType: 'seance',
			entityId: sessionId,
			oldValue: seanceRow.formateurId ?? '',
			newValue: '',
			fieldName: 'formateurId'
		});

		return { success: true };
	}
};
