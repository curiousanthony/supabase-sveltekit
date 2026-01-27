<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { cn } from '$lib/utils';
	import { tick } from 'svelte';
	import { Pencil } from '@lucide/svelte';

	let { value = $bindable(), class: className = '' } = $props();

	let isEditing = $state(false);
	let isHovered = $state(false);
	let inputElement: HTMLInputElement | null = $state(null);
	let hasBeenEdited = $state(false);

	async function startEditing() {
		isEditing = true;
		await tick();
		inputElement?.focus();
		inputElement?.select();
	}

	function stopEditing() {
		isEditing = false;
		if (value && value.trim() && value !== 'Formation sans titre') {
			hasBeenEdited = true;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			stopEditing();
		}
		if (e.key === 'Escape') {
			stopEditing();
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div 
	class={cn('group relative flex items-center', className)}
	onmouseenter={() => (isHovered = true)}
	onmouseleave={() => (isHovered = false)}
>
	{#if isEditing}
		<Input
			bind:ref={inputElement}
			bind:value
			onblur={stopEditing}
			onkeydown={handleKeydown}
			class="h-9 w-auto min-w-[300px] border-none bg-accent focus-visible:ring-1 text-lg font-bold"
		/>
	{:else}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div class="relative flex items-center group">
			<h1
				onclick={startEditing}
				class={cn(
					"cursor-text rounded-md px-2 py-1 text-lg font-bold transition-all duration-200 hover:bg-accent/80 active:scale-95 flex items-center gap-3",
					!hasBeenEdited && (!value || value === 'Formation sans titre') ? "text-muted-foreground" : "text-foreground"
				)}
			>
				{value || 'Sans titre'}
				<Pencil class="size-4 opacity-0 group-hover:opacity-40 transition-opacity" />
			</h1>
			
			{#if isHovered && !isEditing}
				<div class="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-[10px] rounded border shadow-sm pointer-events-none z-50 whitespace-nowrap animate-in fade-in zoom-in-95 duration-200">
					Cliquer pour modifier
				</div>
			{/if}
		</div>
	{/if}
</div>
