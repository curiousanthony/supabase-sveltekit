<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { cn } from "$lib/utils";
	import Minus from "@lucide/svelte/icons/minus";
	import Plus from "@lucide/svelte/icons/plus";

	type Props = {
		id?: string;
		name?: string;
		value?: number;
		min?: number;
		max?: number;
		step?: number;
		disabled?: boolean;
		class?: string;
	};

	let {
		id,
		name,
		value = $bindable(0),
		min,
		max,
		step = 1,
		disabled = false,
		class: className,
		...rest
	}: Props = $props();

	function clamp(next: number) {
		if (min !== undefined) next = Math.max(min, next);
		if (max !== undefined) next = Math.min(max, next);
		return next;
	}

	function handleStep(event: MouseEvent, direction: -1 | 1) {
		const isShift = event.shiftKey;
		const baseStep = step || 1;
		const delta = (isShift ? 5 : baseStep) * direction;
		const current = typeof value === "number" ? value : Number(value) || 0;
		value = clamp(current + delta);
	}
</script>

<div
	class={cn(
		"inline-flex h-10 items-stretch overflow-hidden rounded-md border border-input bg-background",
		className
	)}
>
	<Button
		type="button"
		variant="ghost"
		size="icon"
		class="h-full rounded-none border-r border-input"
		onclick={(event) => handleStep(event, -1)}
		disabled={disabled}
	>
		<Minus class="size-4" />
	</Button>

	<Input
		{id}
		{name}
		type="number"
		class="h-full w-20 border-none text-center font-mono text-base focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
		bind:value
		{min}
		{max}
		disabled={disabled}
		{...rest}
	/>

	<Button
		type="button"
		variant="ghost"
		size="icon"
		class="h-full rounded-none border-l border-input"
		onclick={(event) => handleStep(event, 1)}
		disabled={disabled}
	>
		<Plus class="size-4" />
	</Button>
</div>

