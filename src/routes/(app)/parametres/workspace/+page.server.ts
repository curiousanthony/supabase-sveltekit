import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { getUserRoleInWorkspace } from '$lib/server/workspace';
import { hasPermission } from '$lib/server/permissions';
import { db } from '$lib/db';
import { workspacesUsers, users, workspaces } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { getRoleLabel } from '$lib/i18n/roles';

export const load = (async ({ locals, url }) => {
	const { userId, workspaceId } = await requireWorkspace({ ...locals, url } as App.Locals);
	const role = await getUserRoleInWorkspace(userId, workspaceId);
	const canManage = role !== null && hasPermission(role, 'workspace_settings');

	const workspace = await db.query.workspaces.findFirst({
		where: eq(workspaces.id, workspaceId),
		columns: { id: true, name: true }
	});

	if (!workspace) throw redirect(303, '/');

	const members = await db
		.select({
			userId: workspacesUsers.userId,
			role: workspacesUsers.role,
			email: users.email,
			firstName: users.firstName,
			lastName: users.lastName,
			avatarUrl: users.avatarUrl
		})
		.from(workspacesUsers)
		.innerJoin(users, eq(workspacesUsers.userId, users.id))
		.where(eq(workspacesUsers.workspaceId, workspaceId));

	const membersWithRoleLabel = members.map((m) => ({
		...m,
		roleLabel: getRoleLabel(m.role as import('$lib/i18n/roles').WorkspaceRole)
	}));

	return {
		workspace,
		members: membersWithRoleLabel,
		canManage,
		header: { pageName: "Paramètres de l'espace", actions: [] }
	};
}) satisfies PageServerLoad;
