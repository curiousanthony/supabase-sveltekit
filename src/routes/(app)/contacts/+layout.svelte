<script lang="ts">
	import type { LayoutProps } from './$types';
	import { page } from '$app/state';
	import NavTabs from '$lib/components/nav-tabs.svelte';
	import Users from '@lucide/svelte/icons/users';
	import Building2 from '@lucide/svelte/icons/building-2';
	import GraduationCap from '@lucide/svelte/icons/graduation-cap';

	let { children }: LayoutProps = $props();

	const pathname = $derived(page?.url?.pathname ?? '');

	const TAB_ROUTES = [
		{ href: '/contacts', label: 'Clients', icon: Users },
		{ href: '/contacts/entreprises', label: 'Entreprises', icon: Building2 },
		{ href: '/contacts/formateurs', label: 'Formateurs', icon: GraduationCap }
	] as const;

	const isTabView = $derived(
		TAB_ROUTES.some((t) => pathname === t.href || pathname === t.href + '/')
	);
</script>

<div class="flex w-full flex-col gap-4">
	{#if isTabView}
		<NavTabs tabs={TAB_ROUTES} ariaLabel="CRM sections" />
	{/if}
	{#key pathname}
		{@render children()}
	{/key}
</div>
