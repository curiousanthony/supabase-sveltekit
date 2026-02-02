import { db } from '$lib/db';
import { users, workspaces, workspacesUsers } from '$lib/db/schema';
import { eq, and } from 'drizzle-orm';

export type WorkspaceRole = 'owner' | 'admin' | 'sales' | 'secretary';

export interface WorkspaceWithRole {
	id: string;
	name: string | null;
	role: WorkspaceRole;
	logoUrl: string | null;
}

export async function getUserWorkspaces(userId: string): Promise<WorkspaceWithRole[]> {
	const rows = await db
		.select({
			workspaceId: workspacesUsers.workspaceId,
			role: workspacesUsers.role,
			name: workspaces.name,
			logoUrl: workspaces.logoUrl
		})
		.from(workspacesUsers)
		.innerJoin(workspaces, eq(workspacesUsers.workspaceId, workspaces.id))
		.where(eq(workspacesUsers.userId, userId));

	return rows.map((r) => ({
		id: r.workspaceId,
		name: r.name,
		role: r.role as WorkspaceRole,
		logoUrl: r.logoUrl
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

export interface EffectiveContext {
	effectiveUserId: string;
	effectiveRole: WorkspaceRole;
	realUserId: string;
	realRole: WorkspaceRole;
	seeAs: {
		userId: string;
		role: WorkspaceRole;
		memberName: string | null;
	} | null;
}

export async function getEffectiveContext(
	realUserId: string,
	workspaceId: string,
	seeAsCookie: string | null
): Promise<EffectiveContext> {
	const realRole = await getUserRoleInWorkspace(realUserId, workspaceId);
	if (!realRole) {
		throw new Error('User is not a member of this workspace');
	}

	// Check if user is owner (only owners can use "See as")
	if (realRole !== 'owner' || !seeAsCookie) {
		return {
			effectiveUserId: realUserId,
			effectiveRole: realRole,
			realUserId,
			realRole,
			seeAs: null
		};
	}

	try {
		const decodedCookie = decodeURIComponent(seeAsCookie);
		const seeAsData = JSON.parse(decodedCookie) as {
			workspaceId: string;
			userId: string;
			role: string;
		};

		// Verify the see_as is for the current workspace
		if (seeAsData.workspaceId !== workspaceId) {
			return {
				effectiveUserId: realUserId,
				effectiveRole: realRole,
				realUserId,
				realRole,
				seeAs: null
			};
		}

		// Verify the target user is a member of this workspace
		const targetMember = await db.query.workspacesUsers.findFirst({
			where: and(
				eq(workspacesUsers.workspaceId, workspaceId),
				eq(workspacesUsers.userId, seeAsData.userId)
			),
			columns: { role: true }
		});

		if (!targetMember) {
			return {
				effectiveUserId: realUserId,
				effectiveRole: realRole,
				realUserId,
				realRole,
				seeAs: null
			};
		}

		// Get target user's name
		const targetUser = await db.query.users.findFirst({
			where: eq(users.id, seeAsData.userId),
			columns: { firstName: true, lastName: true, email: true }
		});

		const memberName = targetUser
			? [targetUser.firstName, targetUser.lastName].filter(Boolean).join(' ') ||
				targetUser.email ||
				null
			: null;

		return {
			effectiveUserId: seeAsData.userId,
			effectiveRole: targetMember.role as WorkspaceRole,
			realUserId,
			realRole,
			seeAs: {
				userId: seeAsData.userId,
				role: targetMember.role as WorkspaceRole,
				memberName
			}
		};
	} catch (e) {
		// Invalid cookie, ignore
		return {
			effectiveUserId: realUserId,
			effectiveRole: realRole,
			realUserId,
			realRole,
			seeAs: null
		};
	}
}
