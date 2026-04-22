# Suivi Tab & HUD Banner — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing "Actions" quest board with a read-mostly "Suivi" tab and a persistent HUD banner that acts as a GPS for formation compliance tasks.

**Architecture:** Three-phase build on a shared pure-function foundation. Phase 0 builds the priority engine and lock system as tested library code. Phase 1 refactors the Actions route into the new Suivi tab layout. Phase 2 adds the HUD banner to the formation detail layout. All UI follows the validated mockup at `docs/mockups/suivi-tab-mockup.html`.

**Tech Stack:** SvelteKit 5, Svelte 5 runes, shadcn-svelte, Tailwind CSS, Drizzle ORM, Supabase Postgres, Vitest (TDD for pure functions), vaul-svelte (mobile bottom sheets)

**Spec:** `docs/specs/formations/2026-03-24-suivi-tab-hud-banner-design.md`

---

## File Structure

### New files

| Path | Responsibility |
|------|---------------|
| `src/lib/formation-quest-locks.ts` | Static lock-type map (`'hard' \| 'soft'`) for every dependency pair |
| `src/lib/formation-quest-locks.test.ts` | Tests for lock map |
| `src/lib/formation-quest-state.ts` | `QuestDisplayState` type, `getQuestDisplayState()`, `categorizeByDisplayState()` |
| `src/lib/formation-quest-state.test.ts` | Tests for state categorization |
| `src/lib/formation-quest-priority.ts` | `getPrimaryAction()`, `getConcurrentActions()`, `computePriorityScore()` |
| `src/lib/formation-quest-priority.test.ts` | Tests for priority engine |
| `src/lib/components/formations/suivi/phase-card.svelte` | Single phase progress card |
| `src/lib/components/formations/suivi/quest-row.svelte` | Single quest row — adapts to all display states |
| `src/lib/components/formations/hud-banner.svelte` | Persistent HUD banner with 4 states |
| `supabase/migrations/XXXXXXXX_suivi_tab_columns.sql` | Add `wait_started_at`, `last_reminded_at`, `anticipated_at`, `soft_lock_overridden_at` to `formation_actions` |

### Modified files

| Path | What changes |
|------|-------------|
| `src/lib/db/schema/formations.ts` | Add 4 new nullable timestamp columns to `formationActions` table definition |
| `src/routes/(app)/formations/[id]/+layout.svelte` | Rename "Actions" tab to "Suivi" (`/suivi`), add HUD banner between tabs and content |
| `src/routes/(app)/formations/[id]/actions/` → `suivi/` | Rename route directory |
| `src/routes/(app)/formations/[id]/suivi/+page.svelte` | Rewrite: phase cards + 4-section quest list (replaces quest board) |
| `src/routes/(app)/formations/[id]/suivi/+page.server.ts` | Add form actions: `overrideSoftLock`, `markWaiting`, `recordReminder`, `clearWaiting` |
| `src/routes/(app)/formations/[id]/+page.svelte` | Update `goTo('actions')` → `goTo('suivi')`, href references |

---

## Phase 0 — Priority Engine & Lock System

### Task 1: Database migration — add Suivi columns

**Files:**
- Modify: `src/lib/db/schema/formations.ts:164-184`
- Create: `supabase/migrations/XXXXXXXX_suivi_tab_columns.sql`

- [ ] **Step 1: Add columns to Drizzle schema**

In `src/lib/db/schema/formations.ts`, add 4 columns to the `formationActions` table definition, after the existing `completedBy` column (line ~178):

```typescript
waitStartedAt: timestamp('wait_started_at', { withTimezone: true, mode: 'string' }),
lastRemindedAt: timestamp('last_reminded_at', { withTimezone: true, mode: 'string' }),
anticipatedAt: timestamp('anticipated_at', { withTimezone: true, mode: 'string' }),
softLockOverriddenAt: timestamp('soft_lock_overridden_at', { withTimezone: true, mode: 'string' }),
```

- [ ] **Step 2: Generate the SQL migration**

Follow the `supabase-database-migration` skill. Create the migration file:

```sql
-- Add Suivi tracking columns to formation_actions
ALTER TABLE formation_actions
  ADD COLUMN IF NOT EXISTS wait_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_reminded_at timestamptz,
  ADD COLUMN IF NOT EXISTS anticipated_at timestamptz,
  ADD COLUMN IF NOT EXISTS soft_lock_overridden_at timestamptz;
```

Use the migration skill's naming convention: `supabase migration new suivi_tab_columns`.

- [ ] **Step 3: Apply migration locally**

Run: `supabase db reset`
Expected: Migration applies cleanly, no errors.

- [ ] **Step 4: Regenerate Drizzle types**

Run: `bun run db:pull` (or equivalent introspection command if configured)
Verify the new columns appear in the generated types.

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/schema/formations.ts supabase/migrations/*suivi_tab_columns*
git commit -m "feat(db): add suivi tracking columns to formation_actions"
```

---

### Task 2: Lock classification map

**Files:**
- Create: `src/lib/formation-quest-locks.ts`
- Test: `src/lib/formation-quest-locks.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/formation-quest-locks.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { getDependencyLockType, DEPENDENCY_LOCK_TYPES } from './formation-quest-locks';

describe('DEPENDENCY_LOCK_TYPES', () => {
	it('contains entries for all dependency pairs from spec §2', () => {
		const expectedPairs = [
			['analyse_besoins', 'verification_infos', 'soft'],
			['programme_modules', 'verification_infos', 'soft'],
			['devis', 'programme_modules', 'hard'],
			['convention', 'devis', 'hard'],
			['demande_financement', 'convention', 'hard'],
			['accord_opco', 'demande_financement', 'hard'],
			['session_edof', 'convention', 'hard'],
			['convocations', 'convention', 'soft'],
			['reglement_interieur', 'convocations', 'soft'],
			['test_positionnement', 'analyse_besoins', 'soft'],
			['preparation_logistique', 'convention', 'soft'],
			['affectation_formateur', 'programme_modules', 'soft'],
			['ordre_mission', 'convention', 'soft'],
			['accueil_lancement', 'programme_modules', 'hard'],
			['accueil_lancement', 'convention', 'hard'],
			['accueil_lancement', 'preparation_logistique', 'hard'],
			['accueil_lancement', 'verification_infos', 'soft'],
			['accueil_lancement', 'convocations', 'soft'],
			['accueil_lancement', 'documents_formateur', 'soft'],
			['emargement', 'accueil_lancement', 'hard'],
			['animation_pedagogique', 'accueil_lancement', 'hard'],
			['evaluations_formatives', 'animation_pedagogique', 'hard'],
			['suivi_absences', 'emargement', 'hard'],
			['adaptation_formation', 'evaluations_formatives', 'hard'],
			['satisfaction_chaud', 'emargement', 'soft'],
			['evaluation_acquis_fin', 'evaluations_formatives', 'soft'],
			['certificat_realisation', 'emargement', 'hard'],
			['attestation', 'evaluation_acquis_fin', 'hard'],
			['attestation', 'certificat_realisation', 'soft'],
			['facturation', 'certificat_realisation', 'hard'],
			['justificatifs_opco', 'facturation', 'hard'],
			['satisfaction_froid', 'satisfaction_chaud', 'soft'],
			['evaluation_transfert', 'satisfaction_froid', 'soft'],
			['bilan_formateur', 'satisfaction_chaud', 'soft'],
			['amelioration_continue', 'satisfaction_chaud', 'hard'],
			['amelioration_continue', 'satisfaction_froid', 'soft'],
			['amelioration_continue', 'bilan_formateur', 'soft'],
			['cloture_archivage', 'satisfaction_chaud', 'hard'],
			['cloture_archivage', 'evaluation_acquis_fin', 'hard'],
			['cloture_archivage', 'certificat_realisation', 'hard'],
			['cloture_archivage', 'attestation', 'hard'],
			['cloture_archivage', 'facturation', 'hard'],
			['cloture_archivage', 'bilan_formateur', 'hard'],
			['cloture_archivage', 'amelioration_continue', 'hard']
		] as const;

		for (const [quest, dep, expectedType] of expectedPairs) {
			expect(
				DEPENDENCY_LOCK_TYPES[quest]?.[dep],
				`${quest} → ${dep} should be '${expectedType}'`
			).toBe(expectedType);
		}
	});
});

describe('getDependencyLockType', () => {
	it('returns the correct lock type for known pairs', () => {
		expect(getDependencyLockType('analyse_besoins', 'verification_infos')).toBe('soft');
		expect(getDependencyLockType('devis', 'programme_modules')).toBe('hard');
		expect(getDependencyLockType('convocations', 'convention')).toBe('soft');
	});

	it('defaults to hard for unknown dependency pairs', () => {
		expect(getDependencyLockType('unknown_quest', 'unknown_dep')).toBe('hard');
	});

	it('defaults to hard for known quest with unknown dep', () => {
		expect(getDependencyLockType('analyse_besoins', 'fake_dep')).toBe('hard');
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test -- src/lib/formation-quest-locks.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the lock map**

Create `src/lib/formation-quest-locks.ts`:

```typescript
export type LockType = 'hard' | 'soft';

export const DEPENDENCY_LOCK_TYPES: Record<string, Record<string, LockType>> = {
	analyse_besoins: { verification_infos: 'soft' },
	programme_modules: { verification_infos: 'soft' },
	devis: { programme_modules: 'hard' },
	convention: { devis: 'hard' },
	demande_financement: { convention: 'hard' },
	accord_opco: { demande_financement: 'hard' },
	session_edof: { convention: 'hard' },
	convocations: { convention: 'soft' },
	reglement_interieur: { convocations: 'soft' },
	test_positionnement: { analyse_besoins: 'soft' },
	preparation_logistique: { convention: 'soft' },
	affectation_formateur: { programme_modules: 'soft' },
	ordre_mission: { convention: 'soft' },
	accueil_lancement: {
		programme_modules: 'hard',
		convention: 'hard',
		preparation_logistique: 'hard',
		verification_infos: 'soft',
		convocations: 'soft',
		documents_formateur: 'soft'
	},
	emargement: { accueil_lancement: 'hard' },
	animation_pedagogique: { accueil_lancement: 'hard' },
	evaluations_formatives: { animation_pedagogique: 'hard' },
	suivi_absences: { emargement: 'hard' },
	adaptation_formation: { evaluations_formatives: 'hard' },
	satisfaction_chaud: { emargement: 'soft' },
	evaluation_acquis_fin: { evaluations_formatives: 'soft' },
	certificat_realisation: { emargement: 'hard' },
	attestation: { evaluation_acquis_fin: 'hard', certificat_realisation: 'soft' },
	facturation: { certificat_realisation: 'hard' },
	justificatifs_opco: { facturation: 'hard' },
	satisfaction_froid: { satisfaction_chaud: 'soft' },
	evaluation_transfert: { satisfaction_froid: 'soft' },
	bilan_formateur: { satisfaction_chaud: 'soft' },
	amelioration_continue: {
		satisfaction_chaud: 'hard',
		satisfaction_froid: 'soft',
		bilan_formateur: 'soft'
	},
	cloture_archivage: {
		satisfaction_chaud: 'hard',
		evaluation_acquis_fin: 'hard',
		certificat_realisation: 'hard',
		attestation: 'hard',
		facturation: 'hard',
		bilan_formateur: 'hard',
		amelioration_continue: 'hard'
	}
};

export function getDependencyLockType(questKey: string, depKey: string): LockType {
	return DEPENDENCY_LOCK_TYPES[questKey]?.[depKey] ?? 'hard';
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test -- src/lib/formation-quest-locks.test.ts`
Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/formation-quest-locks.ts src/lib/formation-quest-locks.test.ts
git commit -m "feat(suivi): add dependency lock type classification map"
```

---

### Task 3: Quest display state categorization

**Files:**
- Create: `src/lib/formation-quest-state.ts`
- Test: `src/lib/formation-quest-state.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/formation-quest-state.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test -- src/lib/formation-quest-state.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement quest display state**

Create `src/lib/formation-quest-state.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test -- src/lib/formation-quest-state.test.ts`
Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/formation-quest-state.ts src/lib/formation-quest-state.test.ts
git commit -m "feat(suivi): add quest display state categorization with lock awareness"
```

---

### Task 4: Priority engine

**Files:**
- Create: `src/lib/formation-quest-priority.ts`
- Test: `src/lib/formation-quest-priority.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/formation-quest-priority.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import {
	computePriorityScore,
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test -- src/lib/formation-quest-priority.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the priority engine**

Create `src/lib/formation-quest-priority.ts`:

```typescript
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

	// Level 1: Overdue (0 = overdue, 100_000 = not overdue)
	score += isOverdue ? 0 : 100_000;

	// Level 2: Qualiopi criticality (0 = critical, 10_000 = not)
	score += template.criticalForQualiopi ? 0 : 10_000;

	// Level 3: Dependency fan-out (inverted — higher fan-out = lower score)
	const fanOut = allTemplates.filter((t) =>
		t.dependencies.includes(action.questKey ?? '')
	).length;
	score += (20 - Math.min(fanOut, 20)) * 100;

	// Level 4: Deadline proximity (closer = lower score)
	if (daysUntilDue !== null) {
		score += Math.max(0, daysUntilDue + 365);
	} else {
		score += 500;
	}

	// Level 5: Phase order as final tiebreaker
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
			return {
				action,
				template,
				priorityScore,
				dueDate,
				isOverdue: daysUntilDue !== null && daysUntilDue < 0
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
			return {
				action,
				template,
				priorityScore,
				dueDate,
				isOverdue: daysUntilDue !== null && daysUntilDue < 0
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test -- src/lib/formation-quest-priority.test.ts`
Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/formation-quest-priority.ts src/lib/formation-quest-priority.test.ts
git commit -m "feat(suivi): add priority engine with 5-level cascade for HUD banner"
```

---

## Phase 1 — Suivi Tab Refactor

### Task 5: Update layout server query to include new columns

**Files:**
- Modify: `src/routes/(app)/formations/[id]/+layout.server.ts:36-49`

The layout server query uses **explicit column selection** for `actions`. The new Suivi columns must be added or the HUD banner and Suivi tab will not receive the data.

- [ ] **Step 1: Add new columns to the actions query**

In `src/routes/(app)/formations/[id]/+layout.server.ts`, find the `actions.columns` object (around lines 36–49) and add:

```typescript
actions: {
	columns: {
		id: true,
		title: true,
		description: true,
		status: true,
		etape: true,
		phase: true,
		questKey: true,
		assigneeId: true,
		guidanceDismissed: true,
		dueDate: true,
		completedAt: true,
		blockedByActionId: true,
		orderIndex: true,
		waitStartedAt: true,
		lastRemindedAt: true,
		anticipatedAt: true,
		softLockOverriddenAt: true
	},
	// ... rest unchanged
```

- [ ] **Step 2: Verify the query works**

Run: `bun run dev --host`
Navigate to a formation. Open browser console. Verify no errors loading formation data. The new fields should appear as `null` on existing actions.

- [ ] **Step 3: Commit**

```bash
git add src/routes/\(app\)/formations/\[id\]/+layout.server.ts
git commit -m "feat(suivi): include new timestamp columns in layout server query"
```

---

### Task 6: Rename route from `/actions` to `/suivi`

**Files:**
- Rename: `src/routes/(app)/formations/[id]/actions/` → `src/routes/(app)/formations/[id]/suivi/`
- Modify: `src/routes/(app)/formations/[id]/+layout.svelte:27`
- Modify: `src/routes/(app)/formations/[id]/+page.svelte:155-236`

- [ ] **Step 1: Rename the route directory**

```bash
cd src/routes/\(app\)/formations/\[id\]
git mv actions suivi
```

- [ ] **Step 2: Update tab href and label in layout**

In `src/routes/(app)/formations/[id]/+layout.svelte`, change line 27 from:

```typescript
{ href: basePath + '/actions', label: 'Actions', icon: Target, dot: overdueQuests || undefined },
```

to:

```typescript
{ href: basePath + '/suivi', label: 'Suivi', icon: Target, dot: overdueQuests || undefined },
```

- [ ] **Step 3: Update overview page navigation references**

In `src/routes/(app)/formations/[id]/+page.svelte`, replace all `goTo('actions')` with `goTo('suivi')` and update the href on line 213:

```typescript
href="/formations/{formationId}/suivi{nextQuest.questKey ? `?quest=${nextQuest.questKey}` : ''}"
```

Also update the button label on line 188-191 ("Voir le suivi" already says "suivi" — verify and keep).

- [ ] **Step 4: Search for any other `/actions` references and update**

Run: `rg "actions" --type svelte -l` in the formations directory to find any other references. Update any remaining hardcoded `/actions` paths to `/suivi`.

- [ ] **Step 5: Verify the route works**

Run: `bun run dev --host`
Navigate to a formation detail page. Verify the "Suivi" tab appears and links to `/formations/[id]/suivi`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(formations): rename Actions route to Suivi"
```

---

### Task 7: Update server dependency validation + add Suivi form actions

**Files:**
- Modify: `src/routes/(app)/formations/[id]/suivi/+page.server.ts`

The existing `updateQuestStatus` form action (lines ~127-144) blocks **all** unmet dependencies, making soft-lock overrides impossible even when `softLockOverriddenAt` is set. It must be updated to use the lock map and allow soft-overridden dependencies. Additionally, when marking a quest "Terminé" while soft deps are still unmet (via override), the server must set `anticipatedAt`.

- [ ] **Step 1: Update `updateQuestStatus` dependency check to use lock types**

In `suivi/+page.server.ts`, add the import:

```typescript
import { getDependencyLockType } from '$lib/formation-quest-locks';
```

Then replace the dependency check block (the `for (const depKey of template.dependencies)` loop, ~lines 127-144) with:

```typescript
if (
	currentAction?.questKey &&
	(newStatus === 'En cours' || newStatus === 'Terminé') &&
	!isReopening
) {
	const template = getQuestTemplate(currentAction.questKey);
	if (template && template.dependencies.length > 0) {
		const siblingActions = await db.query.formationActions.findMany({
			where: eq(formationActions.formationId, currentAction.formationId),
			columns: { questKey: true, status: true, title: true, softLockOverriddenAt: true }
		});

		const currentSibling = siblingActions.find((a) => a.questKey === currentAction.questKey);
		const isSoftLockOverridden = !!currentSibling?.softLockOverriddenAt;

		for (const depKey of template.dependencies) {
			const dep = siblingActions.find((a) => a.questKey === depKey);
			if (dep && dep.status !== 'Terminé') {
				const lockType = getDependencyLockType(currentAction.questKey, depKey);
				if (lockType === 'hard') {
					return fail(400, { message: `Prérequis non terminé : ${dep.title}` });
				}
				if (lockType === 'soft' && !isSoftLockOverridden) {
					return fail(400, { message: `Prérequis non terminé : ${dep.title}` });
				}
			}
		}
	}
}
```

- [ ] **Step 2: Set `anticipatedAt` when completing a soft-overridden quest**

In the same `updateQuestStatus` action, after the dependency check and before writing the status update, add logic to detect if the quest was completed "anticipated" (soft deps still unmet):

```typescript
let isAnticipated = false;
if (newStatus === 'Terminé' && currentAction?.questKey) {
	const template = getQuestTemplate(currentAction.questKey);
	if (template) {
		const siblingActions = await db.query.formationActions.findMany({
			where: eq(formationActions.formationId, currentAction.formationId),
			columns: { questKey: true, status: true, softLockOverriddenAt: true }
		});
		const currentSibling = siblingActions.find((a) => a.questKey === currentAction.questKey);
		if (currentSibling?.softLockOverriddenAt) {
			const hasUnmetSoftDep = template.dependencies.some((depKey) => {
				const dep = siblingActions.find((a) => a.questKey === depKey);
				const lockType = getDependencyLockType(currentAction.questKey!, depKey);
				return dep && dep.status !== 'Terminé' && lockType === 'soft';
			});
			if (hasUnmetSoftDep) isAnticipated = true;
		}
	}
}
```

Then in the `db.update()` call that sets `status: newStatus`, also include:

```typescript
.set({
	status: newStatus,
	completedAt: newStatus === 'Terminé' ? new Date().toISOString() : null,
	completedBy: newStatus === 'Terminé' ? user.id : null,
	anticipatedAt: isAnticipated ? new Date().toISOString() : undefined
})
```

(Use `undefined` to skip updating `anticipatedAt` when not anticipated — Drizzle ignores `undefined` fields in `.set()`.)

- [ ] **Step 3: Add `overrideSoftLock` form action**

Add to `export const actions: Actions`:

```typescript
overrideSoftLock: async ({ request, locals }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) return fail(401, { message: 'Non autorisé' });
	const formData = await request.formData();
	const actionId = formData.get('actionId')?.toString();
	if (!actionId || !UUID_RE.test(actionId)) return fail(400, { message: 'ID action invalide' });
	const action = await verifyActionOwnership(actionId, workspaceId);
	if (!action) return fail(404, { message: 'Action non trouvée' });

	await db
		.update(formationActions)
		.set({ softLockOverriddenAt: new Date().toISOString() })
		.where(eq(formationActions.id, actionId));

	return { success: true };
},
```

- [ ] **Step 4: Add `markWaiting`, `recordReminder`, `clearWaiting` form actions**

```typescript
markWaiting: async ({ request, locals }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) return fail(401, { message: 'Non autorisé' });
	const formData = await request.formData();
	const actionId = formData.get('actionId')?.toString();
	if (!actionId || !UUID_RE.test(actionId)) return fail(400, { message: 'ID action invalide' });
	const action = await verifyActionOwnership(actionId, workspaceId);
	if (!action) return fail(404, { message: 'Action non trouvée' });

	await db
		.update(formationActions)
		.set({ waitStartedAt: new Date().toISOString(), status: 'En cours' })
		.where(eq(formationActions.id, actionId));

	return { success: true };
},

recordReminder: async ({ request, locals }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) return fail(401, { message: 'Non autorisé' });
	const formData = await request.formData();
	const actionId = formData.get('actionId')?.toString();
	if (!actionId || !UUID_RE.test(actionId)) return fail(400, { message: 'ID action invalide' });
	const action = await verifyActionOwnership(actionId, workspaceId);
	if (!action) return fail(404, { message: 'Action non trouvée' });

	await db
		.update(formationActions)
		.set({ lastRemindedAt: new Date().toISOString() })
		.where(eq(formationActions.id, actionId));

	return { success: true };
},

clearWaiting: async ({ request, locals }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) return fail(401, { message: 'Non autorisé' });
	const formData = await request.formData();
	const actionId = formData.get('actionId')?.toString();
	if (!actionId || !UUID_RE.test(actionId)) return fail(400, { message: 'ID action invalide' });
	const action = await verifyActionOwnership(actionId, workspaceId);
	if (!action) return fail(404, { message: 'Action non trouvée' });

	await db
		.update(formationActions)
		.set({ waitStartedAt: null })
		.where(eq(formationActions.id, actionId));

	return { success: true };
},
```

- [ ] **Step 5: Commit**

```bash
git add src/routes/\(app\)/formations/\[id\]/suivi/+page.server.ts
git commit -m "feat(suivi): update dependency validation for soft locks and add Suivi form actions"
```

---

### Task 8: Phase progress card component

**Files:**
- Create: `src/lib/components/formations/suivi/phase-card.svelte`

Use the `svelte-file-editor` subagent for this task.

- [ ] **Step 1: Create the phase-card component**

Props interface:

```typescript
interface Props {
	phase: 'conception' | 'deploiement' | 'evaluation';
	label: string;
	subtitle: string;
	dateRange: string;
	completed: number;
	total: number;
	isActive: boolean;
	isDone: boolean;
	countdownText: string | null;
	tooltipText: string;
}
```

Design (from validated mockup):
- Card with rounded corners, subtle border
- Phase name (bold) + info icon with tooltip
- Subtitle in muted text
- Date range
- Progress: "{completed} / {total} étapes" with progress bar
- Progress bar colors: amber for active, green for done, gray for future
- Countdown text below progress bar (muted)
- On mobile (< 640px): cards stack vertically

Use shadcn-svelte `Card`, `Tooltip` components. The progress bar is a simple `div` with `bg-amber-500` / `bg-green-500` / `bg-gray-300` and percentage width.

- [ ] **Step 2: Browser-verify the component renders correctly**

Create a temporary test in the Suivi page or use the playground pattern to render 3 phase cards.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/formations/suivi/phase-card.svelte
git commit -m "feat(suivi): add phase progress card component"
```

---

### Task 9: Quest row component

**Files:**
- Create: `src/lib/components/formations/suivi/quest-row.svelte`

Use the `svelte-file-editor` subagent for this task.

- [ ] **Step 1: Create the quest-row component**

Props interface:

```typescript
interface Props {
	questKey: string;
	title: string;
	displayState: QuestDisplayState;
	dueDate: string | null;
	completedAt: string | null;
	waitStartedAt: string | null;
	lastRemindedAt: string | null;
	unmetDeps: { key: string; title: string; lockType: 'hard' | 'soft' }[];
	targetTab: string | null;
	onOverrideSoftLock?: () => void;
	onRemind?: () => void;
}
```

Design (from validated mockup, spec §5):
- CSS Grid: `grid-cols-[1fr_auto_auto]` for title, badge, CTA alignment
- Left border accent (3px): amber (actionable), blue (waiting), gray (locked), green (completed)
- Dimmed row for locked states (opacity-60)

**Per display state:**

| State | Badge | Right content |
|-------|-------|--------------|
| `actionable` | "À faire" amber pill | Tab CTA button (bordered pill) |
| `waiting` | "En attente" blue pill | "Relancé il y a X jours" + "Relancer" blue outlined pill |
| `soft_locked` | none | Explanatory text + "Anticiper cette étape" link |
| `hard_locked` | "🔒 Verrouillé" gray pill with tooltip | none |
| `completed` | "✓ Complété" green pill | Completion date |
| `anticipated` | "✓ Anticipé" green pill | Completion date |

The tooltip for hard-locked shows: "Cette étape sera disponible après [dep name]."

The "Anticiper cette étape" link calls `onOverrideSoftLock()`.

The tab CTA navigates to `?quest={questKey}` on the target tab. Determine target tab from the quest template's `inlineType` and `subActions`:

```typescript
function getTargetTab(questKey: string): string | null {
	const tabMap: Record<string, string> = {
		verification_infos: 'fiche',
		analyse_besoins: 'apprenants',
		programme_modules: 'programme',
		affectation_formateur: 'formateurs',
		convocations: 'apprenants',
		preparation_logistique: 'fiche',
		emargement: 'seances',
		documents_formateur: 'formateurs',
		facturation: 'finances',
		// ... more mappings
	};
	return tabMap[questKey] ?? 'suivi';
}
```

On mobile (< 640px): grid columns stack vertically.

- [ ] **Step 2: Browser-verify the component renders correctly for all states**

Render sample rows with each display state.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/formations/suivi/quest-row.svelte
git commit -m "feat(suivi): add quest row component with all display states"
```

---

### Task 10: Rewrite Suivi page

**Files:**
- Modify: `src/routes/(app)/formations/[id]/suivi/+page.svelte`

Use the `svelte-file-editor` subagent for this task.

- [ ] **Step 1: Rewrite the page with new imports and data flow**

Replace the entire `+page.svelte` content. The page should:

1. Import `categorizeByDisplayState` from `$lib/formation-quest-state`
2. Import `PhaseCard` and `QuestRow` components
3. Import `PHASE_LABELS` and `getQuestProgress` from `$lib/formation-quests`
4. Compute phase progress from `data.formation.actions`
5. Compute `categorized` using `categorizeByDisplayState(actions, formation)`

Structure:

```svelte
<script lang="ts">
	import type { PageProps } from './$types';
	import { deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { PHASE_LABELS, type QuestPhase, getQuestProgress } from '$lib/formation-quests';
	import { categorizeByDisplayState } from '$lib/formation-quest-state';
	import { playMicroSound, playMediumSound, playMacroSound } from '$lib/sounds';
	import PhaseCard from '$lib/components/formations/suivi/phase-card.svelte';
	import QuestRow from '$lib/components/formations/suivi/quest-row.svelte';
	import LevelUpToast from '$lib/components/formations/level-up-toast.svelte';

	let { data }: PageProps = $props();
	const formation = $derived(data?.formation);
	const actions = $derived(formation?.actions ?? []);
	const categorized = $derived(categorizeByDisplayState(actions, formation));
	const progress = $derived(getQuestProgress(actions));

	let showAllEvalSteps = $state(false);

	// ... callAction, celebration logic (keep from existing page) ...
</script>

<div class="mx-auto flex max-w-3xl flex-col gap-6">
	<!-- Phase Progress Cards -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		{#each ['conception', 'deploiement', 'evaluation'] as phase}
			<PhaseCard
				{phase}
				label={PHASE_LABELS[phase]}
				subtitle={...}
				dateRange={...}
				completed={progress.phases[phase].completed}
				total={progress.phases[phase].total}
				isActive={...}
				isDone={...}
				countdownText={...}
				tooltipText={...}
			/>
		{/each}
	</div>

	<!-- Section 1: En cours / À faire -->
	{#if categorized.actionable.length > 0}
		<section>
			<h2 class="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
				En cours / À faire
			</h2>
			<div class="flex flex-col gap-2">
				{#each categorized.actionable as quest}
					<QuestRow
						questKey={quest.action.questKey}
						title={quest.template.title}
						displayState={quest.displayState}
						dueDate={quest.dueDate}
						completedAt={quest.action.completedAt}
						waitStartedAt={quest.action.waitStartedAt}
						lastRemindedAt={quest.action.lastRemindedAt}
						unmetDeps={quest.unmetDeps}
						targetTab={getTargetTab(quest.action.questKey)}
					/>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Section 2: En attente -->
	{#if categorized.waiting.length > 0}
		<section>
			<h2 class="...">En attente</h2>
			<div class="flex flex-col gap-2">
				{#each categorized.waiting as quest}
					<QuestRow ... onRemind={() => handleReminder(quest.action.id)} />
				{/each}
			</div>
		</section>
	{/if}

	<!-- Section 3: À venir -->
	{#if categorized.locked.length > 0}
		<section>
			<h2 class="...">À venir</h2>
			<div class="flex flex-col gap-2">
				{@const evalLocked = categorized.locked.filter(q => q.action.phase === 'evaluation' && q.displayState === 'hard_locked')}
				{@const nonEvalLocked = categorized.locked.filter(q => !(q.action.phase === 'evaluation' && q.displayState === 'hard_locked'))}

				{#each nonEvalLocked as quest}
					<QuestRow
						...
						onOverrideSoftLock={quest.displayState === 'soft_locked'
							? () => handleOverrideSoftLock(quest.action.id)
							: undefined}
					/>
				{/each}

				<!-- Collapsed group for hard-locked evaluation quests (spec §5) -->
				{#if evalLocked.length > 3}
					<button
						type="button"
						class="w-full rounded-lg border border-dashed border-muted-foreground/20 px-4 py-2.5 text-left text-sm text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer"
						onclick={() => showAllEvalSteps = !showAllEvalSteps}
					>
						{#if showAllEvalSteps}
							Masquer les étapes d'évaluation
						{:else}
							+ {evalLocked.length} étapes d'évaluation (après la formation)
						{/if}
					</button>
					{#if showAllEvalSteps}
						{#each evalLocked as quest}
							<QuestRow ... />
						{/each}
					{/if}
				{:else}
					{#each evalLocked as quest}
						<QuestRow ... />
					{/each}
				{/if}
			</div>
		</section>
	{/if}

	<!-- Section 4: Historique -->
	{#if categorized.completed.length > 0}
		<section>
			<h2 class="...">Historique</h2>
			<div class="flex flex-col gap-2">
				{#each categorized.completed as quest}
					<QuestRow ... />
				{/each}
			</div>
		</section>
	{/if}
</div>

<LevelUpToast ... />
```

Implement `handleOverrideSoftLock(actionId)` and `handleReminder(actionId)` using `callAction()` pattern from the existing page.

- [ ] **Step 2: Browser-verify the Suivi page renders correctly**

Navigate to a formation's Suivi tab. Verify:
- Phase cards render with correct data
- All 4 sections appear with appropriate quests
- Soft-locked quests show "Anticiper cette étape" link
- Hard-locked quests show lock badge with tooltip
- Completed quests appear in Historique

- [ ] **Step 3: Test soft lock override**

Click "Anticiper cette étape" on a soft-locked quest. Verify:
- Quest moves to "En cours / À faire" section
- No page reload needed (invalidateAll refreshes data)
- Override persists after page reload

- [ ] **Step 4: Commit**

```bash
git add src/routes/\(app\)/formations/\[id\]/suivi/+page.svelte
git commit -m "feat(suivi): rewrite Suivi page with 4-section categorized layout"
```

---

## Phase 2 — HUD Banner

### Task 11: HUD banner component

**Files:**
- Create: `src/lib/components/formations/hud-banner.svelte`

Use the `svelte-file-editor` subagent for this task.

- [ ] **Step 1: Create the HUD banner component**

Props interface:

```typescript
import type { HudBannerState } from '$lib/formation-quest-priority';
import type { QuestPhase } from '$lib/formation-quests';

interface Props {
	state: HudBannerState;
	formationId: string;
	onRemind?: (actionId: string) => void;
}
```

Design (from spec §4 and validated mockup):
- Fixed height ~52px, persistent strip
- Left border 4px color accent: amber (State 1/2), blue (State 3), green (State 4)
- Background: white (`bg-background`)
- Layout: `flex items-center gap-3 px-4 py-3`

**State 1 — Single action:**
```html
<div class="...">
	<Badge variant="secondary">{phaseName}</Badge>
	<span class="text-sm">{message}</span>
	<a href="/formations/{id}/{tab}?quest={key}" class="btn-pill">{tabName}</a>
</div>
```

For overdue items, replace message with "À régulariser" copy.

**State 2 — Concurrent actions:**
Same as State 1 plus a "+N autres" chip that opens a `Popover` (shadcn-svelte `Popover`).

Popover content:
```html
<div class="flex flex-col gap-2 p-3">
	{#each others as quest}
		<div class="flex items-center justify-between gap-4">
			<span class="text-sm">{quest.template.title}</span>
			<a href="..." class="btn-pill text-xs">{tabName}</a>
		</div>
	{/each}
	<p class="text-xs text-muted-foreground border-t pt-2 mt-1">
		Ces actions peuvent se faire dans l'ordre de votre choix.
	</p>
</div>
```

On mobile (< 640px): use vaul-svelte `Drawer` instead of `Popover`.

**State 3 — Waiting:**
```html
<div class="...border-l-blue-500">
	<Badge variant="secondary">{phaseName}</Badge>
	<span>⏳ En attente de {description} · {elapsedText}</span>
	<button class="btn-pill-outline-blue" onclick={onRemind}>Relancer</button>
</div>
```

Where `elapsedText` is "Relancé il y a X jours" or "Aucune relance depuis X jours".

**State 4 — Phase complete:**
```html
<div class="...border-l-green-500">
	<span>✓ {message}</span>
</div>
```

**Null state:** Banner is hidden entirely (`{#if state}` wrapper).

- [ ] **Step 2: Browser-verify the banner renders for all 4 states**

Test with different formation states. Verify:
- State 1: single action with CTA
- State 2: concurrent actions with popover
- State 3: waiting with elapsed time
- State 4: green completion message

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/formations/hud-banner.svelte
git commit -m "feat(suivi): add HUD banner component with 4 states"
```

---

### Task 12: Integrate HUD banner into formation layout

**Files:**
- Modify: `src/routes/(app)/formations/[id]/+layout.svelte`

- [ ] **Step 1: Add HUD banner to layout**

In `+layout.svelte`, import and render the HUD banner between `<NavTabs>` and `{@render children()}`:

```svelte
<script lang="ts">
	// ... existing imports ...
	import HudBanner from '$lib/components/formations/hud-banner.svelte';
	import { getHudBannerState } from '$lib/formation-quest-priority';

	let { data, children }: LayoutProps = $props();

	const formation = $derived(data?.formation);
	const actions = $derived(formation?.actions ?? []);
	const formationId = $derived(formation?.id ?? '');

	const hudState = $derived(
		getHudBannerState({
			actions: actions,
			formation: {
				type: formation?.type,
				typeFinancement: formation?.typeFinancement,
				dateDebut: formation?.dateDebut,
				dateFin: formation?.dateFin
			}
		})
	);

	// ... rest of existing code ...
</script>

<div class="flex min-h-0 w-full flex-1 flex-col gap-4">
	<NavTabs {tabs} ariaLabel="Formation sections" />
	<HudBanner state={hudState} {formationId} />
	{@render children()}
</div>
```

Note: The `actions` data from the layout server load may need the new timestamp columns. Verify that the Drizzle query in `+layout.server.ts` includes them (it should, since it uses `with: { actions: true }` which fetches all columns).

- [ ] **Step 2: Browser-verify the banner appears on all tabs**

Navigate through multiple formation tabs. Verify:
- Banner appears on every tab
- Banner content does not change when switching tabs
- Banner CTA navigates to the correct tab

- [ ] **Step 3: Test the "+N autres" popover on desktop**

Trigger a formation state where multiple quests are actionable. Click the "+N autres" chip. Verify popover opens with correct content and footer copy.

- [ ] **Step 4: Commit**

```bash
git add src/routes/\(app\)/formations/\[id\]/+layout.svelte
git commit -m "feat(suivi): integrate HUD banner into formation layout"
```

---

### Task 13: Update overview page

**Files:**
- Modify: `src/routes/(app)/formations/[id]/+page.svelte`

- [ ] **Step 1: Update the "Next Action Hero Card" to use priority engine**

The overview page currently has a hero card showing the next quest. Update it to use `getPrimaryAction()` from the priority engine instead of the existing logic.

Import `getPrimaryAction` and compute the primary action from layout data. Update the hero card to use the same data and copy as the HUD banner for consistency.

Also verify that all `goTo('actions')` were already renamed to `goTo('suivi')` in Task 6.

- [ ] **Step 2: Browser-verify the overview page**

Navigate to a formation's overview page. Verify:
- Hero card shows the correct next action
- CTA links to `/formations/[id]/suivi`
- No stale `/actions` references remain

- [ ] **Step 3: Commit**

```bash
git add src/routes/\(app\)/formations/\[id\]/+page.svelte
git commit -m "refactor(formations): update overview hero card to use priority engine"
```

---

## Phase 3 — Polish

### Task 14: Celebration system

**Files:**
- Modify: `src/routes/(app)/formations/[id]/suivi/+page.svelte`
- Existing: `src/lib/sounds.ts`, `src/lib/components/formations/level-up-toast.svelte`

- [ ] **Step 1: Implement Tier 1 — Individual quest completion**

When a quest's status changes to "Terminé" (detected via `$effect` comparing previous and current actions):
- Play micro sound (`playMicroSound()`)
- Quest row animates: brief scale-up + border color transition to green (CSS transition, `transition: all 300ms ease`)

This is already partially implemented in the existing page. Verify and adapt the celebration triggers to work with the new `QuestRow` component.

- [ ] **Step 2: Implement Tier 2 — Phase completion**

When all quests in a phase become "Terminé" (same `$effect` pattern from existing page):
- Play medium sound (`playMediumSound()` — existing)
- Show `LevelUpToast` with phase name (already implemented)
- HUD banner smoothly transitions to green (CSS transition on border-color)

Verify the existing `LevelUpToast` and `$effect` pattern from the old page are preserved in the new Suivi page.

- [ ] **Step 3: Implement Tier 3 — Formation fully complete**

When `cloture_archivage` is marked "Terminé":
- Play macro sound (`playMacroSound()` — existing)
- Show a special `LevelUpToast` with copy: "Dossier complet · Cette formation est prête pour l'audit."

Add a check in the `$effect` for when all actions are "Terminé" and trigger the Tier 3 celebration.

- [ ] **Step 4: Browser-verify celebrations**

Complete a quest and verify:
- Tier 1: sound plays, row animates
- Tier 2: toast appears on phase completion
- Tier 3: special toast on full completion

- [ ] **Step 5: Commit**

```bash
git add src/routes/\(app\)/formations/\[id\]/suivi/+page.svelte
git commit -m "feat(suivi): implement tiered celebration system for quest/phase/formation completion"
```

---

## Final Verification

### Task 15: Build and type-check

- [ ] **Step 1: Run type checker**

Run: `bun run check`
Expected: No new type errors introduced (pre-existing errors are acceptable per AGENTS.md).

- [ ] **Step 2: Run full build**

Run: `bun run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Run all tests**

Run: `bun run test`
Expected: All tests pass (existing + new).

- [ ] **Step 4: Browser smoke test**

1. Navigate to a formation detail page
2. Verify HUD banner appears with correct state
3. Click the Suivi tab
4. Verify phase cards, 4 sections render correctly
5. Test soft lock override
6. Test tab CTA navigation (deep linking)
7. Verify back to overview page — hero card uses new data
8. Check browser console for JS errors (expect zero)
9. Check network tab for failed API calls (expect zero)

- [ ] **Step 5: Final commit (if any cleanup needed)**

```bash
git status
# Only commit if there are remaining changes
```

---

## Notes for the Implementer

1. **TDD is mandatory for Tasks 2-4.** Write the test, watch it fail, implement, watch it pass. No shortcuts.

2. **Use `svelte-file-editor` subagent for all Svelte component tasks** (Tasks 8-12). This ensures Svelte 5 rune syntax is correct and the MCP tools validate the components.

3. **The `formation-quest-urgency.ts` file is NOT deleted.** It continues to exist for backward compatibility (the `quest-board.svelte` component still uses `categorizeQuests`). If `quest-board.svelte` is no longer used after the Suivi refactor, both files can be removed in a follow-up cleanup task.

4. **The existing `quest-board.svelte` and `quest-card.svelte` are NOT modified or deleted.** The Suivi tab uses entirely new components. The old components may be useful for comparison during development and can be cleaned up later.

5. **Deep-linking (query param `?quest=...`):** The Suivi tab CTA buttons navigate to destination tabs with a `?quest=` query param. Implementing the scroll-to + pulse animation on destination tabs is a separate task (Phase 3 from the spec — out of scope for this plan). For now, just ensure the query param is passed correctly.

6. **Émargement edge case:** The spec says émargement only appears in the banner when a séance date has passed AND signatures are missing after 24h. This requires séance data that the priority engine doesn't currently have access to. For MVP, treat émargement like any other quest. The edge case can be added in a follow-up once the séance integration is specified.

7. **Bibliothèque dependency for `reglement_interieur`:** The spec says `reglement_interieur` auto-completes when the document is sent, contingent on the Bibliothèque feature. Since Bibliothèque doesn't exist yet, `reglement_interieur` uses the standard manual flow for now. No special handling needed in this plan.

8. **CRM integration for `documents_formateur`:** The spec says this quest's completion is derived from formateur profiles in the CRM. This requires CRM data integration which is out of scope for this plan. For now, `documents_formateur` uses the standard manual completion flow.

9. **Relancer → send-email integration:** The `recordReminder` form action only timestamps the reminder. Wiring it to the actual send-email flow (using `SendEmailConfig` and `reminderEmailType` from quest templates) is a follow-up. For MVP, "Relancer" records the timestamp and the user sends the email manually. The send-email infrastructure already exists in the codebase.

10. **Copy audit against spec §8:** After all UI components are built, do a final pass to ensure user-facing strings match the naming conventions table in spec §8 (e.g., "étape" not "tâche", "À régulariser" not "En retard", no ⚡ icon anywhere).
