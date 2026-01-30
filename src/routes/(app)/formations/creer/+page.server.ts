import { db } from '$lib/db';
import { formations, clients, modules } from '$lib/db/schema';
import { eq, asc, desc } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { formationSchema } from './schema';
import { getUserWorkspace } from '$lib/auth';
import type { PageServerLoad, Actions } from './$types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const load = (async ({ locals }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) {
		return {
			form: await superValidate(zod(formationSchema), { defaults: {} }),
			clients: [],
			prerequisites: [],
			targetPublics: [],
			topics: [],
			header: { pageName: 'Créer une formation', backButton: true, backButtonLabel: 'Formations', backButtonHref: '/formations' }
		};
	}

	const clientsData = await db.query.clients.findMany({
		where: eq(clients.workspaceId, workspaceId),
		columns: { id: true, legalName: true },
		orderBy: [asc(clients.legalName)]
	});
	// Mock data for the UI-first approach
	const mockClients = [
		{ id: '1', legalName: 'Acme Corp' },
		{ id: '2', legalName: 'Globex Corporation' },
		{ id: '3', legalName: 'Soylent Corp' }
	];

	const mockPrerequisites = [
		{ id: 'p1', name: "Maîtrise des bases de l'informatique" },
		{ id: 'p2', name: "Connaissance d'Excel niveau débutant" },
		{ id: 'p3', name: 'Anglais technique' }
	];

	const mockTargetPublics = [
		{ id: 'tp1', name: 'Salariés en reconversion' },
		{ id: 'tp2', name: "Chefs d'entreprise" },
		{ id: 'tp3', name: "Demandeurs d'emploi" }
	];

	const mockTopics = [
		{ id: 't1', name: 'AI' },
		{ id: 't2', name: 'Bureautique' },
		{ id: 't3', name: 'Langues' },
		{ id: 't4', name: 'Management' }
	];

	const form = await superValidate(zod(formationSchema), {
		defaults: {
			name: 'Formation sans titre',
			clientId: '',
			duree: 7,
			modalite: 'Présentiel',
			topicId: '',
			customTopic: '',
			targetPublicIds: [],
			prerequisiteIds: [],
			customPrerequisites: [],
			modules: [
				{
					title: 'Formation sans titre',
					durationHours: 7,
					objectifs: 'Objectifs du premier module'
				}
			],
			evaluationMode: 'QCM de fin de formation',
			suiviAssiduite: "Feuille d'émargement signée par demi-journée"
		}
	});

	return {
		form,
		clients: clientsData,
		prerequisites: mockPrerequisites,
		targetPublics: mockTargetPublics,
		topics: mockTopics,
		header: {
			pageName: 'Créer une formation',
			backButton: true,
			backButtonLabel: 'Formations',
			backButtonHref: '/formations'
		}
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun workspace associé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) {
			return fail(401, { message: 'Non autorisé' });
		}

		const form = await superValidate(request, zod(formationSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		const topicId =
			form.data.topicId && UUID_REGEX.test(form.data.topicId) ? form.data.topicId : null;
		const clientId = form.data.clientId && UUID_REGEX.test(form.data.clientId) ? form.data.clientId : null;

		const maxIdResult = await db
			.select({ n: formations.idInWorkspace })
			.from(formations)
			.where(eq(formations.workspaceId, workspaceId))
			.orderBy(desc(formations.idInWorkspace))
			.limit(1);
		const nextIdInWorkspace = (maxIdResult[0]?.n ?? 0) + 1;

		const [inserted] = await db
			.insert(formations)
			.values({
				workspaceId,
				createdBy: user.id,
				name: form.data.name ?? null,
				description: form.data.description?.trim() || null,
				topicId,
				clientId,
				duree: form.data.duree,
				modalite: form.data.modalite,
				idInWorkspace: nextIdInWorkspace,
				statut: 'En attente'
			})
			.returning({ id: formations.id });

		if (!inserted) return fail(500, { message: 'Erreur lors de la création de la formation', form });

		await db.insert(modules).values(
			form.data.modules.map((m, i) => ({
				courseId: inserted.id,
				createdBy: user.id,
				name: m.title,
				durationHours: String(m.durationHours),
				orderIndex: i
			}))
		);

		throw redirect(303, `/formations/${inserted.id}`);
	}
};
