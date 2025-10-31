<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import SiteHeader from '$lib/components/site-header.svelte';
	// import { sitemap } from '$lib/settings/config';
	// import { page } from '$app/state';

	import { ModeWatcher } from 'mode-watcher';
	// import type { LayoutProps } from '../$types';
	import { page } from '$app/state';

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
</script>

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
