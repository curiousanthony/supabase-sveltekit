<script lang="ts">
	import type { PageProps } from './$types';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Button from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { enhance } from '$app/forms';

	let { data }: PageProps = $props();

	const contact = $derived(data?.contact);
	const companies = $derived(
		(contact?.contactCompanies ?? []).map((cc) => cc.company).filter(Boolean)
	);
	const linkedDeals = $derived(contact?.deals ?? []);
	const formationsFromDeals = $derived(
		linkedDeals
			.filter((d) => d.formation != null)
			.map((d) => ({ ...d.formation!, dealName: d.name }))
	);
	const name = $derived(
		[contact?.firstName, contact?.lastName].filter(Boolean).join(' ') || 'Contact'
	);

	function formatCurrency(value: string | null | undefined): string {
		if (value == null) return '—';
		const n = Number(value);
		if (Number.isNaN(n)) return '—';
		return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
	}

	function ownerLabel(owner: {
		firstName?: string | null;
		lastName?: string | null;
		email?: string | null;
	} | null): string {
		if (!owner) return '—';
		const fullName = [owner.firstName, owner.lastName].filter(Boolean).join(' ');
		return fullName || owner.email || '—';
	}
</script>

<svelte:head>
	<title>{name}</title>
</svelte:head>

<div class="space-y-8">
	<!-- En-tête -->
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">{name}</h1>
			<div class="mt-2 flex flex-wrap items-center gap-2">
				{#if contact?.poste}
					<Badge variant="secondary">{contact.poste}</Badge>
				{/if}
				{#each companies as company (company.id)}
					<a
						href="/crm/entreprises/{company.id}"
						class="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
					>
						{company.name}
					</a>
				{/each}
			</div>
		</div>
		<div class="flex gap-2">
			<Button.Root href="/crm/contacts?edit={contact?.id}" variant="secondary">
				Éditer
			</Button.Root>
			<Dialog.Root>
				<Dialog.Trigger>
					<Button.Root type="button" variant="destructive">
						Supprimer
					</Button.Root>
				</Dialog.Trigger>
				<Dialog.Content>
					<Dialog.Header>
						<Dialog.Title>Supprimer le contact</Dialog.Title>
						<Dialog.Description>
							Êtes-vous sûr de vouloir supprimer « {name} » ? Cette action est irréversible.
						</Dialog.Description>
					</Dialog.Header>
					<form method="POST" action="?/deleteContact" use:enhance>
						<Dialog.Footer>
							<Dialog.Close>
								<Button.Root type="button" variant="outline">
									Annuler
								</Button.Root>
							</Dialog.Close>
							<Button.Root type="submit" variant="destructive">
								Supprimer
							</Button.Root>
						</Dialog.Footer>
					</form>
				</Dialog.Content>
			</Dialog.Root>
		</div>
	</div>

	<!-- Section Informations -->
	<section class="space-y-3">
		<h2 class="text-lg font-semibold">Informations</h2>
		<dl class="grid gap-2 text-sm sm:grid-cols-2">
			{#if contact?.email}
				<div>
					<dt class="text-muted-foreground">E-mail</dt>
					<dd>
						<a href="mailto:{contact.email}" class="text-primary hover:underline">{contact.email}</a>
					</dd>
				</div>
			{/if}
			{#if contact?.phone}
				<div>
					<dt class="text-muted-foreground">Téléphone</dt>
					<dd>
						<a href="tel:{contact.phone}" class="text-primary hover:underline">{contact.phone}</a>
					</dd>
				</div>
			{/if}
			{#if contact?.linkedinUrl}
				<div>
					<dt class="text-muted-foreground">LinkedIn</dt>
					<dd>
						<a
							href={contact.linkedinUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="text-primary hover:underline"
							>Profil LinkedIn</a
						>
					</dd>
				</div>
			{/if}
			{#if contact?.owner}
				<div>
					<dt class="text-muted-foreground">Propriétaire</dt>
					<dd>{ownerLabel(contact.owner)}</dd>
				</div>
			{/if}
			{#if contact?.internalNotes}
				<div class="sm:col-span-2">
					<dt class="text-muted-foreground">Commentaire interne</dt>
					<dd class="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-muted-foreground">
						{contact.internalNotes}
					</dd>
				</div>
			{/if}
		</dl>
	</section>

	<!-- Section Entreprises liées -->
	<section class="space-y-3">
		<h2 class="text-lg font-semibold">Entreprises liées</h2>
		{#if companies.length === 0}
			<p class="text-sm text-muted-foreground">Aucune entreprise liée.</p>
		{:else}
			<div class="rounded-md border">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Nom</Table.Head>
							<Table.Head>Industrie</Table.Head>
							<Table.Head>Taille</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each companies as company (company.id)}
							<Table.Row>
								<Table.Cell class="font-medium">
									<a
										href="/crm/entreprises/{company.id}"
										class="text-primary hover:underline"
										>{company.name}</a
									>
								</Table.Cell>
								<Table.Cell>{company.industry ?? '—'}</Table.Cell>
								<Table.Cell>
									{#if company.companySize}
										<Badge variant="outline">{company.companySize}</Badge>
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
		<p class="text-sm">
			<a href="/crm/entreprises" class="text-primary hover:underline">Ajouter une entreprise</a>
		</p>
	</section>

	<!-- Section Deals liés -->
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
							<Table.Head>Création</Table.Head>
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
								<Table.Cell class="text-muted-foreground text-sm">
									{#if d.createdAt}
										{new Date(d.createdAt).toLocaleDateString('fr-FR')}
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
		<p class="text-sm">
			<a href="/deals/creer?contactId={contact?.id}" class="text-primary hover:underline"
				>Créer un deal</a
			>
		</p>
	</section>

	<!-- Section Formations liées -->
	<section class="space-y-3">
		<h2 class="text-lg font-semibold">Formations liées</h2>
		<p class="text-sm text-muted-foreground">
			{formationsFromDeals.length} formation(s) inscrite(s) via les deals.
		</p>
		{#if formationsFromDeals.length > 0}
			<div class="rounded-md border">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Formation</Table.Head>
							<Table.Head>Statut</Table.Head>
							<Table.Head>Deal</Table.Head>
							<Table.Head>Création</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each formationsFromDeals as f, i (`${f.id}-${i}`)}
							<Table.Row>
								<Table.Cell class="font-medium">{f.name ?? '—'}</Table.Cell>
								<Table.Cell>
									<Badge variant="outline">{f.statut ?? '—'}</Badge>
								</Table.Cell>
								<Table.Cell class="text-muted-foreground text-sm">{f.dealName}</Table.Cell>
								<Table.Cell class="text-muted-foreground text-sm">
									{#if f.createdAt}
										{new Date(f.createdAt).toLocaleDateString('fr-FR')}
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
