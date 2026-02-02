import { redirect } from '@sveltejs/kit';
import { getActiveWorkspace, getUserRoleInWorkspace, setActiveWorkspace } from './workspace';
import { hasPermission, type Permission } from './permissions';
import { getUserWorkspace } from '$lib/auth';

export interface RequireWorkspaceLocals {
	safeGetSession: App.Locals['safeGetSession'];
	url?: { pathname: string };
}

export async function requireWorkspace(locals: RequireWorkspaceLocals): Promise<{
	userId: string;
	workspaceId: string;
}> {
	const { user } = await locals.safeGetSession();
	if (!user) {
		throw redirect(
			303,
			'/auth/login?redirectTo=' + encodeURIComponent(locals.url?.pathname ?? '/')
		);
	}

	let workspaceId = await getActiveWorkspace(user.id);
	if (!workspaceId) {
		workspaceId = await getUserWorkspace(locals as App.Locals);
		if (workspaceId) await setActiveWorkspace(user.id, workspaceId);
	}
	if (!workspaceId) throw redirect(303, '/onboarding');

	return { userId: user.id, workspaceId };
}

export async function requireRole(
	locals: RequireWorkspaceLocals,
	permission: Permission
): Promise<{ userId: string; workspaceId: string; role: import('./workspace').WorkspaceRole }> {
	const { userId, workspaceId } = await requireWorkspace(locals);
	const role = await getUserRoleInWorkspace(userId, workspaceId);
	if (!role || !hasPermission(role, permission)) throw redirect(303, '/');
	return { userId, workspaceId, role };
}
