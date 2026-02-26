<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import CardCheckboxGroup from '$lib/components/ui/card-checkbox/card-checkbox-group.svelte';
	import CardCheckbox from '$lib/components/ui/card-checkbox/card-checkbox.svelte';
	import BarChart3 from '@lucide/svelte/icons/bar-chart-3';
	import ListChecks from '@lucide/svelte/icons/list-checks';
	import Search from '@lucide/svelte/icons/search';
	import X from '@lucide/svelte/icons/x';

	let { data, form }: PageProps = $props();
	let { availableProgrammes, availableModules } = $derived(data);

	let typeArray = $state<(string | number)[]>([]);
	let selectedProgrammeIds = $state<string[]>([]);
	let selectedModuleIds = $state<string[]>([]);

	$effect(() => {
		const f = form;
		if (!f?.message || !('values' in f) || !f.values) return;
		const v = f.values as { type?: string; programmeIds?: string[]; moduleIds?: string[] };
		typeArray = v.type ? [v.type] : [];
		selectedProgrammeIds = Array.isArray(v.programmeIds) ? [...v.programmeIds] : [];
		selectedModuleIds = Array.isArray(v.moduleIds) ? [...v.moduleIds] : [];
	});

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
	<title>Nouveau questionnaire — Bibliothèque</title>
</svelte:head>

<div class="mx-auto flex w-full max-w-2xl flex-col gap-6">
	{#if form?.message}
		<div class="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
			{form.message}
		</div>
	{/if}

	<form method="POST" use:enhance class="flex flex-col gap-5">
		<input type="hidden" name="type" value={typeArray[0] ?? ''} />
		<input type="hidden" name="programmeIds" value={JSON.stringify(selectedProgrammeIds)} />
		<input type="hidden" name="moduleIds" value={JSON.stringify(selectedModuleIds)} />

		<div class="flex flex-col gap-2">
			<Label for="titre">Titre *</Label>
			<Input id="titre" name="titre" required placeholder="Nom du questionnaire" />
		</div>

		<fieldset class="flex flex-col gap-3">
			<legend class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Type</legend>
			<CardCheckboxGroup multiple={false} bind:value={typeArray} class="grid-cols-1 sm:grid-cols-3 gap-4">
				<CardCheckbox value="Test de niveau" title="Test de niveau" subtitle="Positionnement initial" icon={BarChart3} />
				<CardCheckbox value="Quiz / Exercice" title="Quiz / Exercice" subtitle="Évaluation en cours" icon={ListChecks} />
				<CardCheckbox value="Audit des besoins" title="Audit des besoins" subtitle="Analyse préalable" icon={Search} />
			</CardCheckboxGroup>
		</fieldset>

		<div class="flex flex-col gap-2">
			<Label for="urlTest">URL du test</Label>
			<Input id="urlTest" name="urlTest" type="url" placeholder="https://forms.google.com/..." />
		</div>

		<fieldset class="flex flex-col gap-2">
			<legend class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Programmes associés</legend>
			{#if selectedProgrammeIds.length > 0}
				<div class="flex flex-wrap gap-2">
					{#each selectedProgrammeIds as id}
						{@const prog = availableProgrammes.find((p) => p.id === id)}
						{#if prog}
							<Badge variant="secondary" class="gap-1">
								{prog.titre}
								<button type="button" aria-label="Retirer le programme {prog.titre}" onclick={() => toggleProgramme(id)}>
									<span class="sr-only">Retirer le programme {prog.titre}</span>
									<X class="size-3" aria-hidden="true" />
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
		</fieldset>

		<fieldset class="flex flex-col gap-2">
			<legend class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Modules associés</legend>
			{#if selectedModuleIds.length > 0}
				<div class="flex flex-wrap gap-2">
					{#each selectedModuleIds as id}
						{@const mod = availableModules.find((m) => m.id === id)}
						{#if mod}
							<Badge variant="secondary" class="gap-1">
								{mod.titre}
								<button type="button" aria-label="Retirer le module {mod.titre}" onclick={() => toggleModule(id)}>
									<span class="sr-only">Retirer le module {mod.titre}</span>
									<X class="size-3" aria-hidden="true" />
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
		</fieldset>

		<div class="flex justify-end gap-3 pt-2">
			<Button href="/bibliotheque/questionnaires" variant="outline">Annuler</Button>
			<Button type="submit">Créer le questionnaire</Button>
		</div>
	</form>
</div>
