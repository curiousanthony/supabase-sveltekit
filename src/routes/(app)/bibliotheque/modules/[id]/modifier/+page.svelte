<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import * as Card from '$lib/components/ui/card';

	const MODALITES = [
		'QCM de fin de formation',
		'Mise en situation pratique',
		'Étude de cas complexe',
		'Entretien avec le formateur'
	] as const;

	let { data, form }: PageProps = $props();
	let libraryModule = $derived(data?.libraryModule);
	let selectedModalite = $state(MODALITES[0]);
	$effect(() => {
		const m = data?.libraryModule?.modaliteEvaluation;
		if (m) selectedModalite = m;
	});
</script>

<svelte:head>
	<title>Bibliothèque – Modifier le module</title>
</svelte:head>

{#if !libraryModule}
	<p class="text-muted-foreground">Module introuvable.</p>
{:else}
	<div class="max-w-2xl space-y-6">
		<h1 class="text-2xl font-bold tracking-tight">Modifier le module</h1>

		<Card.Root>
			<Card.Content class="pt-6">
				<form method="POST" use:enhance class="space-y-6">
					<div class="space-y-2">
						<label for="titre" class="text-sm font-medium">Titre <span class="text-destructive">*</span></label>
						<Input
							id="titre"
							name="titre"
							required
							value={libraryModule.titre}
							placeholder="Ex. Introduction aux fondamentaux"
						/>
					</div>
					<div class="space-y-2">
						<label for="dureeHours" class="text-sm font-medium">Durée (heures) <span class="text-destructive">*</span></label>
						<Input
							id="dureeHours"
							name="dureeHours"
							type="number"
							step="0.5"
							min="0.5"
							required
							value={libraryModule.dureeHours ?? ''}
						/>
					</div>
					<div class="space-y-2">
						<label for="objectifsPedagogiques" class="text-sm font-medium">
							Objectifs pédagogiques <span class="text-destructive">*</span>
						</label>
						<Textarea
							id="objectifsPedagogiques"
							name="objectifsPedagogiques"
							required
							value={libraryModule.objectifsPedagogiques ?? ''}
							class="min-h-[120px]"
						/>
					</div>
					<div class="space-y-2">
						<label for="modalite-select" class="text-sm font-medium">Modalité d'évaluation <span class="text-destructive">*</span></label>
						<Select.Root type="single" bind:value={selectedModalite}>
							<Select.Trigger id="modalite-select" class="w-full">
								<span>{selectedModalite}</span>
							</Select.Trigger>
							<Select.Content>
								{#each MODALITES as m}
									<Select.Item value={m}>{m}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
						<input type="hidden" name="modaliteEvaluation" value={selectedModalite} />
					</div>
					{#if form?.message}
						<p class="text-sm text-destructive">{form.message}</p>
					{/if}
					<div class="flex flex-wrap gap-2">
						<Button type="submit">Enregistrer</Button>
						<Button type="button" variant="outline" href="/bibliotheque/modules">Annuler</Button>
					</div>
				</form>
				<form method="POST" action="?/delete" use:enhance class="mt-4 pt-4 border-t">
					<Button type="submit" variant="destructive">Supprimer le module</Button>
				</form>
			</Card.Content>
		</Card.Root>
	</div>
{/if}
