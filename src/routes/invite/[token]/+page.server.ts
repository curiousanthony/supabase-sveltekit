import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/db';
import { workspaceInvites, workspacesUsers, users } from '$lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { setActiveWorkspace } from '$lib/server/workspace';

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw redirect(303, `/auth/login?redirectTo=${url.pathname}`);
	}

	const token = params.token;

	if (!token) {
		throw error(400, 'Token invalide');
	}

	// Find invite by token
	const invite = await db.query.workspaceInvites.findFirst({
		where: eq(workspaceInvites.token, token),
		columns: {
			id: true,
			workspaceId: true,
			email: true,
			role: true,
			expiresAt: true
		}
	});

	if (!invite) {
		throw error(404, 'Invitation introuvable');
	}

	// Check if expired
	if (new Date(invite.expiresAt) < new Date()) {
		throw error(400, 'Cette invitation a expiré');
	}

	// Check if email matches
	if (invite.email.toLowerCase() !== user.email?.toLowerCase()) {
		throw error(403, "Cette invitation n'est pas pour votre adresse email");
	}

	// Check if user is already a member
	const existingMember = await db.query.workspacesUsers.findFirst({
		where: and(
			eq(workspacesUsers.workspaceId, invite.workspaceId),
			eq(workspacesUsers.userId, user.id)
		)
	});

	if (existingMember) {
		// User is already a member, just activate the workspace and delete the invite
		await setActiveWorkspace(user.id, invite.workspaceId);
		await db.delete(workspaceInvites).where(eq(workspaceInvites.id, invite.id));
		throw redirect(303, '/');
	}

	// Add user to workspace
	await db.insert(workspacesUsers).values({
		workspaceId: invite.workspaceId,
		userId: user.id,
		role: invite.role
	});

	// Set as active workspace
	await setActiveWorkspace(user.id, invite.workspaceId);

	// Delete the invite
	await db.delete(workspaceInvites).where(eq(workspaceInvites.id, invite.id));

	throw redirect(303, '/');
};
