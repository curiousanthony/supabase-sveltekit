import { fail } from '@sveltejs/kit';
import { db } from '$lib/db';
import {
	seances,
	emargements,
	formations,
	formationApprenants,
	formationFormateurs,
	modules
} from '$lib/db/schema';
import { and, eq, inArray, notInArray } from 'drizzle-orm';
import { getUserWorkspace, ensureUserInPublicUsers } from '$lib/auth';
import { logAuditEvent } from '$lib/services/audit-log';
import type { Actions } from './$types';

type ModaliteValue = 'Distanciel' | 'Présentiel' | 'Hybride' | 'E-Learning';

async function verifyFormationOwnership(params: { id: string }, workspaceId: string) {
	const formation = await db.query.formations.findFirst({
		where: and(eq(formations.id, params.id), eq(formations.workspaceId, workspaceId)),
		columns: { id: true }
	});
	return !!formation;
}

function combineLocalDateTimeToIso(dateStr: string, timeStr: string): string | null {
	const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
	const tm = /^(\d{1,2}):(\d{2})$/.exec(timeStr.trim());
	if (!dm || !tm) return null;
	const y = Number(dm[1]);
	const mo = Number(dm[2]);
	const d = Number(dm[3]);
	const h = Number(tm[1]);
	const mi = Number(tm[2]);
	if ([y, mo, d, h, mi].some((n) => Number.isNaN(n))) return null;
	const dt = new Date(y, mo - 1, d, h, mi, 0, 0);
	return dt.toISOString();
}

function parseModality(raw: string | null): ModaliteValue | null {
	if (raw == null || raw === '' || raw === 'inherit') return null;
	if (['Distanciel', 'Présentiel', 'Hybride', 'E-Learning'].includes(raw)) {
		return raw as ModaliteValue;
	}
	return null;
}

export const actions: Actions = {
	createSession: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });
		await ensureUserInPublicUsers(locals);

		if (!(await verifyFormationOwnership(params, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const date = formData.get('date');
		const startTime = formData.get('startTime');
		const endTime = formData.get('endTime');
		const moduleIdRaw = formData.get('moduleId');
		const formateurIdRaw = formData.get('formateurId');
		const modalityOverrideRaw = formData.get('modalityOverride');
		const locationRaw = formData.get('location');
		const roomRaw = formData.get('room');
		const learnerIdsRaw = formData.get('learnerIds');

		if (typeof date !== 'string' || typeof startTime !== 'string' || typeof endTime !== 'string') {
			return fail(400, { message: 'Date et horaires requis' });
		}

		const startAt = combineLocalDateTimeToIso(date, startTime);
		const endAt = combineLocalDateTimeToIso(date, endTime);
		if (!startAt || !endAt) {
			return fail(400, { message: 'Date ou horaires invalides' });
		}
		if (new Date(endAt) <= new Date(startAt)) {
			return fail(400, { message: 'L\'heure de fin doit être après l\'heure de début' });
		}

		const moduleId =
			typeof moduleIdRaw === 'string' && moduleIdRaw.trim() !== '' ? moduleIdRaw.trim() : null;
		if (moduleId) {
			const mod = await db.query.modules.findFirst({
				where: and(eq(modules.id, moduleId), eq(modules.courseId, params.id)),
				columns: { id: true }
			});
			if (!mod) return fail(400, { message: 'Module invalide pour cette formation' });
		}

		const formateurId =
			typeof formateurIdRaw === 'string' && formateurIdRaw.trim() !== ''
				? formateurIdRaw.trim()
				: null;
		if (formateurId) {
			const ff = await db.query.formationFormateurs.findFirst({
				where: and(
					eq(formationFormateurs.formationId, params.id),
					eq(formationFormateurs.formateurId, formateurId)
				),
				columns: { id: true }
			});
			if (!ff) return fail(400, { message: 'Formateur non assigné à cette formation' });
		}

		const modalityOverride = parseModality(
			typeof modalityOverrideRaw === 'string' ? modalityOverrideRaw : null
		);
		const location =
			typeof locationRaw === 'string' && locationRaw.trim() !== '' ? locationRaw.trim() : null;
		const room = typeof roomRaw === 'string' && roomRaw.trim() !== '' ? roomRaw.trim() : null;

		let learnerIds: string[] = [];
		if (typeof learnerIdsRaw === 'string' && learnerIdsRaw.trim() !== '') {
			try {
				const parsed = JSON.parse(learnerIdsRaw) as unknown;
				if (!Array.isArray(parsed) || !parsed.every((x) => typeof x === 'string')) {
					return fail(400, { message: 'Liste de participants invalide' });
				}
				learnerIds = parsed;
			} catch {
				return fail(400, { message: 'Liste de participants invalide' });
			}
		}

		if (learnerIds.length > 0) {
			const rows = await db.query.formationApprenants.findMany({
				where: eq(formationApprenants.formationId, params.id),
				columns: { contactId: true }
			});
			const allowed = new Set(rows.map((r) => r.contactId));
			for (const id of learnerIds) {
				if (!allowed.has(id)) {
					return fail(400, { message: 'Participant non inscrit à cette formation' });
				}
			}
		}

		const [inserted] = await db
			.insert(seances)
			.values({
				createdBy: user.id,
				formationId: params.id,
				moduleId,
				formateurId,
				startAt,
				endAt,
				location,
				room,
				modalityOverride
			})
			.returning({ id: seances.id, startAt: seances.startAt });

		if (!inserted) {
			return fail(500, { message: 'Échec de la création de la séance' });
		}

		if (learnerIds.length > 0) {
			await db.insert(emargements).values(
				learnerIds.map((contactId) => ({
					seanceId: inserted.id,
					contactId
				}))
			);
		}

		await logAuditEvent({
			formationId: params.id,
			userId: user.id,
			actionType: 'session_created',
			entityType: 'seance',
			entityId: inserted.id,
			newValue: inserted.startAt?.slice(0, 10) ?? ''
		});

		return { success: true };
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
		const sessionIdRaw = formData.get('sessionId');
		const date = formData.get('date');
		const startTime = formData.get('startTime');
		const endTime = formData.get('endTime');
		const moduleIdRaw = formData.get('moduleId');
		const formateurIdRaw = formData.get('formateurId');
		const modalityOverrideRaw = formData.get('modalityOverride');
		const locationRaw = formData.get('location');
		const roomRaw = formData.get('room');

		if (typeof sessionIdRaw !== 'string' || sessionIdRaw.trim() === '') {
			return fail(400, { message: 'Séance requise' });
		}
		const sessionId = sessionIdRaw.trim();

		const existing = await db.query.seances.findFirst({
			where: and(eq(seances.id, sessionId), eq(seances.formationId, params.id)),
			columns: {
				id: true,
				startAt: true
			}
		});
		if (!existing) {
			return fail(404, { message: 'Séance introuvable' });
		}

		if (typeof date !== 'string' || typeof startTime !== 'string' || typeof endTime !== 'string') {
			return fail(400, { message: 'Date et horaires requis' });
		}

		const startAt = combineLocalDateTimeToIso(date, startTime);
		const endAt = combineLocalDateTimeToIso(date, endTime);
		if (!startAt || !endAt) {
			return fail(400, { message: 'Date ou horaires invalides' });
		}
		if (new Date(endAt) <= new Date(startAt)) {
			return fail(400, { message: 'L\'heure de fin doit être après l\'heure de début' });
		}

		const moduleId =
			typeof moduleIdRaw === 'string' && moduleIdRaw.trim() !== '' ? moduleIdRaw.trim() : null;
		if (moduleId) {
			const mod = await db.query.modules.findFirst({
				where: and(eq(modules.id, moduleId), eq(modules.courseId, params.id)),
				columns: { id: true }
			});
			if (!mod) return fail(400, { message: 'Module invalide pour cette formation' });
		}

		const formateurId =
			typeof formateurIdRaw === 'string' && formateurIdRaw.trim() !== ''
				? formateurIdRaw.trim()
				: null;
		if (formateurId) {
			const ff = await db.query.formationFormateurs.findFirst({
				where: and(
					eq(formationFormateurs.formationId, params.id),
					eq(formationFormateurs.formateurId, formateurId)
				),
				columns: { id: true }
			});
			if (!ff) return fail(400, { message: 'Formateur non assigné à cette formation' });
		}

		const modalityOverride = parseModality(
			typeof modalityOverrideRaw === 'string' ? modalityOverrideRaw : null
		);
		const location =
			typeof locationRaw === 'string' && locationRaw.trim() !== '' ? locationRaw.trim() : null;
		const room = typeof roomRaw === 'string' && roomRaw.trim() !== '' ? roomRaw.trim() : null;

		await db
			.update(seances)
			.set({
				startAt,
				endAt,
				moduleId,
				formateurId,
				location,
				room,
				modalityOverride
			})
			.where(and(eq(seances.id, sessionId), eq(seances.formationId, params.id)));

		await logAuditEvent({
			formationId: params.id,
			userId: user.id,
			actionType: 'session_updated',
			entityType: 'seance',
			entityId: sessionId,
			oldValue: existing.startAt?.slice(0, 10) ?? '',
			newValue: startAt.slice(0, 10)
		});

		return { success: true };
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
		const sessionIdRaw = formData.get('sessionId');
		if (typeof sessionIdRaw !== 'string' || sessionIdRaw.trim() === '') {
			return fail(400, { message: 'Séance requise' });
		}
		const sessionId = sessionIdRaw.trim();

		const existing = await db.query.seances.findFirst({
			where: and(eq(seances.id, sessionId), eq(seances.formationId, params.id)),
			columns: { id: true, startAt: true }
		});
		if (!existing) {
			return fail(404, { message: 'Séance introuvable' });
		}

		await db
			.delete(seances)
			.where(and(eq(seances.id, sessionId), eq(seances.formationId, params.id)));

		await logAuditEvent({
			formationId: params.id,
			userId: user.id,
			actionType: 'session_deleted',
			entityType: 'seance',
			entityId: sessionId,
			oldValue: existing.startAt?.slice(0, 10) ?? ''
		});

		return { success: true };
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
		const sessionIdRaw = formData.get('sessionId');
		const learnerIdsRaw = formData.get('learnerIds');

		if (typeof sessionIdRaw !== 'string' || sessionIdRaw.trim() === '') {
			return fail(400, { message: 'Séance requise' });
		}
		const sessionId = sessionIdRaw.trim();

		const seanceRow = await db.query.seances.findFirst({
			where: and(eq(seances.id, sessionId), eq(seances.formationId, params.id)),
			columns: { id: true }
		});
		if (!seanceRow) {
			return fail(404, { message: 'Séance introuvable' });
		}

		let learnerIds: string[] = [];
		if (typeof learnerIdsRaw === 'string' && learnerIdsRaw.trim() !== '') {
			try {
				const parsed = JSON.parse(learnerIdsRaw) as unknown;
				if (!Array.isArray(parsed) || !parsed.every((x) => typeof x === 'string')) {
					return fail(400, { message: 'Liste de participants invalide' });
				}
				learnerIds = parsed;
			} catch {
				return fail(400, { message: 'Liste de participants invalide' });
			}
		}

		const rows = await db.query.formationApprenants.findMany({
			where: eq(formationApprenants.formationId, params.id),
			columns: { contactId: true }
		});
		const allowed = new Set(rows.map((r) => r.contactId));
		for (const id of learnerIds) {
			if (!allowed.has(id)) {
				return fail(400, { message: 'Participant non inscrit à cette formation' });
			}
		}

		if (learnerIds.length === 0) {
			await db.delete(emargements).where(eq(emargements.seanceId, sessionId));
		} else {
			await db
				.delete(emargements)
				.where(
					and(
						eq(emargements.seanceId, sessionId),
						notInArray(emargements.contactId, learnerIds)
					)
				);

			const existingEm = await db.query.emargements.findMany({
				where: eq(emargements.seanceId, sessionId),
				columns: { contactId: true }
			});
			const have = new Set(existingEm.map((e) => e.contactId));
			const toAdd = learnerIds.filter((id) => !have.has(id));
			if (toAdd.length > 0) {
				await db.insert(emargements).values(
					toAdd.map((contactId) => ({
						seanceId: sessionId,
						contactId
					}))
				);
			}
		}

		return { success: true };
	}
};
