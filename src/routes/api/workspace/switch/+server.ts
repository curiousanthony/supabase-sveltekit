import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	setActiveWorkspace,
	UnauthorizedError,
	NotFoundError
} from '$lib/server/workspace';

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
		const err = e instanceof Error ? e : new Error(String(e));
		console.error('[workspace/switch]', err.message, err.stack);
		if (e instanceof UnauthorizedError) {
			return json({ error: 'Unauthorized' }, { status: 403 });
		}
		if (e instanceof NotFoundError) {
			return json({ error: 'Workspace not found' }, { status: 404 });
		}
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
