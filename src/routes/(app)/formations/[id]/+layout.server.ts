import { error } from '@sveltejs/kit';
import { db } from '$lib/db';
import { formations } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';

const STATUT_COLORS: Record<string, string> = {
	'À traiter': '[&_svg]:text-neutral-400',
	'Signature convention': '[&_svg]:text-orange-400',
	'Financement': '[&_svg]:text-yellow-400',
	'Planification': '[&_svg]:text-purple-400',
	'En cours': '[&_svg]:text-blue-400',
	'Terminée': '[&_svg]:text-green-400',
	'Archivée': '[&_svg]:text-red-400'
};

export const load = (async ({ params }) => {
	const formationId = params.id;

	const formation = await db.query.formations.findFirst({
		where: eq(formations.id, formationId),
		with: {
			thematique: { columns: { id: true, name: true } },
			sousthematique: { columns: { id: true, name: true } },
			client: { columns: { id: true, legalName: true } },
			programmeSource: {
				columns: { id: true, titre: true, dureeHeures: true, modalite: true }
			},
			modules: {
				columns: { id: true, name: true, durationHours: true, orderIndex: true },
				orderBy: (m, { asc }) => [asc(m.orderIndex)]
			},
			actions: {
				columns: {
					id: true,
					title: true,
					description: true,
					status: true,
					etape: true,
					dueDate: true,
					completedAt: true,
					blockedByActionId: true,
					orderIndex: true
				},
				orderBy: (a, { asc }) => [asc(a.orderIndex)]
			},
			formationFormateurs: {
				with: {
					formateur: {
						columns: { id: true },
						with: {
							user: { columns: { id: true, email: true, rawUserMetaData: true } }
						}
					}
				}
			},
			formationApprenants: {
				with: {
					contact: {
						columns: { id: true, firstName: true, lastName: true, email: true, phone: true },
						with: {
							contactCompanies: {
								with: {
									company: { columns: { id: true, name: true } }
								},
								limit: 1
							}
						}
					}
				}
			},
			seances: {
				columns: {
					id: true,
					startAt: true,
					endAt: true,
					location: true,
					moduleId: true,
					formateurId: true
				},
				orderBy: (s, { asc }) => [asc(s.startAt)],
				with: {
					module: { columns: { id: true, name: true } },
					formateur: {
						columns: { id: true },
						with: {
							user: { columns: { id: true, rawUserMetaData: true } }
						}
					},
					emargements: {
						columns: { id: true, contactId: true, signedAt: true }
					}
				}
			}
		}
	});

	if (!formation) {
		throw error(404, 'Formation introuvable');
	}

	const statutBadgeClass = STATUT_COLORS[formation.statut] ?? '[&_svg]:text-neutral-400';

	const header = {
		pageName: formation.name ?? 'Formation',
		idInWorkspace: formation.idInWorkspace,
		actions: [
			{
				type: 'badge' as const,
				icon: 'circle',
				text: formation.statut,
				variant: 'outline' as const,
				className: statutBadgeClass + ' select-none'
			},
			{
				type: 'formationButtonGroup' as const,
				formationId: formation.id
			}
		],
		backButtonLabel: 'Formations',
		backButtonHref: '/formations',
		backButton: true
	};

	return { formation, pageName: formation.name ?? 'Formation', header };
}) satisfies LayoutServerLoad;
