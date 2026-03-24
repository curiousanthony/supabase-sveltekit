<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import Info from '@lucide/svelte/icons/info';

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

	let {
		label,
		subtitle,
		dateRange,
		completed,
		total,
		isActive,
		isDone,
		countdownText,
		tooltipText
	}: Props = $props();

	const percentage = $derived(total > 0 ? Math.round((completed / total) * 100) : 0);

	const barColor = $derived(
		isDone ? 'bg-green-500' : isActive ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'
	);
</script>

<div class="rounded-lg border bg-card px-5 py-4">
	<div class="flex items-start justify-between gap-2">
		<div class="min-w-0">
			<div class="flex items-center gap-2">
				<span class="text-base font-semibold">{label}</span>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Info class="size-4 shrink-0 text-muted-foreground/50 hover:text-muted-foreground" />
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p class="max-w-xs text-xs">{tooltipText}</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</div>
			<p class="text-sm text-muted-foreground">{subtitle}</p>
		</div>
	</div>

	{#if dateRange}
		<p class="mt-2 text-xs text-muted-foreground">{dateRange}</p>
	{/if}

	<div class="mt-3">
		<p class="text-sm font-medium">
			{completed} / {total} étapes
		</p>

		<div class="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
			<div class="h-full rounded-full transition-all {barColor}" style="width: {percentage}%">
			</div>
		</div>

		{#if countdownText}
			<p class="mt-2 text-xs font-medium text-muted-foreground">{countdownText}</p>
		{/if}
	</div>
</div>
