<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import FileIcon from '@lucide/svelte/icons/file';

	let { data, form }: PageProps = $props();
	let { support } = $derived(data);

	let showDeleteDialog = $state(false);

	function formatSize(bytes: number | null) {
		if (bytes === null || bytes === undefined) return '—';
		if (bytes < 1024) return `${bytes} o`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
	}
</script>

<svelte:head>
	<title>{support.titre} — Supports — Bibliothèque</title>
</svelte:head>

<div class="mx-auto flex w-full max-w-2xl flex-col gap-6">
	{#if form?.success}
		<div role="alert" aria-live="polite" class="rounded-md border border-green-500/50 bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
			Support mis à jour avec succès.
		</div>
	{/if}
	{#if form?.message}
		<div role="alert" aria-live="assertive" class="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
			{form.message}
		</div>
	{/if}

	{#if support.filePath}
		<div class="flex items-center gap-3 rounded-md border bg-muted/30 p-4">
			<FileIcon class="size-8 text-muted-foreground" />
			<div class="flex flex-col">
				<span class="text-sm font-medium">{support.fileName}</span>
				<span class="text-xs text-muted-foreground">
					{support.mimeType} — {formatSize(support.fileSize)}
				</span>
			</div>
		</div>
	{/if}

	<form method="POST" action="?/update" use:enhance class="flex flex-col gap-5">
		<div class="flex flex-col gap-2">
			<Label for="titre">Titre</Label>
			<Input id="titre" name="titre" required value={support.titre} />
		</div>

		{#if !support.filePath}
			<div class="flex flex-col gap-2">
				<Label for="url">URL</Label>
				<Input id="url" name="url" type="url" value={support.url ?? ''} placeholder="https://..." />
			</div>
		{/if}

		<div class="flex justify-end gap-3 pt-2">
			<Button type="submit">Enregistrer</Button>
		</div>
	</form>

	<div class="rounded-md border border-destructive/30 bg-destructive/5 p-4 flex items-center justify-between">
		<div>
			<p class="text-sm font-medium">Supprimer ce support</p>
			<p class="text-xs text-muted-foreground">Cette action est irréversible.</p>
		</div>
		<Button variant="destructive" size="sm" onclick={() => (showDeleteDialog = true)}>
			<Trash2 class="mr-1 size-4" />
			Supprimer
		</Button>
	</div>
</div>

<AlertDialog.Root bind:open={showDeleteDialog}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Supprimer ce support ?</AlertDialog.Title>
			<AlertDialog.Description>
				Cette action est irréversible. Le support sera définitivement supprimé.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Annuler</AlertDialog.Cancel>
			<form
				method="POST"
				action="?/delete"
				use:enhance={() => {
					return async ({ result, update }) => {
						await update();
						if (result.type === 'success' || result.type === 'redirect') {
							showDeleteDialog = false;
						}
					};
				}}
			>
				<Button type="submit" variant="destructive" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
					Supprimer
				</Button>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
