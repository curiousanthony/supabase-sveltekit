import { db } from '$lib/db';
import {
	biblioQuestionnaires,
	biblioProgrammeQuestionnaires,
	biblioModuleQuestionnaires,
	biblioProgrammes,
	biblioModules
} from '$lib/db/schema';
import { getUserWorkspace, ensureUserInPublicUsers } from '$lib/auth';
import { eq, and, desc } from 'drizzle-orm';
import { fail, redirect, error } from '@sveltejs/kit';
import { questionnaireSchema } from '$lib/bibliotheque/questionnaire-schema';
import type { PageServerLoad, Actions } from './$types';

export const load = (async ({ params, locals }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) throw error(403, 'Aucun espace de travail');

	const questionnaire = await db.query.biblioQuestionnaires.findFirst({
		where: and(
			eq(biblioQuestionnaires.id, params.id),
			eq(biblioQuestionnaires.workspaceId, workspaceId)
		)
	});
	if (!questionnaire) throw error(404, 'Questionnaire non trouvé');

	const linkedProgrammes = await db
		.select({ programmeId: biblioProgrammeQuestionnaires.programmeId })
		.from(biblioProgrammeQuestionnaires)
		.where(eq(biblioProgrammeQuestionnaires.questionnaireId, params.id));

	const linkedModules = await db
		.select({ moduleId: biblioModuleQuestionnaires.moduleId })
		.from(biblioModuleQuestionnaires)
		.where(eq(biblioModuleQuestionnaires.questionnaireId, params.id));

	const [programmes, modules] = await Promise.all([
		db
			.select({ id: biblioProgrammes.id, titre: biblioProgrammes.titre })
			.from(biblioProgrammes)
			.where(eq(biblioProgrammes.workspaceId, workspaceId))
			.orderBy(desc(biblioProgrammes.updatedAt)),
		db
			.select({ id: biblioModules.id, titre: biblioModules.titre })
			.from(biblioModules)
			.where(eq(biblioModules.workspaceId, workspaceId))
			.orderBy(desc(biblioModules.updatedAt))
	]);

	return {
		questionnaire,
		linkedProgrammeIds: linkedProgrammes.map((r) => r.programmeId),
		linkedModuleIds: linkedModules.map((r) => r.moduleId),
		availableProgrammes: programmes,
		availableModules: modules,
		header: {
			pageName: questionnaire.titre,
			backButton: true,
			backButtonHref: '/bibliotheque/questionnaires',
			backButtonLabel: 'Questionnaires',
			actions: []
		}
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	update: async ({ request, locals, params }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun espace de travail' });

		const fd = await request.formData();
		const raw = {
			titre: (fd.get('titre') as string)?.trim() ?? '',
			type: (fd.get('type') as string) || undefined,
			urlTest: (fd.get('urlTest') as string)?.trim() || undefined,
			programmeIds: JSON.parse((fd.get('programmeIds') as string) || '[]'),
			moduleIds: JSON.parse((fd.get('moduleIds') as string) || '[]')
		};

		const parsed = questionnaireSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, { message: parsed.error.errors.map((e) => e.message).join(', ') });
		}

		await db.transaction(async (tx) => {
			await tx
				.update(biblioQuestionnaires)
				.set({
					titre: parsed.data.titre,
					type: parsed.data.type ?? null,
					urlTest: parsed.data.urlTest || null
				})
				.where(
					and(
						eq(biblioQuestionnaires.id, params.id),
						eq(biblioQuestionnaires.workspaceId, workspaceId)
					)
				);

			await tx
				.delete(biblioProgrammeQuestionnaires)
				.where(eq(biblioProgrammeQuestionnaires.questionnaireId, params.id));
			if (parsed.data.programmeIds.length > 0) {
				await tx.insert(biblioProgrammeQuestionnaires).values(
					parsed.data.programmeIds.map((programmeId) => ({
						programmeId,
						questionnaireId: params.id
					}))
				);
			}

			await tx
				.delete(biblioModuleQuestionnaires)
				.where(eq(biblioModuleQuestionnaires.questionnaireId, params.id));
			if (parsed.data.moduleIds.length > 0) {
				await tx.insert(biblioModuleQuestionnaires).values(
					parsed.data.moduleIds.map((moduleId) => ({
						moduleId,
						questionnaireId: params.id
					}))
				);
			}
		});

		return { success: true };
	},

	delete: async ({ locals, params }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun espace de travail' });

		await db
			.delete(biblioQuestionnaires)
			.where(
				and(
					eq(biblioQuestionnaires.id, params.id),
					eq(biblioQuestionnaires.workspaceId, workspaceId)
				)
			);

		throw redirect(303, '/bibliotheque/questionnaires');
	}
};
