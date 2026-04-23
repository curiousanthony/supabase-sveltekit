import type { InferSelectModel } from 'drizzle-orm';
import type { formationActions } from '$lib/db/schema';
import {
	type QuestTemplate,
	type QuestPhase,
	getQuestTemplate,
	getBlockingInfo,
	calculateDueDates,
	getQuestsForFormation
} from './formation-quests';

type ActionRow = Pick<
	InferSelectModel<typeof formationActions>,
	'status' | 'questKey' | 'phase' | 'id'
> & {
	subActions?: { completed: boolean }[];
};

export type UrgencyCategory = 'maintenant' | 'prochainement' | 'enAttente' | 'completes';

export interface CategorizedQuest {
	action: ActionRow;
	template: QuestTemplate;
	urgencyScore: number;
	dueDate: string | null;
	category: UrgencyCategory;
}

export interface CategorizedQuests {
	maintenant: CategorizedQuest[];
	prochainement: CategorizedQuest[];
	enAttente: CategorizedQuest[];
	completes: CategorizedQuest[];
}

/**
 * Computes a numeric urgency score for a quest action.
 * Lower = more urgent. Used for sorting within categories.
 */
export function computeUrgencyScore(
	action: ActionRow,
	allActions: ActionRow[],
	dueDates: Map<string, string>
): number {
	if (action.status === 'Terminé') return 1000;

	const { blocked } = getBlockingInfo(action, allActions);
	if (blocked) return 800;

	const dueDate = action.questKey ? dueDates.get(action.questKey) : null;
	if (!dueDate) return 500;

	const now = new Date();
	now.setHours(0, 0, 0, 0);
	// Parse as local date to avoid UTC offset issues with YYYY-MM-DD strings
	const [year, month, day] = dueDate.split('-').map(Number);
	const due = new Date(year, month - 1, day);
	const daysUntilDue = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

	if (daysUntilDue < 0) return -1000 + daysUntilDue;
	if (daysUntilDue === 0) return 0;
	if (daysUntilDue <= 7) return 100 + daysUntilDue;
	if (daysUntilDue <= 14) return 200 + daysUntilDue;
	return 300 + daysUntilDue;
}

/**
 * Categorizes quest actions into the four guided workspace sections.
 *
 * - maintenant: Top 1-3 unblocked, incomplete quests by urgency
 * - prochainement: Next 2-5 unblocked quests
 * - enAttente: Quests blocked on external parties
 * - completes: Finished quests
 */
export function categorizeQuests(
	actions: ActionRow[],
	formation: {
		type?: string | null;
		typeFinancement?: string | null;
		dateDebut?: string | null;
		dateFin?: string | null;
	}
): CategorizedQuests {
	const quests = getQuestsForFormation(
		formation.type as 'Intra' | 'Inter' | 'CPF' | null | undefined,
		formation.typeFinancement as 'CPF' | 'OPCO' | 'Inter' | 'Intra' | null | undefined
	);
	const dueDates = calculateDueDates(quests, formation.dateDebut, formation.dateFin);

	const result: CategorizedQuests = {
		maintenant: [],
		prochainement: [],
		enAttente: [],
		completes: []
	};

	const scored: CategorizedQuest[] = [];

	for (const action of actions) {
		const template = action.questKey ? getQuestTemplate(action.questKey) : null;
		if (!template) continue;

		const urgencyScore = computeUrgencyScore(action, actions, dueDates);
		const dueDate = action.questKey ? (dueDates.get(action.questKey) ?? null) : null;

		scored.push({ action, template, urgencyScore, dueDate, category: 'maintenant' });
	}

	scored.sort((a, b) => a.urgencyScore - b.urgencyScore);

	const MAX_ACTIVE = 3;
	const MAX_UPCOMING = 5;
	let activeCount = 0;
	let upcomingCount = 0;

	for (const item of scored) {
		if (item.action.status === 'Terminé') {
			item.category = 'completes';
			result.completes.push(item);
			continue;
		}

		const { blocked } = getBlockingInfo(item.action, actions);

		if (blocked) {
			item.category = 'enAttente';
			result.enAttente.push(item);
			continue;
		}

		if (item.action.status === 'En cours') {
			item.category = 'maintenant';
			result.maintenant.push(item);
			activeCount++;
			continue;
		}

		if (activeCount < MAX_ACTIVE) {
			item.category = 'maintenant';
			result.maintenant.push(item);
			activeCount++;
		} else if (upcomingCount < MAX_UPCOMING) {
			item.category = 'prochainement';
			result.prochainement.push(item);
			upcomingCount++;
		} else {
			item.category = 'prochainement';
			result.prochainement.push(item);
		}
	}

	return result;
}

/**
 * Returns a human-readable urgency label for display.
 */
export function getUrgencyLabel(score: number): string {
	if (score < -999) return 'En retard';
	if (score <= 0) return "Aujourd'hui";
	if (score <= 107) return 'Cette semaine';
	if (score <= 214) return 'Prochainement';
	if (score >= 1000) return 'Terminé';
	if (score >= 800) return 'Bloqué';
	return 'Planifié';
}

/**
 * Returns CSS color class for urgency badge.
 */
export function getUrgencyColor(score: number): string {
	if (score < -999) return 'text-red-600 bg-red-50 border-red-200';
	if (score <= 0) return 'text-orange-600 bg-orange-50 border-orange-200';
	if (score <= 107) return 'text-amber-600 bg-amber-50 border-amber-200';
	if (score >= 1000) return 'text-green-600 bg-green-50 border-green-200';
	if (score >= 800) return 'text-slate-500 bg-slate-50 border-slate-200';
	return 'text-blue-600 bg-blue-50 border-blue-200';
}
