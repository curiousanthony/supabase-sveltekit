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
		logoUrl?: string | null;
	}

	let {
		workspaces = [],
		defaultWorkspace = null,
		canManageWorkspace = false,
		workspacePlanTitle = 'Mentore Pro'
	}: {
		workspaces: WorkspaceItem[];
		defaultWorkspace: { id: string; name: string | null; logoUrl?: string | null } | null;
		canManageWorkspace?: boolean;
		/** Current workspace pricing plan title. TODO: will be replaced with actual workspace plan from DB/billing. */
		workspacePlanTitle?: string;
	} = $props();

	type SelectedShape = { id: string; name: string | null };

	const serverWorkspace = $derived.by((): SelectedShape | null => {
		if (defaultWorkspace) {
			return { id: defaultWorkspace.id, name: defaultWorkspace.name };
		}
		const first = workspaces[0];
		return first ? { id: first.id, name: first.name } : null;
	});

	/** Shown after a successful switch until load data catches up with `defaultWorkspace`. */
	let pendingWorkspace = $state<SelectedShape | null>(null);

	const selectedWorkspace = $derived.by((): SelectedShape | null => {
		return pendingWorkspace ?? serverWorkspace;
	});

	let isSwitching = $state(false);

	const displayName = $derived(selectedWorkspace?.name ?? 'Espace de travail');

	async function switchWorkspace(ws: WorkspaceItem) {
		if (ws.id === selectedWorkspace?.id) return;
		if (isSwitching) return;

		isSwitching = true;
		try {
			// Clear "See as" cookie when switching workspaces
			document.cookie = 'see_as=; path=/; max-age=0';
			
			const res = await fetch('/api/workspace/switch', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ workspaceId: ws.id })
			});

			if (res.ok) {
				pendingWorkspace = { id: ws.id, name: ws.name };
				await invalidateAll();
				pendingWorkspace = null;
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
							class="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden {defaultWorkspace?.logoUrl ? '' : 'bg-sidebar-accent text-sidebar-accent-foreground'}"
						>
							{#if defaultWorkspace?.logoUrl}
								<img
									src={defaultWorkspace.logoUrl}
									alt={displayName}
									class="size-full object-cover"
								/>
							{:else}
								<GalleryVerticalEndIcon class="size-4" />
							{/if}
						</div>
						<div class="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
							<span class="font-medium">{displayName}</span>
							<!-- Plan title: TODO replace with actual workspace plan from DB/billing -->
							<span class="text-muted-foreground text-xs">{workspacePlanTitle}</span>
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
