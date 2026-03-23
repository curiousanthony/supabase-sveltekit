<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Check from '@lucide/svelte/icons/check';
	import ExternalLink from '@lucide/svelte/icons/external-link';

	interface Props {
		completed: boolean;
		url?: string | null;
		label?: string;
		onToggle: () => void;
	}

	let { completed, url, label = 'Ouvrir', onToggle }: Props = $props();
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
	<div class="flex items-center gap-2">
		{#if url}
			<Button variant="outline" size="sm" href={url} target="_blank" rel="noopener noreferrer">
				<ExternalLink class="size-3.5 mr-1.5" />
				{label}
			</Button>
		{/if}
		<Button variant="ghost" size="sm" onclick={onToggle}>
			<Check class="size-3.5 mr-1" />
			Fait
		</Button>
	</div>
{/if}
