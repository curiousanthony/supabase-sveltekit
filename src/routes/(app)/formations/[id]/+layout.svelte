<script lang="ts">
	import type { LayoutProps } from './$types';
	import NavTabs from '$lib/components/nav-tabs.svelte';
	import LayoutGrid from '@lucide/svelte/icons/layout-grid';
	import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';
	import GraduationCap from '@lucide/svelte/icons/graduation-cap';
	import Calendar from '@lucide/svelte/icons/calendar';

	let { data, children }: LayoutProps = $props();

	const formationId = $derived(data?.formation?.id ?? '');
	const basePath = $derived(`/formations/${formationId}`);

	const tabs = $derived([
		{ href: basePath, label: 'Aperçu', icon: LayoutGrid },
		{ href: basePath + '/suivi', label: 'Suivi', icon: ClipboardCheck },
		{ href: basePath + '/formateurs', label: 'Formateurs', icon: GraduationCap },
		{ href: basePath + '/seances', label: 'Séances', icon: Calendar }
	]);
</script>

<div class="flex w-full flex-col gap-4">
	<NavTabs {tabs} ariaLabel="Formation sections" />
	{@render children()}
</div>
