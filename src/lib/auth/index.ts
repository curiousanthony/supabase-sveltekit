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
 * For now, returns the first workspace the user belongs to.
 * If the user has no workspace, ensures they get one: syncs to public.users,
 * creates a default workspace if needed, and assigns the user to it.
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

	// User has no workspace: ensure they have one (transactional, with try/catch + re-check)
	try {
		const workspaceId = await db.transaction(async (tx) => {
			// 1. Ensure user exists in public.users (same id as auth.users)
			await tx
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
				.onConflictDoNothing({ target: [users.id] });

			// 2. Create a new personal workspace for this user
			const [inserted] = await tx
				.insert(workspaces)
				.values({ name: 'Mon espace' })
				.returning({ id: workspaces.id });
			const workspace = inserted;

			if (!workspace) {
				throw new Error('Failed to create workspace');
			}

			// 3. Add user to workspace as owner
			await tx
				.insert(workspacesUsers)
				.values({
					workspaceId: workspace.id,
					userId: user.id,
					role: 'owner'
				})
				.onConflictDoNothing({
					target: [workspacesUsers.workspaceId, workspacesUsers.userId]
				});

			// 4. Create sample client and deals so the user can see the Kanban
			const [sampleClient] = await tx
				.insert(clients)
				.values({
					legalName: 'Exemple SARL',
					type: 'Entreprise',
					createdBy: user.id,
					workspaceId: workspace.id
				})
				.returning({ id: clients.id });

			if (sampleClient) {
				await tx.insert(deals).values([
					{
						workspaceId: workspace.id,
						clientId: sampleClient.id,
						name: 'Deal exemple – Formation Excel',
						value: '4500',
						stage: 'Proposition',
						ownerId: user.id,
						createdBy: user.id
					},
					{
						workspaceId: workspace.id,
						clientId: sampleClient.id,
						name: 'Deal exemple – Anglais business',
						value: '3200',
						stage: 'Qualification',
						ownerId: user.id,
						createdBy: user.id
					},
					{
						workspaceId: workspace.id,
						clientId: sampleClient.id,
						name: 'Deal exemple – Management',
						value: '6800',
						stage: 'Lead',
						ownerId: user.id,
						createdBy: user.id
					}
				]);
			}

			return workspace.id;
		});

		if (workspaceId) return workspaceId;
	} catch (err) {
		console.error('[getUserWorkspace] Create workspace failed:', err);
		// Re-check: another request may have created a workspace for this user
		const retry = await db.query.workspacesUsers.findFirst({
			where: eq(workspacesUsers.userId, user.id),
			columns: { workspaceId: true }
		});
		if (retry?.workspaceId) return retry.workspaceId;
		// Return null so the app can redirect to onboarding instead of 500
		return null;
	}

	return null;
};
