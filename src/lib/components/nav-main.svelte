<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import { page } from '$app/state';
	import type { Component } from 'svelte';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';

	type NavLink = { type: 'link'; title: string; url: string; icon: Component };
	type NavCollapsible = {
		type: 'collapsible';
		title: string;
		icon: Component;
		children: { title: string; url: string }[];
		defaultOpen: boolean;
		hidden: boolean;
	};
	type MainNavItem = NavLink | NavCollapsible;

	let { mainNav }: { mainNav: MainNavItem[] } = $props();

	const currentPath = $derived(page?.url?.pathname ?? '');
	const items = $derived(mainNav ?? []);

	// Contacts section: collapsible open state (default open)
	let contactsOpen = $state(true);

	function calculateIsActive(itemUrl: string, path: string): boolean {
		const isRoot = itemUrl === '/';
		const isCurrentPage = path === itemUrl;
		const isParent = !isRoot && path.startsWith(itemUrl + '/');
		return isCurrentPage || isParent;
	}
</script>

<Sidebar.Group>
	<Sidebar.GroupContent>
		<Sidebar.Menu>
			{#each items as item (item.type === 'link' ? item.url : item.title)}
				{#if item.type === 'link'}
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							tooltipContent={item.title}
							isActive={calculateIsActive(item.url, currentPath)}
						>
							{#snippet child({ props })}
								<a href={item.url} {...props}>
									<item.icon
										class="size-[1.1em] shrink-0 {calculateIsActive(item.url, currentPath) ? 'text-primary' : ''}"
									/>
									<span
										class="text-[1.1em] {calculateIsActive(item.url, currentPath) ? 'text-primary' : ''}"
									>
										{item.title}
									</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				{:else if item.type === 'collapsible' && !item.hidden}
					<!-- Collapsible Sidebar.Menu pattern from shadcn-svelte docs -->
					<Collapsible.Root bind:open={contactsOpen} class="group/collapsible">
						<Sidebar.MenuItem>
							<Collapsible.Trigger>
								{#snippet child({ props: triggerProps })}
									<Sidebar.MenuButton
										{...triggerProps}
										tooltipContent={item.title}
										isActive={calculateIsActive('/contacts', currentPath)}
									>
										{#snippet child({ props })}
											<a href="/contacts" {...props}>
												<item.icon
													class="size-[1.1em] shrink-0 {calculateIsActive('/contacts', currentPath) ? 'text-primary' : ''}"
												/>
												<span
													class="text-[1.1em] {calculateIsActive('/contacts', currentPath) ? 'text-primary' : ''}"
												>
													{item.title}
												</span>
												<ChevronDown
													class="ms-auto size-4 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-180"
												/>
											</a>
										{/snippet}
									</Sidebar.MenuButton>
								{/snippet}
							</Collapsible.Trigger>
							<Collapsible.Content>
								<Sidebar.MenuSub>
									{#each item.children as subItem (subItem.url)}
										<Sidebar.MenuSubItem>
											<Sidebar.MenuSubButton isActive={calculateIsActive(subItem.url, currentPath)}>
												{#snippet child({ props })}
													<a href={subItem.url} {...props}>{subItem.title}</a>
												{/snippet}
											</Sidebar.MenuSubButton>
										</Sidebar.MenuSubItem>
									{/each}
								</Sidebar.MenuSub>
							</Collapsible.Content>
						</Sidebar.MenuItem>
					</Collapsible.Root>
				{/if}
			{/each}
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
