import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
	// Reuse same dummy data as parent; in Phase 2 this would load from DB
	const dummyModules = [
		{
			id: '1',
			name: 'Module 1: Introduction',
			durationHours: 8,
			formateurId: null as string | null,
			formateurName: null as string | null,
			objectifs: 'Comprendre les fondamentaux du pilotage'
		},
		{
			id: '2',
			name: 'Module 2: Approfondissement',
			durationHours: 16,
			formateurId: '1',
			formateurName: 'Formateur A',
			objectifs: 'Mettre en œuvre les méthodes avancées'
		}
	];

	const dummyFormateurs = [
		{ id: '1', name: 'Formateur A', specialite: 'Management' },
		{ id: '2', name: 'Formateur B', specialite: 'Leadership' },
		{ id: '3', name: 'Formateur C', specialite: 'Projet' }
	];

	return {
		formationId: params.id,
		formationName: 'Formation pilot',
		modules: dummyModules,
		formateurs: dummyFormateurs,
		pageName: 'Équipe pédagogique',
		header: {
			pageName: 'Équipe pédagogique',
			backButtonLabel: 'Formation',
			backButtonHref: `/formations/${params.id}`,
			backButton: true
		}
	};
}) satisfies PageServerLoad;
