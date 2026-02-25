<script lang="ts">
	import type { PageProps } from './$types';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Button from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { enhance } from '$app/forms';

	let { data }: PageProps = $props();

	const company = $derived(data?.company);
	const linkedContacts = $derived(data?.linkedContacts ?? []);
	const linkedDeals = $derived(data?.linkedDeals ?? []);

	function fullName(c: { firstName?: string | null; lastName?: string | null }) {
		return [c.firstName, c.lastName].filter(Boolean).join(' ') || '—';
	}

	function formatCurrency(value: string | null | undefined): string {
		if (value == null) return '—';
		const n = Number(value);
		if (Number.isNaN(n)) return '—';
		return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
	}
</script>

<svelte:head>
	<title>{company?.name ?? 'Entreprise'}</title>
</svelte:head>

<div class="space-y-8">
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">{company?.name}</h1>
			<div class="mt-2 flex flex-wrap gap-2">
				{#if company?.industry}
					<Badge variant="secondary">{company.industry}</Badge>
				{/if}
				{#if company?.legalStatus}
					<Badge variant="outline">{company.legalStatus}</Badge>
				{/if}
			</div>
		</div>
		<div class="flex gap-2">
			<Button.Root href="/contacts/entreprises?editCompany={company?.id}" variant="secondary">
				Éditer
			</Button.Root>
			<Dialog.Root>
				<Dialog.Trigger>
					<Button.Root type="button" variant="destructive">Supprimer</Button.Root>
				</Dialog.Trigger>
				<Dialog.Content>
					<Dialog.Header>
						<Dialog.Title>Supprimer l&apos;entreprise</Dialog.Title>
						<Dialog.Description>
							Êtes-vous sûr de vouloir supprimer « {company?.name} » ? Cette action est
							irréversible.
						</Dialog.Description>
					</Dialog.Header>
					<form method="POST" action="?/deleteCompany" use:enhance>
						<Dialog.Footer>
							<Dialog.Close>
								<Button.Root type="button" variant="outline">Annuler</Button.Root>
							</Dialog.Close>
							<Button.Root type="submit" variant="destructive">Supprimer</Button.Root>
						</Dialog.Footer>
					</form>
				</Dialog.Content>
			</Dialog.Root>
		</div>
	</div>

	<section class="space-y-3">
		<h2 class="text-lg font-semibold">Informations</h2>
		<dl class="grid gap-2 text-sm sm:grid-cols-2">
			{#if company?.siret}
				<div>
					<dt class="text-muted-foreground">SIRET</dt>
					<dd>{company.siret}</dd>
				</div>
			{/if}
			{#if company?.websiteUrl}
				<div>
					<dt class="text-muted-foreground">Site web</dt>
					<dd>
						<a
							href={company.websiteUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="text-primary hover:underline">{company.websiteUrl}</a
						>
					</dd>
				</div>
			{/if}
			{#if company?.address}
				<div class="sm:col-span-2">
					<dt class="text-muted-foreground">Adresse</dt>
					<dd>{company.address}</dd>
				</div>
			{/if}
			{#if company?.city || company?.region}
				<div>
					<dt class="text-muted-foreground">Ville / Région</dt>
					<dd>{[company?.city, company?.region].filter(Boolean).join(' — ') || '—'}</dd>
				</div>
			{/if}
			{#if company?.companySize}
				<div>
					<dt class="text-muted-foreground">Taille</dt>
					<dd><Badge variant="outline">{company.companySize}</Badge></dd>
				</div>
			{/if}
			{#if company?.estimatedBudget != null}
				<div>
					<dt class="text-muted-foreground">Budget estimé</dt>
					<dd>{formatCurrency(company.estimatedBudget)}</dd>
				</div>
			{/if}
			{#if company?.fundingDevices?.length}
				<div class="sm:col-span-2">
					<dt class="text-muted-foreground">Dispositifs utilisés</dt>
					<dd class="flex flex-wrap gap-1">
						{#each company.fundingDevices as device (device)}
							<Badge variant="secondary">{device}</Badge>
						{/each}
					</dd>
				</div>
			{/if}
			{#if company?.internalNotes}
				<div class="sm:col-span-2">
					<dt class="text-muted-foreground">Commentaire interne</dt>
					<dd
						class="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-muted-foreground"
					>
						{company.internalNotes}
					</dd>
				</div>
			{/if}
		</dl>
	</section>

	<section class="space-y-3">
		<h2 class="text-lg font-semibold">Contacts liés</h2>
		{#if linkedContacts.length === 0}
			<p class="text-sm text-muted-foreground">Aucun contact lié.</p>
		{:else}
			<div class="rounded-md border">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Nom</Table.Head>
							<Table.Head>Poste</Table.Head>
							<Table.Head>Email</Table.Head>
							<Table.Head>Téléphone</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each linkedContacts as c (c.id)}
							<Table.Row>
								<Table.Cell class="font-medium">
									<a href="/contacts/{c.id}" class="text-primary hover:underline"
										>{fullName(c)}</a
									>
								</Table.Cell>
								<Table.Cell>{c.poste ?? '—'}</Table.Cell>
								<Table.Cell>
									{#if c.email}
										<a href="mailto:{c.email}" class="text-primary hover:underline">{c.email}</a>
									{:else}
										—
									{/if}
								</Table.Cell>
								<Table.Cell>{c.phone ?? '—'}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		{/if}
	</section>

	<section class="space-y-3">
		<h2 class="text-lg font-semibold">Deals liés</h2>
		{#if linkedDeals.length === 0}
			<p class="text-sm text-muted-foreground">Aucun deal lié.</p>
		{:else}
			<div class="rounded-md border">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Deal</Table.Head>
							<Table.Head>Statut</Table.Head>
							<Table.Head>Montant</Table.Head>
							<Table.Head>Mise à jour</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each linkedDeals as d (d.id)}
							<Table.Row>
								<Table.Cell class="font-medium">
									<a href="/deals/{d.id}" class="text-primary hover:underline">{d.name}</a>
								</Table.Cell>
								<Table.Cell>
									<Badge variant="outline">{d.stage ?? '—'}</Badge>
								</Table.Cell>
								<Table.Cell>{formatCurrency(d.dealAmount ?? d.value)}</Table.Cell>
								<Table.Cell class="text-sm text-muted-foreground">
									{#if d.updatedAt}
										{new Date(d.updatedAt).toLocaleDateString('fr-FR')}
									{:else}
										—
									{/if}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		{/if}
	</section>
</div>
