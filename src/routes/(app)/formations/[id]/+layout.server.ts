import { redirect } from '@sveltejs/kit';
import { db } from '$lib/db';
import { formations } from '$lib/db/schema';
import { getUserWorkspace } from '$lib/auth';
import { eq, and } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params, locals }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) throw redirect(303, '/');

	const formation = await db.query.formations.findFirst({
		where: and(eq(formations.id, params.id), eq(formations.workspaceId, workspaceId)),
		with: {
			thematique: { columns: { name: true } },
			modules: { orderBy: (m, { asc }) => [asc(m.orderIndex)] }
		}
	});

	if (!formation) throw redirect(303, '/formations');

	const header = {
		pageName: formation.name ?? 'Formation',
		idInWorkspace: formation.idInWorkspace,
		actions: [
			{ type: 'badge' as const, icon: 'circle', text: formation.statut, variant: 'outline' as const, className: 'select-none' },
			{ type: 'formationButtonGroup' as const, formationId: formation.id }
		],
		backButtonLabel: 'Formations',
		backButtonHref: '/formations',
		backButton: true
	};

	return { formation, pageName: formation.name ?? 'Formation', header };
};
