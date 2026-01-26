<script lang="ts">
	import { IconInfoCircle, IconSparkles, IconShieldCheck } from '@tabler/icons-svelte';
	import { cn } from '$lib/utils';

	let { 
		title = 'Conseil Qualiopi', 
		message, 
		variant = 'info', 
		class: className = ''
	} = $props();

	const variants = {
		info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
		success: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300',
		playful: 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300'
	};
</script>

<div class={cn('flex gap-3 rounded-lg border p-4 text-sm leading-relaxed shadow-sm', variants[variant as keyof typeof variants], className)}>
	<div class="shrink-0 mt-0.5">
		{#if variant === 'info'}
			<IconInfoCircle class="size-5" />
		{:else if variant === 'success'}
			<IconShieldCheck class="size-5" />
		{:else}
			<IconSparkles class="size-5" />
		{/if}
	</div>
	<div>
		{#if title}
			<p class="font-bold mb-1">{title}</p>
		{/if}
		<p>{message}</p>
	</div>
</div>
