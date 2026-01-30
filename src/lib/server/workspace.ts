import { db } from '$lib/db';
import { users, workspaces, workspacesUsers } from '$lib/db/schema';
import { eq, and } from 'drizzle-orm';

export class UnauthorizedError extends Error {}
export class NotFoundError extends Error {}

export type WorkspaceRole = 'owner' | 'admin' | 'sales' | 'secretary';

export interface WorkspaceWithRole {
	id: string;
	name: string | null;
	role: WorkspaceRole;
}

/**
 * Returns all workspaces the user belongs to, with their role in each.
 */
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

/**
 * Returns the user's active workspace ID.
 * Uses last_active_workspace_id if set and valid; otherwise the first workspace.
 */
export async function getActiveWorkspace(userId: string): Promise<string | null> {
	// Check last_active_workspace_id first
	const [userRow] = await db
		.select({ lastActiveWorkspaceId: users.lastActiveWorkspaceId })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	const lastActiveId = userRow?.lastActiveWorkspaceId;

	if (lastActiveId) {
		// Verify user still belongs to this workspace
		const member = await db.query.workspacesUsers.findFirst({
			where: and(
				eq(workspacesUsers.workspaceId, lastActiveId),
				eq(workspacesUsers.userId, userId)
			),
			columns: { workspaceId: true }
		});

		if (member) {
			return lastActiveId;
		}
	}

	// Fall back to first workspace
	const [first] = await db
		.select({ workspaceId: workspacesUsers.workspaceId })
		.from(workspacesUsers)
		.where(eq(workspacesUsers.userId, userId))
		.limit(1);

	return first?.workspaceId ?? null;
}

/**
 * Updates the user's last active workspace.
 * Call after workspace switch.
 */
export async function setActiveWorkspace(userId: string, workspaceId: string): Promise<void> {
	// Verify user belongs to workspace
	const member = await db.query.workspacesUsers.findFirst({
		where: and(
			eq(workspacesUsers.workspaceId, workspaceId),
			eq(workspacesUsers.userId, userId)
		),
		columns: { workspaceId: true }
	});

	if (!member) {
		throw new UnauthorizedError('User does not belong to this workspace');
	}

	await db
		.update(users)
		.set({ lastActiveWorkspaceId: workspaceId })
		.where(eq(users.id, userId));
}

/**
 * Returns the user's role in the given workspace, or null if not a member.
 */
export async function getUserRoleInWorkspace(
	userId: string,
	workspaceId: string
): Promise<WorkspaceRole | null> {
	const row = await db.query.workspacesUsers.findFirst({
		where: and(
			eq(workspacesUsers.workspaceId, workspaceId),
			eq(workspacesUsers.userId, userId)
		),
		columns: { role: true }
	});

	return (row?.role as WorkspaceRole) ?? null;
}
