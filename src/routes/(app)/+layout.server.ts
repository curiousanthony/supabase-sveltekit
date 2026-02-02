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

	let workspace: { id: string; name: string | null } | null = null;
	let workspaces: { id: string; name: string | null; role: string; roleLabel: string }[] = [];
	let role: string | null = null;
	let roleLabel: string | null = null;
	let allowedNavUrls: string[] = sitemap.map((item) => item.url);

	try {
		const { userId, workspaceId } = await requireWorkspace({ ...locals, url } as App.Locals);
		const [workspacesList, roleInWorkspace] = await Promise.all([
			getUserWorkspaces(userId),
			getUserRoleInWorkspace(userId, workspaceId)
		]);

		const activeWs = workspacesList.find((w) => w.id === workspaceId);
		workspace = activeWs
			? { id: activeWs.id, name: activeWs.name }
			: workspacesList[0]
				? { id: workspacesList[0].id, name: workspacesList[0].name }
				: null;

		workspaces = workspacesList.map((w) => ({
			id: w.id,
			name: w.name,
			role: w.role,
			roleLabel: getRoleLabel(w.role)
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
	}

	return {
		session,
		user,
		cookies: cookies.getAll(),
		header,
		workspace,
		workspaces,
		role,
		roleLabel,
		allowedNavUrls
	};
};