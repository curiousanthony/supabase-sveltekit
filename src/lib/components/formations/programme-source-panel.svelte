<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import Info from '@lucide/svelte/icons/info';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import Save from '@lucide/svelte/icons/save';
	import Unlink from '@lucide/svelte/icons/unlink';
	import Library from '@lucide/svelte/icons/library';
	import BookOpen from '@lucide/svelte/icons/book-open';

	type ProgrammeSource = {
		id: string;
		titre: string;
		dureeHeures?: number | null;
		modalite?: string | null;
	};

	interface Props {
		programmeSource: ProgrammeSource | null;
		programmeSourceUpdatedSinceLink: boolean;
		formationStatut: string;
		hasModules: boolean;
		formationId: string;
		onOpenPicker: () => void;
	}

	let {
		programmeSource,
		programmeSourceUpdatedSinceLink,
		formationStatut,
		hasModules,
		formationId,
		onOpenPicker
	}: Props = $props();

	let dismissed = $state(false);
	let submitting = $state(false);

	const frozen = $derived(formationStatut === 'Terminée' || formationStatut === 'Archivée');

	const showUpdateStrip = $derived(
		!frozen && programmeSource !== null && programmeSourceUpdatedSinceLink && !dismissed
	);

	const showLinkedSyncActions = $derived(
		!frozen && programmeSource !== null && hasModules && !showUpdateStrip
	);

	const showSaveCard = $derived(!frozen && programmeSource === null && hasModules);

	const showEmptyState = $derived(!frozen && programmeSource === null && !hasModules);

	function enhanceWithFeedback(successMsg: string, errorMsg: string) {
		return () => {
			submitting = true;
			return async ({ result }: { result: { type: string } }) => {
				submitting = false;
				if (result.type === 'success') {
					toast.success(successMsg);
					await invalidateAll();
				} else {
					toast.error(errorMsg);
				}
			};
		};
	}
</script>

{#if frozen && programmeSource}
	<Card.Root class="border-muted bg-muted/30 shadow-none">
		<Card.Content class="pt-6">
			<div class="flex items-start gap-3">
				<Library class="text-muted-foreground mt-0.5 size-5 shrink-0" />
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
		</Card.Content>
	</Card.Root>
{:else if frozen}
	<!-- Formation figée sans programme source : rien -->
{:else if showEmptyState}
	<Card.Root>
		<Card.Content class="pt-6">
			<div class="flex items-center justify-between gap-4">
				<div class="flex items-center gap-3">
					<Library class="text-muted-foreground size-5 shrink-0" />
					<div>
						<p class="text-muted-foreground text-sm">Aucun programme source</p>
						<p class="text-muted-foreground mt-0.5 text-xs">
							Associez un programme de la bibliothèque ou assemblez un programme personnalisé.
						</p>
					</div>
				</div>
				<Button variant="outline" size="sm" class="shrink-0" onclick={onOpenPicker}>
					<BookOpen class="mr-1.5 size-4" />
					Choisir
				</Button>
			</div>
		</Card.Content>
	</Card.Root>
{:else if programmeSource}
	<Card.Root class="border-muted bg-muted/30 shadow-none overflow-hidden">
		{#if showUpdateStrip}
			<div
				class="flex items-start gap-3 border-b border-blue-200/80 bg-blue-50 p-4 dark:border-blue-800/40 dark:bg-blue-950/30"
				role="status"
			>
				<Info class="mt-0.5 size-5 shrink-0 text-blue-600 dark:text-blue-400" />
				<div class="flex min-w-0 flex-1 flex-col gap-3">
					<p class="text-sm text-blue-900 dark:text-blue-100">
						Une mise à jour du programme source est disponible dans la bibliothèque. Souhaitez-vous
						récupérer ces changements dans cette formation&nbsp;?
					</p>
					<div class="flex flex-wrap gap-2">
						<form
							method="POST"
							action="?/pullFromSource"
							use:enhance={enhanceWithFeedback(
								'Programme mis à jour depuis la source',
								'Erreur lors de la mise à jour'
							)}
						>
							<input type="hidden" name="formationId" value={formationId} />
							<Button type="submit" size="sm" disabled={submitting}>
								<RefreshCw class="size-4" />
								Mettre à jour
							</Button>
						</form>
						<Button
							variant="ghost"
							size="sm"
							onclick={() => (dismissed = true)}
							disabled={submitting}
						>
							Ignorer
						</Button>
					</div>
				</div>
			</div>
		{/if}
		<Card.Content class="pt-6">
			<div class="flex items-start justify-between gap-4">
				<div class="flex items-start gap-3">
					<Library class="text-muted-foreground mt-0.5 size-5 shrink-0" />
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
				<Button variant="outline" size="sm" class="shrink-0" onclick={onOpenPicker}>
					Changer
				</Button>
			</div>
			{#if showLinkedSyncActions}
				<div class="mt-4 flex flex-wrap gap-2 border-t border-border/60 pt-4">
					<form
						method="POST"
						action="?/syncToSource"
						use:enhance={enhanceWithFeedback(
							'Programme source mis à jour',
							'Erreur lors de la synchronisation'
						)}
					>
						<input type="hidden" name="formationId" value={formationId} />
						<Button type="submit" variant="outline" size="sm" disabled={submitting}>
							<RefreshCw class="size-4" />
							Mettre à jour le programme source
						</Button>
					</form>
					<form
						method="POST"
						action="?/createNewProgramme"
						use:enhance={enhanceWithFeedback(
							'Nouveau programme créé',
							'Erreur lors de la création'
						)}
					>
						<input type="hidden" name="formationId" value={formationId} />
						<Button type="submit" variant="outline" size="sm" disabled={submitting}>
							<Save class="size-4" />
							Enregistrer en tant que nouveau programme
						</Button>
					</form>
					<form
						method="POST"
						action="?/detachProgramme"
						use:enhance={enhanceWithFeedback('Programme détaché', 'Erreur lors du détachement')}
					>
						<input type="hidden" name="formationId" value={formationId} />
						<Button type="submit" variant="destructive" size="sm" disabled={submitting}>
							<Unlink class="size-4" />
							Détacher
						</Button>
					</form>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
{:else if showSaveCard}
	<Card.Root class="border-muted bg-muted/30 shadow-none">
		<Card.Header class="pb-0">
			<div class="flex items-center gap-2">
				<Library class="size-4 text-muted-foreground" />
				<Card.Title class="text-sm font-medium">
					Créer un nouveau programme dans la bibliothèque à partir de ces modules
				</Card.Title>
			</div>
		</Card.Header>
		<Card.Content>
			<form
				method="POST"
				action="?/createNewProgramme"
				use:enhance={enhanceWithFeedback('Nouveau programme créé', 'Erreur lors de la création')}
			>
				<input type="hidden" name="formationId" value={formationId} />
				<Button type="submit" variant="outline" size="sm" disabled={submitting}>
					<Save class="size-4" />
					Sauvegarder comme programme
				</Button>
			</form>
		</Card.Content>
	</Card.Root>
{/if}
