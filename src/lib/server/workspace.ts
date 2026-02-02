import { db } from '$lib/db';
import { users, workspaces, workspacesUsers } from '$lib/db/schema';
import { eq, and } from 'drizzle-orm';

export type WorkspaceRole = 'owner' | 'admin' | 'sales' | 'secretary';

export interface WorkspaceWithRole {
	id: string;
	name: string | null;
	role: WorkspaceRole;
}

export async function getUserWorkspaces(userId: string): Promise<WorkspaceWithRole[]> {
	const rows = await db
		.select({
			workspaceId: workspacesUsers.workspaceId,
			role: workspacesUsers.role,
			name: workspaces.name
		})
		.from(workspacesUsers)
		.innerJoin(workspaces, eq(workspacesUsers.workspaceId, workspaces.id))
		.where(eq(workspacesUsers.userId, userId));

	return rows.map((r) => ({
		id: r.workspaceId,
		name: r.name,
		role: r.role as WorkspaceRole
	}));
}

export async function getActiveWorkspace(userId: string): Promise<string | null> {
	const [userRow] = await db
		.select({ lastActiveWorkspaceId: users.lastActiveWorkspaceId })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	const lastActiveId = userRow?.lastActiveWorkspaceId;
	if (lastActiveId) {
		const member = await db.query.workspacesUsers.findFirst({
			where: and(eq(workspacesUsers.workspaceId, lastActiveId), eq(workspacesUsers.userId, userId)),
			columns: { workspaceId: true }
		});
		if (member) return lastActiveId;
	}

	const [first] = await db
		.select({ workspaceId: workspacesUsers.workspaceId })
		.from(workspacesUsers)
		.where(eq(workspacesUsers.userId, userId))
		.limit(1);
	return first?.workspaceId ?? null;
}

export async function setActiveWorkspace(userId: string, workspaceId: string): Promise<void> {
	const member = await db.query.workspacesUsers.findFirst({
		where: and(eq(workspacesUsers.workspaceId, workspaceId), eq(workspacesUsers.userId, userId)),
		columns: { workspaceId: true }
	});
	if (!member) throw new Error('User does not belong to this workspace');

	await db.update(users).set({ lastActiveWorkspaceId: workspaceId }).where(eq(users.id, userId));
}

export async function getUserRoleInWorkspace(
	userId: string,
	workspaceId: string
): Promise<WorkspaceRole | null> {
	const row = await db.query.workspacesUsers.findFirst({
		where: and(eq(workspacesUsers.workspaceId, workspaceId), eq(workspacesUsers.userId, userId)),
		columns: { role: true }
	});
	return (row?.role as WorkspaceRole) ?? null;
}
