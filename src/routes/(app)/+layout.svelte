<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import SiteHeader from '$lib/components/site-header.svelte';
	import { Toaster } from 'svelte-sonner';
	import * as Command from '$lib/components/ui/command/index.js';
	import { sitemap } from '$lib/settings/config';
	// import { page } from '$app/state';

	import { ModeWatcher } from 'mode-watcher';
	// import type { LayoutProps } from '../$types';
	import { page } from '$app/state';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Kbd } from '$lib/components/ui/kbd/index.js';
	import { IconArrowBack, IconSettings } from '@tabler/icons-svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { headerTitleSnippet, headerTitleText } from '$lib/stores/header-store';
	import { commandPaletteOpen } from '$lib/stores/command-palette-store';
	import * as Button from '$lib/components/ui/button/index.js';
	import EyeIcon from '@tabler/icons-svelte/icons/eye';
	import { invalidateAll } from '$app/navigation';

	let { data, children } = $props();

	// let pageName = $derived(
	// 	sitemap.find((item) => item.url === page.url.pathname)?.title || 'Default Page name'
	// );

	// The page title is now derived ONLY from the data prop,
	// forcing every page's load function to provide a title.
	const pageTitle = $derived(
		page.data?.header?.pageName ?? page.data?.pageName ?? 'Titre de page manquant'
	);

	// Test for headerActions based on page.data
	// const headeractions = $derived(page.data?.headerActions ?? null);
	const header = $derived(page.data?.header ?? null);
	const formations = $derived(page.data?.formations ?? []);

	const RECENT_FORMATIONS_COUNT = 3;

	const recentFormations = $derived((): any[] => {
		// If there are no formations, return an empty array
		if (!formations) return [];

		// Formations are pre-sorted by the server. Return the last N.
		return formations.slice(0, RECENT_FORMATIONS_COUNT);
	});

	// Command palette (keyboard + sidebar "Chercher" trigger)
	let open = $state(false);
	$effect(() => {
		if ($commandPaletteOpen) {
			open = true;
			commandPaletteOpen.set(false);
		}
	});

	// Create a derived variable for recent formations. This is reactive and more performant.
	// const recentFormations = $derived.by(() => {
	// 	if (!page.data?.formations) return [];

	// 	const thirtyDaysAgo = new Date();
	// 	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
	// 	// thirtyDaysAgo.setHours(0, 0, 0, 0);
	// 	const cutoffTime = thirtyDaysAgo.getTime();

	// 	return page.data.formations.filter(
	// 		(formation: { createdAt: string }) =>
	// 			new Date(formation.createdAt.replace(' ', 'T')).getTime() >= cutoffTime
	// 	);
	// });

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			open = !open;
		}

		// if (e.key === 'Escape') {
		// 	e.preventDefault();
		// 	open = false;
		// }
		// Close the command palette when pressing Return (Enter)
		// if (e.key === 'Enter') {
		// 	// e.preventDefault();
		// 	open = false;
		// }
	}
</script>

<svelte:document onkeydown={handleKeydown} />

<svelte:head>
	<title>{header?.pageName ?? pageTitle}</title>
</svelte:head>

<ModeWatcher />

<Sidebar.Provider
	style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 16);"
>
	<AppSidebar
		variant="inset"
		userObject={data?.user}
		workspace={data?.workspace}
		workspacePlanTitle={data?.workspacePlanTitle}
		workspaces={data?.workspaces}
		role={data?.role}
		roleLabel={data?.roleLabel}
		allowedNavUrls={data?.allowedNavUrls}
	/>
	<main class="flex h-screen w-full flex-col bg-background">
		<SiteHeader pageName={$headerTitleText || pageTitle} {header} title={$headerTitleSnippet}>
			<!-- {#snippet actions()}
				<p>Default Actions in (app) +layout.svelte</p>
			{/snippet} -->
			<!-- {@render children?.()} -->
		</SiteHeader>
		{#if data?.seeAs}
			<div class="border-b bg-muted/50 px-4 py-2">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2 text-sm">
						<EyeIcon class="size-4" />
						<span>
							Vous consultez l'espace en tant que <strong>{data.seeAs.memberName ?? 'Membre'}</strong> ({data.seeAs.roleLabel})
						</span>
					</div>
					<Button.Root
						variant="ghost"
						size="sm"
						onclick={async () => {
							document.cookie = 'see_as=; path=/; max-age=0';
							await invalidateAll();
							window.location.reload();
						}}
					>
						Revenir à mon rôle
					</Button.Root>
				</div>
			</div>
		{/if}
		<div class="flex min-w-0 flex-1 flex-col gap-4 p-4">
			{@render children()}
		</div>
	</main>
</Sidebar.Provider>

<Command.Dialog bind:open loop={true}>
	<Command.Input placeholder="Tapez où vous souhaitez naviguer..." />
	<Command.List>
		<Command.Empty>Aucun résultat trouvé.</Command.Empty>
		<!-- Add dynamic command group with command linkitems for each item returned in page data that is "formations" -->
		{#if recentFormations().length > 0}
			<Command.Group heading="Formations récentes">
				{#each recentFormations() as formation (formation.id)}
					<Command.LinkItem
						href={`/formations/${formation.id}`}
						onSelect={() => (open = false)}
						class="cursor-pointer"
						value={formation.id}
					>
						<!-- <FormationIcon /> -->
						<div class="flex items-center gap-2">
							<span>{formation.name}</span>
							<Badge variant="secondary" class="ml-auto">
								{formation.statut}
							</Badge>
						</div>
						<!-- Revert the letter spacing to normal in the class of the element below -->
						<Command.Shortcut class="tracking-wide">{formation.thematique?.name}</Command.Shortcut>
					</Command.LinkItem>
				{/each}
			</Command.Group>
			<!-- <Command.Separator /> -->
		{/if}
		<Command.Group heading="Principal">
			<!-- <Command.LinkItem href="/formations">Formations</Command.LinkItem> -->
			{#each sitemap as item (item.url)}
				<!-- Render below link item if url pathname is NOT the same as the current page's pathname-->
				{#if item.url !== page.url.pathname}
					<Command.LinkItem href={item.url} onSelect={() => (open = false)} class="cursor-pointer">
						<item.icon />
						{item.title}
					</Command.LinkItem>
				{/if}
			{/each}
		</Command.Group>
		<!-- <Command.Separator /> -->
		<Command.Group heading="Autre">
			<Command.LinkItem href="/parametres" onSelect={() => (open = false)} class="cursor-pointer">
				<IconSettings />
				Paramètres
			</Command.LinkItem>
		</Command.Group>
	</Command.List>
	<!-- <span>Footer</span> -->
	<div class="flex items-center justify-end gap-2 bg-muted/60 px-4 py-3">
		<span class="text-sm text-muted-foreground">Aller à la page</span>
		<Kbd>
			<IconArrowBack class="size-4" />
		</Kbd>
	</div>
</Command.Dialog>

<Toaster richColors position="top-right" />
