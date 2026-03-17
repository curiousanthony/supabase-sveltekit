import { db } from '$lib/db';
import {
	biblioProgrammes,
	biblioProgrammeModules,
	biblioProgrammeSupports,
	biblioModules,
	biblioSupports
} from '$lib/db/schema';
import { getUserWorkspace, ensureUserInPublicUsers } from '$lib/auth';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { programmeSchema } from '$lib/bibliotheque/programme-schema';
import type { PageServerLoad, Actions } from './$types';

function safeParseJSON<T>(raw: string | null, fallback: T): { ok: true; value: T } | { ok: false; error: string } {
	if (!raw) return { ok: true, value: fallback };
	try {
		return { ok: true, value: JSON.parse(raw) as T };
	} catch (e) {
		const msg = e instanceof SyntaxError ? 'Format JSON invalide pour les données envoyées.' : 'Erreur lors de la lecture des données.';
		return { ok: false, error: msg };
	}
}

export const load = (async ({ locals, url }) => {
	const workspaceId = await getUserWorkspace(locals);
	const returnTo = url.searchParams.get('returnTo');

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
			backButtonHref: returnTo ?? '/bibliotheque/programmes',
			backButtonLabel: returnTo ? 'Retour' : 'Programmes',
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
		const moduleIdsRaw = fd.get('moduleIds') as string | null;
		const supportIdsRaw = fd.get('supportIds') as string | null;
		const prixPublicRaw = fd.get('prixPublic') as string | null;
		const dureeHeuresRaw = fd.get('dureeHeures') as string | null;

		const moduleIdsResult = safeParseJSON<string[]>(moduleIdsRaw, []);
		if (!moduleIdsResult.ok) {
			return fail(400, { message: `Modules : ${moduleIdsResult.error}` });
		}
		const supportIdsResult = safeParseJSON<string[]>(supportIdsRaw, []);
		if (!supportIdsResult.ok) {
			return fail(400, { message: `Supports : ${supportIdsResult.error}` });
		}

		const raw = {
			titre: (fd.get('titre') as string)?.trim() ?? '',
			description: (fd.get('description') as string)?.trim() || undefined,
			modalite: (fd.get('modalite') as string) || undefined,
			prixPublic: prixPublicRaw != null && String(prixPublicRaw).trim() !== '' ? Number(prixPublicRaw) : undefined,
			statut: (fd.get('statut') as string) || 'Brouillon',
			prerequis: (fd.get('prerequis') as string)?.trim() || undefined,
			dureeHeures: dureeHeuresRaw != null && String(dureeHeuresRaw).trim() !== '' ? Number(dureeHeuresRaw) : undefined,
			moduleIds: moduleIdsResult.value,
			supportIds: supportIdsResult.value
		};

		const parsed = programmeSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, {
				message: parsed.error.errors.map((e) => e.message).join(', '),
				values: raw
			});
		}

		if (parsed.data.moduleIds.length > 0) {
			const allowedModules = await db
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
				return fail(400, { message: 'Un ou plusieurs modules n’appartiennent pas à cet espace de travail.' });
			}
		}

		if (parsed.data.supportIds.length > 0) {
			const allowedSupports = await db
				.select({ id: biblioSupports.id })
				.from(biblioSupports)
				.where(
					and(
						eq(biblioSupports.workspaceId, workspaceId),
						inArray(biblioSupports.id, parsed.data.supportIds)
					)
				);
			const allowedSupportIds = new Set(allowedSupports.map((r) => r.id));
			const invalid =
				allowedSupportIds.size !== parsed.data.supportIds.length ||
				parsed.data.supportIds.some((id: string) => !allowedSupportIds.has(id));
			if (invalid) {
				return fail(400, { message: 'Un ou plusieurs supports n’appartiennent pas à cet espace de travail.' });
			}
		}

		const inserted = await db.transaction(async (tx) => {
			const [row] = await tx
				.insert(biblioProgrammes)
				.values({
					titre: parsed.data.titre,
					description: parsed.data.description ?? null,
					modalite: parsed.data.modalite ?? null,
					prixPublic: parsed.data.prixPublic?.toString() ?? null,
					statut: parsed.data.statut,
					prerequis:
						parsed.data.prerequis?.length ? JSON.stringify(parsed.data.prerequis) : null,
					dureeHeures: parsed.data.dureeHeures?.toString() ?? null,
					workspaceId,
					createdBy: user.id
				})
				.returning({ id: biblioProgrammes.id });

			if (!row) throw new Error('Programme insert failed');

			if (parsed.data.moduleIds.length > 0) {
				await tx.insert(biblioProgrammeModules).values(
					parsed.data.moduleIds.map((moduleId, index) => ({
						programmeId: row.id,
						moduleId,
						orderIndex: index
					}))
				);
			}

			if (parsed.data.supportIds.length > 0) {
				await tx.insert(biblioProgrammeSupports).values(
					parsed.data.supportIds.map((supportId) => ({
						programmeId: row.id,
						supportId
					}))
				);
			}

			return row;
		});

		const returnTo = new URL(request.url).searchParams.get('returnTo');
		if (returnTo) {
			const sep = returnTo.includes('?') ? '&' : '?';
			throw redirect(303, `${returnTo}${sep}programmeId=${inserted.id}`);
		}
		throw redirect(303, `/bibliotheque/programmes/${inserted.id}`);
	}
};
