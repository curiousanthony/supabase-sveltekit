import type { LayoutServerLoad } from './$types';

/** PoC: dummy formation and header so the formation detail UI works without DB. Replace with real fetch when backend is wired. */
export const load = (async ({ params }) => {
	const formationId = params.id;
	const statutBadgeClass =
		'[&_svg]:text-neutral-400'; // En attente

	const formation = {
		id: formationId,
		name: 'Introduction à ChatGPT',
		description: 'Formation d\'introduction aux usages de ChatGPT en entreprise.',
		idInWorkspace: 246,
		duree: 35,
		modalite: 'Présentiel',
		statut: 'En attente',
		typeFinancement: 'Intra',
		thematique: { name: 'IA générative' },
		sousthematique: null,
		user: null,
		modules: []
	};

	const header = {
		pageName: formation.name,
		idInWorkspace: formation.idInWorkspace,
		actions: [
			{
				type: 'badge',
				icon: 'circle',
				text: formation.statut,
				variant: 'outline',
				className: statutBadgeClass + ' select-none'
			},
			{
				type: 'formationButtonGroup',
				formationId: formation.id
			}
		],
		backButtonLabel: 'Formations',
		backButtonHref: '/formations',
		backButton: true
	};

	return { formation, pageName: formation.name, header };
}) satisfies LayoutServerLoad;
