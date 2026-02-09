import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { getUserWorkspaces, getUserRoleInWorkspace } from '$lib/server/workspace';
import { getRoleLabel } from '$lib/i18n/roles';
import { hasPermission } from '$lib/server/permissions';
import { sitemap, sitemapPermissions } from '$lib/settings/config';

export const load: LayoutServerLoad = async ({ locals, cookies, url }) => {
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw redirect(303, `/auth/login?redirectTo=${url.pathname}`);
	}

	const pathParts = url.pathname.split('/');
	const lastPart = pathParts[pathParts.length - 1];
	const pageName = lastPart
		? lastPart.charAt(0).toUpperCase() + lastPart.slice(1)
		: 'Tableau de bord';
	const header = { pageName, actions: [] };

	let workspace: { id: string; name: string | null; logoUrl: string | null } | null = null;
	let workspacePlanTitle: string = 'Mentore Pro';
	let workspaces: {
		id: string;
		name: string | null;
		role: string;
		roleLabel: string;
		logoUrl: string | null;
	}[] = [];
	let role: string | null = null;
	let roleLabel: string | null = null;
	let allowedNavUrls: string[] = sitemap.map((item) => item.url);
	let effectiveContext:
		| Awaited<ReturnType<typeof requireWorkspace>>['effectiveContext']
		| undefined;

	try {
		const result = await requireWorkspace({
			...locals,
			url,
			cookies
		} as App.Locals);
		const { userId, workspaceId, effectiveContext: ctx } = result;
		effectiveContext = ctx;
		const effectiveUserId = effectiveContext?.effectiveUserId ?? userId;
		const effectiveRole = effectiveContext?.effectiveRole;

		const [workspacesList, roleInWorkspace] = await Promise.all([
			getUserWorkspaces(userId), // Always use real user for workspace list
			effectiveRole ?? getUserRoleInWorkspace(effectiveUserId, workspaceId)
		]);

		const activeWs = workspacesList.find((w) => w.id === workspaceId);
		workspace = activeWs
			? { id: activeWs.id, name: activeWs.name, logoUrl: activeWs.logoUrl }
			: workspacesList[0]
				? {
						id: workspacesList[0].id,
						name: workspacesList[0].name,
						logoUrl: workspacesList[0].logoUrl
					}
				: null;

		// TODO: Replace with actual workspace plan title from workspace subscription/plan (e.g. from DB or billing provider)
		workspacePlanTitle = 'Mentore Pro';

		workspaces = workspacesList.map((w) => ({
			id: w.id,
			name: w.name,
			role: w.role,
			roleLabel: getRoleLabel(w.role),
			logoUrl: w.logoUrl
		}));

		role = roleInWorkspace ?? workspacesList[0]?.role ?? null;
		roleLabel = role ? getRoleLabel(role as import('$lib/i18n/roles').WorkspaceRole) : null;

		if (role != null) {
			allowedNavUrls = sitemap
				.filter((item) => {
					const perm = sitemapPermissions[item.url];
					if (!perm) return true;
					if (item.url === '/contacts') {
						return hasPermission(role!, 'formateurs') || hasPermission(role!, 'clients');
					}
					return hasPermission(role!, perm);
				})
				.map((item) => item.url);
		}
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e && (e as { status: number }).status === 303) {
			throw e;
		}
		console.error('[Layout] Workspace load failed:', e);
		throw e;
	}

	const seeAs = effectiveContext?.seeAs
		? {
				userId: effectiveContext.seeAs.userId,
				role: effectiveContext.seeAs.role,
				roleLabel: getRoleLabel(effectiveContext.seeAs.role),
				memberName: effectiveContext.seeAs.memberName
			}
		: null;

	return {
		session,
		user,
		cookies: cookies.getAll(),
		header,
		workspace,
		workspacePlanTitle,
		workspaces,
		role,
		roleLabel,
		allowedNavUrls,
		seeAs
	};
};
