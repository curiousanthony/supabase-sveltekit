<script lang="ts">
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';

	let {
		label,
		active = false,
		direction = null as 'asc' | 'desc' | null,
		onclick
	}: {
		label: string;
		active?: boolean;
		direction?: 'asc' | 'desc' | null;
		onclick?: (e: MouseEvent) => void;
	} = $props();
</script>

<button
	type="button"
	class="inline-flex items-center gap-1.5 font-medium hover:text-foreground text-left transition-colors"
	{onclick}
>
	{label}
	{#if active && direction === 'asc'}
		<ArrowUpIcon class="size-4 shrink-0 opacity-70" aria-hidden="true" />
	{:else if active && direction === 'desc'}
		<ArrowDownIcon class="size-4 shrink-0 opacity-70" aria-hidden="true" />
	{:else}
		<ArrowUpDownIcon class="size-4 shrink-0 opacity-50" aria-hidden="true" />
	{/if}
</button>
