<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { cn } from '$lib/utils';
	import { PHASE_LABELS, type QuestTemplate } from '$lib/formation-quests';
	import InlineConfirm from './inline-confirm.svelte';
	import InlineWaitExternal from './inline-wait-external.svelte';
	import InlineExternalLink from './inline-external-link.svelte';
	import Check from '@lucide/svelte/icons/check';
	import Circle from '@lucide/svelte/icons/circle';
	import CircleDot from '@lucide/svelte/icons/circle-dot';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Info from '@lucide/svelte/icons/info';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import Calendar from '@lucide/svelte/icons/calendar';
	import X from '@lucide/svelte/icons/x';
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
		status: string;
		phase: string | null;
		title: string;
		dueDate: string | null;
		completedAt: string | null;
		updatedAt?: string | null;
		guidanceDismissed: boolean;
		subActions: SubAction[];
	}

	interface Props {
		action: Action;
		template: QuestTemplate | null;
		urgencyScore: number;
		dueDate: string | null;
		expanded: boolean;
		onToggleExpand: () => void;
		onSubActionToggle: (subActionId: string, completed: boolean) => void;
		onStatusChange: (actionId: string, newStatus: string) => void;
	}

	let {
		action,
		template,
		urgencyScore,
		dueDate,
		expanded,
		onToggleExpand,
		onSubActionToggle,
		onStatusChange
	}: Props = $props();

	const completedCount = $derived(action.subActions.filter((s) => s.completed).length);
	const totalCount = $derived(action.subActions.length);
	const isComplete = $derived(action.status === 'Terminé');
	const activeSubActionIndex = $derived(action.subActions.findIndex((s) => !s.completed));

	const phaseColors: Record<string, string> = {
		conception: 'bg-blue-50 text-blue-700 border-blue-200',
		deploiement: 'bg-amber-50 text-amber-700 border-amber-200',
		evaluation: 'bg-green-50 text-green-700 border-green-200'
	};

	const phaseBorderColors: Record<string, string> = {
		conception: 'border-l-blue-400',
		deploiement: 'border-l-amber-400',
		evaluation: 'border-l-green-400'
	};

	function formatDueDate(date: string) {
		return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
	}

	function isDueDateOverdue(date: string) {
		return new Date(date) < new Date(new Date().toDateString());
	}

	function isDueDateSoon(date: string) {
		const d = new Date(date);
		const now = new Date();
		const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
		return diff >= 0 && diff <= 7;
	}

	function getInlineConfig(subAction: SubAction) {
		if (!template) return null;
		const templateSub = template.subActions[subAction.orderIndex];
		return templateSub?.inlineConfig ?? null;
	}
</script>

<div
	class={cn(
		'rounded-lg border border-l-4 bg-card shadow-sm transition-shadow hover:shadow-md',
		phaseBorderColors[action.phase ?? 'conception'],
		isComplete && 'opacity-75'
	)}
>
	<!-- Header -->
	<button
		type="button"
		class="flex w-full items-center justify-between gap-3 p-4 text-left"
		onclick={onToggleExpand}
	>
		<div class="flex min-w-0 flex-1 items-center gap-3">
			{#if action.phase}
				<span
					class={cn(
						'shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
						phaseColors[action.phase]
					)}
				>
					{PHASE_LABELS[action.phase as keyof typeof PHASE_LABELS] ?? action.phase}
				</span>
			{/if}
			<span class="truncate font-semibold text-foreground">{action.title}</span>
			<span class="shrink-0 text-xs text-muted-foreground">{completedCount}/{totalCount}</span>
		</div>
		<div class="flex shrink-0 items-center gap-2">
			{#if dueDate}
				<span
					class={cn(
						'flex items-center gap-1 text-xs',
						isDueDateOverdue(dueDate)
							? 'font-medium text-red-600'
							: isDueDateSoon(dueDate)
								? 'text-amber-600'
								: 'text-muted-foreground'
					)}
				>
					<Calendar class="size-3" />
					{formatDueDate(dueDate)}
				</span>
			{/if}
			{#if expanded}
				<ChevronDown class="size-4 text-muted-foreground" />
			{:else}
				<ChevronRight class="size-4 text-muted-foreground" />
			{/if}
		</div>
	</button>

	<!-- Expanded content -->
	{#if expanded}
		<div class="border-t px-4 pb-4 pt-3" transition:slide={{ duration: 200 }}>
			<!-- Guidance tip -->
			{#if template?.guidance && !action.guidanceDismissed}
				<div class="mb-3 flex items-start gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
					<Info class="mt-0.5 size-4 shrink-0" />
					<p class="flex-1">{template.guidance}</p>
					<button
						type="button"
						class="shrink-0 text-blue-500 hover:text-blue-700"
						onclick={() => onStatusChange(action.id, action.status)}
					>
						<X class="size-3.5" />
					</button>
				</div>
			{/if}

			<!-- Sub-actions list -->
			<ul class="space-y-1">
				{#each action.subActions as subAction, i (subAction.id)}
					{@const isActive = i === activeSubActionIndex}
					{@const isFuture = !subAction.completed && i > activeSubActionIndex && activeSubActionIndex !== -1}
					<li
						class={cn(
							'flex items-start gap-2 rounded-md px-2 py-2 transition-colors',
							isActive && 'bg-muted/30 p-3',
							isFuture && 'text-muted-foreground'
						)}
					>
						<!-- Status indicator -->
						{#if subAction.completed}
							<Check class="mt-0.5 size-4 shrink-0 text-green-600" />
						{:else if isActive}
							<CircleDot class="mt-0.5 size-4 shrink-0 text-blue-600" />
						{:else}
							<Circle class="mt-0.5 size-4 shrink-0 text-muted-foreground/50" />
						{/if}

						<div class="min-w-0 flex-1">
							<span
								class={cn(
									'text-sm',
									subAction.completed && 'text-muted-foreground line-through'
								)}
							>
								{subAction.title}
							</span>

							<!-- Inline component for active sub-action only -->
							{#if isActive && subAction.inlineType}
								<div class="mt-2">
									{#if subAction.inlineType === 'confirm-task'}
										<InlineConfirm
											completed={subAction.completed}
											onToggle={() => onSubActionToggle(subAction.id, !subAction.completed)}
										/>
									{:else if subAction.inlineType === 'wait-external'}
										{@const config = getInlineConfig(subAction)}
										<InlineWaitExternal
											completed={subAction.completed}
											waitingFor={config && 'waitingFor' in config ? String(config.waitingFor) : 'Tiers'}
											onToggle={() => onSubActionToggle(subAction.id, !subAction.completed)}
										/>
									{:else if subAction.inlineType === 'external-link'}
										{@const config = getInlineConfig(subAction)}
										<InlineExternalLink
											completed={subAction.completed}
											url={config && 'url' in config ? String(config.url) : null}
											label={config && 'label' in config ? String(config.label) : 'Ouvrir'}
											onToggle={() => onSubActionToggle(subAction.id, !subAction.completed)}
										/>
									{:else if subAction.inlineType === 'upload-document'}
										<p class="text-xs text-muted-foreground italic">Téléverser un fichier</p>
									{:else if subAction.inlineType === 'generate-document'}
										<p class="text-xs text-muted-foreground italic">Génération de document (bientôt disponible)</p>
									{:else if subAction.inlineType === 'send-email'}
										<p class="text-xs text-muted-foreground italic">Envoi d'email (bientôt disponible)</p>
									{:else if subAction.inlineType === 'verify-fields'}
										<p class="text-xs text-muted-foreground italic">Vérification des champs</p>
									{:else if subAction.inlineType === 'select-people'}
										<p class="text-xs text-muted-foreground italic">Sélection des participants</p>
									{:else if subAction.inlineType === 'inline-view'}
										<p class="text-xs text-muted-foreground italic">Vue en ligne</p>
									{/if}
								</div>
							{/if}
						</div>
					</li>
				{/each}
			</ul>

			<!-- Reopen button for completed quests -->
			{#if isComplete}
				<div class="mt-3 flex justify-end">
					<Button
						variant="ghost"
						size="sm"
						onclick={() => onStatusChange(action.id, 'En cours')}
					>
						<RotateCcw class="size-3.5" />
						Rouvrir
					</Button>
				</div>
			{/if}
		</div>
	{/if}
</div>
