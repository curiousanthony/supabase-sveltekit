<script lang="ts">
	import type { PageProps } from './$types';
	import * as Table from '$lib/components/ui/table';
	import * as Button from '$lib/components/ui/button';
	import * as Input from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import CompanyModal from '$lib/components/crm/CompanyModal.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Building2 from '@lucide/svelte/icons/building-2';
	import { industryOptions, companySizeOptions } from '$lib/crm/company-form-options';

	let { data }: PageProps = $props();
	let companyModalOpen = $state(false);
	let companyModalCompany = $state<typeof data.editCompany>(null);

	$effect(() => {
		if (data?.editCompany) {
			companyModalOpen = true;
			companyModalCompany = data.editCompany;
		}
	});

	$effect(() => {
		if (data?.openNewModal) {
			companyModalCompany = null;
			companyModalOpen = true;
			// Clean ?new=true from URL
			const url = new URL(window.location.href);
			url.searchParams.delete('new');
			goto(url.pathname + (url.search ? url.search : ''), { replaceState: true, noScroll: true });
		}
	});

	function openNewCompanyModal() {
		companyModalCompany = null;
		companyModalOpen = true;
	}

	const companies = $derived(data?.companies ?? []);
	const allContacts = $derived(data?.allContacts ?? []);
	const workspaceId = $derived(data?.workspaceId);

	let search = $state('');
	let industryFilter = $state<string>('all');
	let sizeFilter = $state<string>('all');
	let sortKey = $state<'name' | null>(null);
	let sortDir = $state<'asc' | 'desc'>('asc');

	$effect(() => {
		search = data?.query ?? '';
		industryFilter = data?.industry && data.industry !== '' ? data.industry : 'all';
		sizeFilter = data?.size && data.size !== '' ? data.size : 'all';
	});
	function applyFilters() {
		const params = new URLSearchParams();
		if (search) params.set('q', search);
		if (industryFilter && industryFilter !== 'all') params.set('industry', industryFilter);
		if (sizeFilter && sizeFilter !== 'all') params.set('size', sizeFilter);
		const qs = params.toString();
		goto(`/contacts/entreprises${qs ? `?${qs}` : ''}`, { replaceState: true });
	}

	function clearFilters() {
		goto('/contacts/entreprises', { replaceState: true });
	}

	function toggleSort(key: 'name') {
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

	const sortedCompanies = $derived.by(() => {
		if (!sortKey) return companies;
		const list = [...companies];
		const mult = sortDir === 'asc' ? 1 : -1;
		list.sort((a, b) => mult * (a.name ?? '').localeCompare(b.name ?? '', undefined, { sensitivity: 'base' }));
		return list;
	});

	const hasActiveFiltersOrSearch = $derived(
		search.trim() !== '' || industryFilter !== 'all' || sizeFilter !== 'all'
	);

	const INDUSTRY_OPTIONS = [
		{ value: 'all', label: 'Toutes les industries' },
		...industryOptions.map((v) => ({ value: v, label: v }))
	];

	const SIZE_OPTIONS = [
		{ value: 'all', label: 'Toutes les tailles' },
		...companySizeOptions.map((v) => ({ value: v, label: v }))
	];

	// Avatar color based on company name initial
	const avatarColors = [
		'bg-blue-100 text-blue-700',
		'bg-violet-100 text-violet-700',
		'bg-emerald-100 text-emerald-700',
		'bg-amber-100 text-amber-700',
		'bg-rose-100 text-rose-700',
		'bg-cyan-100 text-cyan-700'
	];
	function avatarColor(name: string) {
		let hash = 0;
		for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
		return avatarColors[Math.abs(hash) % avatarColors.length];
	}
	function initial(name: string) {
		return name.trim()[0]?.toUpperCase() ?? '?';
	}
</script>

<svelte:head>
	<title>CRM – Entreprises</title>
</svelte:head>

<div class="flex w-full flex-col gap-4">
	<div class="flex flex-wrap items-center gap-2">
		<div class="relative flex-1 min-w-[180px] max-w-sm">
				<Input.Root
					type="search"
					placeholder="Rechercher par nom, ville, SIRET..."
					bind:value={search}
					onkeydown={(e) => e.key === 'Enter' && applyFilters()}
					class="pr-8"
					aria-label="Rechercher par nom, ville, SIRET"
				/>
			</div>
			<Select.Root type="single" bind:value={industryFilter}>
				<Select.Trigger class="w-[180px]">
					{INDUSTRY_OPTIONS.find((o) => o.value === industryFilter)?.label ?? 'Industrie'}
				</Select.Trigger>
				<Select.Content>
					{#each INDUSTRY_OPTIONS as opt (opt.value)}
						<Select.Item value={opt.value}>{opt.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			<Select.Root type="single" bind:value={sizeFilter}>
				<Select.Trigger class="w-[160px]">
					{SIZE_OPTIONS.find((o) => o.value === sizeFilter)?.label ?? 'Taille'}
				</Select.Trigger>
				<Select.Content>
					{#each SIZE_OPTIONS as opt (opt.value)}
						<Select.Item value={opt.value}>{opt.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			<Button.Root variant="secondary" onclick={() => applyFilters()}>Filtrer</Button.Root>
		</div>

	{#if companies.length === 0 && hasActiveFiltersOrSearch}
			<div class="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center gap-3">
				<div class="flex size-12 items-center justify-center rounded-full bg-muted">
					<Building2 class="size-5 text-muted-foreground" />
				</div>
				<div>
					<p class="font-medium text-sm">Aucun résultat pour cette recherche</p>
					<p class="text-sm text-muted-foreground mt-1">Essayez d’autres critères ou effacez les filtres.</p>
				</div>
				<Button.Root variant="secondary" onclick={clearFilters}>Effacer les filtres</Button.Root>
			</div>
		{:else if companies.length === 0}
			<div class="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center gap-3">
				<div class="flex size-12 items-center justify-center rounded-full bg-muted">
					<Building2 class="size-5 text-muted-foreground" />
				</div>
				<div>
					<p class="font-medium text-sm">Aucune entreprise trouvée</p>
					<p class="text-sm text-muted-foreground mt-1">Commencez par ajouter votre première entreprise.</p>
				</div>
				<Button.Root onclick={openNewCompanyModal}>+ Nouvelle entreprise</Button.Root>
			</div>
		{:else}
			<!-- Desktop table -->
			<div class="hidden md:block overflow-auto rounded-xl border bg-card">
				<Table.Root>
					<Table.Header>
						<Table.Row class="hover:bg-transparent border-b">
							<Table.Head class="w-[260px]">
								<Table.SortableTableHead
									label="Entreprise"
									active={sortKey === 'name'}
									direction={sortKey === 'name' ? sortDir : null}
									onclick={() => toggleSort('name')}
								/>
							</Table.Head>
							<Table.Head>Industrie</Table.Head>
							<Table.Head class="w-[120px]">Taille</Table.Head>
							<Table.Head class="w-[160px]">Ville</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each sortedCompanies as company (company.id)}
							{@const color = avatarColor(company.name)}
							{@const ini = initial(company.name)}
							<Table.Row
								class="cursor-pointer hover:bg-muted/40 transition-colors"
								onclick={() => goto(`/contacts/entreprises/${company.id}`)}
							>
								<Table.Cell>
									<div class="flex items-center gap-3">
										<div class={`flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${color}`}>
											{ini}
										</div>
										<span class="font-medium text-sm">{company.name}</span>
									</div>
								</Table.Cell>
								<Table.Cell>
									{#if company.industry}
										<Badge variant="secondary" class="text-xs">{company.industry}</Badge>
									{:else}
										<span class="text-muted-foreground text-sm">—</span>
									{/if}
								</Table.Cell>
								<Table.Cell>
									{#if company.companySize}
										<Badge variant="outline" class="text-xs">{company.companySize}</Badge>
									{:else}
										<span class="text-muted-foreground text-sm">—</span>
									{/if}
								</Table.Cell>
								<Table.Cell>
									<span class="text-sm">{company.city ?? '—'}</span>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>

			<!-- Mobile card list -->
			<div class="flex flex-col gap-2 md:hidden">
				{#each sortedCompanies as company (company.id)}
					{@const color = avatarColor(company.name)}
					{@const ini = initial(company.name)}
					<button
						type="button"
						class="flex items-center gap-3 rounded-xl border bg-card p-4 text-left hover:bg-muted/40 transition-colors w-full"
						onclick={() => goto(`/contacts/entreprises/${company.id}`)}
					>
						<div class={`flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${color}`}>
							{ini}
						</div>
						<div class="min-w-0 flex-1">
							<p class="font-medium text-sm truncate">{company.name}</p>
							<p class="text-xs text-muted-foreground truncate">{company.city ?? company.industry ?? '—'}</p>
						</div>
						{#if company.companySize}
							<Badge variant="outline" class="text-xs shrink-0">{company.companySize}</Badge>
						{/if}
					</button>
				{/each}
			</div>
		{/if}
</div>

<CompanyModal bind:open={companyModalOpen} company={companyModalCompany} contacts={allContacts} />
