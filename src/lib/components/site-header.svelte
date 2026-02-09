<script lang="ts">
	// import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { IconCircleFilled, IconExternalLink, IconPlus, IconSearch } from '@tabler/icons-svelte';
	import Share from '@tabler/icons-svelte/icons/share';
	import History from '@tabler/icons-svelte/icons/history';
	import DotsVertical from '@tabler/icons-svelte/icons/dots-vertical';
	import Pencil from '@tabler/icons-svelte/icons/pencil';
	import Copy from '@tabler/icons-svelte/icons/copy';
	import MessageCircle from '@tabler/icons-svelte/icons/message-circle';
	import Trash from '@tabler/icons-svelte/icons/trash';
	import Badge from './ui/badge/badge.svelte';
	import BackButton from './custom/backButton.svelte';
	// import { sitemap } from '$lib/settings/config';

	let { pageName = 'Default Page Name', header = null, title } = $props();
</script>

<header
	class="sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)"
>
	<div class="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
		<!-- Sidebar trigger to replace with mobile bottom nav later -->
		<Sidebar.Trigger class="-ml-1" />
		{#if header?.backButton}
			<BackButton href={header?.backButtonHref} label={header?.backButtonLabel} />
			<!-- <Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" /> -->
		{/if}
		<!-- Title, Formation ID (#n), then status badge (order per design) -->
		<div class="flex items-center gap-2">
			{#if title}
				{@render title()}
			{:else}
				<h1 class="text-base font-medium">{pageName}</h1>
			{/if}
			{#if header?.idInWorkspace != null}
				<span class="text-muted-foreground text-sm font-mono">#{header.idInWorkspace}</span>
			{/if}
			{#each header?.actions ?? [] as action}
				{#if action.type === 'badge'}
					<Badge variant={action?.variant ?? 'default'} class={action?.className}>
						{@render actionIcon(action)}
						{action.text}
					</Badge>
				{/if}
			{/each}
		</div>
		<!-- <div class="ml-auto flex items-center gap-2">
			<Button
				href="https://github.com/shadcn-ui/ui/tree/main/apps/v4/app/(examples)/dashboard"
				variant="ghost"
				size="sm"
				class="hidden sm:flex dark:text-foreground"
				target="_blank"
				rel="noopener noreferrer"
			>
				GitHub
			</Button>
		</div> -->

		<!-- Right Side: Dynamic Content Slot (Actions Area) -->
		<!-- <div class="flex items-center space-x-4">
			{@render $slots.actions()}
		</div> -->
		{#if header?.actions}
			{@render actions?.()}
		{/if}
	</div>
</header>

{#snippet actions()}
	<!-- Default empty area if parent doesn’t override -->
	<div class="ml-auto flex items-center gap-2">
		<!-- <p>Default actions from site-header.svelte</p> -->
		<!-- <Button href={header.actions.href}>{header.actions.label}</Button> -->
		{#each header?.actions ?? [] as action}
			{#if action.type === 'button'}
				<Button
					href={action?.href}
					class={action?.className}
					variant={action?.variant ?? 'default'}
				>
					{@render actionIcon(action)}
					{action.text}
				</Button>
			{:else if action.type === 'formationButtonGroup'}
				<!-- Formation header: share link, history, more-options dropdown (edit, copy, discuss, delete) -->
				<ButtonGroup.Root aria-label="Actions formation">
					<!-- Will: share the Formation link -->
					<Button
						variant="outline"
						size="icon-sm"
						aria-label="Partager le lien de la formation"
						onclick={() => {}}
					>
						<Share class="size-4" />
					</Button>
					<!-- Will: open modifications history logs -->
					<Button
						variant="outline"
						size="icon-sm"
						aria-label="Voir l'historique des modifications"
						onclick={() => {}}
					>
						<History class="size-4" />
					</Button>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									variant="outline"
									size="icon-sm"
									aria-label="Plus d'options"
									class="data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
								>
									<DotsVertical class="size-4" />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" class="w-56">
							<DropdownMenu.Group>
								<!-- Will: navigate to edit formation -->
								<DropdownMenu.Item onclick={() => {}}>
									<Pencil class="size-4" />
									Modifier la formation
								</DropdownMenu.Item>
								<!-- Will: copy formation info to clipboard -->
								<DropdownMenu.Item onclick={() => {}}>
									<Copy class="size-4" />
									Copier les informations
								</DropdownMenu.Item>
								<!-- Will: open discuss-with flow (e.g. share or message) -->
								<DropdownMenu.Item onclick={() => {}}>
									<MessageCircle class="size-4" />
									En discuter avec...
								</DropdownMenu.Item>
							</DropdownMenu.Group>
							<DropdownMenu.Separator />
							<DropdownMenu.Group>
								<!-- Will: delete the formation (with confirmation) -->
								<DropdownMenu.Item variant="destructive" onclick={() => {}}>
									<Trash class="size-4" />
									Supprimer la formation
								</DropdownMenu.Item>
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</ButtonGroup.Root>
			{:else if action.type === 'separator'}
				<Separator
					orientation={action?.orientation ?? 'vertical'}
					class="mx-2 data-[orientation=vertical]:h-4"
				/>
			{/if}
		{/each}
	</div>
{/snippet}

{#snippet actionIcon(action: { icon: string })}
	{#if action?.icon === 'plus'}
		<IconPlus />
	{:else if action?.icon === 'external'}
		<IconExternalLink />
	{:else if action?.icon === 'circle'}
		<IconCircleFilled />
	{:else if action?.icon === 'search'}
		<IconSearch />
	{/if}
{/snippet}
