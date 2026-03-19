import { db } from '$lib/db';
import { formations } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { getUserWorkspace } from '$lib/auth';
import type { Actions } from './$types';

export const actions: Actions = {
	updateField: async ({ request, params, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });

		const formData = await request.formData();
		const field = formData.get('field') as string;
		const value = formData.get('value') as string;

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
			'typeFinancement',
			'montantAccorde',
			'financementAccorde',
			'tjmFormateur'
		];

		if (!field || !allowedFields.includes(field)) {
			return fail(400, { message: 'Champ non autorisé' });
		}

		const existing = await db.query.formations.findFirst({
			where: eq(formations.id, params.id),
			columns: { workspaceId: true }
		});
		if (!existing || existing.workspaceId !== workspaceId) {
			return fail(404, { message: 'Formation introuvable' });
		}

		let processedValue: string | number | boolean | null = value;
		if (field === 'duree') processedValue = value ? parseInt(value, 10) : null;
		if (field === 'financementAccorde') processedValue = value === 'true';
		if (field === 'montantAccorde' || field === 'tjmFormateur') {
			const num = value ? parseFloat(value) : NaN;
			processedValue = Number.isFinite(num) ? num : null;
		}
		if (['dateDebut', 'dateFin'].includes(field)) processedValue = value || null;
		if (field === 'clientId') processedValue = value || null;
		if (value === '') processedValue = null;

		await db
			.update(formations)
			.set({ [field]: processedValue })
			.where(eq(formations.id, params.id));

		return { success: true };
	}
};
