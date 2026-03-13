<script lang="ts">
	import type { PageProps } from './$types';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils.js';
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import ModuleRowActions from './module-row-actions.svelte';
	import Plus from '@lucide/svelte/icons/plus';
	import Blocks from '@lucide/svelte/icons/blocks';

	let { data }: PageProps = $props();
	let { modules } = $derived(data);

	let deleteDialogOpen = $state(false);
	let pendingDeleteId = $state<string | null>(null);

	function openDeleteDialog(id: string) {
		pendingDeleteId = id;
		deleteDialogOpen = true;
	}

	function confirmDelete() {
		if (!pendingDeleteId) return;
		const form = document.getElementById(`delete-module-${pendingDeleteId}`);
		if (form instanceof HTMLFormElement) form.requestSubmit();
		deleteDialogOpen = false;
		pendingDeleteId = null;
	}

	function formatDuration(value: string | null) {
		if (!value) return '—';
		const n = Number(value);
		return isNaN(n) ? '—' : `${n}h`;
	}
</script>

<svelte:head>
	<title>Modules — Bibliothèque</title>
</svelte:head>

<div class="flex flex-col gap-4">
	{#if modules.length === 0}
		<div
			class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16"
		>
			<Blocks class="size-10 text-muted-foreground" />
			<p class="text-sm text-muted-foreground">Aucun module pour le moment</p>
			<Button href="/bibliotheque/modules/creer" size="sm" variant="outline">
				<Plus class="mr-1 size-4" />
				Nouveau module
			</Button>
		</div>
	{:else}
		<div class="rounded-md border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Titre</Table.Head>
						<Table.Head>Modalité d'évaluation</Table.Head>
						<Table.Head class="text-right">Durée</Table.Head>
						<Table.Head class="w-10"></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each modules as mod (mod.id)}
						<Table.Row>
							<Table.Cell>
								<a
									href="/bibliotheque/modules/{mod.id}"
									class="font-medium hover:underline"
								>
									{mod.titre}
								</a>
							</Table.Cell>
							<Table.Cell>
								{#if mod.modaliteEvaluation}
									<Badge variant="outline">{mod.modaliteEvaluation}</Badge>
								{:else}
									<span class="text-muted-foreground">—</span>
								{/if}
							</Table.Cell>
							<Table.Cell class="text-right">
								{formatDuration(mod.dureeHeures)}
							</Table.Cell>
							<Table.Cell>
								<ModuleRowActions
									id={mod.id}
									onDeleteClick={openDeleteDialog}
									onDeleteComplete={() => {
										deleteDialogOpen = false;
										pendingDeleteId = null;
									}}
								/>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}

	<AlertDialog.Root bind:open={deleteDialogOpen}>
		<AlertDialog.Content interactOutsideBehavior="close">
			<AlertDialog.Header>
				<AlertDialog.Title>Supprimer ce module ?</AlertDialog.Title>
				<AlertDialog.Description>
					Cette action est irréversible. Le module sera définitivement supprimé.
				</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer>
				<AlertDialog.Cancel class={cn(buttonVariants({ variant: 'outline' }))}>
					Annuler
				</AlertDialog.Cancel>
				<AlertDialog.Action
					class={cn(buttonVariants({ variant: 'destructive' }))}
					onclick={confirmDelete}
				>
					Supprimer
				</AlertDialog.Action>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>
</div>
