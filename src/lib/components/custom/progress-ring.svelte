<script lang="ts">
	import { cn } from "$lib/utils.js";

	interface Props {
		percent: number;
		size?: number;
		strokeWidth?: number;
		class?: string;
	}

	let { percent, size = 28, strokeWidth = 3, class: className }: Props = $props();

	const clampedPercent = $derived(Math.min(100, Math.max(0, percent)));
	const radius = $derived((size - strokeWidth) / 2);
	const circumference = $derived(2 * Math.PI * radius);
	const strokeDashoffset = $derived(circumference * (1 - clampedPercent / 100));
	const showText = $derived(size >= 40);
</script>

<svg
	width={size}
	height={size}
	class={cn("shrink-0 -rotate-90", className)}
	role="progressbar"
	aria-valuenow={clampedPercent}
	aria-valuemin={0}
	aria-valuemax={100}
	aria-label="Progression"
>
	<!-- Track -->
	<circle
		cx={size / 2}
		cy={size / 2}
		r={radius}
		fill="none"
		stroke="currentColor"
		stroke-width={strokeWidth}
		class="text-muted-foreground/40"
	/>
	<!-- Progress arc -->
	<circle
		cx={size / 2}
		cy={size / 2}
		r={radius}
		fill="none"
		stroke="var(--primary)"
		stroke-width={strokeWidth}
		stroke-linecap="round"
		stroke-dasharray={circumference}
		stroke-dashoffset={strokeDashoffset}
		class="transition-[stroke-dashoffset] duration-300 ease-out"
	/>
	{#if showText}
		<text
			x={size / 2}
			y={size / 2}
			text-anchor="middle"
			dominant-baseline="central"
			transform="rotate(90 {size / 2} {size / 2})"
			class="fill-foreground text-xs font-medium"
		>
			{Math.round(clampedPercent)}%
		</text>
	{/if}
</svg>
