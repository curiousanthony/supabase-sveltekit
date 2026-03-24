import { getQuestTemplate, getQuestsForFormation, calculateDueDates } from './formation-quests';
import { getDependencyLockType, type LockType } from './formation-quest-locks';
import type { QuestTemplate, QuestPhase } from './formation-quests';

export type QuestDisplayState =
	| 'actionable'
	| 'waiting'
	| 'soft_locked'
	| 'hard_locked'
	| 'completed'
	| 'anticipated';

export interface SuiviActionRow {
	id: string;
	questKey: string | null;
	status: 'Terminé' | 'En cours' | 'Pas commencé';
	phase: QuestPhase | null;
	completedAt: string | null;
	waitStartedAt: string | null;
	lastRemindedAt: string | null;
	anticipatedAt: string | null;
	softLockOverriddenAt: string | null;
}

export interface CategorizedSuiviQuest {
	action: SuiviActionRow;
	template: QuestTemplate;
	displayState: QuestDisplayState;
	dueDate: string | null;
	unmetDeps: { key: string; title: string; lockType: LockType }[];
}

export interface SuiviCategories {
	actionable: CategorizedSuiviQuest[];
	waiting: CategorizedSuiviQuest[];
	locked: CategorizedSuiviQuest[];
	completed: CategorizedSuiviQuest[];
}

export function getQuestDisplayState(
	action: SuiviActionRow,
	allActions: SuiviActionRow[]
): QuestDisplayState {
	if (action.status === 'Terminé') {
		return action.anticipatedAt ? 'anticipated' : 'completed';
	}

	if (action.waitStartedAt) {
		return 'waiting';
	}

	const template = action.questKey ? getQuestTemplate(action.questKey) : null;
	if (!template || template.dependencies.length === 0) {
		return 'actionable';
	}

	const unmetDeps = template.dependencies.filter((depKey) => {
		const depAction = allActions.find((a) => a.questKey === depKey);
		return depAction && depAction.status !== 'Terminé';
	});

	if (unmetDeps.length === 0) return 'actionable';

	const hasUnmetHardDep = unmetDeps.some(
		(depKey) => getDependencyLockType(action.questKey!, depKey) === 'hard'
	);

	if (action.softLockOverriddenAt) {
		return hasUnmetHardDep ? 'hard_locked' : 'actionable';
	}

	return hasUnmetHardDep ? 'hard_locked' : 'soft_locked';
}

export function getUnmetDependencies(
	action: SuiviActionRow,
	allActions: SuiviActionRow[]
): { key: string; title: string; lockType: LockType }[] {
	const template = action.questKey ? getQuestTemplate(action.questKey) : null;
	if (!template) return [];

	return template.dependencies
		.filter((depKey) => {
			const depAction = allActions.find((a) => a.questKey === depKey);
			return depAction && depAction.status !== 'Terminé';
		})
		.map((depKey) => ({
			key: depKey,
			title: getQuestTemplate(depKey)?.title ?? depKey,
			lockType: getDependencyLockType(action.questKey!, depKey)
		}));
}

export function categorizeByDisplayState(
	actions: SuiviActionRow[],
	formation: {
		type?: string | null;
		typeFinancement?: string | null;
		dateDebut?: string | null;
		dateFin?: string | null;
	}
): SuiviCategories {
	const quests = getQuestsForFormation(
		formation.type as 'Intra' | 'Inter' | 'CPF' | null | undefined,
		formation.typeFinancement as 'CPF' | 'OPCO' | 'Inter' | 'Intra' | null | undefined
	);
	const dueDates = calculateDueDates(quests, formation.dateDebut, formation.dateFin);

	const result: SuiviCategories = {
		actionable: [],
		waiting: [],
		locked: [],
		completed: []
	};

	for (const action of actions) {
		const template = action.questKey ? getQuestTemplate(action.questKey) : null;
		if (!template) continue;

		const applicableKeys = new Set(quests.map((q) => q.key));
		if (!applicableKeys.has(action.questKey!)) continue;

		const displayState = getQuestDisplayState(action, actions);
		const dueDate = action.questKey ? dueDates.get(action.questKey) ?? null : null;
		const unmetDeps = getUnmetDependencies(action, actions);

		const item: CategorizedSuiviQuest = { action, template, displayState, dueDate, unmetDeps };

		switch (displayState) {
			case 'actionable':
				result.actionable.push(item);
				break;
			case 'waiting':
				result.waiting.push(item);
				break;
			case 'soft_locked':
			case 'hard_locked':
				result.locked.push(item);
				break;
			case 'completed':
			case 'anticipated':
				result.completed.push(item);
				break;
		}
	}

	result.actionable.sort((a, b) => a.template.orderIndex - b.template.orderIndex);
	result.locked.sort((a, b) => a.template.orderIndex - b.template.orderIndex);
	result.completed.sort((a, b) => {
		const dateA = a.action.completedAt ?? '';
		const dateB = b.action.completedAt ?? '';
		return dateB.localeCompare(dateA);
	});

	return result;
}
