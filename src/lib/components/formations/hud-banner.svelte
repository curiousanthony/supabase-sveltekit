<script lang="ts">
	import type { HudBannerState } from '$lib/formation-quest-priority';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { PHASE_LABELS } from '$lib/formation-quests';

	interface Props {
		state: HudBannerState;
		formationId: string;
		onRemind?: (actionId: string) => void;
	}

	let { state, formationId, onRemind }: Props = $props();

	function getTargetTab(questKey: string | null): string {
		if (!questKey) return 'suivi';
		const tabMap: Record<string, string> = {
			verification_infos: 'fiche',
			analyse_besoins: 'apprenants',
			programme_modules: 'programme',
			affectation_formateur: 'formateurs',
			convocations: 'apprenants',
			preparation_logistique: 'fiche',
			emargement: 'seances',
			documents_formateur: 'formateurs',
			facturation: 'finances'
		};
		return tabMap[questKey] ?? 'suivi';
	}

	function capitalizeTab(tab: string): string {
		return tab.charAt(0).toUpperCase() + tab.slice(1);
	}
</script>

{#if state}
	{#if state.type === 'action_single'}
		{@const tab = getTargetTab(state.quest.action.questKey)}
		<div
			class="flex flex-wrap items-center gap-3 rounded-lg border border-l-4 border-l-amber-500 bg-background px-4 py-3"
			role="status"
		>
			<span class="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
				{PHASE_LABELS[state.quest.template.phase]}
			</span>
			<span class="text-sm font-medium">
				{state.quest.template.title}
				{#if state.quest.isOverdue}
					<span class="text-destructive"> · À régulariser</span>
				{/if}
			</span>
			<a
				href="/formations/{formationId}?tab={tab}"
				class="rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted"
			>
				{capitalizeTab(tab)}
			</a>
		</div>
	{:else if state.type === 'action_concurrent'}
		{@const tab = getTargetTab(state.primary.action.questKey)}
		<div
			class="flex flex-wrap items-center gap-3 rounded-lg border border-l-4 border-l-amber-500 bg-background px-4 py-3"
			role="status"
		>
			<span class="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
				{PHASE_LABELS[state.primary.template.phase]}
			</span>
			<span class="text-sm font-medium">
				{state.primary.template.title}
				{#if state.primary.isOverdue}
					<span class="text-destructive"> · À régulariser</span>
				{/if}
			</span>
			<a
				href="/formations/{formationId}?tab={tab}"
				class="rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted"
			>
				{capitalizeTab(tab)}
			</a>
			<Popover.Root>
				<Popover.Trigger
					class="cursor-pointer rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent"
				>
					+{state.others.length} autres
				</Popover.Trigger>
				<Popover.Content class="w-80">
					<div class="flex flex-col gap-2 p-3">
						{#each state.others as quest (quest.action.id)}
							{@const otherTab = getTargetTab(quest.action.questKey)}
							<div class="flex items-center justify-between gap-4">
								<span class="text-sm">{quest.template.title}</span>
								<a
									href="/formations/{formationId}?tab={otherTab}"
									class="shrink-0 rounded-full border px-2 py-0.5 text-xs transition-colors hover:bg-muted"
								>
									{capitalizeTab(otherTab)}
								</a>
							</div>
						{/each}
						<p class="mt-1 border-t pt-2 text-xs text-muted-foreground">
							Ces actions peuvent se faire dans l'ordre de votre choix.
						</p>
					</div>
				</Popover.Content>
			</Popover.Root>
		</div>
	{:else if state.type === 'waiting'}
		<div
			class="flex flex-wrap items-center gap-3 rounded-lg border border-l-4 border-l-blue-500 bg-background px-4 py-3"
			role="status"
		>
			<span class="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
				{PHASE_LABELS[state.template.phase]}
			</span>
			<span class="text-sm font-medium">
				⏳ En attente de {state.template.title}
				<span class="text-muted-foreground">
					·
					{#if state.lastRemindedDays !== null}
						Relancé il y a {state.lastRemindedDays} j
					{:else}
						En attente depuis {state.elapsedDays} j
					{/if}
				</span>
			</span>
			<button
				type="button"
				onclick={() => onRemind?.(state.type === 'waiting' ? state.quest.id : '')}
				class="rounded-full border border-blue-300 px-3 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
			>
				Relancer
			</button>
		</div>
	{:else if state.type === 'phase_complete'}
		<div
			class="flex items-center gap-3 rounded-lg border border-l-4 border-l-green-500 bg-background px-4 py-3"
			role="status"
		>
			<span class="text-sm text-green-700 dark:text-green-400">
				✓ {state.message}
			</span>
		</div>
	{/if}
{/if}
