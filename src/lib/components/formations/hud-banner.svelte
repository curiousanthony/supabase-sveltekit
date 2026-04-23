<script lang="ts">
	import type { HudBannerState } from '$lib/formation-quest-priority';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { PHASE_LABELS, getQuestActionTitle } from '$lib/formation-quests';
	import { getTargetTab } from '$lib/document-prompts';

	interface Props {
		hudState: HudBannerState;
		formationId: string;
		onRemind?: (actionId: string) => void;
	}

	let { hudState, formationId, onRemind }: Props = $props();

	let popoverOpen = $state(false);
	let hoverTimeout = $state<ReturnType<typeof setTimeout> | null>(null);

	function getQuestHref(questKey: string | null): string {
		const tab = getTargetTab(questKey);
		return `/formations/${formationId}/${tab}${questKey ? `?quest=${questKey}` : ''}`;
	}

	function capitalizeTab(tab: string): string {
		return tab.charAt(0).toUpperCase() + tab.slice(1);
	}

	function handlePopoverHoverIn() {
		if (hoverTimeout) clearTimeout(hoverTimeout);
		popoverOpen = true;
	}

	function handlePopoverHoverOut() {
		hoverTimeout = setTimeout(() => {
			popoverOpen = false;
		}, 200);
	}
</script>

{#if hudState}
	{#if hudState.type === 'action_single'}
		{@const tab = getTargetTab(hudState.quest.action.questKey)}
		{@const q = hudState.quest}
		<div
			class="flex items-start gap-4 border-b border-l-4 border-l-amber-500 bg-background px-6 py-4"
			role="status"
		>
			<div class="flex min-w-0 flex-1 flex-col gap-1">
				<div class="flex flex-wrap items-center gap-x-2 gap-y-1.5">
					<span class="min-w-0 text-sm font-medium leading-snug">
						{getQuestActionTitle(q.template)}
					</span>
					{#if q.isOverdue && q.daysLate != null}
						<span
							class="inline-flex shrink-0 items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/60 dark:text-amber-100"
							title="Échéance dépassée"
						>
							En retard de {q.daysLate}&nbsp;jour{q.daysLate > 1 ? 's' : ''}
						</span>
					{/if}
				</div>
				<span class="text-xs font-medium text-muted-foreground">{PHASE_LABELS[q.template.phase]}</span>
			</div>
			<a
				href={getQuestHref(q.action.questKey)}
				class="inline-flex shrink-0 self-start items-center rounded-md bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-85"
			>
				{capitalizeTab(tab)}
			</a>
		</div>
	{:else if hudState.type === 'action_concurrent'}
		{@const tab = getTargetTab(hudState.primary.action.questKey)}
		{@const q = hudState.primary}
		<div
			class="flex items-start gap-4 border-b border-l-4 border-l-amber-500 bg-background px-6 py-4"
			role="status"
		>
			<div class="flex min-w-0 flex-1 flex-col gap-1">
				<div class="flex flex-wrap items-center gap-x-2 gap-y-1.5">
					<span class="min-w-0 text-sm font-medium leading-snug">
						{getQuestActionTitle(q.template)}
					</span>
					{#if q.isOverdue && q.daysLate != null}
						<span
							class="inline-flex shrink-0 items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/60 dark:text-amber-100"
							title="Échéance dépassée"
						>
							En retard de {q.daysLate}&nbsp;jour{q.daysLate > 1 ? 's' : ''}
						</span>
					{/if}
				</div>
				<span class="text-xs font-medium text-muted-foreground">{PHASE_LABELS[q.template.phase]}</span>
			</div>
			<div class="flex shrink-0 items-center gap-2 self-start">
			<Popover.Root bind:open={popoverOpen}>
				<Popover.Trigger
					class="cursor-pointer rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent"
					onmouseenter={handlePopoverHoverIn}
					onmouseleave={handlePopoverHoverOut}
				>
					+{hudState.others.length} autre{hudState.others.length > 1 ? 's' : ''}
				</Popover.Trigger>
				<Popover.Content
					class="w-80"
					onmouseenter={handlePopoverHoverIn}
					onmouseleave={handlePopoverHoverOut}
				>
					<div class="flex flex-col gap-2 p-3">
						<p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							Aussi disponibles maintenant
						</p>
						{#each hudState.others as quest (quest.action.id)}
							{@const otherTab = getTargetTab(quest.action.questKey)}
							<div
								class="flex items-center justify-between gap-4 border-t pt-2"
							>
								<span class="text-sm">{getQuestActionTitle(quest.template)}</span>
								<a
									href={getQuestHref(quest.action.questKey)}
									class="shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted"
								>
									{capitalizeTab(otherTab)}
								</a>
							</div>
						{/each}
						<p class="mt-1 border-t pt-2 text-xs italic text-muted-foreground">
							Ces actions peuvent se faire dans l'ordre de votre choix.
						</p>
					</div>
				</Popover.Content>
			</Popover.Root>
			<a
				href={getQuestHref(q.action.questKey)}
				class="inline-flex shrink-0 items-center rounded-md bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-85"
			>
				{capitalizeTab(tab)}
			</a>
			</div>
		</div>
	{:else if hudState.type === 'waiting'}
		<div
			class="flex items-start gap-4 border-b border-l-4 border-l-blue-500 bg-background px-6 py-4"
			role="status"
		>
			<div class="flex min-w-0 flex-1 flex-col gap-1">
				<span class="text-sm font-medium leading-snug">
					⏳ En attente de {hudState.template.title}
					<span class="text-muted-foreground">
						·
						{#if hudState.lastRemindedDays !== null}
							Relancé il y a {hudState.lastRemindedDays} j
						{:else}
							En attente depuis {hudState.elapsedDays} j
						{/if}
					</span>
				</span>
				<span class="text-xs font-medium text-muted-foreground">
					{PHASE_LABELS[hudState.template.phase]}
				</span>
			</div>
			<button
				type="button"
				onclick={() => onRemind?.(hudState.type === 'waiting' ? hudState.quest.id : '')}
				class="shrink-0 self-start rounded-md border border-blue-300 px-5 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
			>
				Relancer
			</button>
		</div>
	{:else if hudState.type === 'phase_complete'}
		<div
			class="flex items-center gap-4 border-b border-l-4 border-l-green-500 bg-background px-6 py-4"
			role="status"
		>
			<span class="text-sm font-medium text-green-700 dark:text-green-400">
				✓ {hudState.message}
			</span>
		</div>
	{/if}
{/if}
