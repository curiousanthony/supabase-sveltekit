<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import Plus from '@lucide/svelte/icons/plus';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Copy from '@lucide/svelte/icons/copy';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import PackageOpen from '@lucide/svelte/icons/package-open';

	let { data }: PageProps = $props();
	let { programmes } = $derived(data);

	const statutColors: Record<string, string> = {
		Brouillon: 'bg-muted text-muted-foreground',
		'En cours': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
		'Publié': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
		'Archivé': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
	};

	function formatPrice(value: string | null) {
		if (!value) return '—';
		return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
			Number(value)
		);
	}

	function formatDuration(value: string | null) {
		if (!value) return '—';
		const n = Number(value);
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
									href="/bibliotheque/programmes/{prog.id}"
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
												<a href="/bibliotheque/programmes/{prog.id}" {...props}>
													<Pencil class="mr-2 size-4" />
													Modifier
												</a>
											{/snippet}
										</DropdownMenu.Item>
										<form method="POST" action="?/duplicate" use:enhance>
											<input type="hidden" name="id" value={prog.id} />
											<DropdownMenu.Item
												type="submit"
												onSelect={(e) => e.preventDefault()}
											>
												<button type="submit" class="flex w-full items-center">
													<Copy class="mr-2 size-4" />
													Dupliquer
												</button>
											</DropdownMenu.Item>
										</form>
										<DropdownMenu.Separator />
										<form method="POST" action="?/delete" use:enhance>
											<input type="hidden" name="id" value={prog.id} />
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
