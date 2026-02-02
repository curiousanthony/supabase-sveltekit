import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { requireWorkspace } from '$lib/server/guards';
import { getUserRoleInWorkspace } from '$lib/server/workspace';
import { hasPermission } from '$lib/server/permissions';
import { db } from '$lib/db';
import { workspaces } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import {
	getSupabaseAdmin,
	getWorkspaceLogosBucketId,
	ensureWorkspaceLogosBucket
} from '$lib/server/supabase-admin';

function jsonError(message: string, status: number) {
	return json({ message }, { status });
}

export const POST: RequestHandler = async ({ locals, request, url }) => {
	const { userId, workspaceId } = await requireWorkspace({ ...locals, url } as App.Locals);
	const role = await getUserRoleInWorkspace(userId, workspaceId);
	if (!role || !hasPermission(role, 'workspace_settings')) {
		return jsonError('Permission refusée', 403);
	}

	const formData = await request.formData();
	const file = formData.get('file') as File | null;

	if (!file) {
		return jsonError('Aucun fichier fourni', 400);
	}

	// Validate file type
	const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
	if (!allowedTypes.includes(file.type)) {
		return jsonError('Type de fichier non autorisé. Utilisez JPEG, PNG, WebP ou SVG.', 400);
	}

	// Validate file size (5MB)
	if (file.size > 5 * 1024 * 1024) {
		return jsonError('Le fichier est trop volumineux. Taille maximale: 5MB', 400);
	}

	// Generate unique filename
	const extension = file.name.split('.').pop() || 'png';
	const filename = `${randomUUID()}.${extension}`;
	const filePath = `${workspaceId}/${filename}`;
	const bucketId = getWorkspaceLogosBucketId();

	// Prefer admin client (service role) so uploads bypass Storage RLS
	let admin = getSupabaseAdmin();
	// Fallback: Vite dev server may not expose .env to $env/dynamic/private
	if (
		!admin &&
		typeof process !== 'undefined' &&
		process.env?.SUPABASE_SERVICE_ROLE_KEY &&
		process.env?.PUBLIC_SUPABASE_URL
	) {
		admin = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
			auth: { persistSession: false }
		});
	}
	if (!admin) {
		return jsonError(
			'Logo upload non configuré : ajoutez SUPABASE_SERVICE_ROLE_KEY dans .env (clé "Secret key" de supabase status en local) et redémarrez le serveur.',
			503
		);
	}
	const storage = admin;

	try {
		if (admin) {
			await ensureWorkspaceLogosBucket(admin);
		}

		const { error: uploadError } = await storage.storage.from(bucketId).upload(filePath, file, {
			contentType: file.type,
			upsert: false
		});

		if (uploadError) {
			console.error('[Upload Logo] Storage error:', uploadError);
			if (uploadError.message?.includes('Bucket') || uploadError.message?.includes('bucket')) {
				return jsonError(
					"Le stockage des logos n'est pas configuré. Définissez SUPABASE_SERVICE_ROLE_KEY et exécutez les migrations Supabase, ou créez le bucket workspace-logos dans le tableau de bord Supabase.",
					503
				);
			}
			return jsonError('Erreur lors du téléversement du logo', 500);
		}

		const {
			data: { publicUrl }
		} = storage.storage.from(bucketId).getPublicUrl(filePath);

		await db.update(workspaces).set({ logoUrl: publicUrl }).where(eq(workspaces.id, workspaceId));

		return json({ success: true, url: publicUrl });
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) {
			throw e;
		}
		console.error('[Upload Logo] Error:', e);
		return jsonError('Erreur lors du téléversement du logo', 500);
	}
};

export const DELETE: RequestHandler = async ({ locals, url }) => {
	const { userId, workspaceId } = await requireWorkspace({ ...locals, url } as App.Locals);
	const role = await getUserRoleInWorkspace(userId, workspaceId);
	if (!role || !hasPermission(role, 'workspace_settings')) {
		return jsonError('Permission refusée', 403);
	}

	const workspace = await db.query.workspaces.findFirst({
		where: eq(workspaces.id, workspaceId),
		columns: { logoUrl: true }
	});

	const bucketId = getWorkspaceLogosBucketId();
	let admin = getSupabaseAdmin();
	if (
		!admin &&
		typeof process !== 'undefined' &&
		process.env?.SUPABASE_SERVICE_ROLE_KEY &&
		process.env?.PUBLIC_SUPABASE_URL
	) {
		admin = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
			auth: { persistSession: false }
		});
	}
	if (!admin) {
		return jsonError('SUPABASE_SERVICE_ROLE_KEY non configuré.', 503);
	}
	const storage = admin;

	if (workspace?.logoUrl) {
		const urlParts = workspace.logoUrl.split(`/${bucketId}/`);
		if (urlParts.length > 1) {
			const filePath = urlParts[1];
			await storage.storage.from(bucketId).remove([filePath]);
		}
	}

	await db.update(workspaces).set({ logoUrl: null }).where(eq(workspaces.id, workspaceId));

	return json({ success: true });
};
