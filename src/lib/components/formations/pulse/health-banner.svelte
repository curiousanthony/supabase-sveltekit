<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import type { ButtonVariant } from '$lib/components/ui/button/button.svelte';
	import { cn } from '$lib/utils';

	type State = 'on-track' | 'action-required' | 'overdue' | 'blocked' | 'complete';

	interface Props {
		state: State;
		message: string;
		ctaLabel?: string;
		ctaHref?: string;
		onCtaClick?: () => void;
	}

	let { state, message, ctaLabel, ctaHref, onCtaClick }: Props = $props();

	const stateStyles: Record<State, { container: string; dot: string; text: string }> = {
		'on-track': {
			container: 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800',
			dot: 'bg-green-500',
			text: 'text-green-800 dark:text-green-200'
		},
		'action-required': {
			container: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800',
			dot: 'bg-amber-500',
			text: 'text-amber-800 dark:text-amber-200'
		},
		overdue: {
			container: 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800',
			dot: 'bg-red-500',
			text: 'text-red-800 dark:text-red-200'
		},
		blocked: {
			container: 'bg-muted border-border',
			dot: 'bg-muted-foreground',
			text: 'text-muted-foreground'
		},
		complete: {
			container: 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800',
			dot: 'bg-green-500',
			text: 'text-green-800 dark:text-green-200'
		}
	};

	let styles = $derived(stateStyles[state]);
	let buttonVariant: ButtonVariant = $derived(
		state === 'on-track' || state === 'complete' || state === 'blocked' ? 'outline' : 'default'
	);
</script>

<div class={cn('flex items-center justify-between gap-4 rounded-lg border p-4 sm:p-5', styles.container)}>
	<div class="flex items-center gap-2.5">
		<span class={cn('size-2 shrink-0 rounded-full', styles.dot)}></span>
		<p class={cn('text-sm font-medium', styles.text)}>{message}</p>
	</div>

	{#if ctaLabel}
		<Button
			variant={buttonVariant}
			size="sm"
			href={ctaHref}
			onclick={onCtaClick}
		>
			{ctaLabel}
		</Button>
	{/if}
</div>
