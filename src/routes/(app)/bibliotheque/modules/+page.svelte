<script lang="ts">
	import type { PageProps } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Badge } from '$lib/components/ui/badge';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { cn } from '$lib/utils';

	const MODALITES_EVALUATION = [
		'QCM de fin de formation',
		'Mise en situation pratique',
		'Étude de cas complexe',
		'Entretien avec le formateur'
	] as const;

	let { data }: PageProps = $props();
	let libraryModules = $derived(data?.libraryModules ?? []);
	let formations = $derived(data?.formations ?? []);
	let canManageBibliotheque = $derived(data?.canManageBibliotheque ?? false);

	let searchQuery = $state('');
	let filterModalite = $state<string>('all');
	let openAddToFormationModal = $state(false);
	let addToFormationModuleId = $state<string | null>(null);
	let addToFormationSelectedId = $state('');
	const addToFormationModule = $derived(
		addToFormationModuleId ? libraryModules.find((m) => m.id === addToFormationModuleId) : null
	);

	const filtered = $derived.by(() => {
		let list = libraryModules;
		if (searchQuery.trim()) {
			const q = searchQuery.trim().toLowerCase();
			list = list.filter(
				(m) =>
					(m.titre ?? '').toLowerCase().includes(q) ||
					(m.objectifsPedagogiques ?? '').toLowerCase().includes(q)
			);
		}
		if (filterModalite !== 'all') {
			list = list.filter((m) => m.modaliteEvaluation === filterModalite);
		}
		return list;
	});
</script>

<svelte:head>
	<title>Bibliothèque – Modules</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<h1 class="text-2xl font-bold tracking-tight">Modules</h1>
		{#if canManageBibliotheque}
			<Button href="/bibliotheque/modules/creer">Créer un module</Button>
		{/if}
	</div>

	<div class="flex flex-col gap-4 sm:flex-row sm:items-center">
		<Input
			type="search"
			placeholder="Rechercher (titre, objectifs…)"
			bind:value={searchQuery}
			class="max-w-xs"
		/>
		<Select.Root type="single" bind:value={filterModalite}>
			<Select.Trigger class="w-[240px]">
				<span class="truncate">
					{filterModalite === 'all' ? "Modalité d'évaluation" : filterModalite}
				</span>
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="all">Toutes modalités</Select.Item>
				{#each MODALITES_EVALUATION as mod}
					<Select.Item value={mod}>{mod}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	{#if filtered.length === 0}
		<Card.Root>
			<Card.Content class="flex flex-col items-center justify-center py-12 text-center">
				<p class="text-muted-foreground">
					{#if libraryModules.length === 0}
						Aucun module dans la bibliothèque. Créez un module pour le réutiliser dans vos formations.
					{:else}
						Aucun résultat pour cette recherche.
					{/if}
				</p>
				{#if canManageBibliotheque && libraryModules.length === 0}
					<Button href="/bibliotheque/modules/creer" class="mt-4">
						Créer un module
					</Button>
				{/if}
			</Card.Content>
		</Card.Root>
	{:else}
		<ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each filtered as module (module.id)}
				<li>
					<Card.Root class="h-full transition-shadow hover:shadow-md">
						<Card.Header class="pb-2">
							<div class="flex items-start justify-between gap-2">
								<Card.Title class="line-clamp-2 text-base">
									{module.titre}
								</Card.Title>
								<Badge variant="secondary" class="shrink-0 text-xs">
									{module.dureeHours}h
								</Badge>
							</div>
							<Card.Description class="line-clamp-2 text-xs">
								{module.objectifsPedagogiques?.slice(0, 120)}
								{module.objectifsPedagogiques && module.objectifsPedagogiques.length > 120 ? '…' : ''}
							</Card.Description>
							<p class="text-xs text-muted-foreground">{module.modaliteEvaluation}</p>
						</Card.Header>
						<Card.Footer class="flex gap-2 pt-2">
							{#if canManageBibliotheque}
								<Button variant="outline" size="sm" href="/bibliotheque/modules/{module.id}/modifier">
									Modifier
								</Button>
							{/if}
							<Button
								variant="secondary"
								size="sm"
								onclick={() => {
									addToFormationModuleId = module.id;
									addToFormationSelectedId = '';
									openAddToFormationModal = true;
								}}
							>
								Ajouter à une formation
							</Button>
						</Card.Footer>
					</Card.Root>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<Dialog.Root bind:open={openAddToFormationModal}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Ajouter à une formation</Dialog.Title>
			<Dialog.Description>
				{#if addToFormationModule}
					« {addToFormationModule.titre} » sera copié dans la formation choisie.
				{/if}
			</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/addModuleToFormation"
			use:enhance={() => {
				return async ({ result, update }) => {
					await update();
					if (result.type === 'success' && result.data && typeof result.data === 'object' && 'success' in result.data && result.data.formationId) {
						openAddToFormationModal = false;
						addToFormationModuleId = null;
						addToFormationSelectedId = '';
						invalidateAll();
						const fid = result.data.formationId as string;
						toast.success('Module ajouté.', {
							action: { label: 'Voir la formation', onClick: () => window.location.assign(`/formations/${fid}`) }
						});
					}
				};
			}}
			class="space-y-4"
		>
			<input type="hidden" name="libraryModuleId" value={addToFormationModuleId ?? ''} />
			<div class="space-y-2">
				<label for="add-formation-select" class="text-sm font-medium">Formation <span class="text-destructive">*</span></label>
				<select
					id="add-formation-select"
					name="formationId"
					required
					bind:value={addToFormationSelectedId}
					class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					<option value="">Choisir une formation…</option>
					{#each formations as f}
						<option value={f.id}>{f.name ?? 'Sans nom'} #{f.idInWorkspace ?? '—'} ({f.statut})</option>
					{/each}
				</select>
				{#if formations.length === 0}
					<p class="text-sm text-muted-foreground">Aucune formation en attente ou en cours. Créez une formation d'abord.</p>
				{/if}
			</div>
			<Dialog.Footer class="flex gap-2">
				<Dialog.Close><Button type="button" variant="outline">Annuler</Button></Dialog.Close>
				<Button type="submit" disabled={!addToFormationSelectedId || formations.length === 0}>Ajouter</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
