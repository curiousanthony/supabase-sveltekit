<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import { untrack } from 'svelte';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import ChevronUp from '@lucide/svelte/icons/chevron-up';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';
	import Clock from '@lucide/svelte/icons/clock';
	import FileText from '@lucide/svelte/icons/file-text';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	interface ModuleItem {
		id: string;
		createdAt: string;
		name: string;
		durationHours: string | null;
		objectifs: string | null;
		contenu: string | null;
		modaliteEvaluation: string | null;
		sourceModuleId: string | null;
		orderIndex: number | null;
		moduleSupports: Array<{
			support: {
				id: string;
				titre: string;
				url: string | null;
				fileName: string | null;
				mimeType: string | null;
			};
		}>;
		moduleQuestionnaires: Array<{
			questionnaire: {
				id: string;
				titre: string;
				type: string;
				urlTest: string | null;
			};
		}>;
	}

	let {
		module,
		index,
		totalCount,
		editing,
		formationId,
		submitting,
		onStartEdit,
		onCancelEdit,
		onMoveUp,
		onMoveDown,
		onDelete
	}: {
		module: ModuleItem;
		index: number;
		totalCount: number;
		editing: boolean;
		formationId: string;
		submitting: boolean;
		onStartEdit: () => void;
		onCancelEdit: () => void;
		onMoveUp: () => void;
		onMoveDown: () => void;
		onDelete: () => void;
	} = $props();

	let objectifsExpanded = $state(false);
	let contenuExpanded = $state(false);

	let editName = $state('');
	let editDuration = $state('');
	let editObjectifs = $state('');
	let editContenu = $state('');
	let editEvaluation = $state('');

	$effect(() => {
		if (editing) {
			untrack(() => resetEditFields());
		}
	});

	const objectifsIsLong = $derived(
		(module.objectifs?.split('\n').length ?? 0) > 3 ||
			(module.objectifs?.length ?? 0) > 200
	);

	const contenuIsLong = $derived(
		(module.contenu?.split('\n').length ?? 0) > 3 || (module.contenu?.length ?? 0) > 200
	);

	function resetEditFields() {
		editName = module.name;
		editDuration = module.durationHours ?? '';
		editObjectifs = module.objectifs ?? '';
		editContenu = module.contenu ?? '';
		editEvaluation = module.modaliteEvaluation ?? '';
	}

	function handleCancel() {
		resetEditFields();
		onCancelEdit();
	}
</script>

{#if editing}
	<Card.Root class="border-primary ring-primary/20 ring-2">
		<Card.Header>
			<Card.Title class="text-base">
				Module {index + 1} — Modifier
			</Card.Title>
		</Card.Header>
		<Card.Content>
			<form
				method="POST"
				action="?/updateModule"
				class="space-y-4"
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === 'success') {
							toast.success('Module mis à jour');
							onCancelEdit();
							await invalidateAll();
						} else if (result.type === 'failure' && result.data && 'message' in result.data) {
							toast.error(String(result.data.message));
						}
						await update({ reset: false });
					};
				}}
			>
				<input type="hidden" name="moduleId" value={module.id} />

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<Label for="edit-name-{module.id}">Nom du module *</Label>
						<Input
							id="edit-name-{module.id}"
							name="name"
							bind:value={editName}
							required
							placeholder="Nom du module"
						/>
					</div>
					<div class="space-y-2">
						<Label for="edit-duration-{module.id}">Durée (heures)</Label>
						<Input
							id="edit-duration-{module.id}"
							name="durationHours"
							type="number"
							step="0.5"
							min="0"
							bind:value={editDuration}
							placeholder="Ex: 7"
						/>
					</div>
				</div>

				<div class="space-y-2">
					<Label for="edit-objectifs-{module.id}">Objectifs</Label>
					<Textarea
						id="edit-objectifs-{module.id}"
						name="objectifs"
						bind:value={editObjectifs}
						rows={3}
						placeholder="Objectifs pédagogiques du module"
					/>
				</div>

				<div class="space-y-2">
					<Label for="edit-contenu-{module.id}">Contenu</Label>
					<Textarea
						id="edit-contenu-{module.id}"
						name="contenu"
						bind:value={editContenu}
						rows={3}
						placeholder="Contenu / syllabus du module"
					/>
				</div>

				<div class="space-y-2">
					<Label for="edit-eval-{module.id}">Modalité d'évaluation</Label>
					<select
						id="edit-eval-{module.id}"
						name="modaliteEvaluation"
						bind:value={editEvaluation}
						class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
					>
						<option value="">— Aucune —</option>
						<option value="QCM">QCM</option>
						<option value="QCU">QCU</option>
						<option value="Pratique">Pratique</option>
						<option value="Projet">Projet</option>
					</select>
				</div>

				<div class="flex items-center justify-end gap-2 pt-2">
					<Button type="button" variant="ghost" size="sm" onclick={handleCancel} disabled={submitting}>
						<X class="mr-1 size-4" />
						Annuler
					</Button>
					<Button type="submit" size="sm" disabled={submitting}>
						<Check class="mr-1 size-4" />
						Enregistrer
					</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
{:else}
	<Card.Root class="group transition-shadow hover:shadow-md" draggable="true">
		<Card.Content class="p-4">
			<div class="flex gap-3">
				<!-- Left: drag handle + reorder arrows -->
				<div class="flex flex-col items-center gap-1 pt-0.5">
					<GripVertical class="text-muted-foreground size-4 cursor-grab" />
					<button
						type="button"
						class="text-muted-foreground hover:text-foreground disabled:opacity-30 rounded p-0.5 transition-colors"
						disabled={index === 0 || submitting}
						onclick={onMoveUp}
						aria-label="Déplacer vers le haut"
					>
						<ChevronUp class="size-4" />
					</button>
					<span class="text-muted-foreground text-xs font-medium">{index + 1}</span>
					<button
						type="button"
						class="text-muted-foreground hover:text-foreground disabled:opacity-30 rounded p-0.5 transition-colors"
						disabled={index === totalCount - 1 || submitting}
						onclick={onMoveDown}
						aria-label="Déplacer vers le bas"
					>
						<ChevronDown class="size-4" />
					</button>
				</div>

				<!-- Center: module content -->
				<div class="min-w-0 flex-1 space-y-3">
					<!-- Title row -->
					<div class="flex items-start justify-between gap-2">
						<div class="flex flex-wrap items-center gap-2">
							<h4 class="text-sm font-semibold">{module.name}</h4>
							{#if module.durationHours}
								<Badge variant="outline" class="gap-1">
									<Clock class="size-3" />
									{module.durationHours}h
								</Badge>
							{/if}
							{#if module.modaliteEvaluation}
								<Badge variant="secondary" class="text-xs">
									{module.modaliteEvaluation}
								</Badge>
							{/if}
						</div>

						<!-- Actions -->
						<div class="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
							<Button variant="ghost" size="icon" class="size-7" onclick={onStartEdit} disabled={submitting}>
								<Pencil class="size-3.5" />
								<span class="sr-only">Modifier</span>
							</Button>
							<Button
								variant="ghost"
								size="icon"
								class="text-destructive hover:text-destructive size-7"
								onclick={onDelete}
								disabled={submitting}
							>
								<Trash2 class="size-3.5" />
								<span class="sr-only">Supprimer</span>
							</Button>
						</div>
					</div>

					<!-- Objectives -->
					{#if module.objectifs}
						<div class="space-y-1">
							<p
								class="text-muted-foreground text-sm whitespace-pre-line {!objectifsExpanded && objectifsIsLong ? 'line-clamp-3' : ''}"
							>
								{module.objectifs}
							</p>
							{#if objectifsIsLong}
								<button
									type="button"
									class="text-primary flex items-center gap-0.5 text-xs font-medium hover:underline"
									onclick={() => (objectifsExpanded = !objectifsExpanded)}
								>
									<ChevronRight
										class="size-3 transition-transform {objectifsExpanded ? 'rotate-90' : ''}"
									/>
									{objectifsExpanded ? 'Réduire' : 'Voir plus'}
								</button>
							{/if}
						</div>
					{/if}

					<!-- Content / Syllabus -->
					{#if module.contenu}
						<div class="border-muted space-y-1 border-l-2 pl-3">
							<button
								type="button"
								class="text-muted-foreground flex items-center gap-1 text-xs font-medium hover:underline"
								onclick={() => (contenuExpanded = !contenuExpanded)}
							>
								<ChevronRight
									class="size-3 transition-transform {contenuExpanded ? 'rotate-90' : ''}"
								/>
								Contenu
							</button>
							{#if contenuExpanded}
								<p class="text-muted-foreground text-sm whitespace-pre-line">
									{module.contenu}
								</p>
							{/if}
						</div>
					{/if}

					<!-- Supports -->
					{#if module.moduleSupports.length > 0}
						<div class="space-y-1">
							<p class="text-muted-foreground text-xs font-medium">Supports</p>
							<ul class="space-y-1">
								{#each module.moduleSupports as ms (ms.support.id)}
									<li class="flex items-center gap-1.5 text-sm">
										<FileText class="text-muted-foreground size-3.5 shrink-0" />
										{#if ms.support.url}
											<a
												href={ms.support.url}
												target="_blank"
												rel="noopener noreferrer"
												class="text-primary truncate hover:underline"
											>
												{ms.support.titre}
											</a>
										{:else}
											<span class="truncate">{ms.support.titre}</span>
										{/if}
									</li>
								{/each}
							</ul>
						</div>
					{/if}

					<!-- Questionnaires -->
					{#if module.moduleQuestionnaires.length > 0}
						<div class="space-y-1">
							<p class="text-muted-foreground text-xs font-medium">Questionnaires</p>
							<ul class="space-y-1">
								{#each module.moduleQuestionnaires as mq (mq.questionnaire.id)}
									<li class="flex items-center gap-1.5 text-sm">
										<ClipboardList class="text-muted-foreground size-3.5 shrink-0" />
										<span class="truncate">{mq.questionnaire.titre}</span>
										<Badge variant="outline" class="text-[10px]">
											{mq.questionnaire.type}
										</Badge>
									</li>
								{/each}
							</ul>
						</div>
					{/if}
				</div>
			</div>
		</Card.Content>
	</Card.Root>
{/if}
