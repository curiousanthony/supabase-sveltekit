<script lang="ts">
	import QuestCard from './quest-card.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { cn } from '$lib/utils';
	import { categorizeQuests } from '$lib/formation-quest-urgency';
	import {
		PHASE_LABELS,
		getBlockingInfo,
		type QuestPhase
	} from '$lib/formation-quests';
	import Flame from '@lucide/svelte/icons/flame';
	import CalendarClock from '@lucide/svelte/icons/calendar-clock';
	import Clock from '@lucide/svelte/icons/clock';
	import CheckCircle2 from '@lucide/svelte/icons/check-circle-2';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Lock from '@lucide/svelte/icons/lock';
	import { slide } from 'svelte/transition';

	interface SubAction {
		id: string;
		title: string;
		completed: boolean;
		orderIndex: number;
		inlineType?: string | null;
	}

	interface Action {
		id: string;
		questKey: string | null;
		status: 'Terminé' | 'En cours' | 'Pas commencé';
		phase: QuestPhase | null;
		title: string;
		dueDate: string | null;
		completedAt: string | null;
		updatedAt?: string | null;
		guidanceDismissed: boolean;
		subActions: SubAction[];
	}

	interface Props {
		actions: Action[];
		formation: {
			type?: string | null;
			typeFinancement?: string | null;
			dateDebut?: string | null;
			dateFin?: string | null;
		};
		onSubActionToggle: (subActionId: string, completed: boolean) => Promise<void>;
		onStatusChange: (actionId: string, newStatus: string) => Promise<void>;
		onDismissGuidance: (actionId: string) => Promise<void>;
	}

	let {
		actions,
		formation,
		onSubActionToggle,
		onStatusChange,
		onDismissGuidance
	}: Props = $props();

	const categorized = $derived(categorizeQuests(actions, formation));

	type ActionItem = (typeof categorized.maintenant)[number] & { action: Action };

	const totalActions = $derived(actions.length);
	const completedActions = $derived(actions.filter((a) => a.status === 'Terminé').length);

	const phases: QuestPhase[] = ['conception', 'deploiement', 'evaluation'];
	const phaseColors: Record<QuestPhase, string> = {
		conception: 'bg-blue-500',
		deploiement: 'bg-amber-500',
		evaluation: 'bg-green-500'
	};

	const phaseProgress = $derived(
		phases.map((p) => {
			const phaseActions = actions.filter((a) => a.phase === p);
			return {
				phase: p,
				label: PHASE_LABELS[p],
				completed: phaseActions.filter((a) => a.status === 'Terminé').length,
				total: phaseActions.length
			};
		})
	);

	let userSelectedId = $state<string | null | undefined>(undefined);
	let completedExpanded = $state(false);

	const expandedQuestId = $derived.by(() => {
		if (userSelectedId !== undefined) return userSelectedId;
		return categorized.maintenant.length > 0 ? categorized.maintenant[0].action.id : null;
	});

	function toggleQuest(id: string) {
		userSelectedId = expandedQuestId === id ? null : id;
	}
</script>

<div class="space-y-8">
	<!-- Lifecycle progress bar -->
	<div class="space-y-2">
		<div class="flex items-center justify-between">
			<span class="text-sm font-medium">{completedActions}/{totalActions} étapes</span>
			<span class="text-xs text-muted-foreground">
				{Math.round((completedActions / Math.max(totalActions, 1)) * 100)}%
			</span>
		</div>
		<div class="flex h-2 gap-0.5 overflow-hidden rounded-full bg-muted">
			{#each phaseProgress as pp (pp.phase)}
				<div
					class="flex flex-1 overflow-hidden rounded-sm"
					title="{pp.label}: {pp.completed}/{pp.total}"
				>
					<div
						class={cn('transition-all', phaseColors[pp.phase])}
						style="width: {pp.total > 0 ? (pp.completed / pp.total) * 100 : 0}%"
					></div>
				</div>
			{/each}
		</div>
		<div class="flex text-xs text-muted-foreground">
			{#each phaseProgress as pp (pp.phase)}
				<span class="flex-1 text-center">{pp.label}</span>
			{/each}
		</div>
	</div>

	<!-- Section 1: À faire maintenant -->
	{#if categorized.maintenant.length > 0}
		<section>
			<div class="mb-3 flex items-center gap-2">
				<Flame class="size-4 text-orange-500" />
				<h3 class="text-sm font-semibold">À faire maintenant</h3>
			</div>
			<div class="space-y-3">
				{#each categorized.maintenant as rawItem (rawItem.action.id)}
					{@const item = rawItem as ActionItem}
					<QuestCard
						action={item.action}
						template={item.template}
						urgencyScore={item.urgencyScore}
						dueDate={item.dueDate}
						expanded={expandedQuestId === item.action.id}
						onToggleExpand={() => toggleQuest(item.action.id)}
						{onSubActionToggle}
						{onStatusChange}
					/>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Section 2: Prochainement -->
	{#if categorized.prochainement.length > 0}
		<section>
			<div class="mb-3 flex items-center gap-2">
				<CalendarClock class="size-4 text-blue-500" />
				<h3 class="text-sm font-semibold">Prochainement</h3>
				<Badge variant="secondary" class="text-xs">{categorized.prochainement.length}</Badge>
			</div>
			<div class="space-y-3">
				{#each categorized.prochainement as rawItem (rawItem.action.id)}
					{@const item = rawItem as ActionItem}
					<QuestCard
						action={item.action}
						template={item.template}
						urgencyScore={item.urgencyScore}
						dueDate={item.dueDate}
						expanded={expandedQuestId === item.action.id}
						onToggleExpand={() => toggleQuest(item.action.id)}
						{onSubActionToggle}
						{onStatusChange}
					/>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Section 3: En attente -->
	{#if categorized.enAttente.length > 0}
		<section>
			<div class="mb-3 flex items-center gap-2">
				<Clock class="size-4 text-muted-foreground" />
				<h3 class="text-sm font-semibold">En attente</h3>
				<Badge variant="secondary" class="text-xs">{categorized.enAttente.length}</Badge>
			</div>
			<div class="space-y-2">
				{#each categorized.enAttente as rawItem (rawItem.action.id)}
					{@const item = rawItem as ActionItem}
					{@const blocking = getBlockingInfo(item.action, actions)}
					<div
						class="flex items-center justify-between rounded-lg border bg-card px-4 py-3 opacity-75"
					>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium text-foreground">{item.action.title}</p>
							<div class="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
								<Lock class="size-3.5" />
								<span>Bloqué par : {blocking.blockerNames.join(', ')}</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Section 4: Complétées -->
	{#if categorized.completes.length > 0}
		<section>
			<button
				type="button"
				class="mb-3 flex w-full items-center gap-2 text-left"
				onclick={() => (completedExpanded = !completedExpanded)}
			>
				{#if completedExpanded}
					<ChevronDown class="size-4 text-muted-foreground" />
				{:else}
					<ChevronRight class="size-4 text-muted-foreground" />
				{/if}
				<CheckCircle2 class="size-4 text-green-500" />
				<h3 class="text-sm font-semibold">Complétées</h3>
				<Badge variant="secondary" class="text-xs">{categorized.completes.length}</Badge>
			</button>

			{#if completedExpanded}
				<ul class="space-y-1 pl-6" transition:slide={{ duration: 200 }}>
					{#each categorized.completes as rawItem (rawItem.action.id)}
					{@const item = rawItem as ActionItem}
						<li class="flex items-center gap-2 py-1.5 text-sm text-muted-foreground">
							<CheckCircle2 class="size-3.5 text-green-500" />
							<span class="line-through">{item.action.title}</span>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	{/if}
</div>
