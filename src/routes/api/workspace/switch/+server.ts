import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { setActiveWorkspace } from '$lib/server/workspace';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { user } = await locals.safeGetSession();

	if (!user) {
		return json({ error: 'Non autorisé' }, { status: 401 });
	}

	const body = await request.json().catch(() => ({}));
	const workspaceId = typeof body?.workspaceId === 'string' ? body.workspaceId : null;

	if (!workspaceId) {
		return json({ error: 'workspaceId requis' }, { status: 400 });
	}

	try {
		await setActiveWorkspace(user.id, workspaceId);
		return json({ success: true });
	} catch (e) {
		return json({ error: 'Impossible de changer d\'espace' }, { status: 403 });
	}
};
