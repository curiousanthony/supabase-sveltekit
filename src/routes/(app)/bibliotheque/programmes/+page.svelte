<script lang="ts">
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils.js';
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import ProgrammeRowActions from './programme-row-actions.svelte';
	import Plus from '@lucide/svelte/icons/plus';
	import PackageOpen from '@lucide/svelte/icons/package-open';

	let { data }: PageProps = $props();
	let { programmes } = $derived(data);

	let deleteDialogOpen = $state(false);
	let pendingDeleteId = $state<string | null>(null);

	function openDeleteDialog(id: string) {
		pendingDeleteId = id;
		deleteDialogOpen = true;
	}

	function confirmDeleteProgramme() {
		if (!pendingDeleteId) return;
		const form = document.getElementById(`delete-programme-${pendingDeleteId}`);
		if (form instanceof HTMLFormElement) form.requestSubmit();
		deleteDialogOpen = false;
		pendingDeleteId = null;
	}

	const statutColors: Record<string, string> = {
		Brouillon: 'bg-muted text-muted-foreground',
		'En cours': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
		'Publié': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
		'Archivé': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
	};

	function formatPrice(value: string | null) {
		if (value == null || value === '') return '—';
		const n = Number(value);
		if (!Number.isFinite(n)) return '—';
		return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
	}

	function formatDuration(value: string | null) {
		if (value == null || value === '') return '—';
		const n = Number(value);
		if (!Number.isFinite(n)) return '—';
		return `${n}h`;
	}
</script>

<svelte:head>
	<title>Programmes — Bibliothèque</title>
</svelte:head>

<div class="flex flex-col gap-4">
	{#if programmes.length === 0}
		<div
			class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16"
		>
			<PackageOpen class="size-10 text-muted-foreground" />
			<p class="text-sm text-muted-foreground">Aucun programme pour le moment</p>
			<Button href="/bibliotheque/programmes/creer" size="sm" variant="outline">
				<Plus class="mr-1 size-4" />
				Nouveau programme
			</Button>
		</div>
	{:else}
		<div class="rounded-md border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Titre</Table.Head>
						<Table.Head>Statut</Table.Head>
						<Table.Head>Modalité</Table.Head>
						<Table.Head class="text-right">Durée</Table.Head>
						<Table.Head class="text-right">Prix</Table.Head>
						<Table.Head class="text-right">Modules</Table.Head>
						<Table.Head class="w-10"></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each programmes as prog (prog.id)}
						<Table.Row>
							<Table.Cell>
								<a
									href={resolve(`/bibliotheque/programmes/${prog.id}`)}
									class="font-medium hover:underline"
								>
									{prog.titre}
								</a>
							</Table.Cell>
							<Table.Cell>
								<Badge variant="secondary" class={statutColors[prog.statut] ?? ''}>
									{prog.statut}
								</Badge>
							</Table.Cell>
							<Table.Cell>
								{prog.modalite ?? '—'}
							</Table.Cell>
							<Table.Cell class="text-right">
								{formatDuration(prog.dureeHeures)}
							</Table.Cell>
							<Table.Cell class="text-right">
								{formatPrice(prog.prixPublic)}
							</Table.Cell>
							<Table.Cell class="text-right">
								{prog.moduleCount}
							</Table.Cell>
							<Table.Cell>
								<ProgrammeRowActions
									id={prog.id}
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
				<AlertDialog.Title>Supprimer ce programme ?</AlertDialog.Title>
				<AlertDialog.Description>
					Cette action est irréversible. Le programme sera définitivement supprimé.
				</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer>
				<AlertDialog.Cancel class={cn(buttonVariants({ variant: 'outline' }))}>
					Annuler
				</AlertDialog.Cancel>
				<AlertDialog.Action
					class={cn(buttonVariants({ variant: 'destructive' }))}
					onclick={confirmDeleteProgramme}
				>
					Supprimer
				</AlertDialog.Action>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>
</div>
