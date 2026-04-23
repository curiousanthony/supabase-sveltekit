import { describe, it, expect } from 'vitest';
import { civilDaysFromTodayUntilDue } from './formation-quests';
import {
	computePriorityScore,
	getDaysLateIfOverdue,
	getPrimaryAction,
	getConcurrentActions,
	type PriorityContext
} from './formation-quest-priority';
import type { SuiviActionRow } from './formation-quest-state';
import type { QuestTemplate } from './formation-quests';

function makeAction(overrides: Partial<SuiviActionRow> = {}): SuiviActionRow {
	return {
		id: 'act-1',
		questKey: 'verification_infos',
		status: 'Pas commencé',
		phase: 'conception',
		completedAt: null,
		waitStartedAt: null,
		lastRemindedAt: null,
		anticipatedAt: null,
		softLockOverriddenAt: null,
		...overrides
	};
}

function makeContext(overrides: Partial<PriorityContext> = {}): PriorityContext {
	return {
		actions: [],
		formation: { type: null, typeFinancement: null, dateDebut: '2026-04-15', dateFin: '2026-04-20' },
		now: new Date('2026-03-24'),
		...overrides
	};
}

describe('civil calendar due dates', () => {
	it('does not mark a future civil due date as overdue (regression: UTC vs local)', () => {
		const today = new Date(2026, 2, 24); // 24 Mar 2026 local
		const dueIn100Days = '2026-07-02'; // civil date ~100 days ahead
		expect(civilDaysFromTodayUntilDue(dueIn100Days, today)).toBeGreaterThan(0);
		expect(getDaysLateIfOverdue(dueIn100Days, today)).toBeNull();
	});

	it('marks past civil due dates as late', () => {
		const today = new Date(2026, 2, 24);
		expect(getDaysLateIfOverdue('2026-03-10', today)).toBe(14);
	});
});

describe('computePriorityScore', () => {
	it('overdue quests get highest priority (lowest score)', () => {
		const overdue = computePriorityScore(
			makeAction({ questKey: 'verification_infos' }),
			{ criticalForQualiopi: true, orderIndex: 0, dependencies: [] } as unknown as QuestTemplate,
			new Map([['verification_infos', '2026-03-20']]),
			new Date('2026-03-24'),
			[]
		);
		const notOverdue = computePriorityScore(
			makeAction({ questKey: 'analyse_besoins' }),
			{ criticalForQualiopi: true, orderIndex: 1, dependencies: [] } as unknown as QuestTemplate,
			new Map([['analyse_besoins', '2026-04-10']]),
			new Date('2026-03-24'),
			[]
		);
		expect(overdue).toBeLessThan(notOverdue);
	});

	it('qualiopi-critical quests rank above non-critical', () => {
		const critical = computePriorityScore(
			makeAction({ questKey: 'a' }),
			{ criticalForQualiopi: true, orderIndex: 0, dependencies: [] } as unknown as QuestTemplate,
			new Map(),
			new Date('2026-03-24'),
			[]
		);
		const nonCritical = computePriorityScore(
			makeAction({ questKey: 'b' }),
			{ criticalForQualiopi: false, orderIndex: 0, dependencies: [] } as unknown as QuestTemplate,
			new Map(),
			new Date('2026-03-24'),
			[]
		);
		expect(critical).toBeLessThan(nonCritical);
	});

	it('higher dependency fan-out ranks higher', () => {
		const highFanout = computePriorityScore(
			makeAction({ questKey: 'convention' }),
			{ criticalForQualiopi: false, orderIndex: 3, dependencies: ['devis'] } as unknown as QuestTemplate,
			new Map(),
			new Date('2026-03-24'),
			[
				{ key: 'demande_financement', dependencies: ['convention'] },
				{ key: 'convocations', dependencies: ['convention'] },
				{ key: 'preparation_logistique', dependencies: ['convention'] }
			] as QuestTemplate[]
		);
		const lowFanout = computePriorityScore(
			makeAction({ questKey: 'reglement_interieur' }),
			{ criticalForQualiopi: false, orderIndex: 8, dependencies: ['convocations'] } as unknown as QuestTemplate,
			new Map(),
			new Date('2026-03-24'),
			[{ key: 'dummy', dependencies: [] }] as QuestTemplate[]
		);
		expect(highFanout).toBeLessThan(lowFanout);
	});

	it('closer deadline ranks higher when other factors equal', () => {
		const soon = computePriorityScore(
			makeAction({ questKey: 'a' }),
			{ criticalForQualiopi: false, orderIndex: 0, dependencies: [] } as unknown as QuestTemplate,
			new Map([['a', '2026-03-30']]),
			new Date('2026-03-24'),
			[]
		);
		const later = computePriorityScore(
			makeAction({ questKey: 'b' }),
			{ criticalForQualiopi: false, orderIndex: 0, dependencies: [] } as unknown as QuestTemplate,
			new Map([['b', '2026-05-01']]),
			new Date('2026-03-24'),
			[]
		);
		expect(soon).toBeLessThan(later);
	});
});

describe('getPrimaryAction', () => {
	it('returns null when no actionable quests exist', () => {
		const ctx = makeContext({
			actions: [makeAction({ status: 'Terminé', completedAt: '2026-03-01' })]
		});
		expect(getPrimaryAction(ctx)).toBeNull();
	});

	it('returns the highest-priority actionable quest', () => {
		const ctx = makeContext({
			actions: [
				makeAction({ id: '1', questKey: 'verification_infos', status: 'Pas commencé' }),
				makeAction({ id: '2', questKey: 'analyse_besoins', status: 'Pas commencé' }),
				makeAction({ id: '3', questKey: 'programme_modules', status: 'Pas commencé' })
			]
		});
		const result = getPrimaryAction(ctx);
		expect(result).not.toBeNull();
		expect(result!.action.questKey).toBe('verification_infos');
	});
});

describe('getConcurrentActions', () => {
	it('returns up to 4 actionable quests sorted by priority', () => {
		const ctx = makeContext({
			actions: [
				makeAction({ id: '1', questKey: 'verification_infos', status: 'Pas commencé' }),
				makeAction({ id: '2', questKey: 'analyse_besoins', status: 'Pas commencé' }),
				makeAction({ id: '3', questKey: 'programme_modules', status: 'Pas commencé' })
			]
		});
		const result = getConcurrentActions(ctx);
		expect(result.length).toBeLessThanOrEqual(4);
		expect(result.length).toBeGreaterThan(0);
	});

	it('excludes waiting and locked quests', () => {
		const ctx = makeContext({
			actions: [
				makeAction({ id: '1', questKey: 'verification_infos', status: 'En cours', waitStartedAt: '2026-03-01' }),
				makeAction({ id: '2', questKey: 'analyse_besoins', status: 'Pas commencé' })
			]
		});
		const result = getConcurrentActions(ctx);
		expect(result.every(q => q.action.questKey !== 'verification_infos')).toBe(true);
	});
});
