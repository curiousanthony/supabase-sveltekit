import { db } from '$lib/db';
import { biblioSupports } from '$lib/db/schema';
import { getUserWorkspace, ensureUserInPublicUsers } from '$lib/auth';
import { eq, desc, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load = (async ({ locals }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) {
		return { supports: [], workspaceId: null, header: { pageName: 'Bibliothèque', actions: [] } };
	}

	const rows = await db
		.select()
		.from(biblioSupports)
		.where(eq(biblioSupports.workspaceId, workspaceId))
		.orderBy(desc(biblioSupports.updatedAt));

	return {
		supports: rows,
		workspaceId,
		header: {
			pageName: 'Bibliothèque',
			actions: []
		}
	};
}) satisfies PageServerLoad;

/** Sanitizes a user-provided filename for storage: basename only, safe chars, preserved extension, max 255 chars. */
function sanitizeFilenameForStorage(originalName: string, fallback: string): string {
	const normalized = originalName.normalize('NFC').replace(/\0/g, '');
	const segments = normalized.replace(/\\/g, '/').split('/').filter(Boolean);
	const basename = segments.pop() ?? '';

	if (!basename || basename === '..' || basename === '.') return fallback;

	const extMatch = basename.match(/\.([a-zA-Z0-9]{1,20})$/);
	const ext = extMatch ? '.' + extMatch[1].toLowerCase() : '';
	const nameWithoutExt = extMatch ? basename.slice(0, -ext.length) : basename;

	const stripControlChars = (s: string) =>
		[...s].filter((c) => {
			const code = c.charCodeAt(0);
			return (code >= 32 && code !== 127) || (code > 159);
		}).join('');
	const safePart = stripControlChars(nameWithoutExt)
		.replace(/[^a-zA-Z0-9._-]/g, '_')
		.replace(/\.{2,}/g, '_')
		.replace(/^[.\s]+|[.\s]+$/g, '')
		.slice(0, Math.max(0, 255 - ext.length));

	const sanitized = (safePart || fallback) + ext;
	return sanitized.slice(0, 255);
}

export const actions: Actions = {
	createLink: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun espace de travail' });
		await ensureUserInPublicUsers(locals);

		const fd = await request.formData();
		const titre = (fd.get('titre') as string)?.trim();
		const url = (fd.get('url') as string)?.trim();

		if (!titre) return fail(400, { message: 'Titre requis' });

		if (url && !/^https?:\/\/.+/i.test(url)) {
			return fail(400, { message: 'URL invalide' });
		}

		await db.insert(biblioSupports).values({
			titre,
			url: url || null,
			workspaceId,
			createdBy: user.id
		});

		return { success: true };
	},

	upload: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun espace de travail' });
		await ensureUserInPublicUsers(locals);

		const fd = await request.formData();
		const file = fd.get('file') as File;
		const titre = (fd.get('titre') as string)?.trim() || file?.name;

		if (!file || file.size === 0) return fail(400, { message: 'Fichier requis' });
		if (file.size > 10 * 1024 * 1024)
			return fail(400, { message: 'Fichier trop volumineux (max 10 Mo)' });

		const { supabase } = locals;
		const segmentId = crypto.randomUUID();
		const sanitizedName = sanitizeFilenameForStorage(file.name, segmentId);
		const filePath = `${workspaceId}/${segmentId}/${sanitizedName}`;

		const { error: uploadError } = await supabase.storage
			.from('bibliotheque-supports')
			.upload(filePath, file, { contentType: file.type });

		if (uploadError) {
			console.error('[Supports upload]', uploadError);
			return fail(500, { message: "Erreur lors de l'upload" });
		}

		try {
			await db.insert(biblioSupports).values({
				titre,
				filePath,
				fileName: file.name,
				fileSize: file.size,
				mimeType: file.type,
				workspaceId,
				createdBy: user.id
			});
		} catch (err) {
			if (!uploadError && filePath) {
				await supabase.storage.from('bibliotheque-supports').remove([filePath]);
			}
			console.error('[Supports insert]', err);
			return fail(500, { message: "Erreur lors de l'insert" });
		}

		return { success: true };
	},

	delete: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun espace de travail' });
		await ensureUserInPublicUsers(locals);

		const fd = await request.formData();
		const id = fd.get('id') as string;
		if (!id) return fail(400, { message: 'ID manquant' });

		const support = await db.query.biblioSupports.findFirst({
			where: and(eq(biblioSupports.id, id), eq(biblioSupports.workspaceId, workspaceId))
		});
		if (!support) return fail(404, { message: 'Support non trouvé' });

		if (support.filePath) {
			const { supabase } = locals;
			const { error: removeError } = await supabase.storage
				.from('bibliotheque-supports')
				.remove([support.filePath]);
			if (removeError) {
				console.error('[Supports delete] storage.remove failed for', support.filePath, removeError);
			}
		}

		await db
			.delete(biblioSupports)
			.where(and(eq(biblioSupports.id, id), eq(biblioSupports.workspaceId, workspaceId)));

		return { success: true };
	}
};
