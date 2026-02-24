<script lang="ts">
	import type { PageProps } from './$types';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Table from '$lib/components/ui/table';
	import * as Button from '$lib/components/ui/button';
	import * as Input from '$lib/components/ui/input';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import * as Select from '$lib/components/ui/select';
	import * as Card from '$lib/components/ui/card';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import StarRating from '$lib/components/custom/starRating.svelte';
	import ContactSheet from '$lib/components/crm/ContactSheet.svelte';
	import CompanySheet from '$lib/components/crm/CompanySheet.svelte';
	import { goto } from '$app/navigation';
	import {
		IconChalkboardTeacher,
		IconUserSearch,
		IconUserShare
	} from '@tabler/icons-svelte';

	let { data }: PageProps = $props();
	let activeTab = $state<'clients' | 'entreprises' | 'formateurs'>('clients');
	let contactSheetOpen = $state(false);
	let contactSheetContact = $state<typeof data.editContact>(null);
	let companySheetOpen = $state(false);
	let companySheetCompany = $state<typeof data.editCompany>(null);

	let search = $state('');
	let posteFilter = $state<string>('all');

	$effect(() => {
		search = data?.query ?? '';
		posteFilter = data?.poste && data.poste !== '' ? data.poste : 'all';
	});

	$effect(() => {
		if (data?.editContact) {
			contactSheetOpen = true;
			contactSheetContact = data.editContact;
		}
	});

	$effect(() => {
		if (data?.editCompany) {
			companySheetOpen = true;
			companySheetCompany = data.editCompany;
		}
	});

	function openNewContactSheet() {
		contactSheetContact = null;
		contactSheetOpen = true;
	}

	function openNewCompanySheet() {
		companySheetCompany = null;
		companySheetOpen = true;
	}

	const contacts = $derived(data?.contacts ?? []);
	const companies = $derived(data?.companies ?? []);
	const formateurs = $derived(data?.formateurs ?? []);
	const workspaceId = $derived(data?.workspaceId);

	function fullName(c: { firstName?: string | null; lastName?: string | null }) {
		return [c.firstName, c.lastName].filter(Boolean).join(' ') || '—';
	}

	function companyBadges(
		c: { contactCompanies: { companyId: string }[] },
		companyList: { id: string; name: string }[]
	) {
		return (
			c.contactCompanies?.map((cc) => companyList.find((co) => co.id === cc.companyId)?.name).filter(Boolean) ?? []
		);
	}

	const POSTE_OPTIONS = [
		{ value: 'all', label: 'Tous les postes' },
		{ value: 'Responsable RH', label: 'Responsable RH' },
		{ value: 'CEO', label: 'CEO' },
		{ value: 'Autre', label: 'Autre' }
	];

	function applyFilters() {
		const params = new URLSearchParams();
		if (search) params.set('q', search);
		if (posteFilter && posteFilter !== 'all') params.set('poste', posteFilter);
		goto(`/contacts?${params.toString()}`, { replaceState: true });
	}
</script>

<svelte:head>
	<title>CRM</title>
</svelte:head>

<div class="space-y-4">
	<div>
		<h1 class="text-2xl font-bold tracking-tight">CRM</h1>
		<p class="text-muted-foreground">
			Clients, entreprises et formateurs. Les clients servent aussi de base pour assigner des apprenants aux formations.
		</p>
	</div>
	{#if data?.loadError}
		<div class="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
			<strong>Erreur au chargement :</strong> {data.loadError}
			<p class="mt-2 text-muted-foreground">Vérifiez que les migrations sont appliquées (ex. <code>supabase db reset</code>).</p>
		</div>
	{/if}

	<Tabs.Root bind:value={activeTab} class="w-full">
		<Tabs.List class="grid w-full grid-cols-3 max-w-md">
			<Tabs.Trigger value="clients">Clients</Tabs.Trigger>
			<Tabs.Trigger value="entreprises">Entreprises</Tabs.Trigger>
			<Tabs.Trigger value="formateurs">Formateurs</Tabs.Trigger>
		</Tabs.List>

		<!-- Clients tab (default) -->
		<Tabs.Content value="clients" class="mt-4">
			{#if !workspaceId}
				<div class="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
					<p class="text-sm">Aucun espace de travail assigné.</p>
				</div>
			{:else}
				<div class="flex min-h-0 flex-1 flex-col gap-4">
					<div class="flex flex-wrap items-center gap-2">
						<Button.Root onclick={openNewContactSheet}>Nouveau contact</Button.Root>
						<Input.Root
							type="search"
							placeholder="Rechercher par nom ou email..."
							class="max-w-xs"
							bind:value={search}
							onkeydown={(e) => e.key === 'Enter' && applyFilters()}
						/>
						<Select.Root type="single" bind:value={posteFilter}>
							<Select.Trigger class="w-[180px]">
								{POSTE_OPTIONS.find((o) => o.value === posteFilter)?.label ?? 'Poste'}
							</Select.Trigger>
							<Select.Content>
								{#each POSTE_OPTIONS as opt (opt.value)}
									<Select.Item value={opt.value}>{opt.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
						<Button.Root onclick={() => applyFilters()}>Filtrer</Button.Root>
					</div>

					{#if contacts.length === 0}
						<div class="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
							<p class="text-sm">Aucun client pour le moment.</p>
							<Button.Root onclick={openNewContactSheet} class="mt-2">
								Ajouter un client
							</Button.Root>
						</div>
					{:else}
						<div class="rounded-md border overflow-auto">
							<Table.Root>
								<Table.Header>
									<Table.Row>
										<Table.Head>Nom</Table.Head>
										<Table.Head>Entreprise(s)</Table.Head>
										<Table.Head>Poste</Table.Head>
										<Table.Head>Email</Table.Head>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#each contacts as c (c.id)}
										<Table.Row
											class="cursor-pointer hover:bg-muted/50"
											onclick={() => goto(`/crm/contacts/${c.id}`)}
										>
											<Table.Cell class="font-medium">{fullName(c)}</Table.Cell>
											<Table.Cell>
												{#each companyBadges(c, companies) as name (name)}
													<Badge variant="secondary" class="mr-1 text-xs">{name}</Badge>
												{/each}
												{#if companyBadges(c, companies).length === 0}
													<span class="text-muted-foreground">—</span>
												{/if}
											</Table.Cell>
											<Table.Cell>
												{#if c.poste}
													<Badge variant="outline">{c.poste}</Badge>
												{:else}
													<span class="text-muted-foreground">—</span>
												{/if}
											</Table.Cell>
											<Table.Cell>
												{#if c.email}
													<a
														href="mailto:{c.email}"
														class="text-primary hover:underline"
														onclick={(e) => e.stopPropagation()}
														>{c.email}</a
													>
												{:else}
													<span class="text-muted-foreground">—</span>
												{/if}
											</Table.Cell>
										</Table.Row>
									{/each}
								</Table.Body>
							</Table.Root>
						</div>
					{/if}
				</div>
			{/if}
		</Tabs.Content>

		<!-- Entreprises tab -->
		<Tabs.Content value="entreprises" class="mt-4">
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
						<div class="rounded-md border overflow-auto">
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
									onclick={() => goto(`/crm/entreprises/${company.id}`)}
								>
									<Table.Cell class="font-medium">{company.name}</Table.Cell>
									<Table.Cell>{company.industry ?? '—'}</Table.Cell>
									<Table.Cell>{company.companySize ?? '—'}</Table.Cell>
									<Table.Cell>{company.city ?? '—'}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
					{/if}
				</div>
			{/if}
		</Tabs.Content>

		<!-- Formateurs tab -->
		<Tabs.Content value="formateurs" class="mt-4">
			{#if formateurs.length === 0}
				<Empty.Root>
					<Empty.Header>
						<Empty.Media variant="icon">
							<IconChalkboardTeacher />
						</Empty.Media>
						<Empty.Title>Tu n'as pas encore ajouté de formateurs.</Empty.Title>
					</Empty.Header>
					<Empty.Content>
						<Button.Root href="/contacts/formateurs/inviter" class="w-full">
							<IconUserShare />
							Inviter un formateur
						</Button.Root>
						<Button.Root href="/contacts/formateurs/rechercher" class="w-full" variant="secondary">
							<IconUserSearch />
							Trouver un formateur
						</Button.Root>
					</Empty.Content>
				</Empty.Root>
			{:else}
				<div class="flex flex-wrap items-center gap-2 mb-4">
					<Button.Root href="/contacts/formateurs/inviter" size="sm">
						<IconUserShare />
						Inviter un formateur
					</Button.Root>
					<Button.Root href="/contacts/formateurs/rechercher" size="sm" variant="secondary">
						<IconUserSearch />
						Trouver un formateur
					</Button.Root>
				</div>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
					{#each formateurs as formateur (formateur.id)}
						<Card.Root class="h-full w-full max-w-sm gap-1 overflow-hidden pt-0">
							<div class="mb-4 overflow-hidden">
								<img
									src={formateur.user?.avatarUrl ??
										'https://api.dicebear.com/9.x/avataaars/svg?seed=' +
											encodeURIComponent(formateur.user?.firstName ?? formateur.id)}
									class="object-cover object-center w-full"
									alt=""
								/>
							</div>
							<Card.Header class="mb-1">
								<Card.Title
									>{formateur.user?.firstName ?? ''} {formateur.user?.lastName ?? ''}</Card.Title
								>
								<Card.Action>
									<Tooltip.Provider>
										<Tooltip.Root>
											<Tooltip.Trigger>
												<Badge variant="outline">
													{formateur.disponible7J ? 'Disponible' : 'Indisponible'}
												</Badge>
											</Tooltip.Trigger>
											<Tooltip.Content>
												{formateur.disponible7J ? 'Disponible ces 7 derniers jours' : 'Non disponible'}
											</Tooltip.Content>
										</Tooltip.Root>
									</Tooltip.Provider>
								</Card.Action>
								<StarRating ratingValue={Number(formateur.rating)} size={16} />
							</Card.Header>
							<Card.Content class="flex grow flex-col justify-between gap-4">
								<Card.Description>{formateur.description ?? '—'}</Card.Description>
								<div class="flex flex-wrap gap-2">
									{#each formateur.formateursThematiques ?? [] as ft (ft.thematique?.name)}
										<Badge variant="secondary">{ft.thematique?.name}</Badge>
									{/each}
								</div>
							</Card.Content>
							<Card.Footer class="mt-3">
								<Button.Root class="w-full" href="/contacts/formateurs/{formateur.id}">
									Consulter le profil
								</Button.Root>
							</Card.Footer>
						</Card.Root>
					{/each}
				</div>
			{/if}
		</Tabs.Content>
	</Tabs.Root>

	<ContactSheet
		bind:open={contactSheetOpen}
		contact={contactSheetContact}
		companies={companies.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }))}
	/>
	<CompanySheet
		bind:open={companySheetOpen}
		company={companySheetCompany}
	/>
</div>
