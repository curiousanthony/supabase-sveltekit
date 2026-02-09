import type { PageServerLoad } from './$types';

/** PoC: dummy apprenant for the detail page. Replace with real fetch when backend is wired. */
export const load = (async ({ params }) => {
	const id = params.id;
	const header = {
		pageName: 'Fiche apprenant',
		actions: [],
		backButtonLabel: 'Apprenants',
		backButtonHref: '/contacts/apprenants',
		backButton: true
	};
	const apprenant = {
		id,
		firstName: 'Philippe',
		lastName: 'Mejia',
		fullName: 'Philippe Mejia',
		email: 'philippe.mejia@example.com',
		company: 'Acme Inc.',
		companyId: '1',
		phone: null
	};
	return { apprenant, header };
}) satisfies PageServerLoad;
