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
	import Files from '@lucide/svelte/icons/files';
	import HudBanner from '$lib/components/formations/hud-banner.svelte';
	import { getHudBannerState } from '$lib/formation-quest-priority';

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
		{ href: basePath + '/suivi', label: 'Suivi', icon: Target, dot: overdueQuests || undefined },
		{ href: basePath + '/programme', label: 'Programme', icon: BookOpen },
		{ href: basePath + '/seances', label: 'Séances', icon: Calendar, dot: missingSignatures || undefined },
		{ href: basePath + '/formateurs', label: 'Formateurs', icon: GraduationCap, dot: missingFormateurDocs || undefined },
		{ href: basePath + '/apprenants', label: 'Apprenants', icon: Users, dot: unsignedEmargements || undefined },
		{ href: basePath + '/documents', label: 'Documents', icon: Files },
		{ href: basePath + '/finances', label: 'Finances', icon: Wallet, dot: overdueInvoices || undefined }
	]);

	const formation = $derived(data?.formation);
	const actions = $derived(formation?.actions ?? []);

	const hudState = $derived(
		getHudBannerState({
			actions: actions as any,
			formation: {
				type: formation?.type,
				typeFinancement: formation?.typeFinancement,
				dateDebut: formation?.dateDebut,
				dateFin: formation?.dateFin
			}
		})
	);
</script>

<div class="flex min-h-0 w-full flex-1 flex-col gap-4">
	<NavTabs {tabs} ariaLabel="Formation sections" />
	<HudBanner state={hudState} {formationId} />
	{@render children()}
</div>
