import { db } from '$lib/db';
import { formations } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUserWorkspace } from '$lib/auth';
import type { PageServerLoad } from './$types';

/** Key Qualiopi-related fields on a formation (critères 2 & 3). */
function isFormationQualiopiComplete(f: {
	name?: string | null;
	description?: string | null;
	modalite?: string | null;
	evaluationMode?: string | null;
	suiviAssiduite?: string | null;
	duree?: number | null;
}) {
	const hasName = Boolean(f.name?.trim());
	const hasDescription = Boolean(f.description?.trim());
	const hasModalite = Boolean(f.modalite?.trim());
	const hasEvaluationMode = Boolean(f.evaluationMode?.trim());
	const hasSuiviAssiduite = Boolean(f.suiviAssiduite?.trim());
	const hasDuree = f.duree != null && f.duree > 0;
	return {
		ok:
			hasName &&
			hasDescription &&
			hasModalite &&
			hasEvaluationMode &&
			hasSuiviAssiduite &&
			hasDuree,
		missing: [
			!hasName && 'nom',
			!hasDescription && 'description',
			!hasModalite && 'modalité',
			!hasEvaluationMode && "mode d'évaluation",
			!hasSuiviAssiduite && "suivi d'assiduité",
			!hasDuree && 'durée'
		].filter(Boolean) as string[]
	};
}

export const load = (async ({ locals }) => {
	const workspaceId = await getUserWorkspace(locals);

	const formationsData = workspaceId
		? await db.query.formations.findMany({
				where: eq(formations.workspaceId, workspaceId),
				with: {
					thematique: {
						columns: { name: true }
					}
				},
				orderBy: (formations, { desc }) => [desc(formations.idInWorkspace)]
			})
		: [];

	const conformityByFormation = formationsData.map((f) => ({
		id: f.id,
		name: f.name,
		...isFormationQualiopiComplete(f)
	}));

	const conformCount = conformityByFormation.filter((c) => c.ok).length;
	const totalFormations = formationsData.length;
	const conformityPercent =
		totalFormations > 0 ? Math.round((conformCount / totalFormations) * 100) : 0;
	const formationsToComplete = conformityByFormation.filter((c) => !c.ok);

	const header = {
		pageName: 'Gestion qualité',
		actions: [
			{
				type: 'button',
				icon: 'plus',
				text: 'Créer une formation',
				href: '/formations/creer',
				variant: 'default'
			}
		]
	};

	return {
		formations: formationsData,
		header,
		conformity: {
			conformCount,
			totalFormations,
			conformityPercent,
			formationsToComplete
		}
	};
}) satisfies PageServerLoad;
