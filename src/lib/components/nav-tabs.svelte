<script lang="ts">
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import type { Component } from 'svelte';

	type TabItem = {
		label: string;
		icon?: Component;
		href?: string;
		value?: string;
	};

	let {
		tabs,
		activeValue = undefined,
		onTabChange = undefined,
		ariaLabel = 'Navigation'
	}: {
		tabs: readonly TabItem[];
		activeValue?: string;
		onTabChange?: (value: string) => void;
		ariaLabel?: string;
	} = $props();

	const pathname = $derived(page?.url?.pathname ?? '');

	function isActive(tab: TabItem): boolean {
		if (tab.href != null) {
			const normalizedPathname = pathname.replace(/\/$/, '');
			const normalizedHref = tab.href.replace(/\/$/, '');
			return normalizedPathname === normalizedHref;
		}
		return tab.value != null && tab.value === activeValue;
	}

	const tabClass = (active: boolean) =>
		cn(
			'flex cursor-pointer items-center gap-2 rounded-t-md border-b-2 px-4 py-2 text-sm font-medium transition-colors',
			active
				? 'border-primary text-primary'
				: 'border-transparent text-muted-foreground hover:text-foreground'
		);
</script>

<nav
	class="sticky top-0 z-40 -mx-4 flex h-fit w-[calc(100%+2rem)] max-w-[calc(100%+2rem)] overflow-visible border-b bg-background px-4 before:absolute before:bottom-full before:left-0 before:right-0 before:z-0 before:block before:h-4 before:bg-background before:content-['']"
	aria-label={ariaLabel}
>
	<div class="relative z-10 min-w-0 flex-1 overflow-x-auto">
		<div class="flex gap-1">
			{#each tabs as tab (tab.href ?? tab.value ?? tab.label)}
				{@const active = isActive(tab)}
				{#if tab.href != null}
					<a
						href={tab.href}
						class={tabClass(active)}
						aria-current={active ? 'page' : undefined}
					>
						{#if tab.icon}
							<tab.icon class="size-4 shrink-0" />
						{/if}
						{tab.label}
					</a>
				{:else}
					<button
						type="button"
						class={tabClass(active)}
						aria-current={active ? 'page' : undefined}
						onclick={() => tab.value != null && onTabChange?.(tab.value)}
					>
						{#if tab.icon}
							<tab.icon class="size-4 shrink-0" />
						{/if}
						{tab.label}
					</button>
				{/if}
			{/each}
		</div>
	</div>
</nav>
