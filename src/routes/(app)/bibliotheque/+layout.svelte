<script lang="ts">
	import type { LayoutProps } from './$types';
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import Blocks from '@lucide/svelte/icons/blocks';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import FileText from '@lucide/svelte/icons/file-text';

	let { children }: LayoutProps = $props();

	const pathname = $derived(page?.url?.pathname ?? '');

	const TAB_ROUTES = [
		{ href: '/bibliotheque/programmes', label: 'Programmes', icon: BookOpen },
		{ href: '/bibliotheque/modules', label: 'Modules', icon: Blocks },
		{ href: '/bibliotheque/questionnaires', label: 'Questionnaires', icon: ClipboardList },
		{ href: '/bibliotheque/supports', label: 'Supports', icon: FileText }
	] as const;

	const isTabView = $derived(
		TAB_ROUTES.some((t) => pathname === t.href || pathname === t.href + '/')
	);

	const tabClass = (active: boolean) =>
		cn(
			'flex items-center gap-2 rounded-t-md border-b-2 px-4 py-2 text-sm font-medium transition-colors',
			active
				? 'border-primary text-primary'
				: 'border-transparent text-muted-foreground hover:text-foreground'
		);

	function isActive(href: string) {
		return pathname === href || pathname === href + '/';
	}
</script>

<div class="flex w-full flex-col gap-4">
	{#if isTabView}
		<nav
			class="sticky z-40 -mx-4 flex h-fit w-[calc(100%+2rem)] max-w-[calc(100%+2rem)] overflow-visible border-b bg-background px-4 before:absolute before:bottom-full before:left-0 before:right-0 before:z-0 before:block before:h-4 before:bg-background before:content-['']"
			style="top: calc(var(--header-height, 0px) + var(--spacing, 0.25rem) * 4)"
			aria-label="Bibliothèque sections"
		>
			<div class="relative z-10 min-w-0 flex-1 overflow-x-auto">
				<div class="flex gap-1">
					{#each TAB_ROUTES as tab (tab.href)}
						<a
							href={tab.href}
							class={tabClass(isActive(tab.href))}
							aria-current={isActive(tab.href) ? 'page' : undefined}
						>
							<tab.icon class="size-4 shrink-0" />
							{tab.label}
						</a>
					{/each}
				</div>
			</div>
		</nav>
	{/if}
	{@render children()}
</div>
