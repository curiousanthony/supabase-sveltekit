import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
	// Reuse same dummy data as parent; in Phase 2 this would load from DB
	const dummySeances = [
		{
			id: '1',
			date: '2026-03-01',
			startTime: '09:00',
			endTime: '12:30',
			moduleName: 'Module 1',
			formateurName: null as string | null,
			emargementSigned: 3,
			emargementTotal: 4
		},
		{
			id: '2',
			date: '2026-03-01',
			startTime: '14:00',
			endTime: '17:30',
			moduleName: 'Module 1',
			formateurName: null as string | null,
			emargementSigned: 0,
			emargementTotal: 4
		},
		{
			id: '3',
			date: '2026-03-02',
			startTime: '09:00',
			endTime: '12:30',
			moduleName: 'Module 2',
			formateurName: 'Formateur A',
			emargementSigned: 0,
			emargementTotal: 4
		},
		{
			id: '4',
			date: '2026-03-02',
			startTime: '14:00',
			endTime: '17:30',
			moduleName: 'Module 2',
			formateurName: 'Formateur A',
			emargementSigned: 0,
			emargementTotal: 4
		},
		{
			id: '5',
			date: '2026-03-03',
			startTime: '09:00',
			endTime: '12:30',
			moduleName: 'Module 2',
			formateurName: 'Formateur A',
			emargementSigned: 0,
			emargementTotal: 4
		}
	];

	return {
		formationId: params.id,
		formationName: 'Formation pilot',
		seances: dummySeances,
		pageName: 'Séances',
		header: {
			pageName: 'Séances',
			backButtonLabel: 'Formation',
			backButtonHref: `/formations/${params.id}`,
			backButton: true
		}
	};
}) satisfies PageServerLoad;
