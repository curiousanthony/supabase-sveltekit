import { db } from '$lib/db';
import { seances, formationDocuments } from '$lib/db/schema';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { generateDocument } from '$lib/services/document-generator';
import type { CronJobResult } from './index';

/**
 * Auto-generate blank feuille d'émargement for in-person séances starting tomorrow (Europe/Paris).
 * Skips Distanciel and E-Learning modalities; skips séances that already have one.
 */
export async function generateEmargementJ1(): Promise<CronJobResult> {
	const details: string[] = [];
	let processed = 0;
	let errors = 0;

	const tomorrowSeances = await db
		.select({
			id: seances.id,
			formationId: seances.formationId
		})
		.from(seances)
		.leftJoin(
			formationDocuments,
			and(
				eq(formationDocuments.relatedSeanceId, seances.id),
				eq(formationDocuments.type, 'feuille_emargement')
			)
		)
		.where(
			and(
				sql`(${seances.startAt} AT TIME ZONE 'Europe/Paris')::date = ((NOW() AT TIME ZONE 'Europe/Paris')::date + 1)`,
				sql`${seances.modalityOverride} IN ('Présentiel', 'Hybride')`,
				isNull(formationDocuments.id)
			)
		);

	for (const seance of tomorrowSeances) {
		try {
			const result = await generateDocument('feuille_emargement', seance.formationId, null, {
				seanceId: seance.id
			});
			processed++;
			details.push(`Generated ${result.documentId} for séance ${seance.id}`);
		} catch (err) {
			errors++;
			const message = err instanceof Error ? err.message : String(err);
			details.push(`Failed séance ${seance.id}: ${message}`);
			console.error(`[emargement-j1] Error for séance ${seance.id}:`, err);
		}
	}

	details.unshift(`Found ${tomorrowSeances.length} séance(s) needing émargement`);

	return { name: 'emargement-j1', processed, errors, details };
}
