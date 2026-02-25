import { db } from '$lib/db';
import {
	biblioQuestionnaires,
	biblioProgrammeQuestionnaires,
	biblioModuleQuestionnaires,
	biblioProgrammes,
	biblioModules
} from '$lib/db/schema';
import { getUserWorkspace, ensureUserInPublicUsers } from '$lib/auth';
import { eq, desc } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { questionnaireSchema } from '$lib/bibliotheque/questionnaire-schema';
import type { PageServerLoad, Actions } from './$types';

export const load = (async ({ locals }) => {
	const workspaceId = await getUserWorkspace(locals);

	const [programmes, modules] = workspaceId
		? await Promise.all([
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
			])
		: [[], []];

	return {
		availableProgrammes: programmes,
		availableModules: modules,
		header: {
			pageName: 'Nouveau questionnaire',
			backButton: true,
			backButtonHref: '/bibliotheque/questionnaires',
			backButtonLabel: 'Questionnaires',
			actions: []
		}
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun espace de travail' });
		await ensureUserInPublicUsers(locals);

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
			return fail(400, {
				message: parsed.error.errors.map((e) => e.message).join(', '),
				values: raw
			});
		}

		const [inserted] = await db
			.insert(biblioQuestionnaires)
			.values({
				titre: parsed.data.titre,
				type: parsed.data.type ?? null,
				urlTest: parsed.data.urlTest || null,
				workspaceId,
				createdBy: user.id
			})
			.returning({ id: biblioQuestionnaires.id });

		if (parsed.data.programmeIds.length > 0) {
			await db.insert(biblioProgrammeQuestionnaires).values(
				parsed.data.programmeIds.map((programmeId) => ({
					programmeId,
					questionnaireId: inserted.id
				}))
			);
		}

		if (parsed.data.moduleIds.length > 0) {
			await db.insert(biblioModuleQuestionnaires).values(
				parsed.data.moduleIds.map((moduleId) => ({
					moduleId,
					questionnaireId: inserted.id
				}))
			);
		}

		throw redirect(303, `/bibliotheque/questionnaires/${inserted.id}`);
	}
};
