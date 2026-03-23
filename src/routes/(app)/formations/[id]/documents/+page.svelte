<script lang="ts">
	import type { PageProps } from './$types';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { enhance } from '$app/forms';
	import { deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import Files from '@lucide/svelte/icons/files';
	import FileSignature from '@lucide/svelte/icons/file-signature';
	import Mail from '@lucide/svelte/icons/mail';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import Award from '@lucide/svelte/icons/award';
	import BadgeCheck from '@lucide/svelte/icons/badge-check';
	import Receipt from '@lucide/svelte/icons/receipt';
	import Briefcase from '@lucide/svelte/icons/briefcase';
	import FileIcon from '@lucide/svelte/icons/file';
	import Plus from '@lucide/svelte/icons/plus';
	import Eye from '@lucide/svelte/icons/eye';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import type { Component } from 'svelte';

	let { data }: PageProps = $props();

	const DOC_TYPE_CONFIG: Record<string, { label: string; icon: Component }> = {
		convention: { label: 'Convention', icon: FileSignature },
		convocation: { label: 'Convocation', icon: Mail },
		feuille_emargement: { label: "Feuille d'émargement", icon: ClipboardList },
		certificat: { label: 'Certificat de réalisation', icon: Award },
		attestation: { label: 'Attestation', icon: BadgeCheck },
		devis: { label: 'Devis', icon: Receipt },
		ordre_mission: { label: 'Ordre de mission', icon: Briefcase },
		autre: { label: 'Autre', icon: FileIcon }
	};

	const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
		draft: { label: 'Brouillon', class: 'border-muted-foreground/30 text-muted-foreground' },
		pending_signature: {
			label: 'En attente de signature',
			class: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-400'
		},
		signed: {
			label: 'Signé',
			class: 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-400'
		},
		sent: {
			label: 'Envoyé',
			class: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-400'
		},
		archived: { label: 'Archivé', class: 'bg-secondary text-secondary-foreground' }
	};

	const GENERATABLE_TYPES = [
		'convention',
		'convocation',
		'certificat',
		'devis',
		'ordre_mission'
	] as const;

	const NEEDS_CONTACT = new Set(['convocation', 'certificat']);
	const NEEDS_FORMATEUR = new Set(['ordre_mission']);

	let typeFilter = $state<string>('all');
	let statusFilter = $state<string>('all');
	let previewOpen = $state(false);
	let previewUrl = $state('');
	let previewLoading = $state(false);
	let generateOpen = $state(false);
	let generateType = $state('');
	let generateContactId = $state('');
	let generateFormateurId = $state('');
	let generating = $state(false);
	let deleteDialogOpen = $state(false);
	let documentToDelete = $state<{ id: string; title: string } | null>(null);
	let deleting = $state(false);

	const formation = $derived(data.formation);
	const documents = $derived(data.documents ?? []);
	const apprenants = $derived(formation?.formationApprenants ?? []);
	const formateurs = $derived(formation?.formationFormateurs ?? []);

	const filteredDocuments = $derived.by(() => {
		let result = documents;
		if (typeFilter !== 'all') {
			result = result.filter((d) => d.type === typeFilter);
		}
		if (statusFilter !== 'all') {
			result = result.filter((d) => d.status === statusFilter);
		}
		return result;
	});

	const statusCounts = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const doc of documents) {
			counts[doc.status] = (counts[doc.status] ?? 0) + 1;
		}
		return counts;
	});

	function formatDate(dateStr: string | null | undefined) {
		if (!dateStr) return '';
		return new Date(dateStr).toLocaleDateString('fr-FR', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function personName(doc: (typeof documents)[number]) {
		if (doc.relatedContact) {
			return [doc.relatedContact.firstName, doc.relatedContact.lastName].filter(Boolean).join(' ');
		}
		if (doc.relatedFormateur?.user) {
			const u = doc.relatedFormateur.user;
			return [u.firstName, u.lastName].filter(Boolean).join(' ');
		}
		return null;
	}

	function openGenerate(type: string) {
		generateType = type;
		generateContactId = '';
		generateFormateurId = '';
		if (NEEDS_CONTACT.has(type) || NEEDS_FORMATEUR.has(type)) {
			generateOpen = true;
		} else {
			submitGenerate(type);
		}
	}

	async function submitGenerate(type?: string) {
		generating = true;
		const docType = type ?? generateType;
		const body = new FormData();
		body.set('type', docType);
		if (generateContactId) body.set('contactId', generateContactId);
		if (generateFormateurId) body.set('formateurId', generateFormateurId);

		try {
			const response = await fetch('?/generateDocument', { method: 'POST', body });
			const result = deserialize(await response.text());
			if (result.type === 'success') {
				toast.success('Document généré');
				generateOpen = false;
				await invalidateAll();
			} else if (result.type === 'failure') {
				toast.error((result.data as { message?: string })?.message ?? 'Erreur de génération');
			}
		} catch {
			toast.error('Erreur de génération');
		} finally {
			generating = false;
		}
	}

	async function openPreview(documentId: string) {
		previewLoading = true;
		previewOpen = true;
		const body = new FormData();
		body.set('documentId', documentId);

		try {
			const response = await fetch('?/getSignedUrl', { method: 'POST', body });
			const result = deserialize(await response.text());
			if (result.type === 'success' && (result.data as { url?: string })?.url) {
				previewUrl = (result.data as { url: string }).url;
			} else {
				toast.error('Impossible de charger le document');
				previewOpen = false;
			}
		} catch {
			toast.error('Impossible de charger le document');
			previewOpen = false;
		} finally {
			previewLoading = false;
		}
	}

	function confirmDelete(doc: { id: string; title: string }) {
		documentToDelete = doc;
		deleteDialogOpen = true;
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h2 class="flex items-center gap-2 text-lg font-semibold">
			<Files class="size-5" />
			Documents
			{#if documents.length > 0}
				<Badge variant="secondary" class="text-xs">{documents.length}</Badge>
			{/if}
		</h2>

		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Button {...props} variant="outline" size="sm" class="cursor-pointer">
						<Plus class="mr-1.5 size-4" />
						Générer un document
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end">
				{#each GENERATABLE_TYPES as type (type)}
					{@const config = DOC_TYPE_CONFIG[type]}
					<DropdownMenu.Item class="cursor-pointer gap-2" onclick={() => openGenerate(type)}>
						<config.icon class="size-4" />
						{config.label}
					</DropdownMenu.Item>
				{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>

	<!-- Filters -->
	<div class="flex flex-wrap items-center gap-3">
		<Select.Root type="single" bind:value={typeFilter}>
			<Select.Trigger class="h-8 w-[180px] text-xs cursor-pointer">
				{typeFilter === 'all' ? 'Tous les types' : DOC_TYPE_CONFIG[typeFilter]?.label ?? typeFilter}
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="all" label="Tous les types">Tous les types</Select.Item>
				{#each Object.entries(DOC_TYPE_CONFIG) as [key, config] (key)}
					<Select.Item value={key} label={config.label}>{config.label}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>

		<div class="flex flex-wrap gap-1.5">
			<button
				type="button"
				class="cursor-pointer"
				onclick={() => (statusFilter = 'all')}
			>
				<Badge
					variant={statusFilter === 'all' ? 'default' : 'outline'}
					class="cursor-pointer transition-colors"
				>
					Tous
				</Badge>
			</button>
			{#each Object.entries(STATUS_CONFIG) as [key, config] (key)}
				{#if statusCounts[key]}
					<button
						type="button"
						class="cursor-pointer"
						onclick={() => (statusFilter = statusFilter === key ? 'all' : key)}
					>
						<Badge
							variant="outline"
							class="cursor-pointer transition-colors {statusFilter === key ? config.class : ''}"
						>
							{config.label}
							<span class="ml-1 text-[10px] opacity-60">{statusCounts[key]}</span>
						</Badge>
					</button>
				{/if}
			{/each}
		</div>
	</div>

	<!-- Document list -->
	{#if filteredDocuments.length === 0}
		<Card.Root>
			<Card.Content class="py-12 text-center">
				<Files class="mx-auto mb-3 size-12 text-muted-foreground/30" />
				<p class="text-muted-foreground">
					{documents.length === 0 ? 'Aucun document généré.' : 'Aucun document ne correspond aux filtres.'}
				</p>
				{#if documents.length === 0}
					<p class="mt-1 text-sm text-muted-foreground">
						Utilisez le bouton « Générer un document » pour créer votre premier document.
					</p>
				{/if}
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="space-y-2">
			{#each filteredDocuments as doc (doc.id)}
				{@const typeConfig = DOC_TYPE_CONFIG[doc.type] ?? DOC_TYPE_CONFIG['autre']}
				{@const statusConfig = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG['draft']}
				{@const related = personName(doc)}
				<Card.Root>
					<Card.Content class="flex items-center gap-4 py-4">
						<div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
							<typeConfig.icon class="size-5 text-muted-foreground" />
						</div>

						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2">
								<p class="truncate text-sm font-medium">{doc.title || typeConfig.label}</p>
								<Badge variant="outline" class="shrink-0 text-[10px] {statusConfig.class}">
									{statusConfig.label}
								</Badge>
							</div>
							<div class="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
								{#if related}
									<span>{related}</span>
								{/if}
								{#if doc.generatedAt}
									<span>{formatDate(doc.generatedAt)}</span>
								{/if}
							</div>
						</div>

						<div class="flex shrink-0 items-center gap-1">
							{#if doc.storagePath}
								<Button
									variant="ghost"
									size="icon"
									class="size-8 cursor-pointer"
									onclick={() => openPreview(doc.id)}
									aria-label="Voir le PDF"
								>
									<Eye class="size-4" />
								</Button>
							{/if}
							<Button
								variant="ghost"
								size="icon"
								class="size-8 cursor-pointer text-destructive hover:text-destructive"
								onclick={() => confirmDelete({ id: doc.id, title: doc.title || typeConfig.label })}
								aria-label="Supprimer"
							>
								<Trash2 class="size-4" />
							</Button>
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{/if}
</div>

<!-- PDF Preview Dialog -->
<Dialog.Root bind:open={previewOpen} onOpenChange={(open) => { if (!open) previewUrl = ''; }}>
	<Dialog.Content class="max-h-[90vh] sm:max-w-4xl">
		<Dialog.Header>
			<Dialog.Title>Aperçu du document</Dialog.Title>
			<Dialog.Description class="sr-only">Prévisualisation PDF</Dialog.Description>
		</Dialog.Header>
		{#if previewLoading}
			<div class="flex h-96 items-center justify-center">
				<Loader2 class="size-8 animate-spin text-muted-foreground" />
			</div>
		{:else if previewUrl}
			<iframe src={previewUrl} class="h-[70vh] w-full rounded border" title="Aperçu PDF"></iframe>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<!-- Generate Document Dialog (for types needing a person selector) -->
<Dialog.Root bind:open={generateOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>
				Générer : {DOC_TYPE_CONFIG[generateType]?.label ?? generateType}
			</Dialog.Title>
			<Dialog.Description>
				{#if NEEDS_CONTACT.has(generateType)}
					Sélectionnez l'apprenant concerné.
				{:else if NEEDS_FORMATEUR.has(generateType)}
					Sélectionnez le formateur concerné.
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4 py-2">
			{#if NEEDS_CONTACT.has(generateType)}
				<Select.Root type="single" bind:value={generateContactId}>
					<Select.Trigger class="w-full cursor-pointer">
						{#if generateContactId}
							{@const found = apprenants.find((a) => a.contact?.id === generateContactId)}
							{found ? [found.contact.firstName, found.contact.lastName].filter(Boolean).join(' ') : 'Sélectionner'}
						{:else}
							<span class="text-muted-foreground">Sélectionner un apprenant</span>
						{/if}
					</Select.Trigger>
					<Select.Content>
						{#each apprenants as fa (fa.contact?.id)}
							{@const c = fa.contact}
							{@const name = [c?.firstName, c?.lastName].filter(Boolean).join(' ') || 'Sans nom'}
							<Select.Item value={c?.id ?? ''} label={name}>{name}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			{:else if NEEDS_FORMATEUR.has(generateType)}
				<Select.Root type="single" bind:value={generateFormateurId}>
					<Select.Trigger class="w-full cursor-pointer">
						{#if generateFormateurId}
							{@const found = formateurs.find((f) => f.formateur?.id === generateFormateurId)}
							{found ? [found.formateur.user?.firstName, found.formateur.user?.lastName].filter(Boolean).join(' ') : 'Sélectionner'}
						{:else}
							<span class="text-muted-foreground">Sélectionner un formateur</span>
						{/if}
					</Select.Trigger>
					<Select.Content>
						{#each formateurs as ff (ff.formateur?.id)}
							{@const u = ff.formateur?.user}
							{@const name = [u?.firstName, u?.lastName].filter(Boolean).join(' ') || 'Formateur'}
							<Select.Item value={ff.formateur?.id ?? ''} label={name}>{name}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			{/if}
		</div>

		<Dialog.Footer>
			<Button
				variant="outline"
				class="cursor-pointer"
				onclick={() => (generateOpen = false)}
			>
				Annuler
			</Button>
			<Button
				class="cursor-pointer"
				disabled={generating || (NEEDS_CONTACT.has(generateType) && !generateContactId) || (NEEDS_FORMATEUR.has(generateType) && !generateFormateurId)}
				onclick={() => submitGenerate()}
			>
				{#if generating}
					<Loader2 class="mr-1.5 size-4 animate-spin" />
					Génération...
				{:else}
					Générer
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Confirmation Dialog -->
<Dialog.Root bind:open={deleteDialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Supprimer le document</Dialog.Title>
			<Dialog.Description>
				Êtes-vous sûr de vouloir supprimer « {documentToDelete?.title ?? ''} » ? Cette action est irréversible.
			</Dialog.Description>
		</Dialog.Header>

		{#if documentToDelete}
			<form
				method="POST"
				action="?/deleteDocument"
				use:enhance={() => {
					deleting = true;
					return async ({ result, update }) => {
						deleting = false;
						if (result.type === 'success') {
							toast.success('Document supprimé');
							deleteDialogOpen = false;
							documentToDelete = null;
							await update();
						} else if (result.type === 'failure') {
							toast.error((result.data as { message?: string })?.message ?? 'Erreur');
						}
					};
				}}
			>
				<input type="hidden" name="documentId" value={documentToDelete.id} />
				<Dialog.Footer>
					<Button
						variant="outline"
						type="button"
						class="cursor-pointer"
						onclick={() => { deleteDialogOpen = false; documentToDelete = null; }}
					>
						Annuler
					</Button>
					<Button type="submit" variant="destructive" class="cursor-pointer" disabled={deleting}>
						{deleting ? 'Suppression...' : 'Supprimer'}
					</Button>
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>
