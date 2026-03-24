<script lang="ts">
	import type { PageProps } from './$types';
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
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import Library from '@lucide/svelte/icons/library';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';
	import ChevronUp from '@lucide/svelte/icons/chevron-up';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import AlertTriangle from '@lucide/svelte/icons/triangle-alert';
	import Unlink from '@lucide/svelte/icons/unlink';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import Save from '@lucide/svelte/icons/save';
	import QuestGuideBanner from '$lib/components/formations/quest-guide-banner.svelte';

	let { data }: PageProps = $props();

	const formation = $derived(data?.formation);
	const rawModules = $derived(formation?.modules ?? []);
	const programme = $derived(formation?.programmeSource ?? null);
	const formationId = $derived(formation?.id ?? '');

	type ModuleItem = {
		id: string;
		name: string;
		durationHours: string | null;
		objectifs?: string | null;
		orderIndex: number | null;
	};

	let localModules: ModuleItem[] = $state([]);
	let hasLocalChanges = $state(false);
	let showAddForm = $state(false);
	let editingModuleId: string | null = $state(null);
	let deleteConfirmId: string | null = $state(null);
	let draggedIndex: number | null = $state(null);
	let dragOverIndex: number | null = $state(null);
	let submitting = $state(false);

	let newName = $state('');
	let newDuration = $state('');
	let newObjectifs = $state('');

	let editName = $state('');
	let editDuration = $state('');
	let editObjectifs = $state('');

	$effect(() => {
		localModules = rawModules.map((m) => ({
			id: m.id,
			name: m.name,
			durationHours: m.durationHours,
			objectifs: m.objectifs ?? null,
			orderIndex: m.orderIndex
		}));
	});

	const totalHours = $derived(
		localModules.reduce((sum, m) => sum + (m.durationHours ? Number(m.durationHours) : 0), 0)
	);

	function startEdit(mod: ModuleItem) {
		editingModuleId = mod.id;
		editName = mod.name;
		editDuration = mod.durationHours ?? '';
		editObjectifs = mod.objectifs ?? '';
	}

	function cancelEdit() {
		editingModuleId = null;
	}

	function resetAddForm() {
		newName = '';
		newDuration = '';
		newObjectifs = '';
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

		const reordered = [...localModules];
		const [moved] = reordered.splice(draggedIndex, 1);
		reordered.splice(targetIndex, 0, moved);

		localModules = reordered;
		handleDragEnd();
		await submitReorder(reordered);
	}

	async function moveModule(fromIndex: number, direction: 'up' | 'down') {
		const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
		if (toIndex < 0 || toIndex >= localModules.length) return;

		const reordered = [...localModules];
		[reordered[fromIndex], reordered[toIndex]] = [reordered[toIndex], reordered[fromIndex]];

		localModules = reordered;
		await submitReorder(reordered);
	}

	async function submitReorder(orderedModules: ModuleItem[]) {
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
				hasLocalChanges = true;
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
	<!-- Programme source info -->
	{#if programme}
		<Card.Root class="bg-primary/5 border-primary/20">
			<Card.Content class="pt-6">
				<div class="flex items-start justify-between gap-4">
					<div class="flex items-start gap-3">
						<Library class="size-5 text-primary mt-0.5 shrink-0" />
						<div>
							<p class="text-sm text-muted-foreground">Programme source (Bibliothèque)</p>
							<h3 class="font-semibold text-foreground">{programme.titre}</h3>
							{#if programme.dureeHeures}
								<p class="text-sm text-muted-foreground mt-1">
									{programme.dureeHeures}h · {programme.modalite ?? '—'}
								</p>
							{/if}
						</div>
					</div>
					<Button
						variant="outline"
						size="sm"
						class="cursor-pointer shrink-0"
						href="/bibliotheque/programmes"
					>
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
						<Library class="size-5 text-muted-foreground shrink-0" />
						<div>
							<p class="text-sm text-muted-foreground">Aucun programme source</p>
							<p class="text-xs text-muted-foreground mt-0.5">
								Associez un programme de la bibliothèque ou assemblez un programme personnalisé.
							</p>
						</div>
					</div>
					<Button
						variant="outline"
						size="sm"
						class="cursor-pointer shrink-0"
						href="/bibliotheque/programmes"
					>
						<BookOpen class="size-4 mr-1.5" />
						Choisir
					</Button>
				</div>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Sync Banner -->
	{#if programme && hasLocalChanges}
		<Card.Root class="border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-950/30">
			<Card.Content class="pt-4 pb-4">
				<div class="flex items-start gap-3">
					<AlertTriangle class="size-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
					<div class="flex-1">
						<p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
							Ce programme a été modifié localement.
						</p>
						<div class="flex flex-wrap gap-2 mt-3">
							<form
								method="POST"
								action="?/syncToSource"
								use:enhance={() => {
									submitting = true;
									return async ({ result }) => {
										submitting = false;
										if (result.type === 'success') {
											hasLocalChanges = false;
											toast.success('Programme source mis à jour');
											await invalidateAll();
										} else {
											toast.error('Erreur lors de la synchronisation');
										}
									};
								}}
							>
								<Button
									type="submit"
									variant="outline"
									size="sm"
									class="cursor-pointer"
									disabled={submitting}
								>
									<RefreshCw class="size-4 mr-1.5" />
									Mettre à jour le programme source
								</Button>
							</form>
							<form
								method="POST"
								action="?/createNewProgramme"
								use:enhance={() => {
									submitting = true;
									return async ({ result }) => {
										submitting = false;
										if (result.type === 'success') {
											hasLocalChanges = false;
											toast.success('Nouveau programme créé');
											await invalidateAll();
										} else {
											toast.error('Erreur lors de la création');
										}
									};
								}}
							>
								<Button
									type="submit"
									variant="outline"
									size="sm"
									class="cursor-pointer"
									disabled={submitting}
								>
									<Save class="size-4 mr-1.5" />
									Créer un nouveau programme
								</Button>
							</form>
							<form
								method="POST"
								action="?/detachProgramme"
								use:enhance={() => {
									submitting = true;
									return async ({ result }) => {
										submitting = false;
										if (result.type === 'success') {
											hasLocalChanges = false;
											toast.success('Programme détaché');
											await invalidateAll();
										} else {
											toast.error('Erreur lors du détachement');
										}
									};
								}}
							>
								<Button
									type="submit"
									variant="outline"
									size="sm"
									class="cursor-pointer text-destructive hover:text-destructive"
									disabled={submitting}
								>
									<Unlink class="size-4 mr-1.5" />
									Détacher
								</Button>
							</form>
						</div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Modules list -->
	<div class="space-y-2">
		<div class="flex items-center justify-between">
			<h2 class="text-lg font-semibold flex items-center gap-2">
				<BookOpen class="size-5" />
				Modules
				{#if localModules.length > 0}
					<Badge variant="secondary" class="text-xs">{localModules.length}</Badge>
				{/if}
			</h2>
			{#if totalHours > 0}
				<span class="text-sm text-muted-foreground flex items-center gap-1.5">
					<Clock class="size-4" />
					{totalHours}h au total
				</span>
			{/if}
		</div>

		{#if localModules.length === 0 && !showAddForm}
			<Card.Root>
				<Card.Content class="py-12 text-center">
					<BookOpen class="size-12 mx-auto text-muted-foreground/30 mb-3" />
					<p class="text-muted-foreground">Aucun module dans cette formation.</p>
					<p class="text-sm text-muted-foreground mt-1">
						Les modules définissent le contenu pédagogique de la formation.
					</p>
				</Card.Content>
			</Card.Root>
		{:else}
			<div class="space-y-2">
				{#each localModules as mod, i (mod.id)}
					{#if editingModuleId === mod.id}
						<!-- Edit mode -->
						<Card.Root class="border-primary/40 ring-1 ring-primary/20">
							<Card.Content class="pt-4 pb-4">
								<form
									method="POST"
									action="?/updateModule"
									use:enhance={() => {
										submitting = true;
										return async ({ result }) => {
											submitting = false;
											if (result.type === 'success') {
												editingModuleId = null;
												hasLocalChanges = true;
												toast.success('Module mis à jour');
												await invalidateAll();
											} else {
												toast.error('Erreur lors de la mise à jour');
											}
										};
									}}
								>
									<input type="hidden" name="moduleId" value={mod.id} />
									<div class="space-y-3">
										<div class="grid grid-cols-[1fr_120px] gap-3">
											<div>
												<Label for="edit-name-{mod.id}" class="text-xs">Titre</Label>
												<Input
													id="edit-name-{mod.id}"
													name="name"
													value={editName}
													oninput={(e) => {
														editName = (e.target as HTMLInputElement).value;
													}}
													placeholder="Nom du module"
													class="mt-1"
												/>
											</div>
											<div>
												<Label for="edit-duration-{mod.id}" class="text-xs">Durée (h)</Label>
												<Input
													id="edit-duration-{mod.id}"
													name="durationHours"
													type="number"
													step="0.5"
													min="0"
													value={editDuration}
													oninput={(e) => {
														editDuration = (e.target as HTMLInputElement).value;
													}}
													placeholder="0"
													class="mt-1"
												/>
											</div>
										</div>
										<div>
											<Label for="edit-objectifs-{mod.id}" class="text-xs">Objectifs</Label>
											<Textarea
												id="edit-objectifs-{mod.id}"
												name="objectifs"
												value={editObjectifs}
												oninput={(e) => {
													editObjectifs = (e.target as HTMLTextAreaElement).value;
												}}
												placeholder="Objectifs pédagogiques (optionnel)"
												rows={2}
												class="mt-1"
											/>
										</div>
										<div class="flex justify-end gap-2">
											<Button
												type="button"
												variant="ghost"
												size="sm"
												class="cursor-pointer"
												onclick={cancelEdit}
											>
												<X class="size-4 mr-1" />
												Annuler
											</Button>
											<Button
												type="submit"
												size="sm"
												class="cursor-pointer"
												disabled={submitting || !editName.trim()}
											>
												<Check class="size-4 mr-1" />
												Enregistrer
											</Button>
										</div>
									</div>
								</form>
							</Card.Content>
						</Card.Root>
					{:else}
						<!-- View mode -->
						<Card.Root
							class="hover:border-primary/30 transition-colors {dragOverIndex === i
								? 'border-primary ring-1 ring-primary/30'
								: ''} {draggedIndex === i ? 'opacity-50' : ''}"
							draggable="true"
							ondragstart={() => handleDragStart(i)}
							ondragover={(e) => handleDragOver(e, i)}
							ondrop={() => handleDrop(i)}
							ondragend={handleDragEnd}
							role="listitem"
						>
							<Card.Content class="pt-4 pb-4">
								<div class="flex items-start gap-3">
									<div class="flex flex-col items-center gap-0.5 shrink-0 mt-0.5">
										<button
											type="button"
											class="p-0.5 rounded hover:bg-muted disabled:opacity-30 cursor-pointer"
											disabled={i === 0}
											onclick={() => moveModule(i, 'up')}
											aria-label="Déplacer vers le haut"
										>
											<ChevronUp class="size-3.5 text-muted-foreground" />
										</button>
										<div class="cursor-grab active:cursor-grabbing" aria-label="Glisser pour réordonner">
											<GripVertical class="size-4 text-muted-foreground/40" />
										</div>
										<button
											type="button"
											class="p-0.5 rounded hover:bg-muted disabled:opacity-30 cursor-pointer"
											disabled={i === localModules.length - 1}
											onclick={() => moveModule(i, 'down')}
											aria-label="Déplacer vers le bas"
										>
											<ChevronDown class="size-3.5 text-muted-foreground" />
										</button>
									</div>

									<span class="text-xs font-medium text-muted-foreground tabular-nums w-5 text-center mt-2.5">
										{i + 1}
									</span>

									<div class="flex-1 min-w-0">
										<h4 class="font-medium text-foreground">{mod.name}</h4>
										{#if mod.durationHours}
											<div class="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
												<Clock class="size-3.5 shrink-0" />
												<span>{mod.durationHours}h</span>
											</div>
										{/if}
										{#if mod.objectifs}
											<p class="text-sm text-muted-foreground mt-1 line-clamp-2">
												{mod.objectifs}
											</p>
										{/if}
									</div>

									<div class="flex items-center gap-1 shrink-0">
										<Button
											variant="ghost"
											size="icon"
											class="size-8 cursor-pointer"
											onclick={() => startEdit(mod)}
											aria-label="Modifier le module"
										>
											<Pencil class="size-4 text-muted-foreground" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											class="size-8 cursor-pointer text-destructive hover:text-destructive"
											onclick={() => {
												deleteConfirmId = mod.id;
											}}
											aria-label="Supprimer le module"
										>
											<Trash2 class="size-4" />
										</Button>
									</div>
								</div>
							</Card.Content>
						</Card.Root>
					{/if}
				{/each}
			</div>
		{/if}

		<!-- Add module form -->
		{#if showAddForm}
			<Card.Root class="border-dashed border-primary/30">
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
									hasLocalChanges = true;
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
									<Label for="new-name" class="text-xs">Titre</Label>
									<Input
										id="new-name"
										name="name"
										value={newName}
										oninput={(e) => {
											newName = (e.target as HTMLInputElement).value;
										}}
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
										value={newDuration}
										oninput={(e) => {
											newDuration = (e.target as HTMLInputElement).value;
										}}
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
									value={newObjectifs}
									oninput={(e) => {
										newObjectifs = (e.target as HTMLTextAreaElement).value;
									}}
									placeholder="Objectifs pédagogiques (optionnel)"
									rows={2}
									class="mt-1"
								/>
							</div>
							<div class="flex justify-end gap-2">
								<Button
									type="button"
									variant="ghost"
									size="sm"
									class="cursor-pointer"
									onclick={resetAddForm}
								>
									<X class="size-4 mr-1" />
									Annuler
								</Button>
								<Button
									type="submit"
									size="sm"
									class="cursor-pointer"
									disabled={submitting || !newName.trim()}
								>
									<Plus class="size-4 mr-1" />
									Ajouter
								</Button>
							</div>
						</div>
					</form>
				</Card.Content>
			</Card.Root>
		{/if}

		<!-- Add module button -->
		{#if !showAddForm}
			<Button
				variant="outline"
				class="w-full border-dashed cursor-pointer"
				onclick={() => {
					showAddForm = true;
				}}
			>
				<Plus class="size-4 mr-1.5" />
				Ajouter un module
			</Button>
		{/if}
	</div>

	<!-- Save as programme button -->
	{#if localModules.length > 0 && !programme}
		<div class="flex justify-end">
			<form
				method="POST"
				action="?/createNewProgramme"
				use:enhance={() => {
					submitting = true;
					return async ({ result }) => {
						submitting = false;
						if (result.type === 'success') {
							hasLocalChanges = false;
							toast.success('Programme créé dans la bibliothèque');
							await invalidateAll();
						} else {
							toast.error('Erreur lors de la création du programme');
						}
					};
				}}
			>
				<Button
					type="submit"
					variant="outline"
					size="sm"
					class="cursor-pointer"
					disabled={submitting}
				>
					<Library class="size-4 mr-1.5" />
					Sauvegarder comme programme
				</Button>
			</form>
		</div>
	{/if}
</div>

<!-- Delete confirmation dialog -->
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
							hasLocalChanges = true;
							const data = (result as { type: 'success'; data?: Record<string, unknown> })
								.data;
							const count = (data?.affectedSessionsCount as number) ?? 0;
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
