<script lang="ts">
	import NavMain from './nav-main.svelte';
	import NavSecondary from './nav-secondary.svelte';
	import NavUser from './nav-user.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';

	const currentPath = $derived(page?.url?.pathname ?? '');
	import { sitemap } from '$lib/settings/config';
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
	// Main nav excludes root, inbox, and messagerie (they live in shortcuts only)
	const navItems = $derived(
		fullNavItems.filter((item) => item.url !== '/' && item.url !== '/inbox' && item.url !== '/messagerie')
	);

	/** Main nav with collapsible Contacts and (hidden) Outils */
	const mainNav = $derived(
		navItems.map((item) => {
			if (item.url === '/contacts') {
				return {
					type: 'collapsible' as const,
					title: item.title,
					icon: item.icon,
					children: [
						{ title: 'Formateurs', url: '/contacts/formateurs' },
						{ title: 'Clients', url: '/contacts/clients' },
						{ title: 'Apprenants', url: '/contacts/apprenants' }
					],
					defaultOpen: true,
					hidden: false
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
			return { type: 'link' as const, title: item.title, url: item.url, icon: item.icon };
		})
	);

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

	// Credits nav item (dummy value; will later reflect real balance)
	const navSecondaryItems = $derived([
		{ title: '1350 crédits', url: '/billing/credits', icon: Coins }
	]);
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
							tooltipContent="Chercher (⌘K)"
							onclick={() => openCommandPalette()}
							class="cursor-pointer"
						>
							<Search class="size-[1.1em]" />
							<span class="text-[1.1em]">Chercher</span>
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
						<Sidebar.MenuButton tooltipContent="Notifications" isActive={currentPath === '/inbox'}>
							{#snippet child({ props })}
								<a href="/inbox" {...props}>
									<Bell class="size-[1.1em] {currentPath === '/inbox' ? 'text-primary' : ''}" />
									<span class="text-[1.1em] {currentPath === '/inbox' ? 'text-primary' : ''}">Notifications</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
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
