import { fail } from '@sveltejs/kit';
import { db } from '$lib/db';
import { formations, modules } from '$lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { getUserWorkspace, ensureUserInPublicUsers } from '$lib/auth';
import { logAuditEvent } from '$lib/services/audit-log';
import type { Actions, PageServerLoad } from './$types';

async function verifyFormationOwnership(params: { id: string }, workspaceId: string) {
	const formation = await db.query.formations.findFirst({
		where: and(eq(formations.id, params.id), eq(formations.workspaceId, workspaceId)),
		columns: { id: true }
	});
	return !!formation;
}

function parseOptionalDuration(value: FormDataEntryValue | null): string | null {
	if (value == null || value === '') return null;
	const n = Number(value);
	if (Number.isNaN(n) || n < 0) return null;
	return String(n);
}

function parseOptionalText(value: FormDataEntryValue | null): string | null {
	if (value == null || typeof value !== 'string') return null;
	const t = value.trim();
	return t === '' ? null : t;
}

export const load = (() => {
	return {};
}) satisfies PageServerLoad;

export const actions: Actions = {
	addModule: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });
		await ensureUserInPublicUsers(locals);
		if (!(await verifyFormationOwnership(params, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const rawName = formData.get('name');
		if (typeof rawName !== 'string' || rawName.trim() === '') {
			return fail(400, { message: 'Le nom du module est requis' });
		}

		const existing = await db.query.modules.findMany({
			where: eq(modules.courseId, params.id),
			columns: { orderIndex: true }
		});
		const nextIndex =
			existing.reduce((max, row) => Math.max(max, row.orderIndex ?? 0), -1) + 1;

		const durationHours = parseOptionalDuration(formData.get('durationHours'));
		const objectifs = parseOptionalText(formData.get('objectifs'));

		const [inserted] = await db
			.insert(modules)
			.values({
				courseId: params.id,
				createdBy: user.id,
				name: rawName.trim(),
				durationHours,
				objectifs,
				orderIndex: nextIndex
			})
			.returning({ id: modules.id, name: modules.name });

		if (!inserted) {
			return fail(500, { message: 'Impossible de créer le module' });
		}

		await logAuditEvent({
			formationId: params.id,
			userId: user.id,
			actionType: 'module_added',
			entityType: 'module',
			entityId: inserted.id,
			newValue: inserted.name
		});

		return { success: true };
	},

	updateModule: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });
		if (!(await verifyFormationOwnership(params, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const moduleId = formData.get('moduleId');
		if (typeof moduleId !== 'string' || moduleId === '') {
			return fail(400, { message: 'Module requis' });
		}

		const existing = await db.query.modules.findFirst({
			where: and(eq(modules.id, moduleId), eq(modules.courseId, params.id)),
			columns: { id: true, name: true }
		});
		if (!existing) {
			return fail(404, { message: 'Module introuvable' });
		}

		const rawName = formData.get('name');
		if (typeof rawName !== 'string' || rawName.trim() === '') {
			return fail(400, { message: 'Le nom du module est requis' });
		}

		const durationHours = parseOptionalDuration(formData.get('durationHours'));
		const objectifs = parseOptionalText(formData.get('objectifs'));

		await db
			.update(modules)
			.set({
				name: rawName.trim(),
				durationHours,
				objectifs
			})
			.where(eq(modules.id, moduleId));

		await logAuditEvent({
			formationId: params.id,
			userId: user.id,
			actionType: 'module_updated',
			entityType: 'module',
			entityId: moduleId,
			oldValue: existing.name,
			newValue: rawName.trim()
		});

		return { success: true };
	},

	deleteModule: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });
		if (!(await verifyFormationOwnership(params, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const moduleId = formData.get('moduleId');
		if (typeof moduleId !== 'string' || moduleId === '') {
			return fail(400, { message: 'Module requis' });
		}

		const existing = await db.query.modules.findFirst({
			where: and(eq(modules.id, moduleId), eq(modules.courseId, params.id)),
			columns: { id: true, name: true }
		});
		if (!existing) {
			return fail(404, { message: 'Module introuvable' });
		}

		await db.delete(modules).where(eq(modules.id, moduleId));

		await logAuditEvent({
			formationId: params.id,
			userId: user.id,
			actionType: 'module_deleted',
			entityType: 'module',
			entityId: moduleId,
			oldValue: existing.name
		});

		return { success: true };
	},

	reorderModules: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });
		if (!(await verifyFormationOwnership(params, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const raw = formData.get('moduleIds');
		if (typeof raw !== 'string' || raw === '') {
			return fail(400, { message: 'Ordre requis' });
		}

		let ids: string[];
		try {
			const parsed = JSON.parse(raw) as unknown;
			if (!Array.isArray(parsed) || !parsed.every((x) => typeof x === 'string')) {
				return fail(400, { message: 'Ordre invalide' });
			}
			ids = parsed;
		} catch {
			return fail(400, { message: 'Ordre invalide' });
		}

		const existingRows = await db.query.modules.findMany({
			where: eq(modules.courseId, params.id),
			columns: { id: true }
		});
		const existingSet = new Set(existingRows.map((r) => r.id));
		if (ids.length !== existingSet.size || !ids.every((id) => existingSet.has(id))) {
			return fail(400, { message: 'Ordre invalide' });
		}

		await db.transaction(async (tx) => {
			for (let i = 0; i < ids.length; i++) {
				await tx.update(modules).set({ orderIndex: i }).where(eq(modules.id, ids[i]));
			}
		});

		await logAuditEvent({
			formationId: params.id,
			userId: user.id,
			actionType: 'modules_reordered',
			entityType: 'formation',
			entityId: params.id,
			newValue: ids.join(',')
		});

		return { success: true };
	},

	detachProgramme: async ({ locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });
		if (!(await verifyFormationOwnership(params, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const current = await db.query.formations.findFirst({
			where: and(eq(formations.id, params.id), eq(formations.workspaceId, workspaceId)),
			columns: { programmeSourceId: true }
		});
		if (!current?.programmeSourceId) {
			return fail(400, { message: 'Aucun programme source lié' });
		}

		const oldId = current.programmeSourceId;

		await db
			.update(formations)
			.set({ programmeSourceId: null })
			.where(eq(formations.id, params.id));

		await logAuditEvent({
			formationId: params.id,
			userId: user.id,
			actionType: 'programme_source_detached',
			entityType: 'formation',
			entityId: params.id,
			fieldName: 'programmeSourceId',
			oldValue: oldId,
			newValue: null
		});

		return { success: true };
	}
};
