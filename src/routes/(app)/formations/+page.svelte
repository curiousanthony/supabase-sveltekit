<script lang="ts">
	import type { PageProps } from './$types';
	import FormationCard from '$lib/components/custom/formationCard.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import LayoutGrid from '@tabler/icons-svelte/icons/layout-grid';
	import LayoutList from '@tabler/icons-svelte/icons/layout-list';
	import LayoutKanban from '@tabler/icons-svelte/icons/layout-kanban';
	import Search from '@tabler/icons-svelte/icons/search';
	import Filter from '@tabler/icons-svelte/icons/filter';
	import { cn } from '$lib/utils';

	type SortOption = 'recent' | 'name-asc' | 'name-desc' | 'duree-asc' | 'duree-desc' | 'ref';
	type ViewMode = 'kanban' | 'grid' | 'list';
	const STATUTS = ['En attente', 'En cours', 'Terminée'] as const;
	const MODALITES = ['Distanciel', 'Présentiel', 'Hybride', 'E-Learning'] as const;
	const SORT_LABELS: Record<SortOption, string> = {
		recent: 'Récent',
		'name-asc': 'Nom A → Z',
		'name-desc': 'Nom Z → A',
		'duree-asc': 'Durée ↑',
		'duree-desc': 'Durée ↓',
		ref: 'Référence'
	};

	let { data }: PageProps = $props();
	let { formations } = $derived(data);

	let searchQuery = $state('');
	let filterStatut = $state<string>('all');
	let filterThematique = $state<string>('all');
	let filterModalite = $state<string>('all');
	let sortBy = $state<SortOption>('recent');
	let viewMode = $state<ViewMode>('kanban');

	const uniqueThematiques = $derived(
		Array.from(
			new Set(
				formations
					.map((f) => f.thematique?.name)
					.filter((n): n is string => !!n && n.trim() !== '')
			)
		).sort((a, b) => a.localeCompare(b))
	);

	const filteredFormations = $derived.by(() => {
		let list = formations;
		if (searchQuery.trim()) {
			const q = searchQuery.trim().toLowerCase();
			list = list.filter(
				(f) =>
					(f.name ?? '').toLowerCase().includes(q) ||
					(f.client?.legalName ?? '').toLowerCase().includes(q) ||
					(f.thematique?.name ?? '').toLowerCase().includes(q)
			);
		}
		if (filterStatut !== 'all') list = list.filter((f) => f.statut === filterStatut);
		if (filterThematique !== 'all') list = list.filter((f) => f.thematique?.name === filterThematique);
		if (filterModalite !== 'all') list = list.filter((f) => f.modalite === filterModalite);
		return list;
	});

	const sortedFormations = $derived.by(() => {
		const list = [...filteredFormations];
		switch (sortBy) {
			case 'name-asc':
				return list.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
			case 'name-desc':
				return list.sort((a, b) => (b.name ?? '').localeCompare(a.name ?? ''));
			case 'duree-asc':
				return list.sort((a, b) => (a.duree ?? 0) - (b.duree ?? 0));
			case 'duree-desc':
				return list.sort((a, b) => (b.duree ?? 0) - (a.duree ?? 0));
			case 'ref':
				return list.sort((a, b) => (b.idInWorkspace ?? 0) - (a.idInWorkspace ?? 0));
			case 'recent':
			default:
				return list.sort((a, b) => (b.idInWorkspace ?? 0) - (a.idInWorkspace ?? 0));
		}
	});

	function getFormationsByStatut(status: string) {
		return sortedFormations.filter((f) => f.statut === status);
	}
</script>

<svelte:head>
	<title>Formations</title>
</svelte:head>

<div class="space-y-6">
	<h1 class="text-2xl font-bold tracking-tight">Formations</h1>

	<!-- Toolbar: search, filters, sort, view toggle -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div class="relative flex-1 max-w-sm">
			<Search
				class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
			/>
			<Input
				type="search"
				placeholder="Rechercher par nom, client, thématique..."
				class="pl-9 h-9"
				bind:value={searchQuery}
			/>
		</div>
		<div class="flex flex-wrap items-center gap-2">
			<span class="flex items-center gap-1.5 text-sm text-muted-foreground mr-1">
				<Filter class="size-4" />
				Filtres
			</span>
			<Select.Root type="single" bind:value={filterStatut}>
				<Select.Trigger class="w-[130px] h-9">
					<span class="truncate">{filterStatut === 'all' ? 'Statut' : filterStatut}</span>
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="all">Tous les statuts</Select.Item>
					{#each STATUTS as s}
						<Select.Item value={s}>{s}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			<Select.Root type="single" bind:value={filterThematique}>
				<Select.Trigger class="w-[140px] h-9">
					<span class="truncate">{filterThematique === 'all' ? 'Thématique' : filterThematique}</span>
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="all">Toutes</Select.Item>
					{#each uniqueThematiques as t}
						<Select.Item value={t}>{t}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			<Select.Root type="single" bind:value={filterModalite}>
				<Select.Trigger class="w-[130px] h-9">
					<span class="truncate">{filterModalite === 'all' ? 'Modalité' : filterModalite}</span>
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="all">Toutes</Select.Item>
					{#each MODALITES as m}
						<Select.Item value={m}>{m}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			<Select.Root type="single" bind:value={sortBy}>
				<Select.Trigger class="w-[140px] h-9">
					<span class="truncate">{SORT_LABELS[sortBy] ?? 'Trier'}</span>
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="recent">Récent</Select.Item>
					<Select.Item value="name-asc">Nom A → Z</Select.Item>
					<Select.Item value="name-desc">Nom Z → A</Select.Item>
					<Select.Item value="duree-asc">Durée ↑</Select.Item>
					<Select.Item value="duree-desc">Durée ↓</Select.Item>
					<Select.Item value="ref">Référence</Select.Item>
				</Select.Content>
			</Select.Root>
			<ToggleGroup.Root type="single" bind:value={viewMode} class="rounded-md border shadow-xs overflow-hidden">
				<ToggleGroup.Item value="kanban" class="px-3 py-1.5" aria-label="Vue Kanban">
					<LayoutKanban class="size-4" />
				</ToggleGroup.Item>
				<ToggleGroup.Item value="grid" class="px-3 py-1.5" aria-label="Vue grille">
					<LayoutGrid class="size-4" />
				</ToggleGroup.Item>
				<ToggleGroup.Item value="list" class="px-3 py-1.5" aria-label="Vue liste">
					<LayoutList class="size-4" />
				</ToggleGroup.Item>
			</ToggleGroup.Root>
		</div>
	</div>

	<!-- Results count -->
	<p class="text-sm text-muted-foreground">
		{sortedFormations.length} formation{sortedFormations.length !== 1 ? 's' : ''}
	</p>

	<!-- Views -->
	{#if sortedFormations.length === 0}
		<Empty.Root class="min-h-[320px]">
			<Empty.Header>
				<Empty.Title>Aucune formation</Empty.Title>
				<Empty.Description>
					{#if searchQuery || filterStatut !== 'all' || filterThematique !== 'all' || filterModalite !== 'all'}
						Aucun résultat pour ces critères. Modifiez les filtres ou la recherche.
					{:else}
						Créez votre première formation pour commencer.
					{/if}
				</Empty.Description>
			</Empty.Header>
		</Empty.Root>
	{:else if viewMode === 'kanban'}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			{#each STATUTS as status}
				{@const columnFormations = getFormationsByStatut(status)}
				<div
					class={cn(
						'flex flex-col rounded-xl border bg-muted/30 overflow-hidden',
						status === 'En attente' && 'border-l-muted-foreground/40',
						status === 'En cours' && 'border-l-amber-500/50',
						status === 'Terminée' && 'border-l-green-500/50'
					)}
				>
					<div
						class={cn(
							'flex items-center justify-between px-4 py-3 border-b font-semibold text-sm',
							status === 'En attente' && 'bg-muted/50',
							status === 'En cours' && 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
							status === 'Terminée' && 'bg-green-500/10 text-green-700 dark:text-green-400'
						)}
					>
						<span>{status}</span>
						<span
							class={cn(
								'rounded-full px-2 py-0.5 text-xs font-medium',
								status === 'En attente' && 'bg-muted text-muted-foreground',
								status === 'En cours' && 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
								status === 'Terminée' && 'bg-green-500/20 text-green-700 dark:text-green-400'
							)}
						>
							{columnFormations.length}
						</span>
					</div>
					<div class="flex-1 min-h-[120px] p-3 space-y-3 overflow-y-auto">
						{#each columnFormations as formation}
							<FormationCard {formation} />
						{/each}
						{#if columnFormations.length === 0}
							<div class="flex flex-col items-center justify-center py-8 text-center text-muted-foreground text-sm">
								<p>Aucune formation</p>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{:else if viewMode === 'grid'}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each sortedFormations as formation}
				<FormationCard {formation} />
			{/each}
		</div>
	{:else}
		<div class="rounded-xl border bg-card overflow-hidden">
			<div class="divide-y">
				{#each sortedFormations as formation}
					<FormationCard {formation} variant="compact" />
				{/each}
			</div>
		</div>
	{/if}
</div>

{#snippet actions()}
	<p>Actions depuis +page.svelte</p>
{/snippet}
