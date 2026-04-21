<script lang="ts">
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
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

	let scrollEl = $state<HTMLDivElement | null>(null);
	let canScrollLeft = $state(false);
	let canScrollRight = $state(false);

	function updateScrollState() {
		if (!scrollEl) return;
		canScrollLeft = scrollEl.scrollLeft > 0;
		canScrollRight = scrollEl.scrollLeft + scrollEl.clientWidth < scrollEl.scrollWidth - 1;
	}

	$effect(() => {
		if (!scrollEl) return;
		updateScrollState();
		const ro = new ResizeObserver(updateScrollState);
		ro.observe(scrollEl);
		return () => ro.disconnect();
	});

	function handleScrollLeft() {
		scrollEl?.scrollBy({ left: -200, behavior: 'smooth' });
	}

	function handleScrollRight() {
		scrollEl?.scrollBy({ left: 200, behavior: 'smooth' });
	}

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
	<div class="relative min-w-0 flex-1 overflow-hidden">
		<div
			class="nav-tabs-scroll relative z-10 min-w-0 flex-1 overflow-x-auto scroll-smooth"
			bind:this={scrollEl}
			onscroll={updateScrollState}
		>
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

		{#if canScrollLeft}
			<div class="pointer-events-none absolute inset-y-0 left-0 z-20 flex items-center">
				<div class="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent"></div>
				<button
					type="button"
					class="pointer-events-auto relative z-10 flex h-full items-center px-1 text-muted-foreground transition-colors hover:text-foreground"
					aria-label="Défiler vers la gauche"
					onclick={handleScrollLeft}
				>
					<ChevronLeft class="size-4" />
				</button>
			</div>
		{/if}

		{#if canScrollRight}
			<div class="pointer-events-none absolute inset-y-0 right-0 z-20 flex items-center">
				<div class="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent"></div>
				<button
					type="button"
					class="pointer-events-auto relative z-10 flex h-full items-center px-1 text-muted-foreground transition-colors hover:text-foreground"
					aria-label="Défiler vers la droite"
					onclick={handleScrollRight}
				>
					<ChevronRight class="size-4" />
				</button>
			</div>
		{/if}
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
