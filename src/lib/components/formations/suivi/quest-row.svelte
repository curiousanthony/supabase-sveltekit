<script lang="ts">
	import type { QuestDisplayState } from '$lib/formation-quest-state';
	import { getHardLockTooltipText } from '$lib/formation-suivi-hints';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';

	interface Props {
		questKey: string | null;
		title: string;
		displayState: QuestDisplayState;
		phaseName: string;
		dueDate: string | null;
		completedAt: string | null;
		waitStartedAt: string | null;
		lastRemindedAt: string | null;
		unmetDeps: { key: string; title: string; lockType: 'hard' | 'soft' }[];
		targetTab: string | null;
		formationId: string;
		formationDateDebut?: string | null;
		formationDateFin?: string | null;
		onOverrideSoftLock?: () => void;
		onRemind?: () => void;
	}

	let {
		questKey,
		title,
		displayState,
		dueDate,
		completedAt,
		waitStartedAt,
		lastRemindedAt,
		unmetDeps,
		targetTab,
		formationId,
		formationDateDebut = null,
		formationDateFin = null,
		onOverrideSoftLock,
		onRemind
	}: Props = $props();

	const isLocked = $derived(displayState === 'soft_locked' || displayState === 'hard_locked');

	const borderAccentClass = $derived(
		displayState === 'actionable'
			? 'border-l-amber-500'
			: displayState === 'waiting'
				? 'border-l-blue-500'
				: displayState === 'soft_locked' || displayState === 'hard_locked'
					? 'border-l-gray-300 dark:border-l-gray-600'
					: 'border-l-green-500'
	);

	const elapsedDays = $derived.by(() => {
		if (displayState !== 'waiting') return 0;
		const ref = lastRemindedAt ?? waitStartedAt;
		if (!ref) return 0;
		return Math.floor((Date.now() - new Date(ref).getTime()) / (1000 * 60 * 60 * 24));
	});

	const elapsedText = $derived(
		displayState === 'waiting'
			? lastRemindedAt
				? `Relancé il y a ${elapsedDays} j`
				: `Aucune relance depuis ${elapsedDays} j`
			: ''
	);

	const formattedCompletedAt = $derived(
		completedAt ? new Date(completedAt).toLocaleDateString('fr-FR') : ''
	);

	const capitalizedTab = $derived(
		targetTab ? targetTab.charAt(0).toUpperCase() + targetTab.slice(1) : ''
	);

	const ctaHref = $derived(
		targetTab && questKey
			? `/formations/${formationId}/${targetTab}?quest=${questKey}`
			: null
	);

	const firstSoftDep = $derived(unmetDeps.find((d) => d.lockType === 'soft'));
	const firstHardDep = $derived(unmetDeps.find((d) => d.lockType === 'hard'));

	const hardLockTooltip = $derived(
		displayState === 'hard_locked' && questKey
			? getHardLockTooltipText(questKey, firstHardDep?.key, {
					dateDebut: formationDateDebut,
					dateFin: formationDateFin
				})
			: ''
	);
</script>

<div class="rounded-lg border bg-card overflow-hidden" class:opacity-60={isLocked}>
	<div
		class="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 gap-y-2 border-l-[3px] px-4 py-3 sm:gap-x-4 {borderAccentClass}"
	>
	<span class="text-sm font-medium">{title}</span>

	{#if displayState === 'actionable'}
		<span
			class="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700"
		>
			À faire
		</span>
		{#if ctaHref}
			<a
				href={ctaHref}
				class="inline-flex min-h-10 shrink-0 items-center justify-center rounded-md bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-85"
			>
				{capitalizedTab}
			</a>
		{:else}
			<span></span>
		{/if}
	{:else if displayState === 'waiting'}
		<span
			class="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
		>
			En attente
		</span>
		<span class="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
			<span class="text-xs text-muted-foreground">{elapsedText}</span>
			<button
				type="button"
				class="inline-flex min-h-10 shrink-0 items-center justify-center rounded-md border border-blue-300 px-5 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
				onclick={() => onRemind?.()}
			>
				Relancer
			</button>
		</span>
	{:else if displayState === 'soft_locked'}
		{#if firstSoftDep}
			<span class="text-xs text-muted-foreground">Après {firstSoftDep.title}</span>
		{:else}
			<span></span>
		{/if}
		<button
			type="button"
			class="cursor-pointer text-xs text-primary hover:underline"
			onclick={() => onOverrideSoftLock?.()}
		>
			Anticiper cette étape
		</button>
	{:else if displayState === 'hard_locked'}
		<Tooltip.Root>
			<Tooltip.Trigger>
				<span
					class="rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs text-gray-500"
				>
					🔒 Verrouillé
				</span>
			</Tooltip.Trigger>
			<Tooltip.Content>
				<p class="max-w-xs text-xs leading-relaxed">{hardLockTooltip}</p>
			</Tooltip.Content>
		</Tooltip.Root>
		<span></span>
	{:else if displayState === 'completed'}
		<span
			class="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs text-green-700"
		>
			✓ Complété
		</span>
		<span class="text-xs text-muted-foreground">{formattedCompletedAt}</span>
	{:else if displayState === 'anticipated'}
		<span
			class="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs text-green-700"
		>
			✓ Anticipé
		</span>
		<span class="text-xs text-muted-foreground">{formattedCompletedAt}</span>
	{/if}
	</div>
</div>
