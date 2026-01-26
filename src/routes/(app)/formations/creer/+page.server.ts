import { db } from '$lib/db';
import { formations, workspacesUsers } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { formationSchema } from './schema';
import type { PageServerLoad, Actions } from './$types';

export const load = (async () => {
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
			name: 'Nouvelle Formation',
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
					title: 'Module 1',
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
		clients: mockClients,
		prerequisites: mockPrerequisites,
		targetPublics: mockTargetPublics,
		topics: mockTopics,
		header: {
			pageName: 'Créer une formation',
			backButton: true
		}
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) {
			return fail(401, { message: 'Non autorisé' });
		}

		const form = await superValidate(request, zod(formationSchema));

		console.log('--- FORM SUBMITTED (UI FLOW ONLY) ---');
		console.log('Data:', JSON.stringify(form.data, null, 2));
		console.log('Valid:', form.valid);
		console.log('------------------------------------');

		if (!form.valid) {
			return fail(400, { form });
		}

		// Simulate backend delay
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// For now, redirect to a success state or just back to the library
		// In a real app, we would insert into DB here.
		throw redirect(303, '/formations');
	}
};
