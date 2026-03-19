<script lang="ts">
	// import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { IconCircleFilled, IconExternalLink, IconPlus, IconSearch } from '@tabler/icons-svelte';
	import Link from '@lucide/svelte/icons/link';
	import History from '@lucide/svelte/icons/history';
	import DotsVertical from '@tabler/icons-svelte/icons/dots-vertical';
	import Copy from '@tabler/icons-svelte/icons/copy';
	import Trash from '@tabler/icons-svelte/icons/trash';
	import Badge from './ui/badge/badge.svelte';
	import BackButton from './custom/backButton.svelte';
	import ProgressRing from '$lib/components/custom/progress-ring.svelte';
	import { toast } from 'svelte-sonner';
	import { tick } from 'svelte';

	import type { Snippet } from 'svelte';

	let {
		pageName = 'Default Page Name',
		header = null,
		title,
		actions: actionsSnippetProp = undefined
	}: {
		pageName?: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		header?: any;
		title?: Snippet;
		actions?: Snippet;
	} = $props();

	const formationAction = $derived(
		header?.actions?.find((a: { type: string }) => a.type === 'formationButtonGroup')
	);
	const hasFormationButtonGroup = $derived(!!formationAction);
	const formationDisplayName = $derived(
		formationAction?.formationData?.name ?? header?.pageName ?? pageName ?? 'Page'
	);

	let nameEditMode = $state(false);
	let nameEditValue = $state('');
	let nameInputEl: HTMLInputElement | undefined = $state();

	async function startEdit() {
		nameEditValue = formationDisplayName;
		nameEditMode = true;
		await tick();
		nameInputEl?.focus();
		nameInputEl?.select();
	}

	function saveName() {
		if (nameEditMode) {
			const trimmed = nameEditValue.trim();
			if (trimmed && trimmed !== formationDisplayName) {
				formationAction?.onRename?.(trimmed);
			}
			nameEditMode = false;
		}
	}

	function cancelEdit() {
		nameEditMode = false;
		nameEditValue = formationDisplayName;
	}

	function formatFormationSummary(data: {
		name?: string;
		idInWorkspace?: number | null;
		type?: string | null;
		modalite?: string | null;
		duree?: number | null;
		dateDebut?: string | null;
		dateFin?: string | null;
		clientName?: string | null;
		formateurName?: string | null;
		statut?: string | null;
	}) {
		const fmt = (v: unknown) => (v != null ? String(v) : '—');
		const formatDate = (d: string | null | undefined) => {
			if (!d) return '—';
			const date = new Date(d);
			if (isNaN(date.getTime())) return '—';
			return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
		};
		const prefix = header?.idPrefix ?? 'FOR-';
		return [
			`Formation : ${fmt(data.name)}`,
			`Réf : ${prefix}${fmt(data.idInWorkspace)}`,
			`Type : ${fmt(data.type)} | Modalité : ${fmt(data.modalite)}`,
			`Durée : ${fmt(data.duree)}h`,
			`Dates : ${formatDate(data.dateDebut)} – ${formatDate(data.dateFin)}`,
			`Client : ${fmt(data.clientName)}`,
			`Formateur : ${data.formateurName?.trim() ? data.formateurName : 'Non assigné'}`,
			`Statut : ${fmt(data.statut)}`
		].join('\n');
	}
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
		<!-- Title, Formation ID (FOR-n), then status badge (order per design) -->
		<div class="flex min-w-0 items-center gap-2">
			{#if title}
				{@render title()}
			{:else if hasFormationButtonGroup}
				{#if nameEditMode}
					<input
						bind:this={nameInputEl}
						bind:value={nameEditValue}
						type="text"
						class="min-w-0 flex-1 rounded border bg-transparent px-1 py-0.5 text-base font-medium outline-none ring-1 ring-input focus:ring-2 focus:ring-ring"
						onkeydown={(e) => {
							if (e.key === 'Enter') saveName();
							if (e.key === 'Escape') cancelEdit();
						}}
						onblur={saveName}
					/>
				{:else}
					<button
						type="button"
						class="cursor-text rounded px-1 py-0.5 text-base font-medium transition-colors hover:bg-muted/50 text-left bg-transparent border-none w-full min-w-0"
						onclick={startEdit}
					>
						{formationDisplayName}
					</button>
				{/if}
			{:else}
				<h1 class="text-base font-medium">{header?.pageName ?? pageName ?? 'Page'}</h1>
			{/if}
		{#if header?.idInWorkspace != null}
			<span class="text-muted-foreground text-sm font-mono">{header.idPrefix ?? 'FOR-'}{header.idInWorkspace}</span>
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
	<div class="ml-auto flex items-center gap-2">
		{#if actionsSnippetProp}
			{@render actionsSnippetProp()}
		{:else if header?.actions?.length}
			{@render actions()}
		{/if}
	</div>
	</div>
</header>

{#snippet actions()}
	<!-- Default actions from header.actions (button, formationButtonGroup, separator, etc.) -->
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
			<!-- Formation header: ProgressRing, link copy, history, more-options dropdown (copy, delete) -->
			<div class="flex items-center gap-2">
				<ProgressRing percent={action.questProgress ?? 0} size={28} strokeWidth={3} class="shrink-0" />
				<ButtonGroup.Root aria-label="Actions formation" class="items-stretch">
					<Button
						variant="outline"
						size="icon"
						aria-label="Copier le lien de la formation"
						onclick={async () => {
							try {
								await navigator.clipboard.writeText(typeof window !== 'undefined' ? window.location.href : '');
								toast.success('Lien copié !');
							} catch {
								toast.error('Impossible de copier le lien');
							}
						}}
						class="size-9 min-h-9 min-w-9 p-2"
					>
						<Link class="size-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						aria-label="Voir l'historique des modifications"
						onclick={() => toast.info('Historique bientôt disponible')}
						class="size-9 min-h-9 min-w-9 p-2"
					>
						<History class="size-4" />
					</Button>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									variant="outline"
									size="icon"
									aria-label="Plus d'options"
									class="size-9 min-h-9 min-w-9 p-2 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
								>
									<DotsVertical class="size-4" />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" class="w-56">
							<DropdownMenu.Group>
								<DropdownMenu.Item
									onclick={async () => {
										const data = action.formationData;
										if (!data) return;
										const text = formatFormationSummary(data);
										try {
											await navigator.clipboard.writeText(text);
											toast.success('Informations copiées !');
										} catch {
											toast.error('Impossible de copier');
										}
									}}
								>
									<Copy class="size-4" />
									Copier les informations
								</DropdownMenu.Item>
							</DropdownMenu.Group>
							<DropdownMenu.Separator />
							<DropdownMenu.Group>
								<DropdownMenu.Item
									variant="destructive"
									onclick={() => {
										if (window.confirm('Supprimer cette formation ?')) {
											action.onDelete?.();
										}
									}}
								>
									<Trash class="size-4" />
									Supprimer la formation
								</DropdownMenu.Item>
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</ButtonGroup.Root>
			</div>
		{:else if action.type === 'separator'}
			<Separator
				orientation={action?.orientation ?? 'vertical'}
				class="mx-2 data-[orientation=vertical]:h-4"
			/>
		{/if}
		{/each}
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
