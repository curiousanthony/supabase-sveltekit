<script lang="ts">
	import type { PageProps } from './$types';
	import { page } from '$app/stores';
	import { deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { untrack } from 'svelte';
	import { slide } from 'svelte/transition';
	import { cn } from '$lib/utils';
	import {
		PHASE_LABELS,
		getQuestTemplate,
		getBlockingInfo,
		type QuestPhase
	} from '$lib/formation-quests';
	import { playMicroSound, playMediumSound, playMacroSound } from '$lib/sounds';
	import LevelUpToast from '$lib/components/formations/level-up-toast.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
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
	import Upload from '@lucide/svelte/icons/upload';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';

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

	const selectedQuestBlocking = $derived(
		selectedQuest ? getBlockingInfo(selectedQuest, actions) : { blocked: false, blockerNames: [] }
	);

	const allSubActionsDone = $derived(
		selectedQuest?.subActions?.length
			? selectedQuest.subActions.every((s) => s.completed)
			: true
	);

	let prevPhaseCompletion = $state<Record<string, boolean>>({});

	$effect(() => {
		const currentCompletion = Object.fromEntries(
			phases.map((p) => [p, phaseProgress[p]?.allDone ?? false])
		);

		const prev = untrack(() => prevPhaseCompletion);

		for (const phase of phases) {
			if (currentCompletion[phase] && !prev[phase]) {
				levelUpPhase = PHASE_LABELS[phase];
				showLevelUp = true;
				playMacroSound();
			}
		}

		prevPhaseCompletion = currentCompletion;
	});

	$effect(() => {
		const questParam = $page.url.searchParams.get('quest');
		if (questParam && !selectedQuestId) {
			const match = actions.find((a) => a.questKey === questParam);
			if (match) {
				const blocking = getBlockingInfo(match, actions);
				if (!blocking.blocked) {
					selectedQuestId = match.id;
				}
			}
		}
	});

	function getQuestBlockingInfo(action: ActionType) {
		return getBlockingInfo(action, actions);
	}

	function selectQuest(action: ActionType) {
		const { blocked } = getQuestBlockingInfo(action);
		if (blocked) return;
		selectedQuestId = action.id;
	}

	function togglePhase(phase: string) {
		collapsedPhases = { ...collapsedPhases, [phase]: !collapsedPhases[phase] };
	}

	async function callAction(actionName: string, body: FormData) {
		try {
			const response = await fetch(`?/${actionName}`, { method: 'POST', body });
			if (!response.ok) {
				toast.error(`Erreur serveur (${response.status})`);
				return;
			}
			const result = deserialize(await response.text());
			if (result.type === 'success') {
				await invalidateAll();
			} else if (result.type === 'failure') {
				toast.error((result.data as { message?: string })?.message ?? 'Erreur');
			} else if (result.type === 'error') {
				toast.error(result.error?.message ?? 'Erreur inattendue');
			} else if (result.type === 'redirect') {
				toast.error('Redirection inattendue');
			}
		} catch (err) {
			console.error('callAction error:', err);
			toast.error(err instanceof Error ? err.message : 'Erreur réseau');
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

	async function handleReopenQuest(actionId: string) {
		const formData = new FormData();
		formData.append('actionId', actionId);
		formData.append('newStatus', 'En cours');
		await callAction('updateQuestStatus', formData);
		toast.info('Action rouverte');
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

	function resolveCtaTarget(target: string | null | undefined): string {
		if (!target) return '#';
		return target.replace('[id]', formation?.id ?? '');
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
							{@const blockInfo = getQuestBlockingInfo(action)}
							{@const isActive = selectedQuestId === action.id}
							{#if blockInfo.blocked}
								<Tooltip.Root>
									<Tooltip.Trigger>
										<button
											type="button"
											disabled
											class="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left cursor-not-allowed opacity-50"
										>
											<div class="shrink-0">
												<Lock class="size-4 text-muted-foreground/50" />
											</div>
											<div class="min-w-0 flex-1">
												<span class="block truncate text-sm">{action.title}</span>
											</div>
										</button>
									</Tooltip.Trigger>
									<Tooltip.Content>
										<p class="text-xs">Bloqué par : {blockInfo.blockerNames.join(', ')}</p>
									</Tooltip.Content>
								</Tooltip.Root>
							{:else}
								<button
									type="button"
									onclick={() => selectQuest(action)}
									class={cn(
										'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors',
										isActive && 'bg-primary/10 ring-1 ring-primary/30',
										!isActive && 'hover:bg-muted/50'
									)}
								>
									<div class="shrink-0">
										{#if action.status === 'Terminé'}
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
							{/if}
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

				<!-- Qualiopi critical badge -->
				{#if selectedQuestTemplate?.criticalForQualiopi}
					<div class="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50/50 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
						<AlertTriangle class="size-3.5 shrink-0" />
						Indicateur Qualiopi — Non-conformité majeure si absent
					</div>
				{/if}

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
							<div
								class={cn(
									'flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-muted/50',
									sub.completed && 'opacity-60'
								)}
							>
								<input
									type="checkbox"
									checked={sub.completed}
									onchange={() => handleToggleSubAction(sub.id, !sub.completed)}
									disabled={selectedQuest.status === 'Terminé'}
									class="size-4 shrink-0 cursor-pointer rounded border-muted-foreground/30 accent-primary"
								/>
								<div class="min-w-0 flex-1">
									<span
										class={cn(
											'text-sm',
											sub.completed && 'text-muted-foreground line-through'
										)}
									>
										{sub.title}
									</span>
									{#if sub.description}
										<p class="mt-0.5 text-xs text-muted-foreground">{sub.description}</p>
									{/if}
								</div>
								{#if !sub.completed}
									{#if sub.ctaType === 'navigate' && sub.ctaTarget}
										<Button
											size="sm"
											variant="outline"
											href={resolveCtaTarget(sub.ctaTarget)}
											class="shrink-0 gap-1.5 text-xs"
										>
											{sub.ctaLabel ?? 'Ouvrir'}
											<ArrowRight class="size-3" />
										</Button>
									{:else if sub.ctaType === 'upload'}
										<Button
											size="sm"
											variant="outline"
											class="shrink-0 gap-1.5 text-xs"
											onclick={() => toast.info('Dépôt de documents bientôt disponible')}
										>
											<Upload class="size-3" />
											{sub.ctaLabel ?? 'Déposer'}
										</Button>
									{:else if sub.ctaType === 'external'}
										<Button
											size="sm"
											variant="outline"
											class="shrink-0 gap-1.5 text-xs"
											onclick={() => toast.info('Lien externe bientôt disponible')}
										>
											<ExternalLink class="size-3" />
											{sub.ctaLabel ?? 'Ouvrir'}
										</Button>
									{/if}
								{/if}
							</div>
						{/each}
					</div>
				{/if}

			<!-- Action buttons -->
			{#if selectedQuest.status === 'Pas commencé' && !selectedQuestBlocking.blocked}
				<Button
					variant="outline"
					onclick={() => handleStartQuest(selectedQuest!.id)}
					class="w-fit gap-2"
				>
					<Clock class="size-4" />
					Commencer
				</Button>
			{:else if selectedQuest.status === 'En cours'}
				<div class="flex flex-col gap-2">
					<Button
						variant="default"
						disabled={!allSubActionsDone}
						onclick={() => handleCompleteQuest(selectedQuest!.id)}
						class="w-fit gap-2"
					>
						<Check class="size-4" />
						Marquer comme terminé
					</Button>
					{#if !allSubActionsDone}
						<p class="text-xs text-muted-foreground">
							Complétez toutes les sous-tâches pour terminer cette action
							({selectedQuest.subActions?.filter((s) => s.completed).length ?? 0}/{selectedQuest.subActions?.length ?? 0})
						</p>
					{/if}
				</div>
			{:else if selectedQuest.status === 'Terminé'}
				<Button
					variant="outline"
					onclick={() => handleReopenQuest(selectedQuest!.id)}
					class="w-fit gap-2"
				>
					<RotateCcw class="size-4" />
					Rouvrir cette action
				</Button>
			{/if}
			</div>
		{:else}
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
