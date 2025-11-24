import { db } from '$lib/db';
import { workspacesUsers } from '$lib/db/schema';
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
 * Get the user's workspace ID from the workspaces_users table
 * For now, returns the first workspace the user belongs to
 */
export const getUserWorkspace = async (locals: App.Locals) => {
	const { user } = await locals.safeGetSession();

	if (!user) {
		return null;
	}

	// Get the first workspace the user belongs to
	const workspaceUser = await db.query.workspacesUsers.findFirst({
		where: eq(workspacesUsers.userId, user.id),
		columns: {
			workspaceId: true
		}
	});

	return workspaceUser?.workspaceId ?? null;
};
