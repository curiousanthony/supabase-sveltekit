import type { PageServerLoad } from './$types';

export const load = (async () => {
	return {
		header: {
			pageName: 'Nouveau contact',
			backButton: true,
			backButtonLabel: 'Contacts',
			backButtonHref: '/contacts'
		}
	};
}) satisfies PageServerLoad;
