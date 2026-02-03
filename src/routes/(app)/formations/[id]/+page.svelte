<script lang="ts">
	import type { PageProps } from './$types';
	import * as Card from '$lib/components/ui/card/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import * as Button from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import {
		IconEdit,
		IconUsers,
		IconCalendar,
		IconCheck,
		IconPlayerPlay,
		IconCircleDashed
	} from '@tabler/icons-svelte';

	let { data }: PageProps = $props();
	let { formation, progress, steps, learners, modules, formateurs, seances } = $derived(data);

	// State for step content area - default to first in_progress or to_do step
	let selectedStepKey = $state<string | null>(
		steps.find((s) => s.status === 'in_progress')?.key ||
			steps.find((s) => s.status === 'to_do')?.key ||
			null
	);

	// Derived: current selected step object
	let currentStep = $derived(steps.find((s) => s.key === selectedStepKey));

	// State for drawers/modals
	let showModifier = $state(false);
	let showFormateurs = $state(false);
	let showSeances = $state(false);

	function getStepStatusLabel(status: string) {
		if (status === 'done') return 'Terminée';
		if (status === 'in_progress') return 'En cours';
		return 'À faire';
	}

	function getStepStatusVariant(status: string): 'default' | 'secondary' | 'outline' {
		if (status === 'done') return 'default';
		if (status === 'in_progress') return 'secondary';
		return 'outline';
	}
</script>

<div class="space-y-5">
	<!-- Recap Block -->
	<Card.Root>
		<Card.Header class="flex flex-row items-start justify-between gap-4 pb-3">
			<div class="min-w-0 flex-1">
				<div class="mb-1 flex flex-wrap items-center gap-2">
					<Badge variant="outline">{formation.statut}</Badge>
					<Badge variant="secondary">{formation.typeFinancement}</Badge>
				</div>
				<Card.Title class="text-xl">{formation.name}</Card.Title>
				<Card.Description>
					{formation.client.legalName} • {formation.dates.start} → {formation.dates.end}
				</Card.Description>
			</div>
			<div class="flex shrink-0 items-center gap-2">
				<Button.Root variant="outline" size="sm" onclick={() => (showFormateurs = true)}>
					<IconUsers class="h-4 w-4" />
					<span class="hidden sm:inline">Formateurs</span>
					<Badge variant="secondary" class="ml-1">{formateurs.length}</Badge>
				</Button.Root>
				<Button.Root variant="outline" size="sm" onclick={() => (showSeances = true)}>
					<IconCalendar class="h-4 w-4" />
					<span class="hidden sm:inline">Séances</span>
					<Badge variant="secondary" class="ml-1">{seances.length}</Badge>
				</Button.Root>
				<Button.Root variant="ghost" size="sm" onclick={() => (showModifier = true)}>
					<IconEdit class="h-4 w-4" />
				</Button.Root>
			</div>
		</Card.Header>
		<Card.Content class="pt-0">
			<div class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm md:grid-cols-4">
				<div>
					<span class="text-muted-foreground">Durée</span>
					<span class="ml-2 font-medium">{formation.duree}h</span>
				</div>
				<div>
					<span class="text-muted-foreground">Lieu</span>
					<span class="ml-2 font-medium">{formation.lieu}</span>
				</div>
				<div>
					<span class="text-muted-foreground">Format</span>
					<span class="ml-2 font-medium">{formation.format}</span>
				</div>
				<div>
					<span class="text-muted-foreground">Thématique</span>
					<span class="ml-2 font-medium">{formation.thematique?.name || '—'}</span>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Horizontal Progress Stepper -->
	<div class="rounded-lg border bg-muted/30 p-4">
		<div class="mb-3 flex items-center justify-between">
			<span class="text-sm font-medium">
				Conformité Qualiopi : {progress.completed}/{progress.total} étapes
			</span>
			<span class="text-sm font-semibold text-primary">
				{Math.round((progress.completed / progress.total) * 100)}%
			</span>
		</div>

		<!-- Stepper -->
		<div class="flex items-center">
			{#each steps as step, i (step.key)}
				<button
					type="button"
					class="group relative flex shrink-0 flex-col items-center"
					onclick={() => (selectedStepKey = step.key)}
					title={step.label}
				>
					<!-- Step Circle -->
					<div
						class="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all
						{step.status === 'done'
							? 'bg-green-500 text-white'
							: step.status === 'in_progress'
								? 'bg-primary text-primary-foreground'
								: 'border-2 border-muted-foreground/30 bg-background text-muted-foreground'}
						{selectedStepKey === step.key ? 'ring-2 ring-primary ring-offset-2' : ''}
						group-hover:scale-110"
					>
						{#if step.status === 'done'}
							<IconCheck class="h-5 w-5" />
						{:else if step.status === 'in_progress'}
							<IconPlayerPlay class="h-4 w-4" />
						{:else}
							{step.stepNumber}
						{/if}
					</div>
					<!-- Step Label (visible on lg screens) -->
					<span
						class="mt-1 hidden max-w-[70px] truncate text-center text-xs lg:block
						{selectedStepKey === step.key || step.status === 'in_progress'
							? 'font-medium text-foreground'
							: 'text-muted-foreground'}"
					>
						{step.label}
					</span>
				</button>

				<!-- Connector Line -->
				{#if i < steps.length - 1}
					<div
						class="mx-1 h-0.5 min-w-[12px] flex-1 transition-colors
						{step.status === 'done' ? 'bg-green-500' : 'bg-muted-foreground/20'}"
					></div>
				{/if}
			{/each}
		</div>
	</div>

	<!-- Hero Step Content -->
	{#if currentStep}
		<Card.Root
			class="border-2 transition-colors {currentStep.status === 'in_progress'
				? 'border-primary/50'
				: currentStep.status === 'done'
					? 'border-green-500/30'
					: ''}"
		>
			<Card.Header class="flex flex-row items-start justify-between gap-4">
				<div class="min-w-0 flex-1">
					<div class="mb-1 flex items-center gap-2">
						<Badge variant={getStepStatusVariant(currentStep.status)}>
							{#if currentStep.status === 'done'}
								<IconCheck class="mr-1 h-3 w-3" />
							{:else if currentStep.status === 'in_progress'}
								<IconPlayerPlay class="mr-1 h-3 w-3" />
							{:else}
								<IconCircleDashed class="mr-1 h-3 w-3" />
							{/if}
							{getStepStatusLabel(currentStep.status)}
						</Badge>
						<span class="text-sm text-muted-foreground">Étape {currentStep.stepNumber}/10</span>
					</div>
					<Card.Title class="text-xl">{currentStep.label}</Card.Title>
				</div>

				{#if currentStep.status !== 'done'}
					<Button.Root size="lg" class="shrink-0">
						{currentStep.primaryButton}
					</Button.Root>
				{/if}
			</Card.Header>
			<Card.Content>
				{@render stepContentByKey(selectedStepKey)}
			</Card.Content>
		</Card.Root>
	{:else}
		<Card.Root>
			<Card.Content class="py-12 text-center text-muted-foreground">
				Sélectionnez une étape pour voir son contenu
			</Card.Content>
		</Card.Root>
	{/if}
</div>

{#snippet stepContentByKey(stepKey: string | null)}
	{#if stepKey === 'info_verification'}
		<!-- Step 1: Vérifications des informations -->
		<div class="space-y-4">
			<div>
				<h4 class="mb-2 font-medium">Apprenants inscrits ({learners.length})</h4>
				<div class="mb-3 space-y-2">
					{#each learners as learner}
						<div class="flex items-center justify-between rounded border p-2">
							<span class="text-sm">{learner.firstName} {learner.lastName}</span>
							<span class="text-xs text-muted-foreground">{learner.email}</span>
						</div>
					{/each}
				</div>
				<div class="flex flex-wrap gap-2">
					<Button.Root variant="outline" size="sm">Ajouter apprenant</Button.Root>
					<Button.Root variant="outline" size="sm">Importer CSV</Button.Root>
				</div>
			</div>
		</div>
	{:else if stepKey === 'convention_program'}
		<!-- Step 2: Convention et programme -->
		<div class="space-y-4">
			<div>
				<h4 class="mb-2 font-medium">Convention de formation</h4>
				<div class="flex flex-wrap gap-2">
					<Button.Root size="sm">Générer</Button.Root>
					<Button.Root variant="outline" size="sm">Modifier</Button.Root>
					<Button.Root variant="outline" size="sm">Télécharger</Button.Root>
				</div>
			</div>
			<div>
				<h4 class="mb-2 font-medium">Programme de formation</h4>
				<div class="flex flex-wrap gap-2">
					<Button.Root variant="outline" size="sm">Renseigner le programme</Button.Root>
					<Button.Root variant="outline" size="sm">Télécharger</Button.Root>
				</div>
			</div>
		</div>
	{:else if stepKey === 'needs_analysis'}
		<!-- Step 3: Analyse des besoins -->
		<div class="space-y-4">
			<div>
				<h4 class="mb-2 font-medium">Participants ({learners.length})</h4>
				<div class="space-y-2">
					{#each learners.slice(0, 3) as learner}
						<div class="flex items-center justify-between rounded border p-2">
							<span class="text-sm">{learner.firstName} {learner.lastName}</span>
							<Badge variant="outline">En attente</Badge>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{:else if stepKey === 'convocation'}
		<!-- Step 4: Convocation -->
		<div class="space-y-4">
			<div class="flex flex-wrap gap-2">
				<Button.Root size="sm">Générer pour tous</Button.Root>
				<Button.Root variant="outline" size="sm">Programmer envoi groupé</Button.Root>
			</div>
			<div>
				<h4 class="mb-2 font-medium">Apprenants ({learners.length})</h4>
				<div class="space-y-1">
					{#each learners as learner}
						<div class="flex items-center justify-between text-sm">
							<span>{learner.firstName} {learner.lastName}</span>
							<span class="text-muted-foreground">{learner.email}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{:else if stepKey === 'mission_order'}
		<!-- Step 5: Ordre de mission -->
		<div class="space-y-4">
			<div>
				<h4 class="mb-2 font-medium">Ordre de mission à signer</h4>
				<div class="flex flex-wrap gap-2">
					<Button.Root size="sm">Générer</Button.Root>
					<Button.Root variant="outline" size="sm">Modifier</Button.Root>
					<Button.Root variant="outline" size="sm">Télécharger</Button.Root>
				</div>
			</div>
			<div>
				<h4 class="mb-2 font-medium">Test de positionnement</h4>
				<div class="rounded border border-dashed p-4 text-center">
					<p class="mb-2 text-sm text-muted-foreground">Télécharger le document</p>
					<Button.Root variant="outline" size="sm">Choisir un fichier</Button.Root>
				</div>
			</div>
		</div>
	{:else if stepKey === 'end_certificate'}
		<!-- Step 6: Attestation de fin de mission -->
		<div class="space-y-4">
			<div class="flex flex-wrap gap-2">
				<Button.Root size="sm">Générer pour tous</Button.Root>
				<Button.Root variant="outline" size="sm">Programmer envoi groupé</Button.Root>
			</div>
			<div class="text-sm text-muted-foreground">
				<p>Apprenants issus du listing mission : {learners.length}</p>
				<p>Apprenants issus de l'émargement : 0</p>
			</div>
		</div>
	{:else if stepKey === 'satisfaction_questionnaires'}
		<!-- Step 7: Questionnaires de satisfaction -->
		<div class="space-y-4">
			<div>
				<h4 class="mb-2 font-medium">Questionnaires à programmer</h4>
				<div class="flex flex-wrap gap-2">
					<Button.Root variant="outline" size="sm">🔥 Questionnaire à chaud</Button.Root>
					<Button.Root variant="outline" size="sm">❄️ Questionnaire à froid</Button.Root>
				</div>
			</div>
			<div>
				<h4 class="mb-2 font-medium">Apprenants ({learners.length})</h4>
				<div class="space-y-2">
					{#each learners.slice(0, 3) as learner}
						<div class="flex items-center justify-between rounded border p-2">
							<span class="text-sm">{learner.firstName} {learner.lastName}</span>
							<Badge variant="outline">En attente</Badge>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{:else if stepKey === 'instructor_documents'}
		<!-- Step 8: Documents formateur -->
		<div class="space-y-3">
			{#each ['Fiche d\'entretien', 'CV', 'Diplôme', 'Attestation URSSAF', 'Attestation NDA', 'Contrat prestataire (signé)'] as doc}
				<div class="flex items-center justify-between rounded border p-2">
					<span class="text-sm">{doc}</span>
					<Button.Root variant="outline" size="sm">Téléverser</Button.Root>
				</div>
			{/each}
		</div>
	{:else if stepKey === 'billing'}
		<!-- Step 9: Facturation -->
		<div class="space-y-4">
			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<h4 class="mb-2 font-medium">Facture entreprise</h4>
					<div class="space-y-1 text-sm">
						<div class="flex justify-between">
							<span class="text-muted-foreground">Envoyée</span>
							<Badge variant="outline">Non</Badge>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Payée</span>
							<Badge variant="outline">Non</Badge>
						</div>
					</div>
				</div>
				<div>
					<h4 class="mb-2 font-medium">Facture formateur</h4>
					<div class="space-y-1 text-sm">
						<div class="flex justify-between">
							<span class="text-muted-foreground">Virement réalisé</span>
							<Badge variant="outline">Non</Badge>
						</div>
					</div>
				</div>
			</div>
			<div>
				<h4 class="mb-2 font-medium">Mode de paiement</h4>
				<div class="flex flex-wrap gap-2">
					<Button.Root size="sm">Via Mentore</Button.Root>
					<Button.Root variant="outline" size="sm">Direct mensuel</Button.Root>
					<Button.Root variant="outline" size="sm">Direct fin de mission</Button.Root>
				</div>
			</div>
		</div>
	{:else if stepKey === 'complete_file'}
		<!-- Step 10: Dossier complet -->
		<div class="space-y-4">
			<div class="rounded-lg bg-muted/50 p-4">
				<h4 class="mb-2 font-medium">Récapitulatif</h4>
				<div class="grid gap-2 text-sm sm:grid-cols-2">
					<div>
						<span class="text-muted-foreground">Sessions créées :</span>
						<span class="ml-1 font-medium">0</span>
					</div>
					<div>
						<span class="text-muted-foreground">Signatures enregistrées :</span>
						<span class="ml-1 font-medium">0</span>
					</div>
					<div>
						<span class="text-muted-foreground">Documents formateur :</span>
						<span class="ml-1 font-medium">0</span>
					</div>
				</div>
			</div>
			<p class="text-sm text-muted-foreground">
				Tous les documents et données seront compilés dans le dossier final.
			</p>
		</div>
	{/if}
{/snippet}

<!-- Modifier Modal -->
<Dialog.Root bind:open={showModifier}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Modifier la formation</Dialog.Title>
			<Dialog.Description>Formulaire d'édition – placeholder</Dialog.Description>
		</Dialog.Header>
		<div class="py-4">
			<p class="text-sm text-muted-foreground">Ce formulaire sera implémenté en Phase 3.</p>
		</div>
		<Dialog.Footer>
			<Button.Root variant="outline" onclick={() => (showModifier = false)}>Annuler</Button.Root>
			<Button.Root onclick={() => (showModifier = false)}>Enregistrer</Button.Root>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Formateurs Drawer -->
<Drawer.Root bind:open={showFormateurs}>
	<Drawer.Content>
		<Drawer.Header>
			<Drawer.Title>Formateurs ({formateurs.length})</Drawer.Title>
		</Drawer.Header>
		<div class="p-4 space-y-4">
			<div>
				<h4 class="font-medium mb-2">Par module</h4>
				<div class="space-y-2">
					{#each modules as module}
						<div class="rounded border p-2">
							<p class="text-sm font-medium">{module.name}</p>
							<p class="text-xs text-muted-foreground">Aucun formateur assigné</p>
						</div>
					{/each}
				</div>
			</div>
			<div>
				<h4 class="font-medium mb-2">Vue agrégée</h4>
				<div class="space-y-2">
					{#each formateurs as formateur}
						<div class="rounded border p-2">
							<p class="text-sm">{formateur.name}</p>
						</div>
					{/each}
				</div>
			</div>
		</div>
		<Drawer.Footer>
			<Button.Root variant="outline" onclick={() => (showFormateurs = false)}>Fermer</Button.Root>
		</Drawer.Footer>
	</Drawer.Content>
</Drawer.Root>

<!-- Séances Drawer -->
<Drawer.Root bind:open={showSeances}>
	<Drawer.Content>
		<Drawer.Header>
			<Drawer.Title>Séances ({seances.length})</Drawer.Title>
		</Drawer.Header>
		<div class="p-4 space-y-2">
			{#each seances as seance}
				<div class="rounded border p-3">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium">{seance.date}</p>
							<p class="text-xs text-muted-foreground">{seance.startTime} → {seance.endTime}</p>
						</div>
					</div>
				</div>
			{/each}
		</div>
		<Drawer.Footer>
			<Button.Root variant="outline" onclick={() => (showSeances = false)}>Fermer</Button.Root>
		</Drawer.Footer>
	</Drawer.Content>
</Drawer.Root>
