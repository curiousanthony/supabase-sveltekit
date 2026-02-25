<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import CardCheckboxGroup from '$lib/components/ui/card-checkbox/card-checkbox-group.svelte';
	import CardCheckbox from '$lib/components/ui/card-checkbox/card-checkbox.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import BarChart3 from '@lucide/svelte/icons/bar-chart-3';
	import ListChecks from '@lucide/svelte/icons/list-checks';
	import Search from '@lucide/svelte/icons/search';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import X from '@lucide/svelte/icons/x';

	let { data, form }: PageProps = $props();
	let {
		questionnaire,
		linkedProgrammeIds,
		linkedModuleIds,
		availableProgrammes,
		availableModules
	} = $derived(data);

	let typeArray = $state<(string | number)[]>(questionnaire.type ? [questionnaire.type] : []);
	let selectedProgrammeIds = $state<string[]>(linkedProgrammeIds);
	let selectedModuleIds = $state<string[]>(linkedModuleIds);
	let showDeleteDialog = $state(false);

	function toggleProgramme(id: string) {
		if (selectedProgrammeIds.includes(id)) {
			selectedProgrammeIds = selectedProgrammeIds.filter((x) => x !== id);
		} else {
			selectedProgrammeIds = [...selectedProgrammeIds, id];
		}
	}

	function toggleModule(id: string) {
		if (selectedModuleIds.includes(id)) {
			selectedModuleIds = selectedModuleIds.filter((x) => x !== id);
		} else {
			selectedModuleIds = [...selectedModuleIds, id];
		}
	}
</script>

<svelte:head>
	<title>{questionnaire.titre} — Questionnaires — Bibliothèque</title>
</svelte:head>

<div class="mx-auto flex w-full max-w-2xl flex-col gap-6">
	{#if form?.success}
		<div class="rounded-md border border-green-500/50 bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
			Questionnaire mis à jour avec succès.
		</div>
	{/if}
	{#if form?.message}
		<div class="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
			{form.message}
		</div>
	{/if}

	<form method="POST" action="?/update" use:enhance class="flex flex-col gap-5">
		<input type="hidden" name="type" value={typeArray[0] ?? ''} />
		<input type="hidden" name="programmeIds" value={JSON.stringify(selectedProgrammeIds)} />
		<input type="hidden" name="moduleIds" value={JSON.stringify(selectedModuleIds)} />

		<div class="flex flex-col gap-2">
			<Label for="titre">Titre *</Label>
			<Input id="titre" name="titre" required value={questionnaire.titre} />
		</div>

		<div class="flex flex-col gap-3">
			<Label>Type</Label>
			<CardCheckboxGroup multiple={false} bind:value={typeArray} class="grid-cols-1 sm:grid-cols-3 gap-4">
				<CardCheckbox value="Test de niveau" title="Test de niveau" subtitle="Positionnement initial" icon={BarChart3} />
				<CardCheckbox value="Quiz / Exercice" title="Quiz / Exercice" subtitle="Évaluation en cours" icon={ListChecks} />
				<CardCheckbox value="Audit des besoins" title="Audit des besoins" subtitle="Analyse préalable" icon={Search} />
			</CardCheckboxGroup>
		</div>

		<div class="flex flex-col gap-2">
			<Label for="urlTest">URL du test</Label>
			<Input id="urlTest" name="urlTest" type="url" value={questionnaire.urlTest ?? ''} placeholder="https://forms.google.com/..." />
		</div>

		<div class="flex flex-col gap-2">
			<Label>Programmes associés</Label>
			{#if selectedProgrammeIds.length > 0}
				<div class="flex flex-wrap gap-2">
					{#each selectedProgrammeIds as id}
						{@const prog = availableProgrammes.find((p) => p.id === id)}
						{#if prog}
							<Badge variant="secondary" class="gap-1">
								{prog.titre}
								<button type="button" onclick={() => toggleProgramme(id)}>
									<X class="size-3" />
								</button>
							</Badge>
						{/if}
					{/each}
				</div>
			{/if}
			{#if availableProgrammes.length > 0}
				<div class="flex flex-wrap gap-2">
					{#each availableProgrammes.filter((p) => !selectedProgrammeIds.includes(p.id)) as prog (prog.id)}
						<button type="button" class="rounded-md border px-3 py-1 text-sm transition-colors hover:bg-muted" onclick={() => toggleProgramme(prog.id)}>
							+ {prog.titre}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<div class="flex flex-col gap-2">
			<Label>Modules associés</Label>
			{#if selectedModuleIds.length > 0}
				<div class="flex flex-wrap gap-2">
					{#each selectedModuleIds as id}
						{@const mod = availableModules.find((m) => m.id === id)}
						{#if mod}
							<Badge variant="secondary" class="gap-1">
								{mod.titre}
								<button type="button" onclick={() => toggleModule(id)}>
									<X class="size-3" />
								</button>
							</Badge>
						{/if}
					{/each}
				</div>
			{/if}
			{#if availableModules.length > 0}
				<div class="flex flex-wrap gap-2">
					{#each availableModules.filter((m) => !selectedModuleIds.includes(m.id)) as mod (mod.id)}
						<button type="button" class="rounded-md border px-3 py-1 text-sm transition-colors hover:bg-muted" onclick={() => toggleModule(mod.id)}>
							+ {mod.titre}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<div class="flex justify-end gap-3 pt-2">
			<Button type="submit">Enregistrer</Button>
		</div>
	</form>

	<div class="rounded-md border border-destructive/30 bg-destructive/5 p-4 flex items-center justify-between">
		<div>
			<p class="text-sm font-medium">Supprimer ce questionnaire</p>
			<p class="text-xs text-muted-foreground">Cette action est irréversible.</p>
		</div>
		<Button variant="destructive" size="sm" onclick={() => (showDeleteDialog = true)}>
			<Trash2 class="mr-1 size-4" />
			Supprimer
		</Button>
	</div>
</div>

<AlertDialog.Root bind:open={showDeleteDialog}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Supprimer ce questionnaire ?</AlertDialog.Title>
			<AlertDialog.Description>
				Cette action est irréversible. Le questionnaire sera définitivement supprimé.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Annuler</AlertDialog.Cancel>
			<form method="POST" action="?/delete" use:enhance>
				<AlertDialog.Action type="submit" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
					Supprimer
				</AlertDialog.Action>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
