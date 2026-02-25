<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Stepper } from '$lib/components/ui/stepper';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import CardCheckboxGroup from '$lib/components/ui/card-checkbox/card-checkbox-group.svelte';
	import CardCheckbox from '$lib/components/ui/card-checkbox/card-checkbox.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import School from '@lucide/svelte/icons/school';
	import Monitor from '@lucide/svelte/icons/monitor';
	import Shuffle from '@lucide/svelte/icons/shuffle';
	import GraduationCap from '@lucide/svelte/icons/graduation-cap';
	import Clock from '@lucide/svelte/icons/clock';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import X from '@lucide/svelte/icons/x';
	import Link from '@lucide/svelte/icons/link';
	import FileIcon from '@lucide/svelte/icons/file';
	import { prerequisOptions } from '$lib/bibliotheque/programme-schema';

	let { data, form }: PageProps = $props();
	let { programme, linkedModules, availableModules, linkedSupports, availableSupports } = $derived(data);

	let modaliteArray = $state<(string | number)[]>(programme.modalite ? [programme.modalite] : []);
	let statutArray = $state<(string | number)[]>([programme.statut]);
	let dureeHeures = $state(programme.dureeHeures ? Number(programme.dureeHeures) : 0);
	let selectedModuleIds = $state<string[]>(linkedModules.map((m) => m.moduleId));
	let selectedSupportIds = $state<string[]>(linkedSupports.map((s) => s.supportId));
	let showDeleteDialog = $state(false);

	const parsedPrereqs: string[] = (() => {
		try { return JSON.parse(programme.prerequis ?? '[]'); }
		catch { return []; }
	})();
	let selectedPrereqs = $state<string[]>(parsedPrereqs);

	const selectedModules = $derived(
		selectedModuleIds
			.map((id) => availableModules.find((m) => m.id === id))
			.filter(Boolean) as typeof availableModules
	);

	const totalModuleDuration = $derived(
		selectedModules.reduce((sum, m) => sum + (m.dureeHeures ? Number(m.dureeHeures) : 0), 0)
	);

	function addModule(id: string) {
		if (!selectedModuleIds.includes(id)) {
			selectedModuleIds = [...selectedModuleIds, id];
		}
	}

	function removeModule(id: string) {
		selectedModuleIds = selectedModuleIds.filter((mid) => mid !== id);
	}

	function togglePrereq(prereq: string) {
		if (selectedPrereqs.includes(prereq)) {
			selectedPrereqs = selectedPrereqs.filter((p) => p !== prereq);
		} else {
			selectedPrereqs = [...selectedPrereqs, prereq];
		}
	}

	function addSupport(id: string) {
		if (!selectedSupportIds.includes(id)) {
			selectedSupportIds = [...selectedSupportIds, id];
		}
	}

	function removeSupport(id: string) {
		selectedSupportIds = selectedSupportIds.filter((sid) => sid !== id);
	}

	const selectedSupports = $derived(
		selectedSupportIds
			.map((id) => availableSupports.find((s) => s.id === id))
			.filter(Boolean) as typeof availableSupports
	);
</script>

<svelte:head>
	<title>{programme.titre} — Programmes — Bibliothèque</title>
</svelte:head>

<div class="mx-auto flex w-full max-w-2xl flex-col gap-6">
	{#if form?.success}
		<div class="rounded-md border border-green-500/50 bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
			Programme mis à jour avec succès.
		</div>
	{/if}
	{#if form?.message}
		<div class="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
			{form.message}
		</div>
	{/if}

	<form method="POST" action="?/update" use:enhance class="flex flex-col gap-5">
		<input type="hidden" name="modalite" value={modaliteArray[0] ?? ''} />
		<input type="hidden" name="statut" value={statutArray[0] ?? 'Brouillon'} />
		<input type="hidden" name="dureeHeures" value={dureeHeures || ''} />
		<input type="hidden" name="moduleIds" value={JSON.stringify(selectedModuleIds)} />
		<input type="hidden" name="supportIds" value={JSON.stringify(selectedSupportIds)} />
		<input type="hidden" name="prerequis" value={JSON.stringify(selectedPrereqs)} />

		<div class="flex flex-col gap-2">
			<Label for="titre">Titre *</Label>
			<Input id="titre" name="titre" required value={programme.titre} />
		</div>

		<div class="flex flex-col gap-2">
			<Label for="description">Description</Label>
			<Textarea id="description" name="description" rows={4} value={programme.description ?? ''} />
		</div>

		<div class="flex flex-col gap-3">
			<Label>Modalité</Label>
			<CardCheckboxGroup multiple={false} bind:value={modaliteArray} class="grid-cols-2 sm:grid-cols-4 gap-4">
				<CardCheckbox value="Présentiel" title="Présentiel" subtitle="En salle" icon={School} />
				<CardCheckbox value="Distanciel" title="Distanciel" subtitle="En ligne" icon={Monitor} />
				<CardCheckbox value="Hybride" title="Hybride" subtitle="Mixte" icon={Shuffle} />
				<CardCheckbox value="E-Learning" title="E-Learning" subtitle="Autonome" icon={GraduationCap} />
			</CardCheckboxGroup>
		</div>

		<div class="flex flex-col gap-3">
			<Label>Statut</Label>
			<CardCheckboxGroup multiple={false} disallowEmpty={true} bind:value={statutArray} class="grid-cols-2 sm:grid-cols-4 gap-3">
				<CardCheckbox value="Brouillon" title="Brouillon" />
				<CardCheckbox value="En cours" title="En cours" />
				<CardCheckbox value="Publié" title="Publié" />
				<CardCheckbox value="Archivé" title="Archivé" />
			</CardCheckboxGroup>
		</div>

		<div class="flex flex-col gap-3">
			<Label>Durée totale (heures)</Label>
			<div class="flex flex-wrap items-center gap-2">
				<div class="relative inline-flex items-center">
					<Clock class="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
					<Stepper id="dureeHeures" bind:value={dureeHeures} min={0} step={0.5} class="pl-8 h-12" />
				</div>
				<ButtonGroup class="h-12">
					<Button type="button" variant="ghost" size="sm" class="h-12 px-6" onclick={() => (dureeHeures = 7)}>7h</Button>
					<Button type="button" variant="ghost" size="sm" class="h-12 px-6" onclick={() => (dureeHeures = 14)}>14h</Button>
					<Button type="button" variant="ghost" size="sm" class="h-12 px-6" onclick={() => (dureeHeures = 21)}>21h</Button>
					<Button type="button" variant="ghost" size="sm" class="h-12 px-6" onclick={() => (dureeHeures = 35)}>35h</Button>
					<Button type="button" variant="ghost" size="sm" class="h-12 px-6" onclick={() => (dureeHeures = 70)}>70h</Button>
				</ButtonGroup>
			</div>
		</div>

		<div class="flex flex-col gap-2">
			<Label for="prixPublic">Prix public (€)</Label>
			<Input id="prixPublic" name="prixPublic" type="number" step="0.01" min="0" value={programme.prixPublic ?? ''} />
		</div>

		<div class="flex flex-col gap-2">
			<Label>Pré-requis</Label>
			<div class="flex flex-wrap gap-3">
				{#each prerequisOptions as prereq}
					<label class="flex items-center gap-2 text-sm">
						<Checkbox
							checked={selectedPrereqs.includes(prereq)}
							onCheckedChange={() => togglePrereq(prereq)}
						/>
						{prereq}
					</label>
				{/each}
			</div>
		</div>

		<div class="flex flex-col gap-3">
			<div class="flex items-center justify-between">
				<Label>Modules</Label>
				{#if totalModuleDuration > 0}
					<span class="text-sm text-muted-foreground">Durée modules : {totalModuleDuration}h</span>
				{/if}
			</div>

			{#if selectedModules.length > 0}
				<div class="flex flex-col gap-1 rounded-md border p-2">
					{#each selectedModules as mod, i (mod.id)}
						<div class="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/50">
							<GripVertical class="size-4 text-muted-foreground" />
							<span class="flex-1 text-sm">{mod.titre}</span>
							{#if mod.dureeHeures}
								<span class="text-xs text-muted-foreground">{mod.dureeHeures}h</span>
							{/if}
							<button type="button" class="rounded p-1 text-muted-foreground hover:text-destructive" onclick={() => removeModule(mod.id)}>
								<X class="size-3" />
							</button>
						</div>
					{/each}
				</div>
			{/if}

			{#if availableModules.length > 0}
				{@const unselected = availableModules.filter((m) => !selectedModuleIds.includes(m.id))}
				{#if unselected.length > 0}
					<div class="flex flex-col gap-1">
						<span class="text-xs text-muted-foreground">Modules disponibles ({unselected.length})</span>
						<div class="flex flex-wrap gap-2">
							{#each unselected as mod (mod.id)}
								<button type="button" class="rounded-md border px-3 py-1 text-sm transition-colors hover:bg-muted" onclick={() => addModule(mod.id)}>
									+ {mod.titre}
								</button>
							{/each}
						</div>
					</div>
				{/if}
			{/if}
		</div>

		<div class="flex flex-col gap-3">
			<Label>Supports pédagogiques</Label>

			{#if selectedSupports.length > 0}
				<div class="flex flex-col gap-1 rounded-md border p-2">
					{#each selectedSupports as s (s.id)}
						<div class="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/50">
							{#if s.filePath}
								<FileIcon class="size-4 shrink-0 text-muted-foreground" />
							{:else}
								<Link class="size-4 shrink-0 text-muted-foreground" />
							{/if}
							<span class="flex-1 text-sm">{s.titre}</span>
							<button type="button" class="rounded p-1 text-muted-foreground hover:text-destructive" onclick={() => removeSupport(s.id)}>
								<X class="size-3" />
							</button>
						</div>
					{/each}
				</div>
			{/if}

			{#if availableSupports.length > 0}
				{@const unselected = availableSupports.filter((s) => !selectedSupportIds.includes(s.id))}
				{#if unselected.length > 0}
					<div class="flex flex-col gap-1">
						<span class="text-xs text-muted-foreground">Supports disponibles ({unselected.length})</span>
						<div class="flex flex-wrap gap-2">
							{#each unselected as s (s.id)}
								<button type="button" class="inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-sm transition-colors hover:bg-muted" onclick={() => addSupport(s.id)}>
									{#if s.filePath}
										<FileIcon class="size-3" />
									{:else}
										<Link class="size-3" />
									{/if}
									+ {s.titre}
								</button>
							{/each}
						</div>
					</div>
				{/if}
			{:else}
				<p class="text-sm text-muted-foreground">
					Aucun support disponible.
					<a href="/bibliotheque/supports" class="underline">Créer un support</a> d'abord.
				</p>
			{/if}
		</div>

		<div class="flex justify-end gap-3 pt-2">
			<Button type="submit">Enregistrer</Button>
		</div>
	</form>

	<div class="rounded-md border border-destructive/30 bg-destructive/5 p-4 flex items-center justify-between">
		<div>
			<p class="text-sm font-medium">Supprimer ce programme</p>
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
			<AlertDialog.Title>Supprimer ce programme ?</AlertDialog.Title>
			<AlertDialog.Description>
				Cette action est irréversible. Le programme sera définitivement supprimé.
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
