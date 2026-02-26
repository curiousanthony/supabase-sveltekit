import { redirect } from '@sveltejs/kit';
import {
	getActiveWorkspace,
	getUserRoleInWorkspace,
	setActiveWorkspace,
	getEffectiveContext,
	type EffectiveContext
} from './workspace';
import { hasPermission, type Permission } from './permissions';
import { getUserWorkspace } from '$lib/auth';

export interface RequireWorkspaceLocals {
	safeGetSession: App.Locals['safeGetSession'];
	url?: { pathname: string };
	cookies?: { get: (name: string) => { value: string | null } };
}

function isRedirect(e: unknown): e is { status: number } {
	return e != null && typeof e === 'object' && 'status' in e && (e as { status: number }).status === 303;
}

export async function requireWorkspace(locals: RequireWorkspaceLocals): Promise<{
	userId: string;
	workspaceId: string;
	effectiveContext?: EffectiveContext;
}> {
	const { user } = await locals.safeGetSession();
	if (!user) {
		throw redirect(
			303,
			'/auth/login?redirectTo=' + encodeURIComponent(locals.url?.pathname ?? '/')
		);
	}

	try {
		let workspaceId = await getActiveWorkspace(user.id);
		if (!workspaceId) {
			workspaceId = await getUserWorkspace(locals as App.Locals);
			if (workspaceId) {
				try {
					await setActiveWorkspace(user.id, workspaceId);
				} catch {
					// User no longer in workspace, continue without setting last active
				}
			}
		}
		if (!workspaceId) throw redirect(303, '/onboarding');

		const seeAsCookie = locals.cookies?.get('see_as')?.value ?? null;
		const effectiveContext = await getEffectiveContext(user.id, workspaceId, seeAsCookie);

		return {
			userId: effectiveContext.effectiveUserId,
			workspaceId,
			effectiveContext
		};
	} catch (e) {
		if (isRedirect(e)) throw e;
		const msg = e instanceof Error ? e.message : String(e);
		if (msg.includes('not a member') || msg.includes('does not belong')) {
			throw redirect(303, '/onboarding');
		}
		console.error('[requireWorkspace]', e);
		throw redirect(
			303,
			'/auth/login?redirectTo=' + encodeURIComponent(locals.url?.pathname ?? '/') + '&error=session'
		);
	}
}

export async function requireRole(
	locals: RequireWorkspaceLocals,
	permission: Permission
): Promise<{
	userId: string;
	workspaceId: string;
	role: import('./workspace').WorkspaceRole;
	effectiveContext?: EffectiveContext;
}> {
	const { userId, workspaceId, effectiveContext } = await requireWorkspace(locals);
	const role =
		effectiveContext?.effectiveRole ?? (await getUserRoleInWorkspace(userId, workspaceId));
	if (!role || !hasPermission(role, permission)) throw redirect(303, '/');
	return { userId, workspaceId, role, effectiveContext };
}
