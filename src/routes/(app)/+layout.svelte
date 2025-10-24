<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import SiteHeader from '$lib/components/site-header.svelte';
	import { sitemap } from '$lib/settings/config';
	import { page } from '$app/state';

	let { data, children } = $props();

	let pageName = $derived(
		sitemap.find((item) => item.url === page.url.pathname)?.title || 'Default Page name'
	);
</script>

<Sidebar.Provider
	style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 16);"
>
	<AppSidebar variant="inset" userObject={data?.user} />
	<main class="flex w-full flex-col bg-background">
		<SiteHeader {pageName} />
		<div class="flex flex-col gap-4 p-4">
			{@render children?.()}
		</div>
	</main>
</Sidebar.Provider>
