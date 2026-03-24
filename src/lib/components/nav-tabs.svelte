<script lang="ts">
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import type { Component } from 'svelte';

	type TabItem = {
		label: string;
		icon?: Component;
		href?: string;
		value?: string;
		dot?: boolean | 'warning' | 'info';
	};

	let {
		tabs,
		activeValue = undefined,
		onTabChange = undefined,
		ariaLabel = 'Navigation',
		sticky = true
	}: {
		tabs: readonly TabItem[];
		activeValue?: string;
		onTabChange?: (value: string) => void;
		ariaLabel?: string;
		/** When false, the bar does not stick on its own — use a parent sticky wrapper (e.g. tabs + HUD). */
		sticky?: boolean;
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
			'relative flex cursor-pointer items-center gap-2 rounded-t-md border-b-2 px-4 py-2 text-sm font-medium transition-colors',
			active
				? 'border-primary text-primary'
				: 'border-transparent text-muted-foreground hover:text-foreground'
		);

	function dotClass(dot: TabItem['dot']): string {
		if (dot === 'warning') return 'bg-amber-500';
		if (dot === 'info') return 'bg-blue-500';
		return 'bg-destructive';
	}
</script>

<nav
	class={cn(
		"-mx-4 flex h-fit w-[calc(100%+2rem)] max-w-[calc(100%+2rem)] overflow-visible border-b bg-background px-4 before:absolute before:bottom-full before:left-0 before:right-0 before:z-0 before:block before:h-4 before:bg-background before:content-['']",
		sticky && 'sticky top-0 z-40'
	)}
	aria-label={ariaLabel}
>
	<div class="nav-tabs-scroll relative z-10 min-w-0 flex-1 overflow-x-auto scroll-smooth">
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
						{#if tab.dot}
							<span
								class={cn(
									'absolute right-1 top-1.5 size-1.5 shrink-0 rounded-full',
									dotClass(tab.dot)
								)}
								aria-hidden="true"
							></span>
							<span class="sr-only">Notification</span>
						{/if}
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
						{#if tab.dot}
							<span
								class={cn(
									'absolute right-1 top-1.5 size-1.5 shrink-0 rounded-full',
									dotClass(tab.dot)
								)}
								aria-hidden="true"
							></span>
							<span class="sr-only">Notification</span>
						{/if}
					</button>
				{/if}
			{/each}
		</div>
	</div>
</nav>

<style>
	.nav-tabs-scroll {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.nav-tabs-scroll::-webkit-scrollbar {
		display: none;
	}
</style>
