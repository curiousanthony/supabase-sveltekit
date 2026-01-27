<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import GalleryVerticalEndIcon from '@lucide/svelte/icons/gallery-vertical-end';
	let { workspaces, defaultWorkspace }: { workspaces: string[]; defaultWorkspace: string } =
		$props();
	let selectedWorkspace = $state(defaultWorkspace);
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
							<span>{selectedWorkspace}</span>
						</div>
						<ChevronsUpDownIcon class="ml-auto group-data-[collapsible=icon]:hidden" />
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="w-(--bits-dropdown-menu-anchor-width)" align="start">
				{#each workspaces as workspace (workspace)}
					<DropdownMenu.Item onSelect={() => (selectedWorkspace = workspace)}>
						{workspace}
						{#if workspace === selectedWorkspace}
							<CheckIcon class="ml-auto" />
						{/if}
					</DropdownMenu.Item>
				{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>
