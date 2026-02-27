<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import type { Component } from 'svelte';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import { defaultWipTooltip } from '$lib/settings/config.js';

	const sidebar = Sidebar.useSidebar();

	type NavLink = {
		type: 'link';
		title: string;
		url: string;
		icon: Component;
		/** When true, shows a WIP badge. If `disabled` is not set, WIP items are disabled by default. */
		wip?: boolean;
		/** When true, link is not clickable and shown muted. Defaults to true when `wip` is true. */
		disabled?: boolean;
		/** Badge text when wip is true. Defaults to "Bêta". */
		wipBadge?: string;
		/** Tooltip when hovering a WIP item. Defaults to a message that the feature is coming in a future update. */
		wipTooltip?: string;
	};
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

	// Per-section collapsible state keyed by section id (e.g. item.title)
	let collapsibleState = $state<Record<string, boolean>>({});

	function isOpen(id: string, defaultOpen: boolean): boolean {
		return collapsibleState[id] ?? defaultOpen;
	}

	function isCollapsed(id: string, defaultOpen: boolean): boolean {
		return !isOpen(id, defaultOpen);
	}

	function setOpen(id: string, value: boolean): void {
		collapsibleState = { ...collapsibleState, [id]: value };
	}

	function toggleCollapse(id: string, defaultOpen: boolean): void {
		setOpen(id, !isOpen(id, defaultOpen));
	}

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
					{@const isDisabled = item.disabled ?? (item.wip ?? false)}
					{@const isWip = item.wip ?? false}
					{@const tooltipText = isDisabled && isWip ? (item.wipTooltip ?? defaultWipTooltip) : item.title}
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							tooltipContent={tooltipText}
							tooltipContentProps={isDisabled && isWip ? { hidden: false, class: 'max-w-xs' } : undefined}
							isActive={!isDisabled && calculateIsActive(item.url, currentPath)}
						>
							{#snippet child({ props })}
								{#if isDisabled}
									<span
										{...props}
										aria-disabled="true"
										class="{props.class ?? ''} pointer-events-auto! cursor-not-allowed! text-sidebar-foreground/80"
									>
										<item.icon class="size-[1.1em] shrink-0 text-sidebar-foreground/80" />
										<span class="text-[1.1em] text-sidebar-foreground/80">{item.title}</span>
										{#if isWip && sidebar.state !== 'collapsed'}
											<span
												class="ms-auto shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground"
											>
												{item.wipBadge ?? 'Bêta'}
											</span>
										{/if}
									</span>
								{:else}
									<a href={item.url} {...props}>
										<item.icon
											class="size-[1.1em] shrink-0 {calculateIsActive(item.url, currentPath) ? 'text-primary' : ''}"
										/>
										<span
											class="text-[1.1em] {calculateIsActive(item.url, currentPath) ? 'text-primary' : ''}"
										>
											{item.title}
										</span>
										{#if isWip && sidebar.state !== 'collapsed'}
											<span
												class="ms-auto shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground"
											>
												{item.wipBadge ?? 'Bêta'}
											</span>
										{/if}
									</a>
								{/if}
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				{:else if item.type === 'collapsible' && !item.hidden}
					{@const isSectionActive = item.children.some((c) => calculateIsActive(c.url, currentPath))}
					{#if sidebar.state === 'collapsed'}
						<!-- When sidebar is collapsed: show dropdown with child links -->
						<Sidebar.MenuItem>
							<DropdownMenu.Root>
								<DropdownMenu.Trigger>
									{#snippet child({ props: triggerProps })}
										<Sidebar.MenuButton
											{...triggerProps}
											tooltipContent={item.title}
											isActive={isSectionActive}
										>
											{#snippet child({ props })}
												<button type="button" {...props}>
													<item.icon
														class="size-[1.1em] shrink-0 {isSectionActive ? 'text-primary' : ''}"
													/>
													<span
														class="flex flex-1 items-center gap-2 overflow-hidden text-[1.1em] {isSectionActive ? 'text-primary' : ''}"
													>
														<span class="truncate">{item.title}</span>
													</span>
												</button>
											{/snippet}
										</Sidebar.MenuButton>
									{/snippet}
								</DropdownMenu.Trigger>
								<DropdownMenu.Content
									class="min-w-48 rounded-lg"
									side="right"
									align="start"
									sideOffset={8}
								>
									<DropdownMenu.Label class="text-xs text-muted-foreground">
										{item.title}
									</DropdownMenu.Label>
									<DropdownMenu.Separator />
									{#each item.children as subItem (subItem.url)}
										<DropdownMenu.Item>
											{#snippet child({ props })}
												<a href={subItem.url} class="block w-full" {...props}>{subItem.title}</a>
											{/snippet}
										</DropdownMenu.Item>
									{/each}
								</DropdownMenu.Content>
							</DropdownMenu.Root>
						</Sidebar.MenuItem>
					{:else}
						<!-- When sidebar is expanded: collapsible with sub-items -->
						<Collapsible.Root
							open={isOpen(item.title, item.defaultOpen)}
							onOpenChange={(v) => setOpen(item.title, v)}
							class="group/collapsible"
						>
							<Sidebar.MenuItem>
								<Collapsible.Trigger>
									{#snippet child({ props: triggerProps })}
										<Sidebar.MenuButton
											{...triggerProps}
											tooltipContent={item.title}
											isActive={isSectionActive}
										>
											{#snippet child({ props })}
												<button type="button" {...props}>
													<item.icon
														class="size-[1.1em] shrink-0 {isSectionActive ? 'text-primary' : ''}"
													/>
													<span
														class="flex flex-1 items-center gap-2 overflow-hidden text-[1.1em] {isSectionActive ? 'text-primary' : ''}"
													>
														<span class="truncate">{item.title}</span>
														<ChevronDown
															class="ms-auto size-4 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-180"
														/>
													</span>
												</button>
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
				{/if}
			{/each}
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
