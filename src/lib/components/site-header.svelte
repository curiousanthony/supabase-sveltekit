<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { IconCircleFilled, IconExternalLink, IconPlus, IconSearch } from '@tabler/icons-svelte';
	import Link from '@lucide/svelte/icons/link';
	import History from '@lucide/svelte/icons/history';
	import Archive from '@lucide/svelte/icons/archive';
	import DotsVertical from '@tabler/icons-svelte/icons/dots-vertical';
	import Copy from '@tabler/icons-svelte/icons/copy';
	import Trash from '@tabler/icons-svelte/icons/trash';
	import Badge from './ui/badge/badge.svelte';
	import BackButton from './custom/backButton.svelte';
	import ProgressRing from '$lib/components/custom/progress-ring.svelte';
	import { toast } from 'svelte-sonner';
	import { tick } from 'svelte';
	import { deserialize } from '$app/forms';
	import { invalidateAll, goto } from '$app/navigation';

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
	let deleteDialogOpen = $state(false);
	let deleteConfirmValue = $state('');
	let isDeleting = $state(false);

	async function startEdit() {
		nameEditValue = formationDisplayName;
		nameEditMode = true;
		await tick();
		nameInputEl?.focus();
		nameInputEl?.select();
	}

	async function saveName() {
		if (!nameEditMode) return;
		const trimmed = nameEditValue.trim();
		nameEditMode = false;
		if (!trimmed || trimmed === formationDisplayName) return;

		const formationId = formationAction?.formationId;
		if (!formationId) return;

		try {
			const formData = new FormData();
			formData.append('name', trimmed);
			const response = await fetch(`/formations/${formationId}?/renameFormation`, {
				method: 'POST',
				body: formData
			});
			const result = deserialize(await response.text());
			if (result.type === 'success') {
				toast.success('Nom mis à jour');
				await invalidateAll();
			} else if (result.type === 'failure') {
				toast.error((result.data as { message?: string })?.message ?? 'Erreur');
			}
		} catch {
			toast.error('Erreur réseau');
		}
	}

	function cancelEdit() {
		nameEditMode = false;
		nameEditValue = formationDisplayName;
	}

	async function handleArchive() {
		const formationId = formationAction?.formationId;
		if (!formationId) return;
		isDeleting = true;
		try {
			const response = await fetch(`/formations/${formationId}?/archiveFormation`, {
				method: 'POST',
				body: new FormData()
			});
			const result = deserialize(await response.text());
			if (result.type === 'redirect') {
				deleteDialogOpen = false;
				toast.success('Formation archivée');
				goto(result.location);
			} else if (result.type === 'failure') {
				toast.error((result.data as { message?: string })?.message ?? 'Erreur');
			}
		} catch {
			toast.error('Erreur réseau');
		} finally {
			isDeleting = false;
		}
	}

	async function handleDelete() {
		const formationId = formationAction?.formationId;
		if (!formationId) return;
		isDeleting = true;
		try {
			const response = await fetch(`/formations/${formationId}?/deleteFormation`, {
				method: 'POST',
				body: new FormData()
			});
			const result = deserialize(await response.text());
			if (result.type === 'redirect') {
				deleteDialogOpen = false;
				toast.success('Formation supprimée');
				goto(result.location);
			} else if (result.type === 'failure') {
				toast.error((result.data as { message?: string })?.message ?? 'Erreur');
			}
		} catch {
			toast.error('Erreur réseau');
		} finally {
			isDeleting = false;
		}
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
			<div class="flex min-w-0 items-center gap-2">
			{#if title}
				{@render title()}
			{:else if hasFormationButtonGroup}
				{#if nameEditMode}
					<input
						bind:this={nameInputEl}
						bind:value={nameEditValue}
						type="text"
						class="w-[200px] sm:w-[300px] rounded border bg-transparent px-1 py-0.5 text-base font-medium outline-none ring-1 ring-input focus:ring-2 focus:ring-ring"
						onkeydown={(e) => {
							if (e.key === 'Enter') saveName();
							if (e.key === 'Escape') cancelEdit();
						}}
						onblur={saveName}
					/>
				{:else}
					<button
						type="button"
						class="max-w-[200px] sm:max-w-[300px] truncate cursor-text rounded px-1 py-0.5 text-base font-medium transition-colors hover:bg-muted/50 text-left bg-transparent border-none"
						onclick={startEdit}
					>
						{formationDisplayName}
					</button>
				{/if}
			{:else}
				<h1 class="text-base font-medium">{header?.pageName ?? pageName ?? 'Page'}</h1>
			{/if}
			{#if header?.idInWorkspace != null}
				<span class="shrink-0 whitespace-nowrap text-muted-foreground text-sm font-mono">{header.idPrefix ?? 'FOR-'}{header.idInWorkspace}</span>
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
									deleteConfirmValue = '';
									deleteDialogOpen = true;
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

{#if hasFormationButtonGroup}
	<AlertDialog.Root bind:open={deleteDialogOpen}>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>Supprimer la formation</AlertDialog.Title>
				<AlertDialog.Description>
					Choisissez une option pour cette formation. L'archivage est réversible, la suppression est définitive.
				</AlertDialog.Description>
			</AlertDialog.Header>
			<div class="flex flex-col gap-3 py-2">
				<p class="text-sm text-muted-foreground">
					Pour supprimer définitivement, tapez <strong>{formationDisplayName}</strong> ci-dessous :
				</p>
				<input
					type="text"
					bind:value={deleteConfirmValue}
					placeholder={formationDisplayName}
					class="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
				/>
			</div>
			<AlertDialog.Footer>
				<AlertDialog.Cancel disabled={isDeleting}>Annuler</AlertDialog.Cancel>
				<Button
					variant="outline"
					disabled={isDeleting}
					onclick={handleArchive}
				>
					<Archive class="size-4" />
					Archiver
				</Button>
				<Button
					variant="destructive"
					disabled={isDeleting || deleteConfirmValue !== formationDisplayName}
					onclick={handleDelete}
				>
					<Trash class="size-4" />
					Supprimer
				</Button>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>
{/if}

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
