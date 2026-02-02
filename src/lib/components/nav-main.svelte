<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import type { Icon } from '@tabler/icons-svelte';
	import { page } from '$app/state';
	import Plus from '@tabler/icons-svelte/icons/plus';
	import HeartHandshake from '@tabler/icons-svelte/icons/heart-handshake';
	import Book2 from '@tabler/icons-svelte/icons/book-2';
	import Users from '@tabler/icons-svelte/icons/users';

	let { items, allowedNavUrls = [] }: { items: { title: string; url: string; icon?: Icon }[]; allowedNavUrls?: string[] } = $props();

	const quickCreateActions = $derived(
		[
			{ title: 'Créer un deal', href: '/deals/creer', icon: HeartHandshake, show: allowedNavUrls.includes('/deals') },
			{ title: 'Créer une formation', href: '/formations/creer', icon: Book2, show: allowedNavUrls.includes('/formations') },
			{ title: 'Contacts', href: '/contacts', icon: Users, show: allowedNavUrls.includes('/contacts') }
		].filter((a) => a.show)
	);

	/**
	 * Calculates the active state for a menu item using robust route matching.
	 */
	function calculateIsActive(itemUrl: string, currentPath: string): boolean {
		const isRoot = itemUrl === '/';
		const isCurrentPage = currentPath === itemUrl;
		const isParent = !isRoot && currentPath.startsWith(itemUrl + '/');
		return isCurrentPage || isParent;
	}
</script>

<Sidebar.Group>
	<Sidebar.GroupContent class="flex flex-col gap-2">
		<Sidebar.Menu>
			<Sidebar.MenuItem class="flex items-center gap-2">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Sidebar.MenuButton
								{...props}
								class="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground data-[state=open]:bg-primary/90 data-[state=open]:text-primary-foreground cursor-pointer"
								tooltipContent="Nouveau"
							>
								<Plus class="h-4 w-4" stroke={3} />
								<span class="font-semibold">Nouveau</span>
							</Sidebar.MenuButton>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content
						class="min-w-56 rounded-lg"
						side="bottom"
						align="start"
						sideOffset={4}
					>
						<DropdownMenu.Label class="text-xs text-muted-foreground">
							Choisissez ce que vous voulez créer
						</DropdownMenu.Label>
						<DropdownMenu.Separator />
						{#each quickCreateActions as action (action.href)}
							<DropdownMenu.Item onclick={() => goto(action.href)}>
								<action.icon class="size-4 shrink-0" />
								{action.title}
							</DropdownMenu.Item>
						{/each}
						{#if quickCreateActions.length === 0}
							<DropdownMenu.Item disabled>
								<span class="text-muted-foreground">Aucune action disponible</span>
							</DropdownMenu.Item>
						{/if}
					</DropdownMenu.Content>
				</DropdownMenu.Root>
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
