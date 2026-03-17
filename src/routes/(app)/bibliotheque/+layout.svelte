<script lang="ts">
	import type { LayoutProps } from './$types';
	import { page } from '$app/state';
	import NavTabs from '$lib/components/nav-tabs.svelte';
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
</script>

<div class="flex w-full flex-col gap-4">
	{#if isTabView}
		<NavTabs tabs={TAB_ROUTES} ariaLabel="Bibliothèque sections" />
	{/if}
	{@render children()}
</div>
