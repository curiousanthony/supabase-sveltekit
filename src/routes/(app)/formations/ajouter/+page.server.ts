import { db } from '$lib/db';
import { formations, thematiques } from '$lib/db/schema';
import { getUserWorkspace } from '$lib/auth';
import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { eq, desc, max } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for formation creation
const formationSchema = z.object({
	name: z.string().min(1, 'Le nom de la formation est requis'),
	topicId: z.string().uuid().optional().nullable(),
	modalite: z.enum(['Distanciel', 'Présentiel', 'Hybride', 'E-Learning']).optional().nullable(),
	typeFinancement: z.enum(['CPF', 'OPCO', 'Inter', 'Intra']).optional().nullable(),
	duree: z.coerce.number().int().positive().optional().nullable()
});

export const load = (async ({ locals }) => {
	try {
		// Fetch all thématiques for the dropdown
		const allThematiques = await db.query.thematiques.findMany({
			orderBy: (thematiques, { asc }) => [asc(thematiques.name)]
		});

		const header = {
			pageName: 'Créer une formation',
			backButton: true
		};

		return {
			thematiques: allThematiques,
			header
		};
	} catch (error) {
		console.error('Error loading thématiques:', error);
		throw error;
	}
}) satisfies PageServerLoad;

export const actions = {
	createFormation: async ({ request, locals }) => {
		try {
			// Get user from session
			const { user } = await locals.safeGetSession();
			if (!user) {
				return fail(401, { message: 'Non authentifié' });
			}

			// Get user's workspace
			const workspaceId = await getUserWorkspace(locals);
			if (!workspaceId) {
				return fail(400, { message: 'Aucun workspace trouvé pour cet utilisateur' });
			}

			// Parse form data
			const formData = await request.formData();
			const data = {
				name: formData.get('name'),
				topicId: formData.get('topicId') || null,
				modalite: formData.get('modalite') || null,
				typeFinancement: formData.get('typeFinancement') || null,
				duree: formData.get('duree') || null
			};

			// Validate form data
			const validation = formationSchema.safeParse(data);
			if (!validation.success) {
				return fail(400, {
					message: 'Données invalides',
					errors: validation.error.flatten().fieldErrors
				});
			}

			// Calculate next idInWorkspace
			const maxIdResult = await db
				.select({ maxId: max(formations.idInWorkspace) })
				.from(formations)
				.where(eq(formations.workspaceId, workspaceId));

			const nextIdInWorkspace = (maxIdResult[0]?.maxId ?? 0) + 1;

			// Insert new formation
			const [newFormation] = await db
				.insert(formations)
				.values({
					name: validation.data.name,
					topicId: validation.data.topicId,
					modalite: validation.data.modalite,
					typeFinancement: validation.data.typeFinancement,
					duree: validation.data.duree,
					createdBy: user.id,
					workspaceId: workspaceId,
					idInWorkspace: nextIdInWorkspace
					// statut: 'En attente' is default in schema
				})
				.returning();

			// Redirect to the new formation's detail page
			throw redirect(303, `/formations/${newFormation.id}`);
		} catch (error) {
			// Re-throw redirect errors
			if (error instanceof Response) {
				throw error;
			}

			console.error('Error creating formation:', error);
			return fail(500, { message: 'Erreur lors de la création de la formation' });
		}
	}
} satisfies Actions;
