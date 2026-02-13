<script lang="ts">
	import type { PageProps } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';

	const MODALITES = ['Distanciel', 'Présentiel', 'Hybride', 'E-Learning'] as const;

	let { data }: PageProps = $props();
	let libraryProgrammes = $derived(data?.libraryProgrammes ?? []);
	let canManageBibliotheque = $derived(data?.canManageBibliotheque ?? false);

	let searchQuery = $state('');
	let filterThematique = $state<string>('all');
	let filterModalite = $state<string>('all');

	const filtered = $derived.by(() => {
		let list = libraryProgrammes;
		if (searchQuery.trim()) {
			const q = searchQuery.trim().toLowerCase();
			list = list.filter(
				(p) =>
					(p.titre ?? '').toLowerCase().includes(q) ||
					(p.objectifs ?? '').toLowerCase().includes(q)
			);
		}
		if (filterThematique !== 'all') {
			list = list.filter((p) => p.thematique?.name === filterThematique);
		}
		if (filterModalite !== 'all') {
			list = list.filter((p) => p.modalite === filterModalite);
		}
		return list;
	});

	const uniqueThematiques = $derived(
		Array.from(
			new Set(
				libraryProgrammes
					.map((p) => p.thematique?.name)
					.filter((n): n is string => !!n && n.trim() !== '')
			)
		).sort((a, b) => a.localeCompare(b))
	);
</script>

<svelte:head>
	<title>Bibliothèque – Programmes de formation</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<h1 class="text-2xl font-bold tracking-tight">Programmes de formation</h1>
		{#if canManageBibliotheque}
			<Button href="/bibliotheque/programmes/creer">Créer un programme</Button>
		{/if}
	</div>

	<div class="flex flex-col gap-4 sm:flex-row sm:items-center">
		<Input
			type="search"
			placeholder="Rechercher (titre, objectifs…)"
			bind:value={searchQuery}
			class="max-w-xs"
		/>
		<Select.Root type="single" bind:value={filterThematique}>
			<Select.Trigger class="w-[180px]">
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
			<Select.Trigger class="w-[160px]">
				<span class="truncate">{filterModalite === 'all' ? 'Modalité' : filterModalite}</span>
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="all">Toutes</Select.Item>
				{#each MODALITES as m}
					<Select.Item value={m}>{m}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	{#if filtered.length === 0}
		<Card.Root>
			<Card.Content class="flex flex-col items-center justify-center py-12 text-center">
				<p class="text-muted-foreground">
					{#if libraryProgrammes.length === 0}
						Aucun programme dans la bibliothèque. Créez un programme pour préremplir vos formations.
					{:else}
						Aucun résultat pour cette recherche.
					{/if}
				</p>
				{#if canManageBibliotheque && libraryProgrammes.length === 0}
					<Button href="/bibliotheque/programmes/creer" class="mt-4">
						Créer un programme
					</Button>
				{/if}
			</Card.Content>
		</Card.Root>
	{:else}
		<ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each filtered as prog (prog.id)}
				<li>
					<Card.Root class="h-full transition-shadow hover:shadow-md">
						<Card.Header class="pb-2">
							<div class="flex items-start justify-between gap-2">
								<Card.Title class="line-clamp-2 text-base">{prog.titre}</Card.Title>
								<Badge variant="secondary" class="shrink-0 text-xs">
									{prog.duree}h
								</Badge>
							</div>
							<Card.Description class="line-clamp-2 text-xs">
								{prog.objectifs?.slice(0, 120)}
								{prog.objectifs && prog.objectifs.length > 120 ? '…' : ''}
							</Card.Description>
							<div class="flex flex-wrap gap-1 text-xs text-muted-foreground">
								{#if prog.thematique?.name}
									<span>{prog.thematique.name}</span>
								{/if}
								<span>·</span>
								<span>{prog.modalite}</span>
								<span>·</span>
								<span>{prog.moduleCount} module(s)</span>
							</div>
						</Card.Header>
						<Card.Footer class="flex gap-2 pt-2">
							{#if canManageBibliotheque}
								<Button
									variant="outline"
									size="sm"
									href="/bibliotheque/programmes/{prog.id}/modifier"
								>
									Modifier
								</Button>
							{/if}
							<Button variant="default" size="sm" href="/formations/creer?programmeId={prog.id}">
								Créer une formation
							</Button>
						</Card.Footer>
					</Card.Root>
				</li>
			{/each}
		</ul>
	{/if}
</div>
