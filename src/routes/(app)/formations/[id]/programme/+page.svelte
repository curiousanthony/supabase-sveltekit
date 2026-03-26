<script lang="ts">
	import type { PageProps } from './$types';
	import ProgrammePickerModal from '$lib/components/formations/programme-picker-modal.svelte';
	import ModuleCardExpanded from '$lib/components/formations/module-card-expanded.svelte';
	import SyncBanner from '$lib/components/formations/sync-banner.svelte';
	import QuestGuideBanner from '$lib/components/formations/quest-guide-banner.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Clock from '@lucide/svelte/icons/clock';
	import Library from '@lucide/svelte/icons/library';
	import Plus from '@lucide/svelte/icons/plus';
	import X from '@lucide/svelte/icons/x';

	let { data }: PageProps = $props();

	const formation = $derived(data.formation);
	const availableProgrammes = $derived(data.availableProgrammes);
	const programmeSourceUpdatedSinceLink = $derived(data.programmeSourceUpdatedSinceLink);
	const modules = $derived(formation?.modules ?? []);
	const programmeSource = $derived(formation?.programmeSource ?? null);
	const formationId = $derived(formation?.id ?? '');
	const statut = $derived(formation?.statut ?? '');

	let showAddForm = $state(false);
	let editingModuleId = $state<string | null>(null);
	let deleteConfirmId = $state<string | null>(null);
	let submitting = $state(false);
	let pickerOpen = $state(false);
	let draggedIndex = $state<number | null>(null);
	let dragOverIndex = $state<number | null>(null);

	let newName = $state('');
	let newDuration = $state('');
	let newObjectifs = $state('');
	let newContenu = $state('');
	let newModaliteEvaluation = $state('');

	const totalHours = $derived(
		modules.reduce((sum, m) => sum + (m.durationHours ? Number(m.durationHours) : 0), 0)
	);

	function resetAddForm() {
		newName = '';
		newDuration = '';
		newObjectifs = '';
		newContenu = '';
		newModaliteEvaluation = '';
		showAddForm = false;
	}

	function handleDragStart(index: number) {
		draggedIndex = index;
	}

	function handleDragOver(e: DragEvent, index: number) {
		e.preventDefault();
		dragOverIndex = index;
	}

	function handleDragEnd() {
		draggedIndex = null;
		dragOverIndex = null;
	}

	async function handleDrop(targetIndex: number) {
		if (draggedIndex === null || draggedIndex === targetIndex) {
			handleDragEnd();
			return;
		}

		const reordered = [...modules];
		const [moved] = reordered.splice(draggedIndex, 1);
		reordered.splice(targetIndex, 0, moved);

		handleDragEnd();
		await submitReorder(reordered);
	}

	async function moveModule(fromIndex: number, direction: 'up' | 'down') {
		const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
		if (toIndex < 0 || toIndex >= modules.length) return;

		const reordered = [...modules];
		[reordered[fromIndex], reordered[toIndex]] = [reordered[toIndex], reordered[fromIndex]];

		await submitReorder(reordered);
	}

	async function submitReorder(orderedModules: typeof modules) {
		const order = orderedModules.map((m, i) => ({ id: m.id, orderIndex: i }));
		const formData = new FormData();
		formData.set('order', JSON.stringify(order));

		submitting = true;
		try {
			const response = await fetch(`/formations/${formationId}/programme?/reorderModules`, {
				method: 'POST',
				body: formData
			});
			const result = await response.json();
			if (result?.type === 'failure') {
				toast.error('Erreur lors du réordonnancement');
			} else {
				await invalidateAll();
			}
		} catch {
			toast.error('Erreur réseau');
		} finally {
			submitting = false;
		}
	}
</script>

<div class="space-y-6">
	<QuestGuideBanner />

	{#if programmeSource}
		<Card.Root class="bg-primary/5 border-primary/20">
			<Card.Content class="pt-6">
				<div class="flex items-start justify-between gap-4">
					<div class="flex items-start gap-3">
						<Library class="text-primary mt-0.5 size-5 shrink-0" />
						<div>
							<p class="text-muted-foreground text-sm">Programme source (Bibliothèque)</p>
							<h3 class="text-foreground font-semibold">{programmeSource.titre}</h3>
							{#if programmeSource.dureeHeures}
								<p class="text-muted-foreground mt-1 text-sm">
									{programmeSource.dureeHeures}h · {programmeSource.modalite ?? '—'}
								</p>
							{/if}
						</div>
					</div>
					<Button variant="outline" size="sm" class="shrink-0" onclick={() => (pickerOpen = true)}>
						Changer
					</Button>
				</div>
			</Card.Content>
		</Card.Root>
	{:else}
		<Card.Root>
			<Card.Content class="pt-6">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<Library class="text-muted-foreground size-5 shrink-0" />
						<div>
							<p class="text-muted-foreground text-sm">Aucun programme source</p>
							<p class="text-muted-foreground mt-0.5 text-xs">
								Associez un programme de la bibliothèque ou assemblez un programme personnalisé.
							</p>
						</div>
					</div>
					<Button variant="outline" size="sm" class="shrink-0" onclick={() => (pickerOpen = true)}>
						<BookOpen class="mr-1.5 size-4" />
						Choisir
					</Button>
				</div>
			</Card.Content>
		</Card.Root>
	{/if}

	<SyncBanner
		{programmeSource}
		{programmeSourceUpdatedSinceLink}
		formationStatut={statut}
		hasModules={modules.length > 0}
		{formationId}
	/>

	<div class="space-y-2">
		<div class="flex items-center justify-between">
			<h2 class="flex items-center gap-2 text-lg font-semibold">
				<BookOpen class="size-5" />
				Modules
				{#if modules.length > 0}
					<Badge variant="secondary" class="text-xs">{modules.length}</Badge>
				{/if}
			</h2>
			{#if totalHours > 0}
				<span class="text-muted-foreground flex items-center gap-1.5 text-sm">
					<Clock class="size-4" />
					{totalHours}h au total
				</span>
			{/if}
		</div>

		{#if modules.length === 0 && !showAddForm}
			<Card.Root>
				<Card.Content class="py-12 text-center">
					<BookOpen class="text-muted-foreground/30 mx-auto mb-3 size-12" />
					<p class="text-muted-foreground">Aucun module dans cette formation.</p>
					<p class="text-muted-foreground mt-1 text-sm">
						Les modules définissent le contenu pédagogique de la formation.
					</p>
				</Card.Content>
			</Card.Root>
		{:else}
			<div class="space-y-2">
				{#each modules as mod, i (mod.id)}
					<div
						ondragstart={() => handleDragStart(i)}
						ondragover={(e: DragEvent) => handleDragOver(e, i)}
						ondrop={() => handleDrop(i)}
						ondragend={handleDragEnd}
						class="{dragOverIndex === i ? 'rounded-lg ring-2 ring-primary/30' : ''} {draggedIndex === i ? 'opacity-50' : ''}"
						role="listitem"
					>
						<ModuleCardExpanded
							module={mod}
							index={i}
							totalCount={modules.length}
							editing={editingModuleId === mod.id}
							{formationId}
							{submitting}
							onStartEdit={() => (editingModuleId = mod.id)}
							onCancelEdit={() => (editingModuleId = null)}
							onMoveUp={() => moveModule(i, 'up')}
							onMoveDown={() => moveModule(i, 'down')}
							onDelete={() => (deleteConfirmId = mod.id)}
						/>
					</div>
				{/each}
			</div>
		{/if}

		{#if showAddForm}
			<Card.Root class="border-primary/30 border-dashed">
				<Card.Content class="pt-4 pb-4">
					<form
						method="POST"
						action="?/addModule"
						use:enhance={() => {
							submitting = true;
							return async ({ result }) => {
								submitting = false;
								if (result.type === 'success') {
									resetAddForm();
									toast.success('Module ajouté');
									await invalidateAll();
								} else {
									toast.error('Erreur lors de la création du module');
								}
							};
						}}
					>
						<div class="space-y-3">
							<div class="grid grid-cols-[1fr_120px] gap-3">
								<div>
									<Label for="new-name" class="text-xs">Titre *</Label>
									<Input
										id="new-name"
										name="name"
										bind:value={newName}
										placeholder="Nom du module"
										class="mt-1"
										autofocus
									/>
								</div>
								<div>
									<Label for="new-duration" class="text-xs">Durée (h)</Label>
									<Input
										id="new-duration"
										name="durationHours"
										type="number"
										step="0.5"
										min="0"
										bind:value={newDuration}
										placeholder="0"
										class="mt-1"
									/>
								</div>
							</div>
							<div>
								<Label for="new-objectifs" class="text-xs">Objectifs</Label>
								<Textarea
									id="new-objectifs"
									name="objectifs"
									bind:value={newObjectifs}
									placeholder="Objectifs pédagogiques (optionnel)"
									rows={2}
									class="mt-1"
								/>
							</div>
							<div>
								<Label for="new-contenu" class="text-xs">Contenu</Label>
								<Textarea
									id="new-contenu"
									name="contenu"
									bind:value={newContenu}
									placeholder="Contenu / syllabus du module (optionnel)"
									rows={2}
									class="mt-1"
								/>
							</div>
							<div>
								<Label for="new-eval" class="text-xs">Modalité d'évaluation</Label>
								<select
									id="new-eval"
									name="modaliteEvaluation"
									bind:value={newModaliteEvaluation}
									class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
								>
									<option value="">— Aucune —</option>
									<option value="QCM">QCM</option>
									<option value="QCU">QCU</option>
									<option value="Pratique">Pratique</option>
									<option value="Projet">Projet</option>
								</select>
							</div>
							<div class="flex justify-end gap-2">
								<Button type="button" variant="ghost" size="sm" onclick={resetAddForm}>
									<X class="mr-1 size-4" />
									Annuler
								</Button>
								<Button type="submit" size="sm" disabled={submitting || !newName.trim()}>
									<Plus class="mr-1 size-4" />
									Ajouter
								</Button>
							</div>
						</div>
					</form>
				</Card.Content>
			</Card.Root>
		{/if}

		{#if !showAddForm}
			<Button variant="outline" class="w-full border-dashed" onclick={() => (showAddForm = true)}>
				<Plus class="mr-1.5 size-4" />
				Ajouter un module
			</Button>
		{/if}
	</div>
</div>

<AlertDialog.Root
	open={deleteConfirmId !== null}
	onOpenChange={(open) => {
		if (!open) deleteConfirmId = null;
	}}
>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Supprimer ce module ?</AlertDialog.Title>
			<AlertDialog.Description>
				Cette action est irréversible. Les séances liées à ce module ne seront pas supprimées mais
				ne seront plus associées à un module.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Annuler</AlertDialog.Cancel>
			<form
				method="POST"
				action="?/deleteModule"
				use:enhance={() => {
					submitting = true;
					return async ({ result }) => {
						submitting = false;
						deleteConfirmId = null;
						if (result.type === 'success') {
							const resultData = (result as { type: 'success'; data?: Record<string, unknown> })
								.data;
							const count = (resultData?.affectedSessionsCount as number) ?? 0;
							if (count > 0) {
								toast.success(
									`Module supprimé. ${count} séance${count > 1 ? 's' : ''} détachée${count > 1 ? 's' : ''}.`
								);
							} else {
								toast.success('Module supprimé');
							}
							await invalidateAll();
						} else {
							toast.error('Erreur lors de la suppression');
						}
					};
				}}
			>
				<input type="hidden" name="moduleId" value={deleteConfirmId ?? ''} />
				<AlertDialog.Action type="submit" disabled={submitting}>Supprimer</AlertDialog.Action>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<ProgrammePickerModal
	open={pickerOpen}
	onOpenChange={(v) => (pickerOpen = v)}
	programmes={availableProgrammes}
	hasExistingModules={modules.length > 0}
	{formationId}
/>
