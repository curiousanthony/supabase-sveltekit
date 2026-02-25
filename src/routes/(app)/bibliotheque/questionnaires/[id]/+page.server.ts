import { db } from '$lib/db';
import {
	biblioQuestionnaires,
	biblioProgrammeQuestionnaires,
	biblioModuleQuestionnaires,
	biblioProgrammes,
	biblioModules
} from '$lib/db/schema';
import { getUserWorkspace, ensureUserInPublicUsers } from '$lib/auth';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { fail, redirect, error } from '@sveltejs/kit';
import { questionnaireSchema } from '$lib/bibliotheque/questionnaire-schema';
import type { PageServerLoad, Actions } from './$types';

function safeParseJsonArray(
	input: string | null | undefined,
	fieldName: string
): { ok: true; value: string[] } | { ok: false; message: string } {
	const str = (typeof input === 'string' ? input : '')?.trim() || '[]';
	try {
		const parsed = JSON.parse(str);
		if (!Array.isArray(parsed)) {
			return { ok: false, message: `Invalid JSON for ${fieldName}: expected array` };
		}
		return { ok: true, value: parsed };
	} catch {
		return { ok: false, message: `Invalid JSON for ${fieldName}` };
	}
}

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
		const programmeIdsResult = safeParseJsonArray(fd.get('programmeIds') as string, 'programmeIds');
		if (!programmeIdsResult.ok) {
			return fail(400, { message: programmeIdsResult.message });
		}
		const moduleIdsResult = safeParseJsonArray(fd.get('moduleIds') as string, 'moduleIds');
		if (!moduleIdsResult.ok) {
			return fail(400, { message: moduleIdsResult.message });
		}
		const raw = {
			titre: (fd.get('titre') as string)?.trim() ?? '',
			type: (fd.get('type') as string) || undefined,
			urlTest: (fd.get('urlTest') as string)?.trim() || undefined,
			programmeIds: programmeIdsResult.value,
			moduleIds: moduleIdsResult.value
		};

		const parsed = questionnaireSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, { message: parsed.error.errors.map((e) => e.message).join(', ') });
		}

		try {
			await db.transaction(async (tx) => {
				const programmeIds = parsed.data.programmeIds;
				const moduleIds = parsed.data.moduleIds;

				const [allowedProgrammeRows, allowedModuleRows] = await Promise.all([
					programmeIds.length > 0
						? tx
								.select({ id: biblioProgrammes.id })
								.from(biblioProgrammes)
								.where(
									and(
										eq(biblioProgrammes.workspaceId, workspaceId),
										inArray(biblioProgrammes.id, programmeIds)
									)
								)
						: Promise.resolve([]),
					moduleIds.length > 0
						? tx
								.select({ id: biblioModules.id })
								.from(biblioModules)
								.where(
									and(
										eq(biblioModules.workspaceId, workspaceId),
										inArray(biblioModules.id, moduleIds)
									)
								)
						: Promise.resolve([])
				]);

				const allowedProgrammeIds = new Set(allowedProgrammeRows.map((r) => r.id));
				const allowedModuleIds = new Set(allowedModuleRows.map((r) => r.id));
				const invalidProgrammeIds = programmeIds.filter((id) => !allowedProgrammeIds.has(id));
				const invalidModuleIds = moduleIds.filter((id) => !allowedModuleIds.has(id));

				if (invalidProgrammeIds.length > 0 || invalidModuleIds.length > 0) {
					const parts: string[] = [];
					if (invalidProgrammeIds.length > 0) parts.push('programmes invalides ou non accessibles');
					if (invalidModuleIds.length > 0) parts.push('modules invalides ou non accessibles');
					throw new Error(parts.join(' ; '));
				}

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
				if (programmeIds.length > 0) {
					await tx.insert(biblioProgrammeQuestionnaires).values(
						programmeIds.map((programmeId) => ({
							programmeId,
							questionnaireId: params.id
						}))
					);
				}

				await tx
					.delete(biblioModuleQuestionnaires)
					.where(eq(biblioModuleQuestionnaires.questionnaireId, params.id));
				if (moduleIds.length > 0) {
					await tx.insert(biblioModuleQuestionnaires).values(
						moduleIds.map((moduleId) => ({
							moduleId,
							questionnaireId: params.id
						}))
					);
				}
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
			return fail(400, { message });
		}

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
