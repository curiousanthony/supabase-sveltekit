<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Check from '@lucide/svelte/icons/check';
	import Circle from '@lucide/svelte/icons/circle';

	interface Props {
		completed: boolean;
		onToggle: () => void;
	}

	let { completed, onToggle }: Props = $props();
</script>

{#if completed}
	<button
		type="button"
		class="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 transition-colors"
		onclick={onToggle}
	>
		<Check class="size-4" />
		<span>Fait</span>
	</button>
{:else}
	<Button variant="outline" size="sm" onclick={onToggle}>
		<Circle class="size-3.5 mr-1.5" />
		Marquer comme fait
	</Button>
{/if}
