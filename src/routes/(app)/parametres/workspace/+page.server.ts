import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { requireWorkspace } from '$lib/server/guards';
import { getUserRoleInWorkspace } from '$lib/server/workspace';
import { hasPermission } from '$lib/server/permissions';
import { db } from '$lib/db';
import { workspacesUsers, users, workspaces, workspaceInvites } from '$lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { getRoleLabel } from '$lib/i18n/roles';
import { randomUUID } from 'crypto';

export const load = (async ({ locals, url }) => {
	const { userId, workspaceId } = await requireWorkspace({ ...locals, url } as App.Locals);
	const role = await getUserRoleInWorkspace(userId, workspaceId);
	const canManage = role !== null && hasPermission(role, 'workspace_settings');

	const workspace = await db.query.workspaces.findFirst({
		where: eq(workspaces.id, workspaceId),
		columns: { id: true, name: true, logoUrl: true, legalName: true, siret: true }
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

	let pendingInvites: Array<{
		id: string;
		email: string;
		role: string;
		roleLabel: string;
		expiresAt: string;
		createdAt: string;
	}> = [];

	if (canManage) {
		const invites = await db
			.select({
				id: workspaceInvites.id,
				email: workspaceInvites.email,
				role: workspaceInvites.role,
				expiresAt: workspaceInvites.expiresAt,
				createdAt: workspaceInvites.createdAt
			})
			.from(workspaceInvites)
			.where(
				and(
					eq(workspaceInvites.workspaceId, workspaceId),
					gt(workspaceInvites.expiresAt, new Date().toISOString())
				)
			);

		pendingInvites = invites.map((inv) => ({
			...inv,
			roleLabel: getRoleLabel(inv.role as import('$lib/i18n/roles').WorkspaceRole)
		}));
	}

	return {
		workspace,
		members: membersWithRoleLabel,
		pendingInvites,
		canManage,
		userId,
		role,
		header: { pageName: "Paramètres de l'espace", actions: [] }
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	saveSettings: async ({ locals, request, url }) => {
		const { userId, workspaceId } = await requireWorkspace({ ...locals, url } as App.Locals);
		const role = await getUserRoleInWorkspace(userId, workspaceId);
		if (!role || !hasPermission(role, 'workspace_settings')) {
			return fail(403, { message: 'Permission refusée' });
		}

		const data = await request.formData();
		const name = data.get('name')?.toString() || null;
		const legalName = data.get('legalName')?.toString() || null;
		const siret = data.get('siret')?.toString() || null;

		await db
			.update(workspaces)
			.set({ name, legalName, siret })
			.where(eq(workspaces.id, workspaceId));

		return { success: true };
	},

	createInvite: async ({ locals, request, url }) => {
		const { userId, workspaceId } = await requireWorkspace({ ...locals, url } as App.Locals);
		const role = await getUserRoleInWorkspace(userId, workspaceId);
		if (!role || !hasPermission(role, 'workspace_settings')) {
			return fail(403, { message: 'Permission refusée' });
		}

		const data = await request.formData();
		const email = data.get('email')?.toString();
		const inviteRole = data.get('role')?.toString();

		if (!email || !inviteRole) {
			return fail(400, { message: 'Email et rôle requis' });
		}

		// Check if user is already a member
		const existingUser = await db.query.users.findFirst({
			where: eq(users.email, email),
			columns: { id: true }
		});

		if (existingUser) {
			const existingMember = await db.query.workspacesUsers.findFirst({
				where: and(
					eq(workspacesUsers.workspaceId, workspaceId),
					eq(workspacesUsers.userId, existingUser.id)
				)
			});

			if (existingMember) {
				return fail(400, { message: "Cet utilisateur est déjà membre de l'espace" });
			}
		}

		const token = randomUUID();
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

		await db.insert(workspaceInvites).values({
			workspaceId,
			email,
			role: inviteRole as import('$lib/db/schema').workspaceRole,
			invitedBy: userId,
			token,
			expiresAt: expiresAt.toISOString()
		});

		return { success: true, token };
	},

	cancelInvite: async ({ locals, request, url }) => {
		const { userId, workspaceId } = await requireWorkspace({ ...locals, url } as App.Locals);
		const role = await getUserRoleInWorkspace(userId, workspaceId);
		if (!role || !hasPermission(role, 'workspace_settings')) {
			return fail(403, { message: 'Permission refusée' });
		}

		const data = await request.formData();
		const inviteId = data.get('inviteId')?.toString();

		if (!inviteId) {
			return fail(400, { message: 'ID invalide' });
		}

		// Verify invite belongs to this workspace
		const invite = await db.query.workspaceInvites.findFirst({
			where: and(eq(workspaceInvites.id, inviteId), eq(workspaceInvites.workspaceId, workspaceId))
		});

		if (!invite) {
			return fail(404, { message: 'Invitation introuvable' });
		}

		await db.delete(workspaceInvites).where(eq(workspaceInvites.id, inviteId));

		return { success: true };
	},

	changeRole: async ({ locals, request, url }) => {
		const { userId, workspaceId } = await requireWorkspace({ ...locals, url } as App.Locals);
		const role = await getUserRoleInWorkspace(userId, workspaceId);
		if (!role || !hasPermission(role, 'workspace_settings')) {
			return fail(403, { message: 'Permission refusée' });
		}

		const data = await request.formData();
		const targetUserId = data.get('userId')?.toString();
		const newRole = data.get('role')?.toString();

		if (!targetUserId || !newRole) {
			return fail(400, { message: 'Données invalides' });
		}

		// Prevent demoting last owner
		if (newRole !== 'owner') {
			const ownerCount = await db
				.select()
				.from(workspacesUsers)
				.where(and(eq(workspacesUsers.workspaceId, workspaceId), eq(workspacesUsers.role, 'owner')))
				.then((rows) => rows.length);

			if (ownerCount === 1) {
				const targetMember = await db.query.workspacesUsers.findFirst({
					where: and(
						eq(workspacesUsers.workspaceId, workspaceId),
						eq(workspacesUsers.userId, targetUserId)
					)
				});

				if (targetMember?.role === 'owner') {
					return fail(400, {
						message: "Impossible de retirer le dernier propriétaire de l'espace"
					});
				}
			}
		}

		await db
			.update(workspacesUsers)
			.set({ role: newRole as import('$lib/db/schema').workspaceRole })
			.where(
				and(eq(workspacesUsers.workspaceId, workspaceId), eq(workspacesUsers.userId, targetUserId))
			);

		return { success: true };
	},

	removeMember: async ({ locals, request, url }) => {
		const { userId, workspaceId } = await requireWorkspace({ ...locals, url } as App.Locals);
		const role = await getUserRoleInWorkspace(userId, workspaceId);
		if (!role || !hasPermission(role, 'workspace_settings')) {
			return fail(403, { message: 'Permission refusée' });
		}

		const data = await request.formData();
		const targetUserId = data.get('userId')?.toString();

		if (!targetUserId) {
			return fail(400, { message: 'ID invalide' });
		}

		// Prevent removing last owner
		const targetMember = await db.query.workspacesUsers.findFirst({
			where: and(
				eq(workspacesUsers.workspaceId, workspaceId),
				eq(workspacesUsers.userId, targetUserId)
			)
		});

		if (targetMember?.role === 'owner') {
			const ownerCount = await db
				.select()
				.from(workspacesUsers)
				.where(and(eq(workspacesUsers.workspaceId, workspaceId), eq(workspacesUsers.role, 'owner')))
				.then((rows) => rows.length);

			if (ownerCount === 1) {
				return fail(400, { message: "Impossible de retirer le dernier propriétaire de l'espace" });
			}
		}

		await db
			.delete(workspacesUsers)
			.where(
				and(eq(workspacesUsers.workspaceId, workspaceId), eq(workspacesUsers.userId, targetUserId))
			);

		return { success: true };
	}
};
