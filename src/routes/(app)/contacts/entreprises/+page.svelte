<script lang="ts">
	import type { PageProps } from './$types';
	import * as Table from '$lib/components/ui/table';
	import * as Button from '$lib/components/ui/button';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import CompanySheet from '$lib/components/crm/CompanySheet.svelte';
	import { goto } from '$app/navigation';

	let { data }: PageProps = $props();
	let companySheetOpen = $state(false);
	let companySheetCompany = $state<typeof data.editCompany>(null);

	$effect(() => {
		if (data?.editCompany) {
			companySheetOpen = true;
			companySheetCompany = data.editCompany;
		}
	});

	function openNewCompanySheet() {
		companySheetCompany = null;
		companySheetOpen = true;
	}

	const companies = $derived(data?.companies ?? []);
	const workspaceId = $derived(data?.workspaceId);
</script>

<svelte:head>
	<title>CRM – Entreprises</title>
</svelte:head>

{#if !workspaceId}
	<div class="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
		<p class="text-sm">Aucun espace de travail assigné.</p>
	</div>
{:else}
	<div class="flex min-h-0 flex-1 flex-col gap-4">
		<div class="flex flex-wrap items-center gap-2">
			<Button.Root onclick={openNewCompanySheet}>Nouvelle entreprise</Button.Root>
		</div>
		{#if companies.length === 0}
			<div class="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
				<p class="text-sm">Aucune entreprise pour le moment.</p>
				<Button.Root onclick={openNewCompanySheet} class="mt-2">
					Ajouter une entreprise
				</Button.Root>
			</div>
		{:else}
			<div class="overflow-auto rounded-md border">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Nom</Table.Head>
							<Table.Head>Industrie</Table.Head>
							<Table.Head>Taille</Table.Head>
							<Table.Head>Ville</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each companies as company (company.id)}
							<Table.Row
								class="cursor-pointer hover:bg-muted/50"
								onclick={() => goto(`/contacts/entreprises/${company.id}`)}
							>
								<Table.Cell class="font-medium">{company.name}</Table.Cell>
								<Table.Cell>{company.industry ?? '—'}</Table.Cell>
								<Table.Cell>
									{#if company.companySize}
										<Badge variant="outline">{company.companySize}</Badge>
									{:else}
										—
									{/if}
								</Table.Cell>
								<Table.Cell>{company.city ?? '—'}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		{/if}
	</div>
{/if}

<CompanySheet bind:open={companySheetOpen} company={companySheetCompany} />
