import { db } from '$lib/db';
import { formations, formationActions, formationApprenants, formationFormateurs, formationWorkflowSteps, questSubActions, formationAuditLog, modules, seances } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { getUserWorkspace } from '$lib/auth';
import type { Actions } from './$types';

export const actions: Actions = {
	renameFormation: async ({ request, params, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });

		const formData = await request.formData();
		const name = formData.get('name');
		if (!name || typeof name !== 'string' || !name.trim()) {
			return fail(400, { message: 'Le nom est requis' });
		}

		const existing = await db.query.formations.findFirst({
			where: eq(formations.id, params.id),
			columns: { workspaceId: true }
		});
		if (!existing || existing.workspaceId !== workspaceId) {
			return fail(404, { message: 'Formation introuvable' });
		}

		await db
			.update(formations)
			.set({ name: name.trim() })
			.where(eq(formations.id, params.id));

		return { success: true };
	},

	archiveFormation: async ({ params, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });

		const existing = await db.query.formations.findFirst({
			where: eq(formations.id, params.id),
			columns: { workspaceId: true }
		});
		if (!existing || existing.workspaceId !== workspaceId) {
			return fail(404, { message: 'Formation introuvable' });
		}

		await db
			.update(formations)
			.set({ statut: 'Archivée' })
			.where(eq(formations.id, params.id));

		throw redirect(303, '/formations');
	},

	deleteFormation: async ({ params, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });

		const existing = await db.query.formations.findFirst({
			where: eq(formations.id, params.id),
			columns: { workspaceId: true }
		});
		if (!existing || existing.workspaceId !== workspaceId) {
			return fail(404, { message: 'Formation introuvable' });
		}

		await db.delete(formations).where(eq(formations.id, params.id));

		throw redirect(303, '/formations');
	}
};
