<script lang="ts">
	import type { PageProps } from './$types';
	import * as Table from '$lib/components/ui/table';
	import * as Button from '$lib/components/ui/button';
	import * as Input from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import ContactModal from '$lib/components/crm/ContactModal.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Users from '@lucide/svelte/icons/users';

	let { data }: PageProps = $props();
	let contactModalOpen = $state(false);
	let contactModalContact = $state<typeof data.editContact>(null);
	let modalClosed = $state(false);
	let openNewModalConsumed = $state(false);
	let prevModalOpen = false;

	// Detect user closing the modal (open goes true → false)
	$effect(() => {
		if (prevModalOpen && !contactModalOpen) {
			modalClosed = true;
		}
		prevModalOpen = contactModalOpen;
	});

	// Reset modalClosed when leaving edit context so next edit can open
	$effect(() => {
		if (!data?.editContact) {
			modalClosed = false;
		}
	});

	// Reset openNewModalConsumed when URL no longer has ?new
	$effect(() => {
		if (!data?.openNewModal) {
			openNewModalConsumed = false;
		}
	});

	$effect(() => {
		if (workspaceId && data?.editContact && !modalClosed && contactModalContact?.id !== data.editContact.id) {
			contactModalOpen = true;
			contactModalContact = data.editContact;
		}
	});

	$effect(() => {
		if (workspaceId && data?.openNewModal && !openNewModalConsumed) {
			openNewModalConsumed = true;
			contactModalContact = null;
			contactModalOpen = true;
			// Clean ?new=true from URL
			const url = new URL($page.url);
			url.searchParams.delete('new');
			goto(url.pathname + (url.search ? url.search : ''), { replaceState: true, noScroll: true });
		}
	});

	function openNewContactModal() {
		contactModalContact = null;
		contactModalOpen = true;
	}

	const contacts = $derived(data?.contacts ?? []);
	const companies = $derived(data?.companies ?? []);
	const workspaceId = $derived(data?.workspaceId);

	let search = $state('');
	let posteFilter = $state<string>('all');
	let sortKey = $state<'name' | 'email' | null>(null);
	let sortDir = $state<'asc' | 'desc'>('asc');

	$effect(() => {
		search = data?.query ?? '';
		posteFilter = data?.poste && data.poste !== '' ? data.poste : 'all';
	});

	function fullName(c: { firstName?: string | null; lastName?: string | null }) {
		return [c.firstName, c.lastName].filter(Boolean).join(' ') || '—';
	}

	function initials(c: { firstName?: string | null; lastName?: string | null }) {
		const f = c.firstName?.[0] ?? '';
		const l = c.lastName?.[0] ?? '';
		return (f + l).toUpperCase() || '?';
	}

	function companyBadges(
		c: { contactCompanies: { companyId: string }[] },
		companyList: { id: string; name: string }[]
	): { id: string; name: string }[] {
		return (
			c.contactCompanies
				?.map((cc) => {
					const company = companyList.find((co) => co.id === cc.companyId);
					return company ? { id: company.id, name: company.name } : null;
				})
				.filter((b): b is { id: string; name: string } => b != null) ?? []
		);
	}

	const POSTE_OPTIONS = [
		{ value: 'all', label: 'Tous les postes' },
		{ value: 'PDG / Président', label: 'PDG / Président' },
		{ value: 'Directeur Général', label: 'Directeur Général' },
		{ value: 'Directeur des Ressources Humaines', label: 'Dir. Ressources Humaines' },
		{ value: 'Responsable RH', label: 'Responsable RH' },
		{ value: 'Responsable Formation', label: 'Responsable Formation' },
		{ value: 'Directeur Commercial', label: 'Directeur Commercial' },
		{ value: 'Responsable Commercial', label: 'Responsable Commercial' },
		{ value: 'Directeur Marketing', label: 'Directeur Marketing' },
		{ value: 'Directeur Financier', label: 'Directeur Financier' },
		{ value: 'Directeur des Opérations', label: 'Dir. des Opérations' },
		{ value: 'Directeur Technique', label: 'Directeur Technique' },
		{ value: 'Office Manager', label: 'Office Manager' },
		{ value: 'Assistant(e) de Direction', label: 'Assistant(e) de Direction' },
		{ value: 'Chef de Projet', label: 'Chef de Projet' },
		{ value: 'Responsable des Achats', label: 'Resp. des Achats' },
		{ value: 'Consultant', label: 'Consultant' },
		{ value: 'Gérant', label: 'Gérant' },
		{ value: 'Associé', label: 'Associé' },
		{ value: 'Autre', label: 'Autre' }
	];

	function applyFilters() {
		const params = new URLSearchParams();
		if (search) params.set('q', search);
		if (posteFilter && posteFilter !== 'all') params.set('poste', posteFilter);
		goto(`/contacts?${params.toString()}`, { replaceState: true });
	}

	function toggleSort(key: 'name' | 'email') {
		if (sortKey === key) {
			if (sortDir === 'asc') {
				sortDir = 'desc';
			} else {
				sortKey = null;
				sortDir = 'asc';
			}
		} else {
			sortKey = key;
			sortDir = 'asc';
		}
	}

	const sortedContacts = $derived.by(() => {
		if (!sortKey) return contacts;
		const list = [...contacts];
		const mult = sortDir === 'asc' ? 1 : -1;
		list.sort((a, b) => {
			if (sortKey === 'name') {
				const na = fullName(a);
				const nb = fullName(b);
				return mult * na.localeCompare(nb, undefined, { sensitivity: 'base' });
			}
			const ea = (a.email ?? '').toLowerCase();
			const eb = (b.email ?? '').toLowerCase();
			return mult * ea.localeCompare(eb);
		});
		return list;
	});

	// Avatar color based on name
	const avatarColors = [
		'bg-blue-100 text-blue-700',
		'bg-purple-100 text-purple-700',
		'bg-green-100 text-green-700',
		'bg-orange-100 text-orange-700',
		'bg-pink-100 text-pink-700',
		'bg-teal-100 text-teal-700'
	];
	function avatarColor(name: string) {
		let hash = 0;
		for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
		return avatarColors[Math.abs(hash) % avatarColors.length];
	}
</script>

<svelte:head>
	<title>CRM – Clients</title>
</svelte:head>

{#if data?.loadError}
	<div class="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
		<strong>Erreur au chargement :</strong>
		{data.loadError}
	</div>
{/if}

{#if !workspaceId}
	<div class="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
		<p class="text-sm">Aucun espace de travail assigné.</p>
	</div>
{:else}
	<div class="flex min-h-0 flex-1 flex-col gap-4">
		<!-- Search / filter bar -->
		<div class="flex flex-wrap items-center gap-2">
			<div class="relative flex-1 min-w-[180px] max-w-sm">
				<Input.Root
					type="search"
					placeholder="Rechercher par nom ou email..."
					bind:value={search}
					onkeydown={(e) => e.key === 'Enter' && applyFilters()}
					class="pr-8"
				/>
			</div>
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
			<Button.Root variant="secondary" onclick={() => applyFilters()}>Filtrer</Button.Root>
		</div>

		{#if contacts.length === 0}
			<div class="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center gap-3">
				<div class="flex size-12 items-center justify-center rounded-full bg-muted">
					<Users class="size-5 text-muted-foreground" />
				</div>
				<div>
					<p class="font-medium text-sm">Aucun contact trouvé</p>
					<p class="text-sm text-muted-foreground mt-1">Commencez par ajouter votre premier contact.</p>
				</div>
				<Button.Root onclick={openNewContactModal}>+ Nouveau contact</Button.Root>
			</div>
		{:else}
			<!-- Desktop table -->
			<div class="hidden md:block overflow-auto rounded-xl border bg-card">
				<Table.Root>
					<Table.Header>
						<Table.Row class="hover:bg-transparent border-b">
							<Table.Head
								class="w-[280px]"
								aria-sort={sortKey === 'name' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
							>
								<Table.SortableTableHead
									label="Contact"
									active={sortKey === 'name'}
									direction={sortKey === 'name' ? sortDir : null}
									onclick={() => toggleSort('name')}
								/>
							</Table.Head>
							<Table.Head>Entreprise(s)</Table.Head>
							<Table.Head class="w-[140px]">Poste</Table.Head>
							<Table.Head
								class="w-[220px]"
								aria-sort={sortKey === 'email' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
							>
								<Table.SortableTableHead
									label="Email"
									active={sortKey === 'email'}
									direction={sortKey === 'email' ? sortDir : null}
									onclick={() => toggleSort('email')}
								/>
							</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each sortedContacts as c (c.id)}
							{@const name = fullName(c)}
							{@const ini = initials(c)}
							{@const color = avatarColor(name)}
							{@const badges = companyBadges(c, companies)}
							<Table.Row
								class="cursor-pointer hover:bg-muted/40 transition-colors"
								onclick={() => goto(`/contacts/${c.id}`)}
							>
								<Table.Cell>
									<div class="flex items-center gap-3">
										<div class={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${color}`}>
											{ini}
										</div>
										<span class="font-medium text-sm">{name}</span>
									</div>
								</Table.Cell>
								<Table.Cell>
									<div class="flex flex-wrap gap-1">
										{#each badges as badge (badge.id)}
											<Badge variant="secondary" class="text-xs">{badge.name}</Badge>
										{/each}
										{#if badges.length === 0}
											<span class="text-muted-foreground text-sm">—</span>
										{/if}
									</div>
								</Table.Cell>
								<Table.Cell>
									{#if c.poste}
										<Badge variant="outline" class="text-xs">{c.poste}</Badge>
									{:else}
										<span class="text-muted-foreground text-sm">—</span>
									{/if}
								</Table.Cell>
								<Table.Cell>
									{#if c.email}
										<a
											href="mailto:{c.email}"
											class="text-sm text-primary hover:underline"
											onclick={(e) => e.stopPropagation()}
										>{c.email}</a>
									{:else}
										<span class="text-muted-foreground text-sm">—</span>
									{/if}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>

			<!-- Mobile card list -->
			<div class="flex flex-col gap-2 md:hidden">
				{#each sortedContacts as c (c.id)}
					{@const name = fullName(c)}
					{@const ini = initials(c)}
					{@const color = avatarColor(name)}
					<button
						type="button"
						class="flex items-center gap-3 rounded-xl border bg-card p-4 text-left hover:bg-muted/40 transition-colors w-full"
						onclick={() => goto(`/contacts/${c.id}`)}
					>
						<div class={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${color}`}>
							{ini}
						</div>
						<div class="min-w-0 flex-1">
							<p class="font-medium text-sm truncate">{name}</p>
							<p class="text-xs text-muted-foreground truncate">{c.email ?? '—'}</p>
						</div>
						{#if c.poste}
							<Badge variant="outline" class="text-xs shrink-0">{c.poste}</Badge>
						{/if}
					</button>
				{/each}
			</div>
		{/if}

		<ContactModal
			bind:open={contactModalOpen}
			contact={contactModalContact}
			companies={companies.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }))}
		/>
	</div>
{/if}
