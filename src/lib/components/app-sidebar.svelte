<script lang="ts">
	import NavMain from './nav-main.svelte';
	import NavSecondary from './nav-secondary.svelte';
	import NavUser from './nav-user.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import { Kbd } from '$lib/components/ui/kbd/index.js';
	import { defaultWipTooltip, sitemap, sidebarHidden } from '$lib/settings/config';
	import VersionSwitcher from './workspace-switcher.svelte';
	import { openCommandPalette } from '$lib/stores/command-palette-store';
	import Search from '@lucide/svelte/icons/search';
	import Home from '@lucide/svelte/icons/home';
	import Bell from '@lucide/svelte/icons/bell';
	import MessageCircle from '@lucide/svelte/icons/message-circle';
	import Plus from '@lucide/svelte/icons/plus';
	import Handshake from '@lucide/svelte/icons/handshake';
	import GraduationCap from '@lucide/svelte/icons/graduation-cap';
	import Coins from '@lucide/svelte/icons/coins';

	const currentPath = $derived(page?.url?.pathname ?? '');

	let {
		userObject,
		workspace,
		workspacePlanTitle,
		workspaces = [],
		role,
		roleLabel,
		allowedNavUrls = [],
		...restProps
	} = $props();

	const sidebar = Sidebar.useSidebar();
	afterNavigate(() => {
		if (sidebar.isMobile) {
			sidebar.setOpenMobile(false);
		}
	});

	let {
		name = 'Test',
		email = 'test@test.com',
		avatar_url = ''
	} = $derived(userObject?.user_metadata ?? {});

	const fullNavItems = $derived(
		allowedNavUrls?.length ? sitemap.filter((item) => allowedNavUrls.includes(item.url)) : sitemap
	);
	// Main nav excludes root, inbox, messagerie (shortcuts), and any sidebarHidden URLs
	const navItems = $derived(
		fullNavItems.filter(
			(item) =>
				item.url !== '/' &&
				item.url !== '/inbox' &&
				item.url !== '/messagerie' &&
				!sidebarHidden.includes(item.url)
		)
	);

	/** Main nav: CRM is a single link (tabs on the page). (hidden) Outils collapsible. */
	const mainNav = $derived(
		navItems.map((item) => {
			if (item.url === '/contacts') {
				return {
					type: 'link' as const,
					title: 'CRM',
					url: '/contacts',
					icon: item.icon,
					wip: item.wip,
					disabled: item.disabled,
					wipBadge: item.wipBadge,
					wipTooltip: item.wipTooltip
				};
			}
			if (item.url === '/outils') {
				return {
					type: 'collapsible' as const,
					title: item.title,
					icon: item.icon,
					// Future-planned child nav items; hidden from sidebar until developed
					children: [
						{ title: 'Placeholder 1', url: '#' },
						{ title: 'Placeholder 2', url: '#' }
					],
					defaultOpen: false,
					hidden: true
				};
			}
			return {
				type: 'link' as const,
				title: item.title,
				url: item.url,
				icon: item.icon,
				wip: item.wip,
				disabled: item.disabled,
				wipBadge: item.wipBadge,
				wipTooltip: item.wipTooltip
			};
		})
	);

	/** Inbox/Notifications shortcut item from sitemap (for WIP tooltip + disabled state in top bar). */
	const inboxNavItem = $derived(fullNavItems.find((i) => i.url === '/inbox'));
	const inboxWip = $derived(inboxNavItem?.wip ?? false);
	const inboxDisabled = $derived(inboxNavItem?.disabled ?? inboxWip);

	const quickCreateActions = $derived(
		[
			{
				title: 'Créer un deal',
				href: '/deals/creer',
				icon: Handshake,
				show: allowedNavUrls.includes('/deals')
			},
			{
				title: 'Créer une formation',
				href: '/formations/creer',
				icon: GraduationCap,
				show: allowedNavUrls.includes('/formations')
			}
		].filter((a) => a.show)
	);

	// Credits nav item (dummy value; will later reflect real balance); hidden when 'credits' in sidebarHidden
	const navSecondaryItems = $derived(
		sidebarHidden.includes('credits')
			? []
			: [{ title: '1350 crédits', url: '/billing/credits', icon: Coins }]
	);

	const showMessagerieShortcut = $derived(!sidebarHidden.includes('/messagerie'));

	const isMac = browser ? /Mac|iPhone|iPad/.test(navigator.userAgent) : false;
	const shortcutLabel = isMac ? '⌘K' : 'Ctrl K';
</script>

<Sidebar.Root collapsible="icon" {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<VersionSwitcher
					workspaces={workspaces}
					defaultWorkspace={workspace}
					workspacePlanTitle={workspacePlanTitle}
					canManageWorkspace={role === 'owner' || role === 'admin'}
				/>
				<!-- <Logo /> -->
				<!-- <Sidebar.MenuButton class="data-[slot=sidebar-menu-button]:p-1.5!"> -->
				<!-- {#snippet child({ props })}
						<a href="/" {...props} class="flex flex-col items-start">
							<img src={appInfo.logo} alt={appInfo.name} class="h-6" />
							<span class="text-xl font-bold text-[#EE2B47]">Manager</span>
						</a>
					{/snippet} -->
				<!-- </Sidebar.MenuButton> -->
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<!-- Top section: Nouveau, then shortcuts (Chercher, Accueil, Notifications, Messagerie) -->
	<Sidebar.Content class="flex-none shrink-0">
		<Sidebar.Group>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					<Sidebar.MenuItem>
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<Sidebar.MenuButton
										{...props}
										class="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground data-[state=open]:bg-primary/90 data-[state=open]:text-primary-foreground cursor-pointer"
										tooltipContent="Nouveau"
									>
										<Plus class="h-4 w-4" strokeWidth={3} />
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
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							tooltipContent="Chercher ({shortcutLabel})"
							onclick={() => openCommandPalette()}
							class="cursor-pointer"
						>
							<Search class="size-[1.1em]" />
							<span class="text-[1.1em]">Chercher</span>
							{#if sidebar.state !== 'collapsed'}
								<Kbd class="ms-auto">{shortcutLabel}</Kbd>
							{/if}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton tooltipContent="Accueil" isActive={currentPath === '/'}>
							{#snippet child({ props })}
								<a href="/" {...props}>
									<Home class="size-[1.1em] {currentPath === '/' ? 'text-primary' : ''}" />
									<span class="text-[1.1em] {currentPath === '/' ? 'text-primary' : ''}">Accueil</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							tooltipContent={inboxWip && inboxDisabled ? (inboxNavItem?.wipTooltip ?? defaultWipTooltip) : 'Notifications'}
							tooltipContentProps={inboxWip && inboxDisabled ? { hidden: false, class: 'max-w-xs' } : undefined}
							isActive={!inboxDisabled && currentPath === '/inbox'}
						>
							{#snippet child({ props })}
								{#if inboxDisabled}
									<span
										{...props}
										aria-disabled="true"
										class="{props.class ?? ''} pointer-events-auto! cursor-not-allowed! text-sidebar-foreground/80"
									>
										<Bell class="size-[1.1em] shrink-0 text-sidebar-foreground/80" />
										<span class="text-[1.1em] text-sidebar-foreground/80">Notifications</span>
										{#if inboxWip && sidebar.state !== 'collapsed'}
											<span
												class="ms-auto shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground"
											>
												{inboxNavItem?.wipBadge ?? 'Bêta'}
											</span>
										{/if}
									</span>
								{:else}
									<a href="/inbox" {...props}>
										<Bell class="size-[1.1em] {currentPath === '/inbox' ? 'text-primary' : ''}" />
										<span class="text-[1.1em] {currentPath === '/inbox' ? 'text-primary' : ''}">Notifications</span>
										{#if inboxWip && sidebar.state !== 'collapsed'}
											<span
												class="ms-auto shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground"
											>
												{inboxNavItem?.wipBadge ?? 'Bêta'}
											</span>
										{/if}
									</a>
								{/if}
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					{#if showMessagerieShortcut}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton tooltipContent="Messagerie" isActive={currentPath === '/messagerie'}>
								{#snippet child({ props })}
									<a href="/messagerie" {...props}>
										<MessageCircle class="size-[1.1em] {currentPath === '/messagerie' ? 'text-primary' : ''}" />
										<span class="text-[1.1em] {currentPath === '/messagerie' ? 'text-primary' : ''}">Messagerie</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/if}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>
	<Sidebar.Separator />
	<Sidebar.Content class="gap-0 flex-1 min-h-0 flex flex-col">
		<NavMain mainNav={mainNav} />
		<NavSecondary items={navSecondaryItems} class="mt-auto" />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser user={userObject?.user_metadata ?? {}} roleLabel={roleLabel} />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
