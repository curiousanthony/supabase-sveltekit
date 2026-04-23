<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Check from '@lucide/svelte/icons/check';
	import Clock from '@lucide/svelte/icons/clock';
	import Send from '@lucide/svelte/icons/send';

	interface Props {
		completed: boolean;
		waitingFor: string;
		startedAt?: string | null;
		onToggle: () => void;
		onRemind?: () => void;
	}

	let { completed, waitingFor, startedAt, onToggle, onRemind }: Props = $props();

	const elapsedDays = $derived.by(() => {
		if (!startedAt) return null;
		const start = new Date(startedAt);
		const now = new Date();
		return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
	});
</script>

{#if completed}
	<button
		type="button"
		class="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 transition-colors"
		onclick={onToggle}
	>
		<Check class="size-4" />
		<span>Reçu</span>
	</button>
{:else}
	<div class="flex items-center gap-3 flex-wrap">
		<div class="flex items-center gap-1.5 text-sm text-muted-foreground">
			<Clock class="size-3.5" />
			<span>En attente : <strong class="text-foreground">{waitingFor}</strong></span>
			{#if elapsedDays !== null && elapsedDays > 0}
				<Badge variant="outline" class="text-xs ml-1">
					{elapsedDays}j
				</Badge>
			{/if}
		</div>
		<div class="flex items-center gap-2">
			<Button variant="outline" size="sm" onclick={onToggle}>
				<Check class="size-3.5 mr-1" />
				Reçu
			</Button>
			{#if onRemind}
				<Button variant="ghost" size="sm" onclick={onRemind}>
					<Send class="size-3.5 mr-1" />
					Relancer
				</Button>
			{/if}
		</div>
	</div>
{/if}
