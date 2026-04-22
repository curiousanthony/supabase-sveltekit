<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import Search from '@lucide/svelte/icons/search';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Clock from '@lucide/svelte/icons/clock';
	import Layers from '@lucide/svelte/icons/layers';

	interface Programme {
		id: string;
		titre: string;
		description: string | null;
		modalite: string | null;
		dureeHeures: string | null;
		moduleCount: number;
		topicId: string | null;
		thematiqueName: string | null;
		derivedFromTitre: string | null;
	}

	let {
		open,
		onOpenChange,
		programmes,
		hasExistingModules,
		formationId
	}: {
		open: boolean;
		onOpenChange: (open: boolean) => void;
		programmes: Programme[];
		hasExistingModules: boolean;
		formationId: string;
	} = $props();

	let searchQuery = $state('');
	let activeThematique = $state<string | null>(null);
	let selectedProgramme = $state<Programme | null>(null);
	let collisionDialogOpen = $state(false);
	let collisionMode = $state<'replace' | 'append'>('replace');
	let formEl = $state<HTMLFormElement | null>(null);

	const thematiques = $derived(
		[...new Set(programmes.map((p) => p.thematiqueName).filter(Boolean))] as string[]
	);

	const filteredProgrammes = $derived.by(() => {
		let result = programmes;
		if (searchQuery.trim()) {
			const q = searchQuery.trim().toLowerCase();
			result = result.filter((p) => p.titre.toLowerCase().includes(q));
		}
		if (activeThematique) {
			result = result.filter((p) => p.thematiqueName === activeThematique);
		}
		return result;
	});

	function handleSelect(programme: Programme) {
		selectedProgramme = programme;
		if (hasExistingModules) {
			collisionDialogOpen = true;
		} else {
			collisionMode = 'replace';
			submitForm();
		}
	}

	function handleCollisionChoice(mode: 'replace' | 'append') {
		collisionMode = mode;
		collisionDialogOpen = false;
		submitForm();
	}

	function submitForm() {
		if (!formEl) return;
		formEl.requestSubmit();
	}

	function resetState() {
		searchQuery = '';
		activeThematique = null;
		selectedProgramme = null;
		collisionDialogOpen = false;
	}
</script>

<Dialog.Root
	{open}
	onOpenChange={(v) => {
		if (!v) resetState();
		onOpenChange(v);
	}}
>
	<Dialog.Content class="max-w-3xl">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<BookOpen class="size-5" />
				Choisir un programme
			</Dialog.Title>
			<Dialog.Description>
				Sélectionnez un programme de la bibliothèque à associer à cette formation.
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4">
			<div class="relative">
				<Search class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
				<Input
					type="text"
					placeholder="Rechercher un programme…"
					class="pl-9"
					bind:value={searchQuery}
				/>
			</div>

			{#if thematiques.length > 0}
				<div class="flex flex-wrap gap-2">
					<button
						type="button"
						class="rounded-full border px-3 py-1 text-xs font-medium transition-colors {activeThematique === null
							? 'bg-primary text-primary-foreground border-primary'
							: 'bg-background text-muted-foreground hover:bg-accent border-border'}"
						onclick={() => (activeThematique = null)}
					>
						Toutes
					</button>
				{#each thematiques as thematique (thematique)}
					<button
							type="button"
							class="rounded-full border px-3 py-1 text-xs font-medium transition-colors {activeThematique ===
							thematique
								? 'bg-primary text-primary-foreground border-primary'
								: 'bg-background text-muted-foreground hover:bg-accent border-border'}"
							onclick={() =>
								(activeThematique = activeThematique === thematique ? null : thematique)}
						>
							{thematique}
						</button>
					{/each}
				</div>
			{/if}

			<div class="max-h-[400px] space-y-2 overflow-y-auto pr-1">
				{#if filteredProgrammes.length === 0}
					<div class="flex flex-col items-center justify-center gap-3 py-12 text-center">
						<div class="bg-muted rounded-full p-3">
							<BookOpen class="text-muted-foreground size-6" />
						</div>
						<div>
							<p class="text-sm font-medium">Aucun programme trouvé</p>
							<p class="text-muted-foreground text-sm">
								Essayez de modifier votre recherche ou vos filtres.
							</p>
						</div>
					</div>
				{:else}
					{#each filteredProgrammes as programme (programme.id)}
						<button
							type="button"
							class="hover:bg-accent/50 w-full rounded-lg border p-4 text-left transition-colors {selectedProgramme?.id ===
							programme.id
								? 'border-primary ring-primary/20 ring-2'
								: 'border-border'}"
							onclick={() => handleSelect(programme)}
						>
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0 flex-1">
									<p class="truncate font-semibold">{programme.titre}</p>
									{#if programme.description}
										<p class="text-muted-foreground mt-1 line-clamp-2 text-sm">
											{programme.description}
										</p>
									{/if}
									<div class="mt-2 flex flex-wrap items-center gap-2">
										{#if programme.modalite}
											<Badge variant="secondary">{programme.modalite}</Badge>
										{/if}
										{#if programme.dureeHeures}
											<Badge variant="outline" class="gap-1">
												<Clock class="size-3" />
												{programme.dureeHeures}h
											</Badge>
										{/if}
										<Badge variant="outline" class="gap-1">
											<Layers class="size-3" />
											{programme.moduleCount} module{programme.moduleCount !== 1 ? 's' : ''}
										</Badge>
									</div>
									{#if programme.derivedFromTitre}
										<p class="text-muted-foreground mt-2 text-xs">
											Dérivé de : {programme.derivedFromTitre}
										</p>
									{/if}
								</div>
								<Button
									size="sm"
									variant="outline"
									onclick={(e: MouseEvent) => {
										e.stopPropagation();
										handleSelect(programme);
									}}
								>
									Sélectionner
								</Button>
							</div>
						</button>
					{/each}
				{/if}
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>

<form
	bind:this={formEl}
	method="POST"
	action="?/attachProgramme"
	class="hidden"
	use:enhance={() => {
		return async ({ result, update }) => {
			if (result.type === 'success') {
				toast.success('Programme associé');
				await invalidateAll();
				resetState();
				onOpenChange(false);
			} else if (result.type === 'failure' && result.data && 'message' in result.data) {
				toast.error(String(result.data.message));
			}
			await update({ reset: false });
		};
	}}
>
	<input type="hidden" name="programmeId" value={selectedProgramme?.id ?? ''} />
	<input type="hidden" name="collisionMode" value={collisionMode} />
</form>

<AlertDialog.Root bind:open={collisionDialogOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Cette formation contient déjà des modules</AlertDialog.Title>
			<AlertDialog.Description>
				Le programme sélectionné contient des modules. Comment souhaitez-vous procéder avec les
				modules existants de la formation ?
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer class="flex-col gap-2 sm:flex-row">
			<AlertDialog.Cancel>Annuler</AlertDialog.Cancel>
			<Button variant="outline" onclick={() => handleCollisionChoice('append')}>
				Ajouter à la suite
			</Button>
			<Button variant="destructive" onclick={() => handleCollisionChoice('replace')}>
				Remplacer les modules existants
			</Button>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
