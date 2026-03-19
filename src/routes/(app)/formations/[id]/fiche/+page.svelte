<script lang="ts">
	import type { PageProps } from './$types';
	import * as Card from '$lib/components/ui/card';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { Switch } from '$lib/components/ui/switch';
	import { deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	let { data }: PageProps = $props();

	const formation = $derived(data?.formation);
	const dealFromFormation = $derived((formation?.dealsFromFormation ?? [])[0]);

	const TYPE_OPTIONS = [
		{ value: 'Intra', label: 'Intra' },
		{ value: 'Inter', label: 'Inter' },
		{ value: 'CPF', label: 'CPF' }
	];
	const MODALITE_OPTIONS = [
		{ value: 'Distanciel', label: 'Distanciel' },
		{ value: 'Présentiel', label: 'Présentiel' },
		{ value: 'Hybride', label: 'Hybride' },
		{ value: 'E-Learning', label: 'E-Learning' }
	];
	const TYPEFINANCEMENT_OPTIONS = [
		{ value: 'CPF', label: 'CPF' },
		{ value: 'OPCO', label: 'OPCO' },
		{ value: 'Inter', label: 'Inter' },
		{ value: 'Intra', label: 'Intra' }
	];

	let editingField = $state<string | null>(null);
	let editValue = $state('');
	let isSaving = $state(false);

	async function saveField(field: string, value: string) {
		if (isSaving) return;
		isSaving = true;
		editingField = null;
		try {
			const formData = new FormData();
			formData.append('field', field);
			formData.append('value', value);
			const response = await fetch('?/updateField', { method: 'POST', body: formData });
			const result = deserialize(await response.text());
			if (result.type === 'success') {
				toast.success('Enregistré');
				await invalidateAll();
			} else if (result.type === 'failure') {
				toast.error((result.data as { message?: string })?.message ?? 'Erreur');
			}
		} catch {
			toast.error('Erreur réseau');
		} finally {
			isSaving = false;
		}
	}

	function startEdit(field: string, current: string | number | boolean | null) {
		editingField = field;
		editValue = current === true ? 'true' : current === false ? 'false' : String(current ?? '');
	}

	function handleBlur(field: string, current: string | number | boolean | null) {
		if (editingField !== field) return;
		const str = String(current ?? '');
		if (editValue !== str) {
			saveField(field, editValue);
		} else {
			editingField = null;
		}
	}

	function handleKeydown(field: string, current: string | number | boolean | null, e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleBlur(field, current);
		}
		if (e.key === 'Escape') {
			editingField = null;
		}
	}

	function displayVal(v: string | number | boolean | null | undefined): string {
		if (v == null || v === '') return '—';
		if (typeof v === 'boolean') return v ? 'Oui' : 'Non';
		return String(v);
	}
</script>

<div class="flex flex-col gap-6">
	{#if dealFromFormation}
		<div class="rounded-lg border bg-muted/50 px-4 py-3 text-sm">
			<span class="text-muted-foreground">Créée depuis le deal</span>
			<a
				href="/deals/{dealFromFormation.id}"
				class="ml-1 font-medium text-primary hover:underline"
			>
				{dealFromFormation.name}
			</a>
		</div>
	{/if}

	<!-- Section 1: Informations générales -->
	<Card.Root class="flex flex-col gap-4">
		<Card.Header>
			<Card.Title>Informations générales</Card.Title>
		</Card.Header>
		<Card.Content class="flex flex-col gap-4">
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<!-- name -->
				<div class="flex flex-col gap-1">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Intitulé</span>
					{#if editingField === 'name'}
						<input
							type="text"
							bind:value={editValue}
							onblur={() => handleBlur('name', formation?.name ?? null)}
							onkeydown={(e) => handleKeydown('name', formation?.name ?? null, e)}
							class="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
							autofocus
						/>
					{:else}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							role="button"
							tabindex="0"
							class="cursor-pointer rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50"
							onclick={() => startEdit('name', formation?.name ?? null)}
							onkeydown={(e) => e.key === 'Enter' && startEdit('name', formation?.name ?? null)}
						>
							{displayVal(formation?.name ?? null)}
						</div>
					{/if}
				</div>

				<!-- type -->
				<div class="flex flex-col gap-1">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</span>
					{#if editingField === 'type'}
						<select
							bind:value={editValue}
							onblur={() => handleBlur('type', formation?.type ?? null)}
							onkeydown={(e) => handleKeydown('type', formation?.type ?? null, e)}
							class="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
							autofocus
						>
							<option value="">—</option>
							{#each TYPE_OPTIONS as opt}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
					{:else}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							role="button"
							tabindex="0"
							class="cursor-pointer rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50"
							onclick={() => startEdit('type', formation?.type ?? null)}
							onkeydown={(e) => e.key === 'Enter' && startEdit('type', formation?.type ?? null)}
						>
							{displayVal(formation?.type ?? null)}
						</div>
					{/if}
				</div>

				<!-- modalite -->
				<div class="flex flex-col gap-1">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Modalité</span>
					{#if editingField === 'modalite'}
						<select
							bind:value={editValue}
							onblur={() => handleBlur('modalite', formation?.modalite ?? null)}
							onkeydown={(e) => handleKeydown('modalite', formation?.modalite ?? null, e)}
							class="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
							autofocus
						>
							<option value="">—</option>
							{#each MODALITE_OPTIONS as opt}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
					{:else}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							role="button"
							tabindex="0"
							class="cursor-pointer rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50"
							onclick={() => startEdit('modalite', formation?.modalite ?? null)}
							onkeydown={(e) => e.key === 'Enter' && startEdit('modalite', formation?.modalite ?? null)}
						>
							{displayVal(formation?.modalite ?? null)}
						</div>
					{/if}
				</div>

				<!-- duree -->
				<div class="flex flex-col gap-1">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Durée (h)</span>
					{#if editingField === 'duree'}
						<input
							type="number"
							bind:value={editValue}
							onblur={() => handleBlur('duree', formation?.duree ?? null)}
							onkeydown={(e) => handleKeydown('duree', formation?.duree ?? null, e)}
							class="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
							autofocus
						/>
					{:else}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							role="button"
							tabindex="0"
							class="cursor-pointer rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50"
							onclick={() => startEdit('duree', formation?.duree ?? null)}
							onkeydown={(e) => e.key === 'Enter' && startEdit('duree', formation?.duree ?? null)}
						>
							{displayVal(formation?.duree ?? null)}
						</div>
					{/if}
				</div>

				<!-- codeRncp -->
				<div class="flex flex-col gap-1 sm:col-span-2">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Code RNCP</span>
					{#if editingField === 'codeRncp'}
						<input
							type="text"
							bind:value={editValue}
							onblur={() => handleBlur('codeRncp', formation?.codeRncp ?? null)}
							onkeydown={(e) => handleKeydown('codeRncp', formation?.codeRncp ?? null, e)}
							class="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
							autofocus
						/>
					{:else}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							role="button"
							tabindex="0"
							class="cursor-pointer rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50"
							onclick={() => startEdit('codeRncp', formation?.codeRncp ?? null)}
							onkeydown={(e) => e.key === 'Enter' && startEdit('codeRncp', formation?.codeRncp ?? null)}
						>
							{displayVal(formation?.codeRncp ?? null)}
						</div>
					{/if}
				</div>

				<!-- description -->
				<div class="flex flex-col gap-1 sm:col-span-2">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</span>
					{#if editingField === 'description'}
						<textarea
							bind:value={editValue}
							onblur={() => handleBlur('description', formation?.description ?? null)}
							onkeydown={(e) => {
								if (e.key === 'Escape') editingField = null;
								if (e.key === 'Enter' && !e.shiftKey) {
									e.preventDefault();
									handleBlur('description', formation?.description ?? null);
								}
							}}
							rows="3"
							class="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
							autofocus
						></textarea>
					{:else}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							role="button"
							tabindex="0"
							class="cursor-pointer whitespace-pre-wrap rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50"
							onclick={() => startEdit('description', formation?.description ?? null)}
							onkeydown={(e) => e.key === 'Enter' && startEdit('description', formation?.description ?? null)}
						>
							{displayVal(formation?.description ?? null)}
						</div>
					{/if}
				</div>

				<!-- thematique (read-only) -->
				<div class="flex flex-col gap-1">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Thématique</span>
					{#if formation?.thematique || formation?.sousthematique}
						<div class="flex flex-wrap gap-1">
							{#if formation.thematique}
								<Badge variant="secondary">{formation.thematique.name}</Badge>
							{/if}
							{#if formation.sousthematique}
								<Badge variant="outline">{formation.sousthematique.name}</Badge>
							{/if}
						</div>
					{:else}
						<span class="text-sm text-muted-foreground">—</span>
					{/if}
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Section 2: Logistique -->
	<Card.Root class="flex flex-col gap-4">
		<Card.Header>
			<Card.Title>Logistique</Card.Title>
		</Card.Header>
		<Card.Content class="flex flex-col gap-4">
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<!-- dateDebut -->
				<div class="flex flex-col gap-1">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date début</span>
					{#if editingField === 'dateDebut'}
						<input
							type="date"
							bind:value={editValue}
							onblur={() => handleBlur('dateDebut', formation?.dateDebut ?? null)}
							onkeydown={(e) => handleKeydown('dateDebut', formation?.dateDebut ?? null, e)}
							class="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
							autofocus
						/>
					{:else}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							role="button"
							tabindex="0"
							class="cursor-pointer rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50"
							onclick={() => startEdit('dateDebut', formation?.dateDebut ?? null)}
							onkeydown={(e) => e.key === 'Enter' && startEdit('dateDebut', formation?.dateDebut ?? null)}
						>
							{displayVal(formation?.dateDebut ?? null)}
						</div>
					{/if}
				</div>

				<!-- dateFin -->
				<div class="flex flex-col gap-1">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date fin</span>
					{#if editingField === 'dateFin'}
						<input
							type="date"
							bind:value={editValue}
							onblur={() => handleBlur('dateFin', formation?.dateFin ?? null)}
							onkeydown={(e) => handleKeydown('dateFin', formation?.dateFin ?? null, e)}
							class="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
							autofocus
						/>
					{:else}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							role="button"
							tabindex="0"
							class="cursor-pointer rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50"
							onclick={() => startEdit('dateFin', formation?.dateFin ?? null)}
							onkeydown={(e) => e.key === 'Enter' && startEdit('dateFin', formation?.dateFin ?? null)}
						>
							{displayVal(formation?.dateFin ?? null)}
						</div>
					{/if}
				</div>

				<!-- location -->
				<div class="flex flex-col gap-1 sm:col-span-2">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Lieu</span>
					{#if editingField === 'location'}
						<input
							type="text"
							bind:value={editValue}
							onblur={() => handleBlur('location', formation?.location ?? null)}
							onkeydown={(e) => handleKeydown('location', formation?.location ?? null, e)}
							class="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
							autofocus
						/>
					{:else}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							role="button"
							tabindex="0"
							class="cursor-pointer rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50"
							onclick={() => startEdit('location', formation?.location ?? null)}
							onkeydown={(e) => e.key === 'Enter' && startEdit('location', formation?.location ?? null)}
						>
							{displayVal(formation?.location ?? null)}
						</div>
					{/if}
				</div>

				<!-- client (read-only) -->
				<div class="flex flex-col gap-1">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Client</span>
					{#if formation?.client}
						<span class="text-sm">{formation.client.legalName ?? '—'}</span>
					{:else}
						<span class="text-sm text-muted-foreground">—</span>
					{/if}
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Section 3: Financement -->
	<Card.Root class="flex flex-col gap-4">
		<Card.Header>
			<Card.Title>Financement</Card.Title>
		</Card.Header>
		<Card.Content class="flex flex-col gap-4">
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<!-- typeFinancement -->
				<div class="flex flex-col gap-1">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type financement</span>
					{#if editingField === 'typeFinancement'}
						<select
							bind:value={editValue}
							onblur={() => handleBlur('typeFinancement', formation?.typeFinancement ?? null)}
							onkeydown={(e) => handleKeydown('typeFinancement', formation?.typeFinancement ?? null, e)}
							class="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
							autofocus
						>
							<option value="">—</option>
							{#each TYPEFINANCEMENT_OPTIONS as opt}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
					{:else}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							role="button"
							tabindex="0"
							class="cursor-pointer rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50"
							onclick={() => startEdit('typeFinancement', formation?.typeFinancement ?? null)}
							onkeydown={(e) => e.key === 'Enter' && startEdit('typeFinancement', formation?.typeFinancement ?? null)}
						>
							{displayVal(formation?.typeFinancement ?? null)}
						</div>
					{/if}
				</div>

				<!-- montantAccorde -->
				<div class="flex flex-col gap-1">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Montant accordé (€)</span>
					{#if editingField === 'montantAccorde'}
						<input
							type="number"
							step="0.01"
							bind:value={editValue}
							onblur={() => handleBlur('montantAccorde', formation?.montantAccorde ?? null)}
							onkeydown={(e) => handleKeydown('montantAccorde', formation?.montantAccorde ?? null, e)}
							class="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
							autofocus
						/>
					{:else}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							role="button"
							tabindex="0"
							class="cursor-pointer rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50"
							onclick={() => startEdit('montantAccorde', formation?.montantAccorde ?? null)}
							onkeydown={(e) => e.key === 'Enter' && startEdit('montantAccorde', formation?.montantAccorde ?? null)}
						>
							{displayVal(formation?.montantAccorde ?? null)}
						</div>
					{/if}
				</div>

				<!-- financementAccorde (toggle) -->
				<div class="flex flex-col gap-1">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Financement accordé</span>
					<div class="flex items-center gap-2 pt-1">
						<Switch
							checked={formation?.financementAccorde ?? false}
							onCheckedChange={(v) => saveField('financementAccorde', v ? 'true' : 'false')}
						/>
						<span class="text-sm">{formation?.financementAccorde ? 'Oui' : 'Non'}</span>
					</div>
				</div>

				<!-- tjmFormateur -->
				<div class="flex flex-col gap-1">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">TJM formateur (€)</span>
					{#if editingField === 'tjmFormateur'}
						<input
							type="number"
							step="0.01"
							bind:value={editValue}
							onblur={() => handleBlur('tjmFormateur', formation?.tjmFormateur ?? null)}
							onkeydown={(e) => handleKeydown('tjmFormateur', formation?.tjmFormateur ?? null, e)}
							class="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
							autofocus
						/>
					{:else}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							role="button"
							tabindex="0"
							class="cursor-pointer rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50"
							onclick={() => startEdit('tjmFormateur', formation?.tjmFormateur ?? null)}
							onkeydown={(e) => e.key === 'Enter' && startEdit('tjmFormateur', formation?.tjmFormateur ?? null)}
						>
							{displayVal(formation?.tjmFormateur ?? null)}
						</div>
					{/if}
				</div>
			</div>
		</Card.Content>
	</Card.Root>
</div>
