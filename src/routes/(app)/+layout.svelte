<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import SiteHeader from '$lib/components/site-header.svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import { sitemap } from '$lib/settings/config';
	// import { page } from '$app/state';

	import { ModeWatcher } from 'mode-watcher';
	// import type { LayoutProps } from '../$types';
	import { page } from '$app/state';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Kbd } from '$lib/components/ui/kbd/index.js';
	import { IconArrowBack, IconSettings } from '@tabler/icons-svelte';

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

	// Command palette
	let open = $state(false);

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
		if (e.key === 'Enter') {
			e.preventDefault();
			open = false;
		}
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
	<AppSidebar variant="inset" userObject={data?.user} />
	<main class="flex h-screen w-full flex-col bg-background">
		<SiteHeader pageName={pageTitle} {header}>
			<!-- {#snippet actions()}
				<p>Default Actions in (app) +layout.svelte</p>
			{/snippet} -->
			<!-- {@render children?.()} -->
		</SiteHeader>
		<div class="flex flex-col gap-4 p-4">
			{@render children()}
		</div>
	</main>
</Sidebar.Provider>

<Command.Dialog bind:open>
	<Command.Input placeholder="Tapez où vous souhaitez naviguer..." />
	<Command.List>
		<Command.Empty>Aucun résultat trouvé.</Command.Empty>
		<Command.Group heading="Principal">
			<!-- <Command.LinkItem href="/formations">Formations</Command.LinkItem> -->
			{#each sitemap as item (item.url)}
				<!-- Render below link item if url pathname is NOT the same as the current page's pathname-->
				{#if item.url !== page.url.pathname}
					<Command.LinkItem href={item.url}>
						<item.icon />
						{item.title}
					</Command.LinkItem>
				{/if}
			{/each}
		</Command.Group>
		<Command.Separator />
		<Command.Group heading="Autre">
			<Command.LinkItem href="/parametres">
				<IconSettings />
				Paramètres
			</Command.LinkItem>
		</Command.Group>
	</Command.List>
	<!-- <span>Footer</span> -->
	<div class="flex items-center gap-2 bg-muted/60 px-4 py-3">
		<Kbd>
			<IconArrowBack class="size-4" />
		</Kbd>
		<span class="text-sm text-muted-foreground">Aller à la page</span>
	</div>
</Command.Dialog>
