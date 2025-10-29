<script lang="ts">
	import CirclePlusFilledIcon from '@tabler/icons-svelte/icons/circle-plus-filled';
	import MailIcon from '@tabler/icons-svelte/icons/mail';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { Icon } from '@tabler/icons-svelte';
	import { page } from '$app/state';
	import Plus from '@tabler/icons-svelte/icons/plus';

	let { items }: { items: { title: string; url: string; icon?: Icon }[] } = $props();

	/**
	 * Calculates the active state for a menu item using robust route matching.
	 * @param itemUrl The URL from the menu item (e.g., '/products').
	 * @param currentPath The current page's pathname (e.g., '/products/123').
	 * @returns boolean - true if the item should be active.
	 */
	function calculateIsActive(itemUrl: string, currentPath: string): boolean {
		// 1. Is this the root path item?
		const isRoot = itemUrl === '/';

		// 2. Exact match check
		const isCurrentPage = currentPath === itemUrl;

		// 3. Parent route check (applies only to non-root items)
		// Checks if the path starts with the itemUrl followed by a slash,
		// preventing /settings from matching /settings-billing.
		const isParent = !isRoot && currentPath.startsWith(itemUrl + '/');

		// The item is active if it's the current page (exact match) or a parent of the current page.
		return isCurrentPage || isParent;
	}
</script>

<Sidebar.Group>
	<Sidebar.GroupContent class="flex flex-col gap-2">
		<Sidebar.Menu>
			<Sidebar.MenuItem class="flex items-center gap-2">
				<Sidebar.MenuButton
					class="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
					tooltipContent="Nouveau"
				>
					<!-- <CirclePlusFilledIcon /> -->
					<Plus class="h-4 w-4" stroke={3} />
					<span class="font-semibold">Nouveau</span>
				</Sidebar.MenuButton>
				<!-- <Button
					size="icon"
					class="size-8 group-data-[collapsible=icon]:opacity-0"
					variant="outline"
				>
					<MailIcon />
					<span class="sr-only">Inbox</span>
				</Button> -->
			</Sidebar.MenuItem>
		</Sidebar.Menu>
		<Sidebar.Menu>
			{#each items as item (item.title)}
				{@const isActive = calculateIsActive(item.url, page.url.pathname)}

				<Sidebar.MenuItem>
					<Sidebar.MenuButton tooltipContent={item.title} {isActive}>
						{#snippet child({ props })}
							{#if item.url}
								<a href={item.url} {...props}>
									{#if item.icon}
										{#if isActive}
											<item.icon class="text-primary" />
											<span class="text-[1.1em] text-primary">{item.title}</span>
										{:else}
											<item.icon />
											<span class="text-[1.1em]">{item.title}</span>
										{/if}
									{/if}
								</a>
							{:else}
								{#if item.icon}
									<item.icon />
								{/if}
								<span>{item.title}</span>
							{/if}
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
