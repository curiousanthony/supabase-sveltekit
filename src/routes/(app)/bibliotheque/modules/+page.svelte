<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import Plus from '@lucide/svelte/icons/plus';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Copy from '@lucide/svelte/icons/copy';
	import Trash2 from '@lucide/svelte/icons/trash-2';
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
								<DropdownMenu.Root>
									<DropdownMenu.Trigger>
										{#snippet child({ props })}
											<Button variant="ghost" size="icon" class="size-8" {...props}>
												<MoreHorizontal class="size-4" />
											</Button>
										{/snippet}
									</DropdownMenu.Trigger>
									<DropdownMenu.Content align="end">
										<DropdownMenu.Item>
											{#snippet child({ props })}
												<a href="/bibliotheque/modules/{mod.id}/modifier" {...props}>
													<Pencil class="mr-2 size-4" />
													Modifier
												</a>
											{/snippet}
										</DropdownMenu.Item>
										<form method="POST" action="?/duplicate" use:enhance>
											<input type="hidden" name="id" value={mod.id} />
											<DropdownMenu.Item>
												{#snippet child({ props })}
													<button type="submit" class="flex w-full items-center" {...props}>
														<Copy class="mr-2 size-4" />
														Dupliquer
													</button>
												{/snippet}
											</DropdownMenu.Item>
										</form>
										<DropdownMenu.Separator />
										<form
											id="delete-module-{mod.id}"
											method="POST"
											action="?/delete"
											use:enhance={() =>
												async ({ update }) => {
													await update();
													deleteDialogOpen = false;
													pendingDeleteId = null;
												}
											}
										>
											<input type="hidden" name="id" value={mod.id} />
										</form>
										<DropdownMenu.Item variant="destructive">
											{#snippet child({ props })}
												<button
													type="button"
													class="flex w-full items-center"
													{...props}
													onclick={() => openDeleteDialog(mod.id)}
												>
													<Trash2 class="mr-2 size-4" />
													Supprimer
												</button>
											{/snippet}
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}

	<AlertDialog.Root bind:open={deleteDialogOpen}>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>Supprimer ce module ?</AlertDialog.Title>
				<AlertDialog.Description>
					Cette action est irréversible. Le module sera définitivement supprimé.
				</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer>
				<AlertDialog.Cancel>Annuler</AlertDialog.Cancel>
				<AlertDialog.Action
					class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					onclick={confirmDelete}
				>
					Supprimer
				</AlertDialog.Action>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>
</div>
