import { db } from '$lib/db';
import { formationActions, questSubActions, modules } from '$lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Checks module-level conditions for the `programme_modules` quest and
 * auto-completes (or un-completes) relevant sub-actions.
 *
 * Conditions:
 * - "Confirmer les objectifs pédagogiques" → all modules have non-empty objectifs
 * - "Valider les modalités d'évaluation" → all modules have non-null modaliteEvaluation
 */
export async function checkModuleAutoComplete(formationId: string, userId: string) {
	const action = await db.query.formationActions.findFirst({
		where: and(
			eq(formationActions.formationId, formationId),
			eq(formationActions.questKey, 'programme_modules')
		),
		columns: { id: true, status: true },
		with: {
			subActions: {
				columns: { id: true, title: true, completed: true }
			}
		}
	});

	if (!action || action.status === 'Terminé') return;

	const formationModules = await db.query.modules.findMany({
		where: eq(modules.courseId, formationId),
		columns: { objectifs: true, modaliteEvaluation: true }
	});

	if (formationModules.length === 0) return;

	const allHaveObjectifs = formationModules.every(
		(m) => m.objectifs && m.objectifs.trim().length > 0
	);
	const allHaveEvaluation = formationModules.every(
		(m) => m.modaliteEvaluation != null
	);

	const conditions: Array<{ titleMatch: string; met: boolean }> = [
		{ titleMatch: 'Confirmer les objectifs pédagogiques', met: allHaveObjectifs },
		{ titleMatch: "Valider les modalités d'évaluation", met: allHaveEvaluation }
	];

	for (const { titleMatch, met } of conditions) {
		const sub = action.subActions.find((s) => s.title === titleMatch);
		if (!sub) continue;

		if (met && !sub.completed) {
			await db
				.update(questSubActions)
				.set({
					completed: true,
					completedAt: new Date().toISOString(),
					completedBy: userId
				})
				.where(eq(questSubActions.id, sub.id));
		} else if (!met && sub.completed) {
			await db
				.update(questSubActions)
				.set({
					completed: false,
					completedAt: null,
					completedBy: null
				})
				.where(eq(questSubActions.id, sub.id));
		}
	}
}
