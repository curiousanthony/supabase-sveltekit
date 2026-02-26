<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import Plus from '@lucide/svelte/icons/plus';
	import Upload from '@lucide/svelte/icons/upload';
	import Link from '@lucide/svelte/icons/link';
	import FileText from '@lucide/svelte/icons/file-text';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import FileIcon from '@lucide/svelte/icons/file';
	import { headerActionsSnippet } from '$lib/stores/header-store';

	let { data }: PageProps = $props();
	let { supports } = $derived(data);

	let showUploadDialog = $state(false);
	let showLinkDialog = $state(false);

	onMount(() => {
		headerActionsSnippet.set(pageActions);
		return () => headerActionsSnippet.set(null);
	});

	function formatSize(bytes: number | null) {
		if (bytes == null) return '—';
		if (bytes < 1024) return `${bytes} o`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
	}

	function isFileSupport(s: { filePath: string | null; url: string | null }) {
		return !!s.filePath;
	}
</script>

<svelte:head>
	<title>Supports — Bibliothèque</title>
</svelte:head>

{#snippet pageActions()}
	<div class="ml-auto flex items-center gap-2">
		<Button size="sm" variant="outline" onclick={() => (showLinkDialog = true)}>
			<Link class="mr-1 size-4" />
			Ajouter un lien
		</Button>
		<Button size="sm" onclick={() => (showUploadDialog = true)}>
			<Upload class="mr-1 size-4" />
			Nouveau support
		</Button>
	</div>
{/snippet}

<div class="flex flex-col gap-4">
	{#if supports.length === 0}
		<div
			class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16"
		>
			<FileText class="size-10 text-muted-foreground" />
			<p class="text-sm text-muted-foreground">Aucun support pour le moment</p>
			<div class="flex gap-2">
				<Button size="sm" variant="outline" onclick={() => (showLinkDialog = true)}>
					<Link class="mr-1 size-4" />
					Ajouter un lien
				</Button>
				<Button size="sm" onclick={() => (showUploadDialog = true)}>
					<Upload class="mr-1 size-4" />
					Nouveau support
				</Button>
			</div>
		</div>
	{:else}
		<div class="rounded-md border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Titre</Table.Head>
						<Table.Head>Type</Table.Head>
						<Table.Head>Détails</Table.Head>
						<Table.Head class="w-10"></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each supports as s (s.id)}
						<Table.Row>
							<Table.Cell>
								<a
									href="/bibliotheque/supports/{s.id}"
									class="font-medium hover:underline"
								>
									{s.titre}
								</a>
							</Table.Cell>
							<Table.Cell>
								{#if isFileSupport(s)}
									<span
										class="inline-flex items-center gap-1 text-sm text-muted-foreground"
									>
										<FileIcon class="size-3" />
										Fichier
									</span>
								{:else}
									<span
										class="inline-flex items-center gap-1 text-sm text-muted-foreground"
									>
										<Link class="size-3" />
										Lien
									</span>
								{/if}
							</Table.Cell>
							<Table.Cell>
								{#if isFileSupport(s)}
									<span class="text-sm text-muted-foreground">
										{s.fileName} ({formatSize(s.fileSize)})
									</span>
								{:else if s.url}
									<a
										href={s.url}
										target="_blank"
										rel="noopener noreferrer"
										class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
									>
										{s.url}
										<ExternalLink class="size-3" />
									</a>
								{:else}
									<span class="text-muted-foreground">—</span>
								{/if}
							</Table.Cell>
							<Table.Cell>
								<DropdownMenu.Root>
									<DropdownMenu.Trigger>
										{#snippet child({ props })}
										<Button variant="ghost" size="icon" class="size-8" aria-label="Actions du support" {...props}>
											<MoreHorizontal class="size-4" />
										</Button>
										{/snippet}
									</DropdownMenu.Trigger>
									<DropdownMenu.Content align="end">
										<DropdownMenu.Separator />
										<form method="POST" action="?/delete" use:enhance>
											<input type="hidden" name="id" value={s.id} />
											<DropdownMenu.Item
												type="submit"
												class="text-destructive"
												onSelect={(e) => e.preventDefault()}
											>
												<button type="submit" class="flex w-full items-center">
													<Trash2 class="mr-2 size-4" />
													Supprimer
												</button>
											</DropdownMenu.Item>
										</form>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>

<Dialog.Root bind:open={showUploadDialog}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Uploader un fichier</Dialog.Title>
			<Dialog.Description>
				Formats acceptés : PDF, Word, PowerPoint, Excel, images. Max 10 Mo.
			</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/upload"
			enctype="multipart/form-data"
			use:enhance={() => {
				return async ({ result, update }) => {
					await update();
					if (result.type === 'success') {
						showUploadDialog = false;
					}
				};
			}}
		>
			<div class="flex flex-col gap-4 py-4">
				<div class="flex flex-col gap-2">
					<Label for="upload-titre">Titre</Label>
					<Input id="upload-titre" name="titre" placeholder="Nom du support" />
				</div>
				<div class="flex flex-col gap-2">
					<Label for="upload-file">Fichier</Label>
					<Input
						id="upload-file"
						name="file"
						type="file"
						accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp"
						required
					/>
				</div>
			</div>
			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (showUploadDialog = false)}>
					Annuler
				</Button>
				<Button type="submit">
					<Upload class="mr-1 size-4" />
					Uploader
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={showLinkDialog}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Ajouter un lien</Dialog.Title>
			<Dialog.Description>
				Ajoutez un lien vers un support de cours externe.
			</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/createLink"
			use:enhance={() => {
				return async ({ result, update }) => {
					await update();
					if (result.type === 'success') {
						showLinkDialog = false;
					}
				};
			}}
		>
			<div class="flex flex-col gap-4 py-4">
				<div class="flex flex-col gap-2">
					<Label for="link-titre">Titre</Label>
					<Input id="link-titre" name="titre" placeholder="Nom du support" required />
				</div>
				<div class="flex flex-col gap-2">
					<Label for="link-url">URL</Label>
						<Input
							id="link-url"
							name="url"
							type="url"
							placeholder="https://..."
							required
						/>
				</div>
			</div>
			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (showLinkDialog = false)}>
					Annuler
				</Button>
				<Button type="submit">
					<Plus class="mr-1 size-4" />
					Ajouter
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
