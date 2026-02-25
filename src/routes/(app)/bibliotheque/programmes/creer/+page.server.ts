import { db } from '$lib/db';
import {
	biblioProgrammes,
	biblioProgrammeModules,
	biblioProgrammeSupports,
	biblioModules,
	biblioSupports
} from '$lib/db/schema';
import { getUserWorkspace, ensureUserInPublicUsers } from '$lib/auth';
import { eq, desc } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { programmeSchema } from '$lib/bibliotheque/programme-schema';
import type { PageServerLoad, Actions } from './$types';

export const load = (async ({ locals }) => {
	const workspaceId = await getUserWorkspace(locals);

	const [availableModules, availableSupports] = workspaceId
		? await Promise.all([
				db
					.select({ id: biblioModules.id, titre: biblioModules.titre, dureeHeures: biblioModules.dureeHeures })
					.from(biblioModules)
					.where(eq(biblioModules.workspaceId, workspaceId))
					.orderBy(desc(biblioModules.updatedAt)),
				db
					.select({ id: biblioSupports.id, titre: biblioSupports.titre, url: biblioSupports.url, filePath: biblioSupports.filePath })
					.from(biblioSupports)
					.where(eq(biblioSupports.workspaceId, workspaceId))
					.orderBy(desc(biblioSupports.updatedAt))
			])
		: [[], []];

	return {
		availableModules,
		availableSupports,
		header: {
			pageName: 'Nouveau programme',
			backButton: true,
			backButtonHref: '/bibliotheque/programmes',
			backButtonLabel: 'Programmes',
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
		const moduleIdsRaw = fd.get('moduleIds') as string;
		const supportIdsRaw = fd.get('supportIds') as string;
		const raw = {
			titre: (fd.get('titre') as string)?.trim() ?? '',
			description: (fd.get('description') as string)?.trim() || undefined,
			modalite: (fd.get('modalite') as string) || undefined,
			prixPublic: fd.get('prixPublic') ? Number(fd.get('prixPublic')) : undefined,
			statut: (fd.get('statut') as string) || 'Brouillon',
			prerequis: (fd.get('prerequis') as string)?.trim() || undefined,
			dureeHeures: fd.get('dureeHeures') ? Number(fd.get('dureeHeures')) : undefined,
			moduleIds: moduleIdsRaw ? JSON.parse(moduleIdsRaw) : []
		};
		const supportIds: string[] = supportIdsRaw ? JSON.parse(supportIdsRaw) : [];

		const parsed = programmeSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, {
				message: parsed.error.errors.map((e) => e.message).join(', '),
				values: raw
			});
		}

		const [inserted] = await db
			.insert(biblioProgrammes)
			.values({
				titre: parsed.data.titre,
				description: parsed.data.description ?? null,
				modalite: parsed.data.modalite ?? null,
				prixPublic: parsed.data.prixPublic?.toString() ?? null,
				statut: parsed.data.statut,
				prerequis: parsed.data.prerequis ?? null,
				dureeHeures: parsed.data.dureeHeures?.toString() ?? null,
				workspaceId,
				createdBy: user.id
			})
			.returning({ id: biblioProgrammes.id });

		if (parsed.data.moduleIds.length > 0) {
			await db.insert(biblioProgrammeModules).values(
				parsed.data.moduleIds.map((moduleId, index) => ({
					programmeId: inserted.id,
					moduleId,
					orderIndex: index
				}))
			);
		}

		if (supportIds.length > 0) {
			await db.insert(biblioProgrammeSupports).values(
				supportIds.map((supportId) => ({
					programmeId: inserted.id,
					supportId
				}))
			);
		}

		throw redirect(303, `/bibliotheque/programmes/${inserted.id}`);
	}
};
