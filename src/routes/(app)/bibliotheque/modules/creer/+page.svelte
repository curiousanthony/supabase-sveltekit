<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Stepper } from '$lib/components/ui/stepper';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import CardCheckboxGroup from '$lib/components/ui/card-checkbox/card-checkbox-group.svelte';
	import CardCheckbox from '$lib/components/ui/card-checkbox/card-checkbox.svelte';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import CircleDot from '@lucide/svelte/icons/circle-dot';
	import Wrench from '@lucide/svelte/icons/wrench';
	import FolderKanban from '@lucide/svelte/icons/folder-kanban';
	import Clock from '@lucide/svelte/icons/clock';

	let { data, form }: PageProps = $props();

	let modaliteArray = $state<(string | number)[]>([]);
	let dureeHeures = $state(0);
</script>

<svelte:head>
	<title>Nouveau module — Bibliothèque</title>
</svelte:head>

<div class="mx-auto flex w-full max-w-2xl flex-col gap-6">
	{#if form?.message}
		<div class="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
			{form.message}
		</div>
	{/if}

	<form method="POST" use:enhance class="flex flex-col gap-5">
		<input type="hidden" name="modaliteEvaluation" value={modaliteArray[0] ?? ''} />
		<input type="hidden" name="dureeHeures" value={dureeHeures || ''} />

		<div class="flex flex-col gap-2">
			<Label for="titre">Titre *</Label>
			<Input id="titre" name="titre" required placeholder="Nom du module" />
		</div>

		<div class="flex flex-col gap-2">
			<Label for="contenu">Contenu</Label>
			<Textarea
				id="contenu"
				name="contenu"
				rows={6}
				placeholder="Ex : Introduction aux fondamentaux du sujet, présentation des concepts clés, démonstration des outils. Ce contenu est transmis via des exposés interactifs, des études de cas et des exercices pratiques guidés."
			/>
		</div>

		<div class="flex flex-col gap-2">
			<Label for="objectifsPedagogiques">Objectifs pédagogiques</Label>
			<Textarea
				id="objectifsPedagogiques"
				name="objectifsPedagogiques"
				rows={4}
				placeholder={"À l'issue de ce module, le stagiaire sera capable de :\n• [Verbe d'action] + [compétence mesurable]\n• Utiliser [outil/méthode] pour [objectif concret]\n• Évaluer [résultat attendu] dans un contexte professionnel"}
			/>
		</div>

		<div class="flex flex-col gap-3">
			<Label>Modalité d'évaluation</Label>
			<CardCheckboxGroup multiple={false} bind:value={modaliteArray} class="grid-cols-2 sm:grid-cols-4 gap-4">
				<CardCheckbox value="QCM" title="QCM" subtitle="Questions à choix multiples" icon={ClipboardList} />
				<CardCheckbox value="QCU" title="QCU" subtitle="Question à choix unique" icon={CircleDot} />
				<CardCheckbox value="Pratique" title="Pratique" subtitle="Mise en situation" icon={Wrench} />
				<CardCheckbox value="Projet" title="Projet" subtitle="Réalisation concrète" icon={FolderKanban} />
			</CardCheckboxGroup>
		</div>

		<div class="flex flex-col gap-3">
			<Label>Durée (heures)</Label>
			<div class="flex flex-wrap items-center gap-2">
				<div class="relative inline-flex items-center">
					<Clock class="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
					<Stepper
						id="dureeHeures"
						bind:value={dureeHeures}
						min={0}
						step={0.5}
						class="pl-8 h-12"
					/>
				</div>
				<ButtonGroup class="h-12">
					<Button type="button" variant="ghost" size="sm" class="h-12 px-6" onclick={() => (dureeHeures = 3.5)}>3.5h</Button>
					<Button type="button" variant="ghost" size="sm" class="h-12 px-6" onclick={() => (dureeHeures = 7)}>7h</Button>
					<Button type="button" variant="ghost" size="sm" class="h-12 px-6" onclick={() => (dureeHeures = 14)}>14h</Button>
					<Button type="button" variant="ghost" size="sm" class="h-12 px-6" onclick={() => (dureeHeures = 21)}>21h</Button>
					<Button type="button" variant="ghost" size="sm" class="h-12 px-6" onclick={() => (dureeHeures = 35)}>35h</Button>
				</ButtonGroup>
			</div>
		</div>

		<div class="flex justify-end gap-3 pt-2">
			<Button href="/bibliotheque/modules" variant="outline">Annuler</Button>
			<Button type="submit">Créer le module</Button>
		</div>
	</form>
</div>
