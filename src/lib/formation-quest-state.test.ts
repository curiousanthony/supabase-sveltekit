import { describe, it, expect } from 'vitest';
import {
	getQuestDisplayState,
	categorizeByDisplayState,
	type QuestDisplayState,
	type SuiviActionRow
} from './formation-quest-state';

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

describe('getQuestDisplayState', () => {
	it('returns "completed" for a finished quest', () => {
		const action = makeAction({ status: 'Terminé', completedAt: '2026-03-01T00:00:00Z' });
		expect(getQuestDisplayState(action, [action])).toBe('completed');
	});

	it('returns "anticipated" for a quest completed with anticipatedAt set', () => {
		const action = makeAction({
			status: 'Terminé',
			completedAt: '2026-03-01T00:00:00Z',
			anticipatedAt: '2026-03-01T00:00:00Z'
		});
		expect(getQuestDisplayState(action, [action])).toBe('anticipated');
	});

	it('returns "waiting" when waitStartedAt is set and not completed', () => {
		const action = makeAction({
			status: 'En cours',
			waitStartedAt: '2026-03-01T00:00:00Z'
		});
		expect(getQuestDisplayState(action, [action])).toBe('waiting');
	});

	it('returns "actionable" when all dependencies are met', () => {
		const dep = makeAction({ id: 'dep-1', questKey: 'verification_infos', status: 'Terminé' });
		const quest = makeAction({ id: 'act-2', questKey: 'analyse_besoins', status: 'Pas commencé' });
		expect(getQuestDisplayState(quest, [dep, quest])).toBe('actionable');
	});

	it('returns "actionable" for quest with no dependencies', () => {
		const action = makeAction({ questKey: 'verification_infos', status: 'Pas commencé' });
		expect(getQuestDisplayState(action, [action])).toBe('actionable');
	});

	it('returns "soft_locked" when only soft deps are unmet', () => {
		const dep = makeAction({ id: 'dep-1', questKey: 'verification_infos', status: 'En cours' });
		const quest = makeAction({ id: 'act-2', questKey: 'analyse_besoins', status: 'Pas commencé' });
		expect(getQuestDisplayState(quest, [dep, quest])).toBe('soft_locked');
	});

	it('returns "hard_locked" when any hard dep is unmet', () => {
		const dep = makeAction({ id: 'dep-1', questKey: 'programme_modules', status: 'En cours' });
		const quest = makeAction({ id: 'act-2', questKey: 'devis', status: 'Pas commencé' });
		expect(getQuestDisplayState(quest, [dep, quest])).toBe('hard_locked');
	});

	it('returns "hard_locked" when mixed hard+soft deps are unmet', () => {
		const dep1 = makeAction({ id: 'd1', questKey: 'programme_modules', status: 'En cours' });
		const dep2 = makeAction({ id: 'd2', questKey: 'convention', status: 'En cours' });
		const dep3 = makeAction({ id: 'd3', questKey: 'preparation_logistique', status: 'En cours' });
		const quest = makeAction({ id: 'q', questKey: 'accueil_lancement', status: 'Pas commencé' });
		expect(getQuestDisplayState(quest, [dep1, dep2, dep3, quest])).toBe('hard_locked');
	});

	it('returns "actionable" when soft lock is overridden and no hard deps unmet', () => {
		const dep = makeAction({ id: 'dep-1', questKey: 'verification_infos', status: 'En cours' });
		const quest = makeAction({
			id: 'act-2',
			questKey: 'analyse_besoins',
			status: 'Pas commencé',
			softLockOverriddenAt: '2026-03-01T00:00:00Z'
		});
		expect(getQuestDisplayState(quest, [dep, quest])).toBe('actionable');
	});

	it('returns "hard_locked" even when soft lock is overridden but hard deps unmet', () => {
		const dep1 = makeAction({ id: 'd1', questKey: 'programme_modules', status: 'En cours' });
		const dep2 = makeAction({ id: 'd2', questKey: 'convention', status: 'En cours' });
		const dep3 = makeAction({ id: 'd3', questKey: 'preparation_logistique', status: 'En cours' });
		const quest = makeAction({
			id: 'q',
			questKey: 'accueil_lancement',
			status: 'Pas commencé',
			softLockOverriddenAt: '2026-03-01T00:00:00Z'
		});
		expect(getQuestDisplayState(quest, [dep1, dep2, dep3, quest])).toBe('hard_locked');
	});
});

describe('categorizeByDisplayState', () => {
	it('groups actions into the 4 Suivi sections', () => {
		const actions: SuiviActionRow[] = [
			makeAction({ id: '1', questKey: 'verification_infos', status: 'Terminé', completedAt: '2026-01-01' }),
			makeAction({ id: '2', questKey: 'analyse_besoins', status: 'En cours' }),
			makeAction({ id: '3', questKey: 'programme_modules', status: 'Pas commencé' }),
			makeAction({ id: '4', questKey: 'devis', status: 'Pas commencé' })
		];
		const formation = { type: null, typeFinancement: null, dateDebut: '2026-04-15', dateFin: '2026-04-20' };
		const result = categorizeByDisplayState(actions, formation);

		expect(result.actionable.length).toBeGreaterThan(0);
		expect(result.completed.length).toBe(1);
		expect(result.completed[0].action.questKey).toBe('verification_infos');
	});

	it('puts waiting quests in the waiting section', () => {
		const actions: SuiviActionRow[] = [
			makeAction({ id: '1', questKey: 'verification_infos', status: 'En cours', waitStartedAt: '2026-03-01' }),
			makeAction({ id: '2', questKey: 'analyse_besoins', status: 'Pas commencé' })
		];
		const formation = { type: null, typeFinancement: null, dateDebut: '2026-04-15', dateFin: '2026-04-20' };
		const result = categorizeByDisplayState(actions, formation);

		expect(result.waiting.length).toBe(1);
		expect(result.waiting[0].action.questKey).toBe('verification_infos');
	});

	it('separates soft-locked and hard-locked into locked section', () => {
		const actions: SuiviActionRow[] = [
			makeAction({ id: '1', questKey: 'verification_infos', status: 'Pas commencé' }),
			makeAction({ id: '2', questKey: 'analyse_besoins', status: 'Pas commencé' }),
			makeAction({ id: '3', questKey: 'programme_modules', status: 'Pas commencé' }),
			makeAction({ id: '4', questKey: 'devis', status: 'Pas commencé' })
		];
		const formation = { type: null, typeFinancement: null, dateDebut: '2026-04-15', dateFin: '2026-04-20' };
		const result = categorizeByDisplayState(actions, formation);

		expect(result.actionable.some(q => q.action.questKey === 'verification_infos')).toBe(true);
		expect(result.locked.some(q => q.displayState === 'soft_locked')).toBe(true);
		expect(result.locked.some(q => q.displayState === 'hard_locked')).toBe(true);
	});
});
