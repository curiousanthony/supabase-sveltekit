import { db } from '$lib/db';
import {
	biblioQuestionnaires,
	biblioProgrammeQuestionnaires,
	biblioModuleQuestionnaires,
	biblioProgrammes,
	biblioModules
} from '$lib/db/schema';
import { getUserWorkspace, ensureUserInPublicUsers } from '$lib/auth';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { questionnaireSchema } from '$lib/bibliotheque/questionnaire-schema';
import type { PageServerLoad, Actions } from './$types';

function safeParseJson<T>(s: string | null | undefined, defaultVal: T): { ok: true; value: T } | { ok: false } {
	const raw = (s ?? '').trim();
	if (raw === '') return { ok: true, value: defaultVal };
	try {
		return { ok: true, value: JSON.parse(raw) as T };
	} catch {
		return { ok: false };
	}
}

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
		try {
			await ensureUserInPublicUsers(locals);
		} catch (e) {
			console.error('[questionnaires/creer] ensureUserInPublicUsers failed:', e);
			return fail(500, { message: 'Impossible de vérifier votre accès. Réessayez ou contactez le support.', error: true });
		}

		const fd = await request.formData();
		const programmeIdsResult = safeParseJson<string[]>(fd.get('programmeIds') as string | null, []);
		const moduleIdsResult = safeParseJson<string[]>(fd.get('moduleIds') as string | null, []);
		const parseErrors: { programmeIds?: string; moduleIds?: string } = {};
		if (!programmeIdsResult.ok) parseErrors.programmeIds = 'invalid JSON';
		if (!moduleIdsResult.ok) parseErrors.moduleIds = 'invalid JSON';
		if (Object.keys(parseErrors).length > 0) {
			return fail(400, { invalid: true, errors: parseErrors });
		}
		const programmeIds = programmeIdsResult.ok ? programmeIdsResult.value : [];
		const moduleIds = moduleIdsResult.ok ? moduleIdsResult.value : [];
		const raw = {
			titre: (fd.get('titre') as string)?.trim() ?? '',
			type: (fd.get('type') as string) || undefined,
			urlTest: (fd.get('urlTest') as string)?.trim() || undefined,
			programmeIds,
			moduleIds
		};

		const parsed = questionnaireSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, {
				message: parsed.error.errors.map((e) => e.message).join(', '),
				values: raw
			});
		}

		let inserted: { id: string };
		try {
			inserted = await db.transaction(async (tx) => {
				const [row] = await tx
					.insert(biblioQuestionnaires)
					.values({
						titre: parsed.data.titre,
						type: parsed.data.type ?? null,
						urlTest: parsed.data.urlTest || null,
						workspaceId,
						createdBy: user.id
					})
					.returning({ id: biblioQuestionnaires.id });

				if (!row) throw new Error('Insert failed');

				if (parsed.data.programmeIds.length > 0) {
					const allowedProgrammes = await tx
						.select({ id: biblioProgrammes.id })
						.from(biblioProgrammes)
						.where(
							and(
								eq(biblioProgrammes.workspaceId, workspaceId),
								inArray(biblioProgrammes.id, parsed.data.programmeIds)
							)
						);
					const allowedProgrammeIds = new Set(allowedProgrammes.map((r) => r.id));
					const invalid =
						allowedProgrammeIds.size !== parsed.data.programmeIds.length ||
						parsed.data.programmeIds.some((id) => !allowedProgrammeIds.has(id));
					if (invalid) {
						throw new Error('PROGRAMMES_INVALID');
					}
					await tx.insert(biblioProgrammeQuestionnaires).values(
						parsed.data.programmeIds.map((programmeId) => ({
							programmeId,
							questionnaireId: row.id
						}))
					);
				}

				if (parsed.data.moduleIds.length > 0) {
					const allowedModules = await tx
						.select({ id: biblioModules.id })
						.from(biblioModules)
						.where(
							and(
								eq(biblioModules.workspaceId, workspaceId),
								inArray(biblioModules.id, parsed.data.moduleIds)
							)
						);
					const allowedModuleIds = new Set(allowedModules.map((r) => r.id));
					const invalid =
						allowedModuleIds.size !== parsed.data.moduleIds.length ||
						parsed.data.moduleIds.some((id) => !allowedModuleIds.has(id));
					if (invalid) {
						throw new Error('MODULES_INVALID');
					}
					await tx.insert(biblioModuleQuestionnaires).values(
						parsed.data.moduleIds.map((moduleId) => ({
							moduleId,
							questionnaireId: row.id
						}))
					);
				}

				return row;
			});
		} catch (err) {
			const msg =
				err instanceof Error && err.message === 'PROGRAMMES_INVALID'
					? 'Un ou plusieurs programmes n’appartiennent pas à cet espace de travail.'
					: err instanceof Error && err.message === 'MODULES_INVALID'
						? 'Un ou plusieurs modules n’appartiennent pas à cet espace de travail.'
						: null;
			if (msg) return fail(400, { message: msg, values: raw });
			throw err;
		}

		throw redirect(303, `/bibliotheque/questionnaires/${inserted.id}`);
	}
};
