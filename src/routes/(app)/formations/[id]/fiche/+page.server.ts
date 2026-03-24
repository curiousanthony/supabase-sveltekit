import { db } from '$lib/db';
import { formations, formationActions, companies, thematiques, sousthematiques } from '$lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { getUserWorkspace } from '$lib/auth';
import { getQuestsForFormation, calculateDueDates } from '$lib/formation-quests';
import type { PageServerLoad, Actions } from './$types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const load = (async ({ locals }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) {
		return { companies: [], thematiques: [], sousthematiques: [] };
	}

	const [companiesData, thematiquesData, sousthematiquesData] = await Promise.all([
		db.query.companies.findMany({
			where: eq(companies.workspaceId, workspaceId),
			columns: { id: true, name: true },
			orderBy: [asc(companies.name)]
		}),
		db.query.thematiques.findMany({
			columns: { id: true, name: true },
			orderBy: [asc(thematiques.name)]
		}),
		db.query.sousthematiques.findMany({
			columns: { id: true, name: true, parentTopicId: true },
			orderBy: [asc(sousthematiques.name)]
		})
	]);

	return {
		companies: companiesData,
		thematiques: thematiquesData,
		sousthematiques: sousthematiquesData
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	updateField: async ({ request, params, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });

		const formData = await request.formData();
		const rawField = formData.get('field');
		const rawValue = formData.get('value');
		if (!rawField || typeof rawField !== 'string') {
			return fail(400, { message: 'Champ requis' });
		}
		const field = rawField;
		const value = rawValue != null && typeof rawValue === 'string' ? rawValue : null;

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
		if (field === 'duree') {
			if (value) {
				const n = parseInt(value, 10);
				processedValue = Number.isFinite(n) ? n : null;
			} else {
				processedValue = null;
			}
		}
		if (field === 'financementAccorde') processedValue = value === 'true';
		if (field === 'montantAccorde' || field === 'tjmFormateur') {
			const num = value ? parseFloat(value) : NaN;
			processedValue = Number.isFinite(num) ? num : null;
		}
		if (['dateDebut', 'dateFin'].includes(field)) processedValue = value || null;
		if (['clientId', 'companyId', 'topicId', 'subtopicsIds'].includes(field)) {
			processedValue = value && UUID_REGEX.test(value) ? value : null;
		}
		if (value === '' || value === null) processedValue = null;

		await db
			.update(formations)
			.set({ [field]: processedValue })
			.where(eq(formations.id, params.id));

		if (['dateDebut', 'dateFin', 'type', 'typeFinancement'].includes(field)) {
			await recalculateActionDueDates(params.id);
		}

		return { success: true };
	}
};

async function recalculateActionDueDates(formationId: string) {
	const formation = await db.query.formations.findFirst({
		where: eq(formations.id, formationId),
		columns: { type: true, typeFinancement: true, dateDebut: true, dateFin: true }
	});
	if (!formation) return;

	const quests = getQuestsForFormation(
		formation.type as 'Intra' | 'Inter' | 'CPF' | null | undefined,
		formation.typeFinancement as 'CPF' | 'OPCO' | 'Inter' | 'Intra' | null | undefined
	);
	const dueDates = calculateDueDates(quests, formation.dateDebut, formation.dateFin);

	const actions = await db.query.formationActions.findMany({
		where: eq(formationActions.formationId, formationId),
		columns: { id: true, questKey: true }
	});

	for (const action of actions) {
		if (!action.questKey) continue;
		const newDueDate = dueDates.get(action.questKey) ?? null;
		await db
			.update(formationActions)
			.set({ dueDate: newDueDate })
			.where(eq(formationActions.id, action.id));
	}
}
