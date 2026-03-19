<script lang="ts">
	import type { PageProps } from './$types';
	import { deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { slide } from 'svelte/transition';
	import { cn } from '$lib/utils';
	import { PHASE_LABELS, getQuestTemplate, type QuestPhase } from '$lib/formation-quests';
	import { playMicroSound, playMediumSound, playMacroSound } from '$lib/sounds';
	import LevelUpToast from '$lib/components/formations/level-up-toast.svelte';
	import Check from '@lucide/svelte/icons/check';
	import Circle from '@lucide/svelte/icons/circle';
	import Lock from '@lucide/svelte/icons/lock';
	import Clock from '@lucide/svelte/icons/clock';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Calendar from '@lucide/svelte/icons/calendar';
	import User from '@lucide/svelte/icons/user';
	import X from '@lucide/svelte/icons/x';
	import Info from '@lucide/svelte/icons/info';

	let { data }: PageProps = $props();

	const formation = $derived(data?.formation);
	const actions = $derived(formation?.actions ?? []);

	let selectedQuestId = $state<string | null>(null);
	let collapsedPhases = $state<Record<string, boolean>>({});
	let levelUpPhase = $state<string | null>(null);
	let showLevelUp = $state(false);

	type ActionType = (typeof actions)[number];

	const phases: QuestPhase[] = ['conception', 'deploiement', 'evaluation'];

	const groupedByPhase = $derived(
		phases.map((phase) => ({
			phase,
			label: PHASE_LABELS[phase],
			actions: actions.filter((a) => a.phase === phase)
		}))
	);

	const phaseProgress = $derived(
		Object.fromEntries(
			groupedByPhase.map((g) => [
				g.phase,
				{
					completed: g.actions.filter((a) => a.status === 'Terminé').length,
					total: g.actions.length,
					allDone: g.actions.length > 0 && g.actions.every((a) => a.status === 'Terminé')
				}
			])
		) as Record<string, { completed: number; total: number; allDone: boolean }>
	);

	const selectedQuest = $derived(
		selectedQuestId ? actions.find((a) => a.id === selectedQuestId) ?? null : null
	);

	const selectedQuestTemplate = $derived(
		selectedQuest?.questKey ? getQuestTemplate(selectedQuest.questKey) : null
	);

	let prevPhaseCompletion = $state<Record<string, boolean>>({});

	$effect(() => {
		for (const phase of phases) {
			const current = phaseProgress[phase]?.allDone ?? false;
			const prev = prevPhaseCompletion[phase] ?? false;
			if (current && !prev) {
				levelUpPhase = PHASE_LABELS[phase];
				showLevelUp = true;
				playMacroSound();
			}
		}
		prevPhaseCompletion = Object.fromEntries(
			phases.map((p) => [p, phaseProgress[p]?.allDone ?? false])
		);
	});

	function isBlocked(action: ActionType): boolean {
		if (!action.blockedByActionId) return false;
		const blocker = actions.find((a) => a.id === action.blockedByActionId);
		return !!blocker && blocker.status !== 'Terminé';
	}

	function selectQuest(action: ActionType) {
		if (isBlocked(action)) return;
		selectedQuestId = action.id;
	}

	function togglePhase(phase: string) {
		collapsedPhases = { ...collapsedPhases, [phase]: !collapsedPhases[phase] };
	}

	async function callAction(actionName: string, body: FormData) {
		const response = await fetch(`?/${actionName}`, { method: 'POST', body });
		const result = deserialize(await response.text());
		if (result.type === 'success') {
			await invalidateAll();
		} else if (result.type === 'failure') {
			toast.error((result.data as { message?: string })?.message ?? 'Erreur');
		}
	}

	async function handleToggleSubAction(subActionId: string, completed: boolean) {
		playMicroSound();
		const formData = new FormData();
		formData.append('subActionId', subActionId);
		formData.append('completed', String(completed));
		await callAction('toggleSubAction', formData);
	}

	async function handleCompleteQuest(actionId: string) {
		playMediumSound();
		const formData = new FormData();
		formData.append('actionId', actionId);
		formData.append('newStatus', 'Terminé');
		await callAction('updateQuestStatus', formData);
		toast.success('Action terminée');
	}

	async function handleStartQuest(actionId: string) {
		const formData = new FormData();
		formData.append('actionId', actionId);
		formData.append('newStatus', 'En cours');
		await callAction('updateQuestStatus', formData);
	}

	async function handleDismissGuidance(actionId: string) {
		const formData = new FormData();
		formData.append('actionId', actionId);
		await callAction('dismissGuidance', formData);
	}

	function formatDate(dateStr: string | null | undefined): string {
		if (!dateStr) return '';
		return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
	}

	function isOverdue(dueDate: string | null | undefined): boolean {
		if (!dueDate) return false;
		return dueDate < new Date().toISOString().slice(0, 10);
	}

	const PHASE_COLORS: Record<string, string> = {
		conception: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
		deploiement: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
		evaluation: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
	};
</script>

<LevelUpToast phaseName={levelUpPhase ?? ''} show={showLevelUp} onClose={() => (showLevelUp = false)} />

<div class="flex h-full gap-0 md:gap-4">
	<!-- Left panel: Quest list -->
	<div
		class={cn(
			'flex w-full flex-col overflow-y-auto border-r md:w-80 md:shrink-0',
			selectedQuestId ? 'hidden md:flex' : 'flex'
		)}
	>
		{#each groupedByPhase as group}
			{@const progress = phaseProgress[group.phase]}
			{@const isCollapsed = collapsedPhases[group.phase] ?? false}
			<div class="border-b last:border-b-0">
				<!-- Phase header -->
				<button
					type="button"
					onclick={() => togglePhase(group.phase)}
					class={cn(
						'flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-muted/50',
						progress?.allDone && 'bg-muted/30'
					)}
				>
					<div class="flex items-center gap-2">
						{#if isCollapsed}
							<ChevronRight class="size-4 text-muted-foreground" />
						{:else}
							<ChevronDown class="size-4 text-muted-foreground" />
						{/if}
						<span class="text-sm font-semibold">{group.label}</span>
						{#if progress?.allDone}
							<Check class="size-3.5 text-primary" />
						{/if}
					</div>
					<span class="text-xs tabular-nums text-muted-foreground">
						{progress?.completed ?? 0}/{progress?.total ?? 0}
					</span>
				</button>

				{#if !isCollapsed}
					<div transition:slide={{ duration: 200 }} class="flex flex-col gap-0.5 px-1.5 pb-1.5">
						{#each group.actions as action}
							{@const blocked = isBlocked(action)}
							{@const isActive = selectedQuestId === action.id}
							<button
								type="button"
								onclick={() => selectQuest(action)}
								disabled={blocked}
								class={cn(
									'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors',
									isActive && 'bg-primary/10 ring-1 ring-primary/30',
									!isActive && !blocked && 'hover:bg-muted/50',
									blocked && 'cursor-not-allowed opacity-50'
								)}
							>
								<div class="shrink-0">
									{#if blocked}
										<Lock class="size-4 text-muted-foreground/50" />
									{:else if action.status === 'Terminé'}
										<div class="flex size-5 items-center justify-center rounded-full bg-primary/10">
											<Check class="size-3 text-primary" />
										</div>
									{:else if action.status === 'En cours'}
										<div class="flex size-5 items-center justify-center rounded-full bg-blue-500/10">
											<Clock class="size-3 text-blue-500" />
										</div>
									{:else}
										<div class="size-5 rounded-full border-2 border-muted-foreground/30"></div>
									{/if}
								</div>

								<div class="min-w-0 flex-1">
									<span
										class={cn(
											'block truncate text-sm',
											action.status === 'Terminé' && 'text-muted-foreground line-through'
										)}
									>
										{action.title}
									</span>
								</div>

								<div class="flex shrink-0 items-center gap-1">
									{#if action.dueDate && action.status !== 'Terminé'}
										<span
											class={cn(
												'text-[10px] tabular-nums',
												isOverdue(action.dueDate)
													? 'text-destructive'
													: 'text-muted-foreground'
											)}
										>
											{formatDate(action.dueDate)}
										</span>
									{/if}
									{#if action.assignee}
										{#if action.assignee.avatarUrl}
											<img
												src={action.assignee.avatarUrl}
												alt=""
												class="size-5 rounded-full"
											/>
										{:else}
											<div class="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
												{(action.assignee.firstName?.[0] ?? '') + (action.assignee.lastName?.[0] ?? '')}
											</div>
										{/if}
									{/if}
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/each}

		{#if actions.length === 0}
			<div class="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
				Aucune action n'a été créée pour cette formation.
			</div>
		{/if}
	</div>

	<!-- Right panel: Quest workspace -->
	<div
		class={cn(
			'flex flex-1 flex-col overflow-y-auto',
			!selectedQuestId ? 'hidden md:flex' : 'flex'
		)}
	>
		{#if selectedQuest}
			<!-- Mobile back button -->
			<button
				type="button"
				onclick={() => (selectedQuestId = null)}
				class="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground md:hidden"
			>
				<ChevronRight class="size-4 rotate-180" />
				Retour
			</button>

			<div class="flex flex-col gap-5 p-4 md:p-6">
				<!-- Title + phase badge -->
				<div class="flex flex-col gap-2">
					<div class="flex items-start justify-between gap-3">
						<h2 class="text-lg font-semibold leading-tight">{selectedQuest.title}</h2>
						{#if selectedQuest.phase}
							<span
								class={cn(
									'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
									PHASE_COLORS[selectedQuest.phase] ?? 'bg-muted text-muted-foreground'
								)}
							>
								{PHASE_LABELS[selectedQuest.phase as QuestPhase] ?? selectedQuest.phase}
							</span>
						{/if}
					</div>
					{#if selectedQuest.description}
						<p class="text-sm text-muted-foreground">{selectedQuest.description}</p>
					{/if}
				</div>

				<!-- Guidance -->
				{#if selectedQuestTemplate?.guidance && !selectedQuest.guidanceDismissed}
					<div class="flex gap-3 rounded-lg border border-blue-200 bg-blue-50/50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950/20">
						<Info class="mt-0.5 size-4 shrink-0 text-blue-500" />
						<div class="flex-1">
							<p class="text-sm text-blue-900 dark:text-blue-200">
								{selectedQuestTemplate.guidance}
							</p>
						</div>
						<button
							type="button"
							onclick={() => handleDismissGuidance(selectedQuest!.id)}
							class="shrink-0 rounded p-0.5 text-blue-400 transition-colors hover:text-blue-600"
							aria-label="Masquer"
						>
							<X class="size-3.5" />
						</button>
					</div>
				{/if}

				<!-- Meta: assignee & due date -->
				<div class="flex flex-wrap gap-4 text-sm">
					{#if selectedQuest.assignee}
						<div class="flex items-center gap-1.5 text-muted-foreground">
							<User class="size-3.5" />
							<span>
								{[selectedQuest.assignee.firstName, selectedQuest.assignee.lastName]
									.filter(Boolean)
									.join(' ') || 'Assigné'}
							</span>
						</div>
					{/if}
					{#if selectedQuest.dueDate}
						<div
							class={cn(
								'flex items-center gap-1.5',
								isOverdue(selectedQuest.dueDate) && selectedQuest.status !== 'Terminé'
									? 'text-destructive'
									: 'text-muted-foreground'
							)}
						>
							<Calendar class="size-3.5" />
							<span>{formatDate(selectedQuest.dueDate)}</span>
						</div>
					{/if}
					{#if selectedQuest.completedAt}
						<div class="flex items-center gap-1.5 text-muted-foreground">
							<Check class="size-3.5" />
							<span>
								Complétée le {new Date(selectedQuest.completedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
							</span>
						</div>
					{/if}
				</div>

				<!-- Sub-actions checklist -->
				{#if selectedQuest.subActions && selectedQuest.subActions.length > 0}
					<div class="flex flex-col gap-1">
						<span class="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Sous-tâches ({selectedQuest.subActions.filter((s) => s.completed).length}/{selectedQuest.subActions.length})
						</span>
						{#each selectedQuest.subActions as sub}
							<label
								class={cn(
									'flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted/50',
									sub.completed && 'opacity-60'
								)}
							>
								<input
									type="checkbox"
									checked={sub.completed}
									onchange={() => handleToggleSubAction(sub.id, !sub.completed)}
									class="size-4 shrink-0 rounded border-muted-foreground/30 accent-primary"
								/>
								<span
									class={cn(
										'text-sm',
										sub.completed && 'text-muted-foreground line-through'
									)}
								>
									{sub.title}
								</span>
							</label>
						{/each}
					</div>
				{/if}

				<!-- Action buttons -->
				{#if selectedQuest.status === 'Pas commencé' && !isBlocked(selectedQuest)}
					<button
						type="button"
						onclick={() => handleStartQuest(selectedQuest!.id)}
						class="inline-flex w-fit items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
					>
						<Clock class="size-4" />
						Commencer
					</button>
				{:else if selectedQuest.status === 'En cours'}
					<button
						type="button"
						onclick={() => handleCompleteQuest(selectedQuest!.id)}
						class="inline-flex w-fit items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
					>
						<Check class="size-4" />
						Marquer comme terminé
					</button>
				{/if}
			</div>
		{:else}
			<!-- Empty state -->
			<div class="flex flex-1 items-center justify-center p-6">
				<div class="text-center">
					<div class="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
						<Circle class="size-5 text-muted-foreground" />
					</div>
					<p class="text-sm text-muted-foreground">
						Sélectionnez une action pour voir ses détails
					</p>
				</div>
			</div>
		{/if}
	</div>
</div>
