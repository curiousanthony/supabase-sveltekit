<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import SiteHeader from '$lib/components/site-header.svelte';

	let { data, children } = $props();
</script>

<Sidebar.Provider
	style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 16);"
>
	<AppSidebar variant="inset" />
	<main class="flex w-full flex-col bg-background">
		<SiteHeader />
		<div class="flex flex-col gap-4 p-4">
			{@render children?.()}
		</div>
	</main>
</Sidebar.Provider>
