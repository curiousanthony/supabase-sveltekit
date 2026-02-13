<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';

	let { data, form }: PageProps = $props();
	let libraryModule = $derived(data?.libraryModule);
	let formations = $derived(data?.formations ?? []);
	let selectedFormationId = $state<string>('');
</script>

<svelte:head>
	<title>Bibliothèque – Ajouter à une formation</title>
</svelte:head>

{#if !libraryModule}
	<p class="text-muted-foreground">Module introuvable.</p>
{:else}
	<div class="max-w-2xl space-y-6">
		<h1 class="text-2xl font-bold tracking-tight">Ajouter ce module à une formation</h1>

		<Card.Root>
			<Card.Header>
				<Card.Title>{libraryModule.titre}</Card.Title>
				<Card.Description>
					{libraryModule.dureeHours}h – {libraryModule.modaliteEvaluation}
				</Card.Description>
			</Card.Header>
		</Card.Root>

		<Card.Root>
			<Card.Content class="pt-6">
				<form method="POST" use:enhance class="space-y-4">
					<label for="formationId" class="text-sm font-medium">Formation <span class="text-destructive">*</span></label>
					<select
						id="formationId"
						name="formationId"
						required
						bind:value={selectedFormationId}
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					>
						<option value="">Choisir une formation…</option>
						{#each formations as f}
							<option value={f.id}>
								{f.name ?? 'Sans nom'} #{f.idInWorkspace ?? '—'} ({f.statut})
							</option>
						{/each}
					</select>
					{#if formations.length === 0}
						<p class="text-sm text-muted-foreground">
							Aucune formation en attente ou en cours. Créez une formation ou choisissez-en une modifiable.
						</p>
					{/if}
					{#if form?.message}
						<p class="text-sm text-destructive">{form.message}</p>
					{/if}
					<div class="flex gap-2">
						<Button type="submit" disabled={formations.length === 0}>
							Ajouter à la formation
						</Button>
						<Button type="button" variant="outline" href="/bibliotheque/modules">
							Annuler
						</Button>
					</div>
				</form>
			</Card.Content>
		</Card.Root>
	</div>
{/if}
