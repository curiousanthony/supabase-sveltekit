import { redirect, fail, isRedirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { onboardingSchema } from './schema';
import { db } from '$lib/db';
import { workspacesUsers, workspaces, users, clients, deals } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { setActiveWorkspace } from '$lib/server/workspace';

export const load: PageServerLoad = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();
	if (!session || !user) {
		throw redirect(303, '/auth/login?redirectTo=/onboarding');
	}

	// Check if user already has a workspace - if so, redirect to home
	const existingWorkspace = await db.query.workspacesUsers.findFirst({
		where: eq(workspacesUsers.userId, user.id),
		columns: { workspaceId: true }
	});

	if (existingWorkspace?.workspaceId) {
		throw redirect(303, '/');
	}

	const form = await superValidate(zod(onboardingSchema), {
		defaults: {
			workspaceName: ''
		}
	});

	// Get user's name for personalized welcome
	const userName =
		user.user_metadata?.full_name?.split(' ')[0] ||
		user.user_metadata?.name ||
		user.email?.split('@')[0] ||
		'';

	return {
		form,
		userName
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) {
			return fail(401, { message: 'Non autorisé' });
		}

		const form = await superValidate(request, zod(onboardingSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const workspaceId = await db.transaction(async (tx) => {
				// 1. Ensure user exists in public.users (same id as auth.users)
				// Use onConflictDoNothing without target to handle both id and email conflicts
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
					.onConflictDoNothing();

				// 2. Create the new workspace with the user-provided name
				const [inserted] = await tx
					.insert(workspaces)
					.values({ name: form.data.workspaceName.trim() })
					.returning({ id: workspaces.id });

				if (!inserted) {
					throw new Error('Failed to create workspace');
				}

				// 3. Add user to workspace as owner
				await tx
					.insert(workspacesUsers)
					.values({
						workspaceId: inserted.id,
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
						workspaceId: inserted.id
					})
					.returning({ id: clients.id });

				if (sampleClient) {
					await tx.insert(deals).values([
						{
							workspaceId: inserted.id,
							clientId: sampleClient.id,
							name: 'Deal exemple – Formation Excel',
							value: '4500',
							stage: 'Proposition',
							ownerId: user.id,
							createdBy: user.id
						},
						{
							workspaceId: inserted.id,
							clientId: sampleClient.id,
							name: 'Deal exemple – Anglais business',
							value: '3200',
							stage: 'Qualification',
							ownerId: user.id,
							createdBy: user.id
						},
						{
							workspaceId: inserted.id,
							clientId: sampleClient.id,
							name: 'Deal exemple – Management',
							value: '6800',
							stage: 'Lead',
							ownerId: user.id,
							createdBy: user.id
						}
					]);
				}

				return inserted.id;
			});

			// Set the workspace as active for this user
			await setActiveWorkspace(user.id, workspaceId);

			// Redirect to home on success
			throw redirect(303, '/');
		} catch (err) {
			// Re-throw redirect errors (they're intentional, not failures)
			if (isRedirect(err)) {
				throw err;
			}
			console.error('[Onboarding] Workspace creation failed:', err);
			return fail(500, {
				form,
				message: 'Une erreur est survenue lors de la création de votre espace. Veuillez réessayer.'
			});
		}
	}
};
