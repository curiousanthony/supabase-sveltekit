import {
	getQuestTemplate,
	getQuestsForFormation,
	calculateDueDates
} from './formation-quests';
import type { QuestTemplate } from './formation-quests';
import { getQuestDisplayState, type SuiviActionRow } from './formation-quest-state';

export interface PriorityContext {
	actions: SuiviActionRow[];
	formation: {
		type?: string | null;
		typeFinancement?: string | null;
		dateDebut?: string | null;
		dateFin?: string | null;
	};
	now?: Date;
}

export interface PrioritizedQuest {
	action: SuiviActionRow;
	template: QuestTemplate;
	priorityScore: number;
	dueDate: string | null;
	isOverdue: boolean;
	/** Positive number of calendar days past due when `isOverdue`; otherwise null. */
	daysLate: number | null;
}

export function computePriorityScore(
	action: SuiviActionRow,
	template: QuestTemplate,
	dueDates: Map<string, string>,
	now: Date,
	allTemplates: QuestTemplate[]
): number {
	let score = 0;

	const dueDate = action.questKey ? dueDates.get(action.questKey) ?? null : null;
	const daysUntilDue = dueDate
		? Math.floor((new Date(dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
		: null;
	const isOverdue = daysUntilDue !== null && daysUntilDue < 0;

	score += isOverdue ? 0 : 100_000;
	score += template.criticalForQualiopi ? 0 : 10_000;

	const fanOut = allTemplates.filter((t) =>
		t.dependencies.includes(action.questKey ?? '')
	).length;
	score += (20 - Math.min(fanOut, 20)) * 100;

	if (daysUntilDue !== null) {
		score += Math.max(0, daysUntilDue + 365);
	} else {
		score += 500;
	}

	score += template.orderIndex * 0.01;

	return score;
}

export function getPrimaryAction(ctx: PriorityContext): PrioritizedQuest | null {
	const now = ctx.now ?? new Date();
	const quests = getQuestsForFormation(
		ctx.formation.type as 'Intra' | 'Inter' | 'CPF' | null | undefined,
		ctx.formation.typeFinancement as 'CPF' | 'OPCO' | 'Inter' | 'Intra' | null | undefined
	);
	const dueDates = calculateDueDates(quests, ctx.formation.dateDebut, ctx.formation.dateFin);
	const allTemplates = quests;

	const actionable = ctx.actions
		.filter((a) => getQuestDisplayState(a, ctx.actions) === 'actionable')
		.map((action) => {
			const template = getQuestTemplate(action.questKey ?? '')!;
			const dueDate = action.questKey ? dueDates.get(action.questKey) ?? null : null;
			const priorityScore = computePriorityScore(action, template, dueDates, now, allTemplates);
			const daysUntilDue = dueDate
				? Math.floor((new Date(dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
				: null;
			const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
			return {
				action,
				template,
				priorityScore,
				dueDate,
				isOverdue,
				daysLate: isOverdue && daysUntilDue !== null ? -daysUntilDue : null
			};
		})
		.filter((q) => q.template != null);

	if (actionable.length === 0) return null;

	actionable.sort((a, b) => a.priorityScore - b.priorityScore);
	return actionable[0];
}

export function getConcurrentActions(ctx: PriorityContext, max = 4): PrioritizedQuest[] {
	const now = ctx.now ?? new Date();
	const quests = getQuestsForFormation(
		ctx.formation.type as 'Intra' | 'Inter' | 'CPF' | null | undefined,
		ctx.formation.typeFinancement as 'CPF' | 'OPCO' | 'Inter' | 'Intra' | null | undefined
	);
	const dueDates = calculateDueDates(quests, ctx.formation.dateDebut, ctx.formation.dateFin);
	const allTemplates = quests;

	const actionable = ctx.actions
		.filter((a) => getQuestDisplayState(a, ctx.actions) === 'actionable')
		.map((action) => {
			const template = getQuestTemplate(action.questKey ?? '')!;
			const dueDate = action.questKey ? dueDates.get(action.questKey) ?? null : null;
			const priorityScore = computePriorityScore(action, template, dueDates, now, allTemplates);
			const daysUntilDue = dueDate
				? Math.floor((new Date(dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
				: null;
			const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
			return {
				action,
				template,
				priorityScore,
				dueDate,
				isOverdue,
				daysLate: isOverdue && daysUntilDue !== null ? -daysUntilDue : null
			};
		})
		.filter((q) => q.template != null);

	actionable.sort((a, b) => a.priorityScore - b.priorityScore);
	return actionable.slice(0, max);
}

export type HudBannerState =
	| { type: 'action_single'; quest: PrioritizedQuest }
	| { type: 'action_concurrent'; primary: PrioritizedQuest; others: PrioritizedQuest[] }
	| { type: 'waiting'; quest: SuiviActionRow; template: QuestTemplate; elapsedDays: number; lastRemindedDays: number | null }
	| { type: 'phase_complete'; message: string; daysUntilNext: number | null }
	| null;

export function getHudBannerState(ctx: PriorityContext): HudBannerState {
	const concurrent = getConcurrentActions(ctx);

	if (concurrent.length === 1) {
		return { type: 'action_single', quest: concurrent[0] };
	}

	if (concurrent.length > 1) {
		return {
			type: 'action_concurrent',
			primary: concurrent[0],
			others: concurrent.slice(1)
		};
	}

	const now = ctx.now ?? new Date();

	const waitingAction = ctx.actions.find(
		(a) => a.waitStartedAt && a.status !== 'Terminé'
	);
	if (waitingAction) {
		const template = getQuestTemplate(waitingAction.questKey ?? '');
		if (template) {
			const elapsedDays = Math.floor(
				(now.getTime() - new Date(waitingAction.waitStartedAt!).getTime()) / (1000 * 60 * 60 * 24)
			);
			const lastRemindedDays = waitingAction.lastRemindedAt
				? Math.floor(
						(now.getTime() - new Date(waitingAction.lastRemindedAt).getTime()) /
							(1000 * 60 * 60 * 24)
					)
				: null;
			return { type: 'waiting', quest: waitingAction, template, elapsedDays, lastRemindedDays };
		}
	}

	const allDone = ctx.actions.every((a) => a.status === 'Terminé');
	if (allDone) {
		return {
			type: 'phase_complete',
			message: 'Dossier complet · Cette formation est prête pour l\'audit.',
			daysUntilNext: null
		};
	}

	const phases = ['conception', 'deploiement', 'evaluation'] as const;
	for (const phase of phases) {
		const phaseActions = ctx.actions.filter((a) => a.phase === phase);
		const phaseComplete = phaseActions.length > 0 && phaseActions.every((a) => a.status === 'Terminé');
		const nextPhaseActions = ctx.actions.filter((a) => a.phase !== phase && a.status !== 'Terminé');
		if (phaseComplete && nextPhaseActions.length > 0) {
			const phaseLabels = { conception: 'Conception', deploiement: 'Déploiement', evaluation: 'Évaluation' };
			const dateDebut = ctx.formation.dateDebut ? new Date(ctx.formation.dateDebut) : null;
			if (phase === 'conception' && dateDebut) {
				const daysUntil = Math.floor((dateDebut.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
				if (daysUntil > 0) {
					return {
						type: 'phase_complete',
						message: `${phaseLabels[phase]} complète · Formation dans ${daysUntil} jours · Vous pouvez souffler.`,
						daysUntilNext: daysUntil
					};
				}
			}
		}
	}

	const hasLockedOnly = ctx.actions.some(
		(a) => a.status !== 'Terminé' && getQuestDisplayState(a, ctx.actions) !== 'actionable'
	);
	if (hasLockedOnly) {
		const nextDueDate = findNextActionableDueDate(ctx);
		const daysUntilNext = nextDueDate
			? Math.floor((nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
			: null;
		return {
			type: 'phase_complete',
			message: daysUntilNext !== null && daysUntilNext > 0
				? `Tout est en ordre · Prochaine étape dans ${daysUntilNext} jours · Vous pouvez souffler.`
				: 'Tout est en ordre · Vous pouvez souffler.',
			daysUntilNext
		};
	}

	return null;
}

function findNextActionableDueDate(ctx: PriorityContext): Date | null {
	const quests = getQuestsForFormation(
		ctx.formation.type as 'Intra' | 'Inter' | 'CPF' | null | undefined,
		ctx.formation.typeFinancement as 'CPF' | 'OPCO' | 'Inter' | 'Intra' | null | undefined
	);
	const dueDates = calculateDueDates(quests, ctx.formation.dateDebut, ctx.formation.dateFin);
	const now = ctx.now ?? new Date();

	let earliest: Date | null = null;
	for (const action of ctx.actions) {
		if (action.status === 'Terminé') continue;
		const state = getQuestDisplayState(action, ctx.actions);
		if (state === 'hard_locked' || state === 'soft_locked') {
			const dd = action.questKey ? dueDates.get(action.questKey) : null;
			if (dd) {
				const d = new Date(dd);
				if (d > now && (!earliest || d < earliest)) {
					earliest = d;
				}
			}
		}
	}
	return earliest;
}
