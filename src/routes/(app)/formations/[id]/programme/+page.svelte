<script lang="ts">
	import type { PageProps } from './$types';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { tick } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { cn } from '$lib/utils';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Clock from '@lucide/svelte/icons/clock';
	import Target from '@lucide/svelte/icons/target';
	import Library from '@lucide/svelte/icons/library';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Link2 from '@lucide/svelte/icons/link-2';

	type ModuleRow = {
		id: string;
		name: string;
		durationHours: string | null;
		objectifs: string | null;
		orderIndex: number | null;
	};

	let { data }: PageProps = $props();

	const formation = $derived(data?.formation);
	const programme = $derived(formation?.programmeSource ?? null);

	const sortedModules = $derived.by(() => {
		const list = [...(formation?.modules ?? [])] as ModuleRow[];
		list.sort((a, b) => {
			const ai = a.orderIndex ?? 0;
			const bi = b.orderIndex ?? 0;
			if (ai !== bi) return ai - bi;
			return a.id.localeCompare(b.id);
		});
		return list;
	});

	const totalHours = $derived(
		sortedModules.reduce((sum, m) => sum + (m.durationHours ? Number(m.durationHours) : 0), 0)
	);

	const sessionCountByModule = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const s of formation?.seances ?? []) {
			if (s.moduleId) {
				counts[s.moduleId] = (counts[s.moduleId] ?? 0) + 1;
			}
		}
		return counts;
	});

	let addDialogOpen = $state(false);
	let editModuleId = $state<string | null>(null);
	let editField = $state<'name' | 'duration' | 'objectifs' | null>(null);
	let draft = $state('');
	let objectifsExpanded = $state<Record<string, boolean>>({});
	let reorderInputValue = $state('');
	let reorderFormEl: HTMLFormElement | null = $state(null);
	let deleteFormEl: HTMLFormElement | null = $state(null);
	let deleteModuleId = $state('');

	function openAddDialog() {
		addDialogOpen = true;
	}

	function startEdit(mod: ModuleRow, field: 'name' | 'duration' | 'objectifs') {
		editModuleId = mod.id;
		editField = field;
		if (field === 'name') draft = mod.name;
		else if (field === 'duration')
			draft =
				mod.durationHours != null && mod.durationHours !== ''
					? String(Number(mod.durationHours))
					: '';
		else draft = mod.objectifs ?? '';
	}

	function cancelEdit() {
		editModuleId = null;
		editField = null;
		draft = '';
	}

	function getNameForSubmit(mod: ModuleRow) {
		if (editModuleId === mod.id && editField === 'name') return draft;
		return mod.name;
	}

	function getDurationForSubmit(mod: ModuleRow) {
		if (editModuleId === mod.id && editField === 'duration') return draft;
		if (mod.durationHours != null && mod.durationHours !== '') return String(Number(mod.durationHours));
		return '';
	}

	function getObjectifsForSubmit(mod: ModuleRow) {
		if (editModuleId === mod.id && editField === 'objectifs') return draft;
		return mod.objectifs ?? '';
	}

	async function submitUpdateForModule(mod: ModuleRow) {
		const name = getNameForSubmit(mod).trim();
		if (!name) {
			cancelEdit();
			return;
		}
		const origName = mod.name;
		const origDur =
			mod.durationHours != null && mod.durationHours !== '' ? String(Number(mod.durationHours)) : '';
		const origObj = mod.objectifs ?? '';

		const newDur = getDurationForSubmit(mod).trim();
		const newObj = getObjectifsForSubmit(mod);

		if (
			name === origName &&
			newDur === origDur &&
			newObj === origObj
		) {
			cancelEdit();
			return;
		}

		const form = document.getElementById(`module-update-${mod.id}`) as HTMLFormElement | null;
		form?.requestSubmit();
		await tick();
		cancelEdit();
	}

	function onUpdateKeydown(e: KeyboardEvent, mod: ModuleRow) {
		if (e.key === 'Escape') {
			e.preventDefault();
			cancelEdit();
		}
		if (e.key === 'Enter' && editField !== 'objectifs') {
			e.preventDefault();
			void submitUpdateForModule(mod);
		}
	}

	async function onFieldBlur(mod: ModuleRow) {
		await tick();
		const name = getNameForSubmit(mod).trim();
		if (!name) {
			cancelEdit();
			return;
		}
		const origName = mod.name;
		const origDur =
			mod.durationHours != null && mod.durationHours !== '' ? String(Number(mod.durationHours)) : '';
		const origObj = mod.objectifs ?? '';
		const newDur = getDurationForSubmit(mod).trim();
		const newObj = getObjectifsForSubmit(mod);
		if (name === origName && newDur === origDur && newObj === origObj) {
			cancelEdit();
			return;
		}
		void submitUpdateForModule(mod);
	}

	async function applyReorder(newIds: string[]) {
		reorderInputValue = JSON.stringify(newIds);
		await tick();
		reorderFormEl?.requestSubmit();
	}

	async function moveModule(modId: string, dir: 'up' | 'down') {
		const ids = sortedModules.map((m) => m.id);
		const idx = ids.indexOf(modId);
		if (idx < 0) return;
		const j = dir === 'up' ? idx - 1 : idx + 1;
		if (j < 0 || j >= ids.length) return;
		const next = [...ids];
		[next[idx], next[j]] = [next[j], next[idx]];
		await applyReorder(next);
	}

	function requestDeleteModule(mod: ModuleRow) {
		const n = sessionCountByModule[mod.id] ?? 0;
		if (n > 0) {
			const ok = confirm(
				`Ce module est lié à ${n} séance(s). Les séances conserveront leurs dates mais ne seront plus rattachées à ce module. Continuer ?`
			);
			if (!ok) return;
		}
		deleteModuleId = mod.id;
		void tick().then(() => deleteFormEl?.requestSubmit());
	}

	function toggleObjectifsSection(modId: string) {
		objectifsExpanded[modId] = !objectifsExpanded[modId];
		objectifsExpanded = { ...objectifsExpanded };
	}

	const enhanceCloseAdd = () => {
		return async ({
			result,
			update
		}: {
			result: { type: string; data?: Record<string, unknown> };
			update: (opts?: { reset?: boolean }) => Promise<void>;
		}) => {
			if (result.type === 'success') {
				addDialogOpen = false;
				toast.success('Module ajouté');
				await invalidateAll();
			} else if (result.type === 'failure') {
				const msg = (result.data as { message?: string } | undefined)?.message ?? 'Erreur';
				toast.error(msg);
			} else {
				await update();
			}
		};
	};
</script>

<div class="space-y-6">
	<!-- Programme source -->
	{#if programme}
		<Card.Root class="bg-primary/5 border-primary/20">
			<Card.Content class="pt-6">
				<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div class="flex items-start gap-3 min-w-0">
						<Library class="size-5 text-primary mt-0.5 shrink-0" />
						<div class="min-w-0">
							<p class="text-sm text-muted-foreground">Programme source (Bibliothèque)</p>
							<h3 class="font-semibold text-foreground truncate">{programme.titre}</h3>
							{#if programme.dureeHeures != null}
								<p class="text-sm text-muted-foreground mt-1">
									{programme.dureeHeures}h · {programme.modalite ?? '—'}
								</p>
							{/if}
							<a
								href={resolve('/bibliotheque/programmes/[id]', { id: programme.id })}
								class="text-sm text-primary inline-flex items-center gap-1 mt-2 underline-offset-4 hover:underline"
							>
								<Link2 class="size-3.5" />
								Ouvrir dans la bibliothèque
							</a>
						</div>
					</div>
					<form method="POST" action="?/detachProgramme" use:enhance class="shrink-0">
						<Button type="submit" variant="outline" size="sm" class="cursor-pointer w-full sm:w-auto">
							Détacher
						</Button>
					</form>
				</div>
			</Card.Content>
		</Card.Root>
	{:else}
		<Card.Root>
			<Card.Content class="pt-6">
				<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div class="flex items-center gap-3 min-w-0">
						<Library class="size-5 text-muted-foreground shrink-0" />
						<div>
							<p class="text-sm text-muted-foreground">Aucun programme source</p>
							<p class="text-xs text-muted-foreground mt-0.5">
								Associez un programme de la bibliothèque ou assemblez un programme personnalisé via les modules
								ci-dessous.
							</p>
						</div>
					</div>
					<Button variant="outline" size="sm" class="cursor-pointer shrink-0" href="/bibliotheque/programmes">
						<BookOpen class="size-4 mr-1.5" />
						Choisir
					</Button>
				</div>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Modules -->
	<div class="space-y-3">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<h2 class="text-lg font-semibold flex flex-wrap items-center gap-2">
				<BookOpen class="size-5 shrink-0" />
				Modules
				{#if sortedModules.length > 0}
					<Badge variant="secondary" class="text-xs">{sortedModules.length}</Badge>
				{/if}
				{#if totalHours > 0}
					<span class="text-sm font-normal text-muted-foreground flex items-center gap-1.5">
						<Clock class="size-4" />
						{totalHours}h au total
					</span>
				{/if}
			</h2>
			<div class="flex flex-wrap items-center gap-2">
				<Button variant="default" size="sm" class="cursor-pointer" type="button" onclick={openAddDialog}>
					<Plus class="size-4 mr-1.5" />
					Ajouter un module
				</Button>
			</div>
		</div>

		{#if sortedModules.length === 0}
			<Card.Root>
				<Card.Content class="py-12 text-center">
					<BookOpen class="size-12 mx-auto text-muted-foreground/30 mb-3" />
					<p class="text-muted-foreground">Aucun module dans cette formation.</p>
					<p class="text-sm text-muted-foreground mt-1">
						Les modules définissent le contenu pédagogique de la formation.
					</p>
					<Button variant="outline" size="sm" class="cursor-pointer mt-4" type="button" onclick={openAddDialog}>
						<Plus class="size-4 mr-1.5" />
						Ajouter un module
					</Button>
				</Card.Content>
			</Card.Root>
		{:else}
			<div class="space-y-2">
				{#each sortedModules as mod, i (mod.id)}
					<Card.Root class="hover:border-primary/30 transition-colors">
						<Card.Content class="pt-4 pb-4">
							<div class="flex items-start gap-2 sm:gap-3">
								<div class="flex flex-col items-center gap-0.5 shrink-0 pt-0.5">
									<Button
										type="button"
										variant="ghost"
										size="icon"
										class="size-8 cursor-pointer"
										disabled={i === 0}
										onclick={() => moveModule(mod.id, 'up')}
										aria-label="Monter le module"
									>
										<ArrowUp class="size-4" />
									</Button>
									<span class="text-xs font-medium text-muted-foreground tabular-nums w-8 text-center">
										{i + 1}
									</span>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										class="size-8 cursor-pointer"
										disabled={i === sortedModules.length - 1}
										onclick={() => moveModule(mod.id, 'down')}
										aria-label="Descendre le module"
									>
										<ArrowDown class="size-4" />
									</Button>
								</div>

								<div class="flex-1 min-w-0 space-y-3">
								<form
									id={`module-update-${mod.id}`}
									method="POST"
									action="?/updateModule"
									use:enhance={() => {
										return async ({ result, update }) => {
											if (result.type === 'success') {
												await invalidateAll();
											} else {
												await update({ reset: false });
											}
										};
									}}
								>
										<input type="hidden" name="moduleId" value={mod.id} />
										<input type="hidden" name="name" value={getNameForSubmit(mod)} />
										<input type="hidden" name="durationHours" value={getDurationForSubmit(mod)} />
										<input type="hidden" name="objectifs" value={getObjectifsForSubmit(mod)} />
									</form>

									<!-- Titre -->
									<div class="min-w-0">
										{#if editModuleId === mod.id && editField === 'name'}
											<Input
												class="font-medium h-9"
												bind:value={draft}
												onblur={() => onFieldBlur(mod)}
												onkeydown={(e) => onUpdateKeydown(e, mod)}
												autofocus
											/>
										{:else}
											<button
												type="button"
												class={cn(
													'text-left font-medium text-foreground w-full truncate rounded px-1 -mx-1 py-0.5',
													'hover:bg-muted/60 transition-colors'
												)}
												onclick={() => startEdit(mod, 'name')}
											>
												{mod.name}
											</button>
										{/if}
									</div>

									<!-- Durée -->
									<div class="flex items-center gap-2 flex-wrap">
										<Clock class="size-3.5 text-muted-foreground shrink-0" />
										{#if editModuleId === mod.id && editField === 'duration'}
											<div class="flex items-center gap-2">
												<Input
													type="number"
													min="0"
													step="0.5"
													class="h-8 w-28"
													bind:value={draft}
													onblur={() => onFieldBlur(mod)}
													onkeydown={(e) => onUpdateKeydown(e, mod)}
													autofocus
												/>
												<span class="text-sm text-muted-foreground">heures</span>
											</div>
										{:else}
											<button
												type="button"
												class="text-sm text-muted-foreground hover:text-foreground rounded px-1 -mx-1 py-0.5 hover:bg-muted/60"
												onclick={() => startEdit(mod, 'duration')}
											>
												{mod.durationHours != null && mod.durationHours !== ''
													? `${Number(mod.durationHours)} h`
													: 'Durée (h)'}
											</button>
										{/if}
									</div>

									<!-- Objectifs (replié) -->
									<div class="border rounded-md bg-muted/20">
										<button
											type="button"
											class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted/40 rounded-md"
											onclick={() => toggleObjectifsSection(mod.id)}
										>
											{#if objectifsExpanded[mod.id]}
												<ChevronDown class="size-4 shrink-0" />
											{:else}
												<ChevronRight class="size-4 shrink-0" />
											{/if}
											<Target class="size-4 shrink-0" />
											<span>Objectifs pédagogiques</span>
											{#if mod.objectifs?.trim()}
												<Badge variant="outline" class="text-[10px] ml-auto">renseignés</Badge>
											{/if}
										</button>
										{#if objectifsExpanded[mod.id]}
											<div class="px-3 pb-3 pt-0">
												{#if editModuleId === mod.id && editField === 'objectifs'}
													<Textarea
														rows={4}
														class="text-sm resize-y min-h-[80px]"
														bind:value={draft}
														onblur={() => onFieldBlur(mod)}
														onkeydown={(e) => onUpdateKeydown(e, mod)}
														autofocus
													/>
												{:else}
													<button
														type="button"
														class="w-full text-left text-sm rounded-md border border-transparent px-2 py-2 hover:bg-muted/50 whitespace-pre-wrap"
														onclick={() => startEdit(mod, 'objectifs')}
													>
														{mod.objectifs?.trim()
															? mod.objectifs
															: 'Cliquez pour ajouter des objectifs (optionnel).'}
													</button>
												{/if}
											</div>
										{/if}
									</div>
								</div>

								<Button
									type="button"
									variant="ghost"
									size="icon"
									class="size-9 shrink-0 text-destructive hover:text-destructive"
									onclick={() => requestDeleteModule(mod)}
									aria-label="Supprimer le module"
								>
									<Trash2 class="size-4" />
								</Button>
							</div>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		{/if}

		{#if sortedModules.length > 0}
			<Button variant="outline" size="sm" class="cursor-pointer" type="button" onclick={openAddDialog}>
				<Plus class="size-4 mr-1.5" />
				Ajouter un module
			</Button>
		{/if}
	</div>

	{#if sortedModules.length > 0 && !programme}
		<div class="flex justify-end">
			<Tooltip.Root>
				<Tooltip.Trigger class="inline-flex">
					<span class="inline-flex cursor-not-allowed">
						<Button variant="outline" size="sm" class="pointer-events-none" disabled>
							<Library class="size-4 mr-1.5" />
							Sauvegarder comme programme
						</Button>
					</span>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>Bientôt disponible</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</div>
	{/if}

	<!-- Reorder hidden form -->
	<form
		bind:this={reorderFormEl}
		method="POST"
		action="?/reorderModules"
		class="hidden"
		use:enhance={() => {
			return async ({ result, update }) => {
				if (result.type === 'success') {
					await invalidateAll();
				} else {
					await update();
				}
			};
		}}
	>
		<input type="hidden" name="moduleIds" value={reorderInputValue} />
	</form>

	<!-- Delete hidden form -->
	<form
		bind:this={deleteFormEl}
		method="POST"
		action="?/deleteModule"
		class="hidden"
		use:enhance={() => {
			return async ({ result, update }) => {
				if (result.type === 'success') {
					deleteModuleId = '';
					toast.success('Module supprimé');
					await invalidateAll();
				} else {
					await update({ reset: false });
				}
			};
		}}
	>
		<input type="hidden" name="moduleId" value={deleteModuleId} />
	</form>
</div>

<Dialog.Root bind:open={addDialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Nouveau module</Dialog.Title>
			<Dialog.Description>
				Ajoutez un module au programme de cette formation. Vous pourrez le réorganiser et l’éditer ensuite.
			</Dialog.Description>
		</Dialog.Header>
		<form method="POST" action="?/addModule" use:enhance={enhanceCloseAdd}>
			<div class="flex flex-col gap-4 py-2">
				<div class="flex flex-col gap-2">
					<Label for="add-name">Nom <span class="text-destructive">*</span></Label>
					<Input id="add-name" name="name" placeholder="Ex. Introduction au référentiel" required />
				</div>
				<div class="flex flex-col gap-2">
					<Label for="add-duration">Durée (heures)</Label>
					<Input id="add-duration" name="durationHours" type="number" min="0" step="0.5" placeholder="Optionnel" />
				</div>
				<div class="flex flex-col gap-2">
					<Label for="add-objectifs">Objectifs</Label>
					<Textarea
						id="add-objectifs"
						name="objectifs"
						rows={3}
						placeholder="Optionnel"
						class="resize-y min-h-[72px]"
					/>
				</div>
			</div>
			<Dialog.Footer class="gap-2 sm:gap-0">
				<Button type="button" variant="outline" onclick={() => (addDialogOpen = false)}>Annuler</Button>
				<Button type="submit">
					<Plus class="size-4 mr-1.5" />
					Ajouter
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
