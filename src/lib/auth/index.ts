import { db } from '$lib/db';
import {
	workspacesUsers,
	workspaces,
	users,
	clients,
	deals,
	contacts,
	companies,
	workspaceInvites,
	formationWorkflowSteps,
	formateurs,
	modules,
	seances
} from '$lib/db/schema';
import { eq } from 'drizzle-orm';

/** Postgres unique violation error code */
const PG_UNIQUE_VIOLATION = '23505';

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
 * If the same email already exists with a different id (e.g. seed or another provider), merges
 * that row to the auth id so contact creation and other FKs succeed.
 */
export const ensureUserInPublicUsers = async (locals: App.Locals): Promise<boolean> => {
	const { user } = await locals.safeGetSession();
	if (!user) return false;

	const userPayload = {
		id: user.id,
		email: user.email ?? '',
		firstName:
			user.user_metadata?.full_name?.split(' ')[0] ?? user.user_metadata?.name ?? null,
		lastName:
			(user.user_metadata?.full_name?.split(' ').slice(1).join(' ') ||
				user.user_metadata?.family_name) ??
			null,
		avatarUrl: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null
	};

	try {
		await db
			.insert(users)
			.values(userPayload)
			.onConflictDoUpdate({
				target: users.id,
				set: {
					email: userPayload.email,
					firstName: userPayload.firstName,
					lastName: userPayload.lastName,
					avatarUrl: userPayload.avatarUrl
				}
			});
		return true;
	} catch (err: unknown) {
		const code = err && typeof err === 'object' && 'code' in err ? (err as { code: string }).code : '';
		const constraint =
			err && typeof err === 'object' && 'constraint' in err
				? (err as { constraint: string }).constraint
				: '';
		// Same email already in public.users with a different id (e.g. seed or invite)
		if (code === PG_UNIQUE_VIOLATION && (constraint === 'email_idx' || constraint === 'users_email_key')) {
			const [existing] = await db
				.select({ id: users.id })
				.from(users)
				.where(eq(users.email, user.email ?? ''))
				.limit(1);
			if (!existing || existing.id === user.id) return true;

			const oldId = existing.id;
			await db.transaction(async (tx) => {
				await tx.update(workspacesUsers).set({ userId: user.id }).where(eq(workspacesUsers.userId, oldId));
				await tx.update(contacts).set({ createdBy: user.id }).where(eq(contacts.createdBy, oldId));
				await tx.update(contacts).set({ ownerId: user.id }).where(eq(contacts.ownerId, oldId));
				await tx.update(companies).set({ ownerId: user.id }).where(eq(companies.ownerId, oldId));
				await tx.update(deals).set({ ownerId: user.id }).where(eq(deals.ownerId, oldId));
				await tx.update(deals).set({ createdBy: user.id }).where(eq(deals.createdBy, oldId));
				await tx.update(deals).set({ commercialId: user.id }).where(eq(deals.commercialId, oldId));
				await tx.update(workspaceInvites).set({ invitedBy: user.id }).where(eq(workspaceInvites.invitedBy, oldId));
				await tx
					.update(formationWorkflowSteps)
					.set({ completedBy: user.id })
					.where(eq(formationWorkflowSteps.completedBy, oldId));
				await tx.update(seances).set({ createdBy: user.id }).where(eq(seances.createdBy, oldId));
				await tx.update(seances).set({ instructor: user.id }).where(eq(seances.instructor, oldId));
				await tx.update(formateurs).set({ userId: user.id }).where(eq(formateurs.userId, oldId));
				await tx.update(modules).set({ createdBy: user.id }).where(eq(modules.createdBy, oldId));
				await tx.update(clients).set({ createdBy: user.id }).where(eq(clients.createdBy, oldId));
				await tx.update(users).set({ id: user.id }).where(eq(users.id, oldId));
			});
			return true;
		}
		throw err;
	}
};
