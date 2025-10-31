<script lang="ts">
	// import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	// import { sitemap } from '$lib/settings/config';

	let { pageName = 'Default Page Name', header = null } = $props();
</script>

<header
	class="sticky top-0 flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-white transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)"
>
	<div class="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
		<Sidebar.Trigger class="-ml-1" />
		<Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />
		<h1 class="text-base font-medium">{pageName}</h1>
		<!-- <div class="ml-auto flex items-center gap-2">
			<Button
				href="https://github.com/shadcn-ui/ui/tree/main/apps/v4/app/(examples)/dashboard"
				variant="ghost"
				size="sm"
				class="hidden sm:flex dark:text-foreground"
				target="_blank"
				rel="noopener noreferrer"
			>
				GitHub
			</Button>
		</div> -->

		<!-- Right Side: Dynamic Content Slot (Actions Area) -->
		<!-- <div class="flex items-center space-x-4">
			{@render $slots.actions()}
		</div> -->
		{#if header.actions}
			{@render actions?.()}
		{/if}
	</div>
</header>

{#snippet actions()}
	<!-- Default empty area if parent doesn’t override -->
	<div class="ml-auto flex items-center gap-2">
		<!-- <p>Default actions from site-header.svelte</p> -->
		<Button href={header.actions.href}>{header.actions.label}</Button>
	</div>
{/snippet}
