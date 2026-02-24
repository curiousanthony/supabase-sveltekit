import { db } from '$lib/db';
import { workspacesUsers, workspaces, users, clients, deals } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const getOrCreateUserProfile = async (locals: App.Locals) => {
	const { user } = await locals.safeGetSession();

	// console.log("auth/index.ts → User data ↓", user)

	if (!user) {
		return null;
	}

	return user;

	/*const curProfile = await db.query.profileTable.findFirst({
        where: eq(profileTable.id, user.id)
    })

    if (curProfile) {
        return curProfile;
    }

    await db.insert(profileTable).values({
        id: user.id,
        firstName: user.user_metadata.name, // Getting this from the provider's (GitHub) metadata
        // lastName: user.user_metadata.lastName,
        // firstName: "",
        lastName: "",
        email: user.email
    })

    const newProfile = await db.query.profileTable.findFirst({
        where: eq(profileTable.id, user.id)
    })

    if (!newProfile) {
        error(500, "Could not create profile")
    }

    return newProfile;*/
};

/**
 * Get the user's workspace ID from the workspaces_users table.
 * Returns the first workspace the user belongs to.
 * If the user has no workspace, returns null (they should be redirected to onboarding).
 * Workspace creation is handled by the onboarding flow.
 */
export const getUserWorkspace = async (locals: App.Locals) => {
	const { user } = await locals.safeGetSession();

	if (!user) {
		return null;
	}

	// Get the first workspace the user belongs to
	let workspaceUser = await db.query.workspacesUsers.findFirst({
		where: eq(workspacesUsers.userId, user.id),
		columns: {
			workspaceId: true
		}
	});

	if (workspaceUser?.workspaceId) {
		return workspaceUser.workspaceId;
	}

	// User has no workspace: return null so they can be redirected to onboarding
	// Workspace creation is now handled by the onboarding flow
	return null;
};

/**
 * Ensures the current session user has a row in public.users (same id as auth.users).
 * Use before any insert that references users.id (e.g. contacts.created_by) so FK constraints pass.
 */
export const ensureUserInPublicUsers = async (locals: App.Locals): Promise<boolean> => {
	const { user } = await locals.safeGetSession();
	if (!user) return false;

	await db
		.insert(users)
		.values({
			id: user.id,
			email: user.email ?? '',
			firstName:
				user.user_metadata?.full_name?.split(' ')[0] ?? user.user_metadata?.name ?? null,
			lastName:
				(user.user_metadata?.full_name?.split(' ').slice(1).join(' ') ||
					user.user_metadata?.family_name) ??
				null,
			avatarUrl: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null
		})
		.onConflictDoUpdate({
			target: users.id,
			set: {
				email: user.email ?? '',
				firstName:
					user.user_metadata?.full_name?.split(' ')[0] ?? user.user_metadata?.name ?? null,
				lastName:
					(user.user_metadata?.full_name?.split(' ').slice(1).join(' ') ||
						user.user_metadata?.family_name) ??
					null,
				avatarUrl: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null
			}
		});
	return true;
};
