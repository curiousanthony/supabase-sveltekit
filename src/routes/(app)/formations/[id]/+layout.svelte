<script lang="ts">
	import type { LayoutProps } from './$types';
	import NavTabs from '$lib/components/nav-tabs.svelte';
	import LayoutGrid from '@lucide/svelte/icons/layout-grid';
	import FileText from '@lucide/svelte/icons/file-text';
	import Target from '@lucide/svelte/icons/target';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Calendar from '@lucide/svelte/icons/calendar';
	import GraduationCap from '@lucide/svelte/icons/graduation-cap';
	import Users from '@lucide/svelte/icons/users';
	import Wallet from '@lucide/svelte/icons/wallet';

	let { data, children }: LayoutProps = $props();

	const formationId = $derived(data?.formation?.id ?? '');
	const basePath = $derived(`/formations/${formationId}`);
	const overdueQuests = $derived(data?.overdueQuests ?? false);
	const missingSignatures = $derived(data?.missingSignatures ?? false);
	const missingFormateurDocs = $derived(data?.missingFormateurDocs ?? false);
	const unsignedEmargements = $derived(data?.unsignedEmargements ?? false);
	const overdueInvoices = $derived(data?.overdueInvoices ?? false);

	const tabs = $derived([
		{ href: basePath, label: 'Aperçu', icon: LayoutGrid },
		{ href: basePath + '/fiche', label: 'Fiche', icon: FileText },
		{ href: basePath + '/actions', label: 'Actions', icon: Target, dot: overdueQuests || undefined },
		{ href: basePath + '/programme', label: 'Programme', icon: BookOpen },
		{ href: basePath + '/seances', label: 'Séances', icon: Calendar, dot: missingSignatures || undefined },
		{ href: basePath + '/formateurs', label: 'Formateurs', icon: GraduationCap, dot: missingFormateurDocs || undefined },
		{ href: basePath + '/apprenants', label: 'Apprenants', icon: Users, dot: unsignedEmargements || undefined },
		{ href: basePath + '/finances', label: 'Finances', icon: Wallet, dot: overdueInvoices || undefined }
	]);
</script>

<div class="flex min-h-0 w-full flex-1 flex-col gap-4">
	<NavTabs {tabs} ariaLabel="Formation sections" />
	{@render children()}
</div>
