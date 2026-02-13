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
	let selectedModalite = $state<string>(MODALITES[0]);
</script>

<svelte:head>
	<title>Bibliothèque – Créer un module</title>
</svelte:head>

<div class="max-w-2xl space-y-6">
	<h1 class="text-2xl font-bold tracking-tight">Créer un module</h1>

	<Card.Root>
		<Card.Content class="pt-6">
			<form method="POST" use:enhance class="space-y-6">
				<div class="space-y-2">
					<label for="titre" class="text-sm font-medium">Titre <span class="text-destructive">*</span></label>
					<Input id="titre" name="titre" required placeholder="Ex. Introduction aux fondamentaux" />
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
						value="2"
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
						placeholder="À la fin de ce module, l'apprenant sera capable de..."
						class="min-h-[120px]"
					/>
				</div>
				<div class="space-y-2">
					<label class="text-sm font-medium">Modalité d'évaluation <span class="text-destructive">*</span></label>
					<Select.Root type="single" bind:value={selectedModalite} name="modaliteEvaluation">
						<Select.Trigger class="w-full">
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
				<div class="flex gap-2">
					<Button type="submit">Créer le module</Button>
					<Button type="button" variant="outline" href="/bibliotheque/modules">Annuler</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
