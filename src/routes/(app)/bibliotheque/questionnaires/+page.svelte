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
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';

	let { data }: PageProps = $props();
	let { questionnaires } = $derived(data);

	function getDomain(url: string | null) {
		if (!url) return null;
		try {
			return new URL(url).hostname;
		} catch {
			return url;
		}
	}
</script>

<svelte:head>
	<title>Questionnaires — Bibliothèque</title>
</svelte:head>

<div class="flex flex-col gap-4">
	{#if questionnaires.length === 0}
		<div
			class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16"
		>
			<ClipboardList class="size-10 text-muted-foreground" />
			<p class="text-sm text-muted-foreground">Aucun questionnaire pour le moment</p>
			<Button href="/bibliotheque/questionnaires/creer" size="sm" variant="outline">
				<Plus class="mr-1 size-4" />
				Nouveau questionnaire
			</Button>
		</div>
	{:else}
		<div class="rounded-md border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Titre</Table.Head>
						<Table.Head>Type</Table.Head>
						<Table.Head>Lien</Table.Head>
						<Table.Head class="w-10"></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each questionnaires as q (q.id)}
						<Table.Row>
							<Table.Cell>
								<a
									href="/bibliotheque/questionnaires/{q.id}"
									class="font-medium hover:underline"
								>
									{q.titre}
								</a>
							</Table.Cell>
							<Table.Cell>
								{#if q.type}
									<Badge variant="outline">{q.type}</Badge>
								{:else}
									<span class="text-muted-foreground">—</span>
								{/if}
							</Table.Cell>
							<Table.Cell>
								{#if q.urlTest}
									<a
										href={q.urlTest}
										target="_blank"
										rel="noopener noreferrer"
										class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
									>
										{getDomain(q.urlTest)}
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
											<Button variant="ghost" size="icon" class="size-8" {...props}>
												<MoreHorizontal class="size-4" />
											</Button>
										{/snippet}
									</DropdownMenu.Trigger>
									<DropdownMenu.Content align="end">
										<DropdownMenu.Item>
											{#snippet child({ props })}
												<a href="/bibliotheque/questionnaires/{q.id}" {...props}>
													<Pencil class="mr-2 size-4" />
													Modifier
												</a>
											{/snippet}
										</DropdownMenu.Item>
										{#if q.urlTest}
											<DropdownMenu.Item>
												{#snippet child({ props })}
													<a href={q.urlTest} target="_blank" rel="noopener noreferrer" {...props}>
														<ExternalLink class="mr-2 size-4" />
														Ouvrir le lien
													</a>
												{/snippet}
											</DropdownMenu.Item>
										{/if}
										<form method="POST" action="?/duplicate" use:enhance>
											<input type="hidden" name="id" value={q.id} />
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
											<input type="hidden" name="id" value={q.id} />
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
