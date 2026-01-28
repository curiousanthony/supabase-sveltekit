import { db } from '$lib/db';
import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
	// Get the formation object from the ID in the URL, from the database
	const formation = await db.query.formations.findFirst({
		where: (formations, { eq }) => eq(formations.id, params.id),
		with: {
			thematique: {
				columns: {
					name: true
				}
			},
			sousthematique: {
				columns: {
					name: true
				}
			},
			user: true,
			modules: true
		}
	});

	const pageName = formation?.name ?? 'Formation';

	if (!formation) {
		throw new Error('Formation not found');
	}

	// Conditional Tailwind CSS class based on formation "statut" value
	// const statutClass = formation.statut === 'En cours' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground';
	const statutBadgeClass =
		formation.statut === 'En attente'
			? '[&_svg]:text-neutral-400'
			: formation.statut === 'En cours'
				? '[&_svg]:text-yellow-400'
				: formation.statut === 'Terminée'
					? '[&_svg]:text-green-400'
					: 'bg-muted text-muted-foreground';

	// console.log("from formations/[id]/+page.server.ts → formation:\n", formation);

	const header = {
		pageName: formation.name,
		actions: [
			{
				type: 'badge',
				icon: 'circle',
				text: formation.statut,
				variant: 'outline',
				className: statutBadgeClass + ' select-none'
			},
			{
				type: 'button',
				icon: 'search',
				text: 'Trouver un formateur',
				href: `/formations/${formation.id}/modifier`,
				// className: 'bg-primary text-primary-foreground hover:bg-primary/70 hover:text-primary-foreground',
				variant: 'default'
			}
		],
		backButtonLabel: 'Formations',
		backButtonHref: '/formations',
		backButton: true
	};

	return { formation, pageName, header };
}) satisfies PageServerLoad;
