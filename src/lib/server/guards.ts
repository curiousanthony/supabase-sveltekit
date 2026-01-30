import { error, redirect } from '@sveltejs/kit';
import { getActiveWorkspace, getUserRoleInWorkspace, setActiveWorkspace, type WorkspaceRole } from './workspace';
import { hasPermission, type Permission } from './permissions';
import { getUserWorkspace } from '$lib/auth';

export interface RequireWorkspaceLocals {
	safeGetSession: App.Locals['safeGetSession'];
	url?: { pathname: string };
}

/**
 * Ensures the user is authenticated and has an active workspace.
 * Returns { userId, workspaceId } or redirects to login.
 * If user has no workspace, runs onboarding (create default workspace) via getUserWorkspace.
 */
export async function requireWorkspace(locals: RequireWorkspaceLocals): Promise<{
	userId: string;
	workspaceId: string;
}> {
	const { user } = await locals.safeGetSession();

	if (!user) {
		throw redirect(303, '/auth/login?redirectTo=' + encodeURIComponent(locals.url?.pathname ?? '/'));
	}

	let workspaceId = await getActiveWorkspace(user.id);

	if (!workspaceId) {
		// User has no workspace - ensure one via auth onboarding
		workspaceId = await getUserWorkspace(locals);
		if (workspaceId) {
			await setActiveWorkspace(user.id, workspaceId);
		}
	}

	if (!workspaceId) {
		throw redirect(303, '/');
	}

	return { userId: user.id, workspaceId };
}

/**
 * Ensures the user has the required permission in the current workspace.
 * Returns { userId, workspaceId, role } or redirects.
 */
export async function requireRole(
	locals: RequireWorkspaceLocals,
	permission: Permission
): Promise<{
	userId: string;
	workspaceId: string;
	role: WorkspaceRole;
}> {
	const { userId, workspaceId } = await requireWorkspace(locals);

	const role = await getUserRoleInWorkspace(userId, workspaceId);

	if (!role || !hasPermission(role, permission)) {
		throw error(403, 'You do not have permission to access this resource');
	}

	return { userId, workspaceId, role };
}
