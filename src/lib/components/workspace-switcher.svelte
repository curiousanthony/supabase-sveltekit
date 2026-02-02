<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import GalleryVerticalEndIcon from '@lucide/svelte/icons/gallery-vertical-end';
	import SettingsIcon from '@tabler/icons-svelte/icons/settings';
	import { invalidateAll, goto } from '$app/navigation';

	interface WorkspaceItem {
		id: string;
		name: string | null;
		role: string;
		roleLabel?: string;
	}

	let {
		workspaces = [],
		defaultWorkspace = null,
		canManageWorkspace = false
	}: {
		workspaces: WorkspaceItem[];
		defaultWorkspace: { id: string; name: string | null } | null;
		canManageWorkspace?: boolean;
	} = $props();

	let selectedWorkspace = $state(defaultWorkspace ?? (workspaces[0] ? { id: workspaces[0].id, name: workspaces[0].name } : null));
	let isSwitching = $state(false);

	$effect(() => {
		if (defaultWorkspace && defaultWorkspace.id !== selectedWorkspace?.id) {
			selectedWorkspace = defaultWorkspace;
		}
	});

	const displayName = $derived(selectedWorkspace?.name ?? 'Espace de travail');

	async function switchWorkspace(ws: WorkspaceItem) {
		if (ws.id === selectedWorkspace?.id) return;
		if (isSwitching) return;

		isSwitching = true;
		try {
			const res = await fetch('/api/workspace/switch', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ workspaceId: ws.id })
			});

			if (res.ok) {
				selectedWorkspace = ws;
				await invalidateAll();
			}
		} finally {
			isSwitching = false;
		}
	}
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Sidebar.MenuButton
						size="lg"
						class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						{...props}
					>
						<div
							class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
						>
							<GalleryVerticalEndIcon class="size-4" />
						</div>
						<div class="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
							<span class="font-medium">Espace de travail</span>
							<span>{displayName}</span>
						</div>
						<ChevronsUpDownIcon class="ml-auto group-data-[collapsible=icon]:hidden" />
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="w-(--bits-dropdown-menu-anchor-width)" align="start">
				{#each workspaces as ws (ws.id)}
					<DropdownMenu.Item onSelect={() => switchWorkspace(ws)} disabled={isSwitching}>
						<div class="flex flex-col gap-0.5">
							<span>{ws.name ?? 'Sans nom'}</span>
							{#if ws.roleLabel}
								<span class="text-xs text-muted-foreground">{ws.roleLabel}</span>
							{/if}
						</div>
						{#if selectedWorkspace?.id === ws.id}
							<CheckIcon class="ml-auto" />
						{/if}
					</DropdownMenu.Item>
				{/each}
				{#if workspaces.length > 0}
					<DropdownMenu.Separator />
					<DropdownMenu.Item onSelect={() => goto('/parametres/workspace')}>
						<SettingsIcon class="size-4" />
						Paramètres de l'espace
					</DropdownMenu.Item>
				{/if}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>
