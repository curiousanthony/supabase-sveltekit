<script lang="ts">
	import CreditCardIcon from '@tabler/icons-svelte/icons/credit-card';
	import DotsVerticalIcon from '@tabler/icons-svelte/icons/dots-vertical';
	import LogoutIcon from '@tabler/icons-svelte/icons/logout';
	import NotificationIcon from '@tabler/icons-svelte/icons/notification';
	import UserCircleIcon from '@tabler/icons-svelte/icons/user-circle';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import Settings from '@tabler/icons-svelte/icons/settings';
	import ArrowUp from '@tabler/icons-svelte/icons/arrow-up';
	import { setMode } from 'mode-watcher';
	import Monitor from '@lucide/svelte/icons/monitor';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import { onMount } from 'svelte';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import * as Button from '$lib/components/ui/button/index.js';

	type ThemeMode = 'system' | 'light' | 'dark';
	const MODE_STORAGE_KEY = 'mode-watcher-mode';

	let { user, roleLabel }: { user: { name: string; email: string; avatar_url: string }; roleLabel?: string | null } = $props();

	let themePreference = $state<ThemeMode>('system');

	onMount(() => {
		const stored = localStorage.getItem(MODE_STORAGE_KEY);
		if (stored === 'light' || stored === 'dark' || stored === 'system') {
			themePreference = stored;
		}
	});

	function handleThemeChange(value: ThemeMode) {
		themePreference = value;
		setMode(value);
	}

	const getInitials = (fullName: string = user.name) => {
		const allNames = fullName.trim().split(' ');
		const initials = allNames.reduce((acc, curr, index) => {
			if (index === 0 || index === allNames.length - 1) {
				acc = `${acc}${curr.charAt(0).toUpperCase()}`;
			}
			return acc;
		}, '');
		return initials;
	};

	const sidebar = Sidebar.useSidebar();
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Sidebar.MenuButton
						{...props}
						size="lg"
						class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
					>
						<Avatar.Root class="size-8 rounded-lg">
							<Avatar.Image src={user.avatar_url} alt={user.name} />
							<Avatar.Fallback class="rounded-lg">{getInitials(user.name)}</Avatar.Fallback>
						</Avatar.Root>
						<div class="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
							<span class="truncate font-medium">{user.name}</span>
							{#if roleLabel}
								<span class="truncate text-xs text-muted-foreground">
									{roleLabel}
								</span>
							{:else}
								<span class="truncate text-xs text-muted-foreground">
									{user.email}
								</span>
							{/if}
						</div>
						<DotsVerticalIcon class="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content
				class="w-(--bits-dropdown-menu-anchor-width) min-w-64 rounded-lg overflow-x-auto"
				side="top"
				align="end"
				sideOffset={4}
			>
				<DropdownMenu.Label class="p-0 font-normal">
					<div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
						<Avatar.Root class="size-8 rounded-lg">
							<Avatar.Image src={user.avatar_url} alt={user.name} />
							<Avatar.Fallback class="rounded-lg">CN</Avatar.Fallback>
						</Avatar.Root>
						<div class="grid flex-1 text-left text-sm leading-tight">
							<span class="truncate font-medium">{user.name}</span>
							<span class="truncate text-xs text-muted-foreground">
								{user.email}
							</span>
							{#if roleLabel}
								<span class="truncate text-xs text-muted-foreground">Rôle : {roleLabel}</span>
							{/if}
						</div>
					</div>
				</DropdownMenu.Label>
				<DropdownMenu.Separator />
				<DropdownMenu.Group>
					<DropdownMenu.Label class="text-xs text-muted-foreground">Thème</DropdownMenu.Label>
					<div class="py-1 w-full min-w-0">
						<ButtonGroup class="w-full min-w-0">
							<Button.Root
								type="button"
								variant={themePreference === 'system' ? 'secondary' : 'ghost'}
								size="sm"
								class="flex-1 min-w-0 gap-1.5 text-sm"
								onclick={() => handleThemeChange('system')}
							>
								<Monitor class="size-4 shrink-0" />
								Système
							</Button.Root>
							<Button.Root
								type="button"
								variant={themePreference === 'light' ? 'secondary' : 'ghost'}
								size="sm"
								class="flex-1 min-w-0 gap-1.5 text-sm"
								onclick={() => handleThemeChange('light')}
							>
								<Sun class="size-4 shrink-0" />
								Clair
							</Button.Root>
							<Button.Root
								type="button"
								variant={themePreference === 'dark' ? 'secondary' : 'ghost'}
								size="sm"
								class="flex-1 min-w-0 gap-1.5 text-sm"
								onclick={() => handleThemeChange('dark')}
							>
								<Moon class="size-4 shrink-0" />
								Sombre
							</Button.Root>
						</ButtonGroup>
					</div>
				</DropdownMenu.Group>
				<DropdownMenu.Separator />
				<DropdownMenu.Group>
					<DropdownMenu.Item>
						<ArrowUp />
						Passer au plan supérieur
					</DropdownMenu.Item>
					<!-- <DropdownMenu.Item>
						<UserCircleIcon />
						Mon compte
					</DropdownMenu.Item> -->
					<!-- <DropdownMenu.Item>
						<CreditCardIcon />
						Billing
					</DropdownMenu.Item> -->
					<DropdownMenu.Item>
						<Settings />
						Paramètres
					</DropdownMenu.Item>
					<!-- <DropdownMenu.Item>
						<NotificationIcon />
						Notifications
					</DropdownMenu.Item> -->
				</DropdownMenu.Group>
				<DropdownMenu.Separator />
				<DropdownMenu.Item
					onclick={() => {
						window.location.href = '/auth/logout';
					}}
				>
					<LogoutIcon />
					Se déconnecter
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>
