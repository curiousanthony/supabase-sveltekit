<script lang="ts">
	import type { PageProps } from './$types';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import * as Button from '$lib/components/ui/button/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import {
		IconEdit,
		IconUsers,
		IconCalendar,
		IconCheck,
		IconPlayerPlay,
		IconCircle,
		IconChevronDown,
		IconChevronUp,
		IconAlertTriangle,
		IconInfoCircle,
		IconTarget
	} from '@tabler/icons-svelte';

	let { data }: PageProps = $props();
	let { formation, progress, steps, learners, modules, formateurs, seances } = $derived(data);

	// State for selected step
	let selectedStepKey = $state<string | null>(null);
	let defaultStepKey = $derived(
		steps.find((s) => s.status === 'in_progress')?.key ||
			steps.find((s) => s.status === 'to_do')?.key ||
			null
	);
	$effect(() => {
		const def = defaultStepKey;
		if (def != null && selectedStepKey === null) selectedStepKey = def;
	});

	// Effective selected key (user selection or default)
	let effectiveSelectedKey = $derived(selectedStepKey ?? defaultStepKey);

	// Derived: current selected step object
	let currentStep = $derived(steps.find((s) => s.key === effectiveSelectedKey));

	// Next action step (first in_progress or to_do)
	let nextActionStep = $derived(
		steps.find((s) => s.status === 'in_progress') || steps.find((s) => s.status === 'to_do')
	);

	// Blockers for convocation step (learners without email)
	let convocationBlockers = $derived(learners.filter((l) => !l.email?.trim()));
	let hasConvocationBlockers = $derived(convocationBlockers.length > 0);

	// Modules without formateur
	let modulesWithoutFormateur = $derived(modules.filter((m) => !m.formateurId && !(m as { formateurName?: string }).formateurName));
	let hasUnassignedModules = $derived(modulesWithoutFormateur.length > 0);

	// Séances view mode
	let seancesViewMode = $state<'list' | 'calendar'>('list');

	// State for UI
	let headerExpanded = $state(false);
	let showModifier = $state(false);
	let showFormateurs = $state(false);
	let showSeances = $state(false);
	let mobileStepsOpen = $state(false);

	// Helpers
	function getStepIcon(status: string) {
		if (status === 'done') return IconCheck;
		if (status === 'in_progress') return IconPlayerPlay;
		return IconCircle;
	}

	function getStepStatusLabel(status: string) {
		if (status === 'done') return 'Terminée';
		if (status === 'in_progress') return 'En cours';
		return 'À venir';
	}

	// Scroll to step content when clicking Next Action CTA
	function scrollToStepContent() {
		selectedStepKey = nextActionStep?.key ?? null;
	}
</script>

<!-- Main Layout Container -->
<Tooltip.Provider delayDuration={300}>
<div class="flex h-full flex-col">
	<!-- Collapsible Header Bar (title in site header, no duplication) -->
	<Collapsible.Root bind:open={headerExpanded} class="border-b bg-background">
		<div class="flex items-center justify-between gap-4 px-4 py-3">
			<!-- Left: Badges + interactive client -->
			<div class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
				<Badge variant="outline">{formation.statut}</Badge>
				<Badge variant="secondary">{formation.typeFinancement}</Badge>
				{#if formation.client?.id}
					<span class="inline-flex items-center gap-1">
						<a
							href="/contacts/clients/{formation.client.id}"
							class="text-sm font-medium text-primary underline-offset-4 hover:underline"
						>
							{formation.client.legalName}
						</a>
						<Tooltip.Root>
							<Tooltip.Trigger
								class="inline-flex rounded p-0.5 text-muted-foreground hover:text-foreground"
								aria-label="Infos client"
							>
								<IconInfoCircle class="h-4 w-4" />
							</Tooltip.Trigger>
							<Tooltip.Content class="max-w-xs p-4">
								<div class="space-y-1 text-sm">
									<p class="font-semibold">{formation.client.legalName}</p>
									{#if formation.client.contactPerson}
										<p>Contact : {formation.client.contactPerson}</p>
									{/if}
									{#if formation.client.email}
										<p>{formation.client.email}</p>
									{/if}
									{#if formation.client.phone}
										<p>{formation.client.phone}</p>
									{/if}
									<a href="/contacts/clients/{formation.client.id}" class="text-primary underline">
										Voir la fiche client →
									</a>
								</div>
							</Tooltip.Content>
						</Tooltip.Root>
					</span>
				{:else}
					<span class="text-sm text-muted-foreground">{formation.client.legalName}</span>
				{/if}
			</div>

			<!-- Right: Actions -->
			<div class="flex shrink-0 items-center gap-2">
				<Collapsible.Trigger
					class="inline-flex items-center justify-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent"
				>
					{#if headerExpanded}
						<IconChevronUp class="h-4 w-4" />
						<span class="hidden sm:inline">Masquer</span>
					{:else}
						<IconChevronDown class="h-4 w-4" />
						<span class="hidden sm:inline">Détails</span>
					{/if}
				</Collapsible.Trigger>
				<Button.Root variant="ghost" size="sm" onclick={() => (showModifier = true)}>
					<IconEdit class="h-4 w-4" />
				</Button.Root>
			</div>
		</div>

		<!-- Expanded Details (sections: base, Qualiopi, modules, brief) -->
		<Collapsible.Content>
			<div class="border-t bg-muted/30 px-4 py-4">
				<div class="space-y-4">
					<!-- Informations de base -->
					<div>
						<h4 class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							Informations de base
						</h4>
						<div class="flex flex-wrap gap-x-6 gap-y-2 text-sm">
							<span><span class="text-muted-foreground">Dates:</span> <span class="font-medium">{formation.dates.start} → {formation.dates.end}</span></span>
							<span><span class="text-muted-foreground">Durée:</span> <span class="font-medium">{formation.duree}h</span></span>
							<span><span class="text-muted-foreground">Lieu:</span> <span class="font-medium">{formation.lieu}</span></span>
							<span><span class="text-muted-foreground">Format:</span> <span class="font-medium">{formation.format}</span></span>
							<span><span class="text-muted-foreground">Thématique:</span> <span class="font-medium">{formation.thematique?.name || '—'}</span></span>
							<span><span class="text-muted-foreground">Apprenants:</span> <span class="font-medium">{learners.length}</span></span>
						</div>
					</div>
					<!-- Exigences Qualiopi -->
					{#if formation.publicCible?.length || formation.prerequis?.length || formation.evaluationMode || formation.suiviAssiduite}
						<div>
							<h4 class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
								Exigences Qualiopi
							</h4>
							<div class="space-y-1 text-sm">
								{#if formation.publicCible?.length}
									<p><span class="text-muted-foreground">Public cible:</span> {formation.publicCible.join(', ')}</p>
								{/if}
								{#if formation.prerequis?.length}
									<p><span class="text-muted-foreground">Prérequis:</span> {formation.prerequis.join(', ')}</p>
								{/if}
								{#if formation.evaluationMode}
									<p><span class="text-muted-foreground">Évaluation:</span> {formation.evaluationMode}</p>
								{/if}
								{#if formation.suiviAssiduite}
									<p><span class="text-muted-foreground">Suivi assiduité:</span> {formation.suiviAssiduite}</p>
								{/if}
							</div>
						</div>
					{/if}
					<!-- Modules -->
					<div>
						<h4 class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							Modules
						</h4>
						<ul class="space-y-1 text-sm">
							{#each modules as m}
								<li>
									<span class="font-medium">{m.name}</span>
									{#if m.durationHours}
										<span class="text-muted-foreground"> ({m.durationHours}h)</span>
									{/if}
									{#if m.objectifs}
										<p class="ml-4 text-muted-foreground">{m.objectifs}</p>
									{/if}
								</li>
							{/each}
						</ul>
					</div>
					<!-- Brief client -->
					{#if formation.needsAnalysis}
						<div>
							<h4 class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
								Analyse des besoins
							</h4>
							<p class="text-sm text-muted-foreground">{formation.needsAnalysis}</p>
						</div>
					{/if}
				</div>
			</div>
		</Collapsible.Content>
	</Collapsible.Root>

	<!-- Two-Column Layout -->
	<div class="flex min-h-0 flex-1">
		<!-- Left Sidebar: Steps (hidden on mobile, shown on md+) - 300px for full step names -->
		<aside class="hidden w-[300px] shrink-0 flex-col border-r bg-muted/20 md:flex">
			<!-- Step List -->
			<div class="flex-1 overflow-y-auto p-4">
				<h2 class="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					Étapes Qualiopi
				</h2>
				<nav class="space-y-1">
					{#each steps as step (step.key)}
						<button
							type="button"
							class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors
								{effectiveSelectedKey === step.key
								? 'bg-primary/10 text-primary font-medium'
								: 'hover:bg-muted'}
								{step.status === 'done' ? 'text-muted-foreground' : ''}"
							onclick={() => { selectedStepKey = step.key; }}
						>
							<span
								class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs
									{step.status === 'done'
									? 'bg-green-500 text-white'
									: step.status === 'in_progress'
										? 'bg-primary text-primary-foreground'
										: 'border-2 border-muted-foreground/30 text-muted-foreground'}"
							>
								{#if step.status === 'done'}
									<IconCheck class="h-3.5 w-3.5" />
								{:else if step.status === 'in_progress'}
									<IconPlayerPlay class="h-3 w-3" />
								{:else}
									{step.stepNumber}
								{/if}
							</span>
							<span class="min-w-0 flex-1 break-words text-left">{step.label}</span>
						</button>
					{/each}
				</nav>
			</div>

			<!-- Équipe pédagogique (Formateurs) - elevated section -->
			<div class="border-t p-4">
				<h3 class="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					Équipe pédagogique
				</h3>
				<div class="space-y-2">
					{#each modules as m}
						<div class="rounded-lg border p-2">
							<p class="text-xs font-medium">{m.name}</p>
							{#if m.formateurId || (m as { formateurName?: string }).formateurName}
								<p class="text-xs text-muted-foreground">{(m as { formateurName?: string }).formateurName || 'Assigné'}</p>
								<Button.Root variant="link" size="sm" class="h-auto p-0 text-xs" onclick={() => (showFormateurs = true)}>
									Voir
								</Button.Root>
							{:else}
								<p class="text-xs text-amber-600 dark:text-amber-400">Non assigné</p>
								<Button.Root variant="link" size="sm" class="h-auto p-0 text-xs font-medium" onclick={() => (showFormateurs = true)}>
									Trouver un formateur →
								</Button.Root>
							{/if}
						</div>
					{/each}
					<Button.Root
						variant="outline"
						size="sm"
						class="w-full justify-center"
						onclick={() => (showFormateurs = true)}
					>
						<IconUsers class="mr-2 h-4 w-4" />
						Gérer ({formateurs.length})
					</Button.Root>
				</div>
			</div>

			<!-- Progress & Séances -->
			<div class="border-t p-4">
				<div class="mb-3">
					<div class="mb-1.5 flex items-center justify-between text-xs">
						<span class="font-medium">{progress.completed}/{progress.total} étapes</span>
						<span class="text-muted-foreground">
							{Math.round((progress.completed / progress.total) * 100)}%
						</span>
					</div>
					<Progress value={(progress.completed / progress.total) * 100} class="h-1.5" />
				</div>
				<Button.Root
					variant="outline"
					size="sm"
					class="w-full justify-start"
					onclick={() => (showSeances = true)}
				>
					<IconCalendar class="mr-2 h-4 w-4" />
					Séances ({seances.length})
				</Button.Root>
			</div>
		</aside>

		<!-- Main Content Area -->
		<main class="flex min-w-0 flex-1 flex-col overflow-y-auto">
			<div class="mx-auto w-full max-w-3xl p-4 md:p-6">
				<!-- Next Action Hero Card - always visible when there's an action to do -->
				{#if nextActionStep && nextActionStep.status !== 'done'}
					<div
						class="mb-6 rounded-xl border-2 border-primary/30 bg-primary/5 p-6 shadow-sm"
						id="next-action-card"
					>
						<div class="mb-2 flex items-center gap-2">
							<IconTarget class="h-5 w-5 text-primary" />
							<span class="text-sm font-semibold uppercase tracking-wide text-primary">Prochaine action</span>
						</div>
						<h3 class="mb-1 text-lg font-bold">
							Étape {nextActionStep.stepNumber}/10 : {nextActionStep.label}
						</h3>
						<p class="mb-4 text-sm text-muted-foreground">
							{@render stepDescription(nextActionStep.key)}
						</p>
						{#if nextActionStep.key === 'convocation' && hasConvocationBlockers}
							<div class="mb-4 flex items-center gap-2 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
								<IconAlertTriangle class="h-4 w-4 shrink-0" />
								{convocationBlockers.length} apprenant{convocationBlockers.length > 1 ? 's' : ''} sans email
							</div>
						{/if}
						{#if hasUnassignedModules && nextActionStep.key === 'mission_order'}
							<div class="mb-4 flex items-center gap-2 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
								<IconAlertTriangle class="h-4 w-4 shrink-0" />
								{modulesWithoutFormateur.length} module{modulesWithoutFormateur.length > 1 ? 's' : ''} sans formateur
							</div>
						{/if}
						<Button.Root size="lg" onclick={scrollToStepContent}>
							{nextActionStep.primaryButton}
						</Button.Root>
					</div>
				{/if}

				<!-- Unassigned formateurs warning card -->
				{#if hasUnassignedModules}
					<div class="mb-6 rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
						<div class="flex items-start justify-between gap-4">
							<div>
								<p class="font-medium text-amber-800 dark:text-amber-200">
									Formateurs requis
								</p>
								<p class="text-sm text-amber-700 dark:text-amber-300">
									{modulesWithoutFormateur.length} module{modulesWithoutFormateur.length > 1 ? 's' : ''} sans formateur assigné
								</p>
							</div>
							<Button.Root variant="outline" size="sm" onclick={() => (showFormateurs = true)}>
								<IconUsers class="mr-2 h-4 w-4" />
								Assigner
							</Button.Root>
						</div>
					</div>
				{/if}

				{#if currentStep}
					<!-- Step Header -->
					<div class="mb-6">
						<div class="mb-2 flex items-center gap-2">
							{#if currentStep.status === 'done'}
								<Badge variant="default" class="bg-green-500">
									<IconCheck class="mr-1 h-3 w-3" />
									{getStepStatusLabel(currentStep.status)}
								</Badge>
							{:else if currentStep.status === 'in_progress'}
								<Badge variant="secondary">
									<IconPlayerPlay class="mr-1 h-3 w-3" />
									{getStepStatusLabel(currentStep.status)}
								</Badge>
							{:else}
								<Badge variant="outline">
									<IconCircle class="mr-1 h-3 w-3" />
									{getStepStatusLabel(currentStep.status)}
								</Badge>
							{/if}
							<span class="text-sm text-muted-foreground">
								Étape {currentStep.stepNumber} sur 10
							</span>
						</div>
						<h2 class="text-2xl font-bold">{currentStep.label}</h2>
					</div>

					<!-- Step Content based on status -->
					{#if currentStep.status === 'done'}
						{@render completedStepContent(currentStep)}
					{:else if currentStep.status === 'in_progress'}
						{@render currentStepContent(currentStep)}
					{:else}
						{@render futureStepContent(currentStep)}
					{/if}
				{:else}
					<div class="py-12 text-center text-muted-foreground">
						Sélectionnez une étape pour commencer
					</div>
				{/if}
			</div>
		</main>
	</div>

	<!-- Mobile: Bottom Step Bar -->
	<div class="border-t bg-background p-2 md:hidden">
		<Sheet.Root bind:open={mobileStepsOpen}>
			<Sheet.Trigger
				class="flex w-full items-center justify-between rounded-md border bg-background px-4 py-2 text-left hover:bg-accent"
			>
				<span class="flex items-center gap-2">
					<span class="text-sm font-medium">
						Étape {currentStep?.stepNumber || '—'}/10
					</span>
					<span class="text-sm text-muted-foreground">
						{currentStep?.label || 'Sélectionner'}
					</span>
				</span>
				<span class="flex items-center gap-2">
					<span class="text-xs text-muted-foreground">
						{Math.round((progress.completed / progress.total) * 100)}%
					</span>
					<IconChevronUp class="h-4 w-4" />
				</span>
			</Sheet.Trigger>
			<Sheet.Content side="bottom" class="h-[70vh]">
				<Sheet.Header>
					<Sheet.Title>Étapes Qualiopi</Sheet.Title>
					<Sheet.Description>
						{progress.completed}/{progress.total} étapes complétées
					</Sheet.Description>
				</Sheet.Header>
				<div class="mt-4 space-y-1 overflow-y-auto">
					{#each steps as step (step.key)}
						<button
							type="button"
							class="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors
								{effectiveSelectedKey === step.key
								? 'bg-primary/10 text-primary font-medium'
								: 'hover:bg-muted'}"
							onclick={() => {
								selectedStepKey = step.key;
								mobileStepsOpen = false;
							}}
						>
							<span
								class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm
									{step.status === 'done'
									? 'bg-green-500 text-white'
									: step.status === 'in_progress'
										? 'bg-primary text-primary-foreground'
										: 'border-2 border-muted-foreground/30 text-muted-foreground'}"
							>
								{#if step.status === 'done'}
									<IconCheck class="h-4 w-4" />
								{:else if step.status === 'in_progress'}
									<IconPlayerPlay class="h-3.5 w-3.5" />
								{:else}
									{step.stepNumber}
								{/if}
							</span>
							<span class="flex-1">{step.label}</span>
							{#if step.status === 'in_progress'}
								<Badge variant="secondary">En cours</Badge>
							{/if}
						</button>
					{/each}
				</div>
				<!-- Quick Access in Mobile Sheet -->
				<div class="mt-4 flex gap-2 border-t pt-4">
					<Button.Root
						variant="outline"
						size="sm"
						class="flex-1"
						onclick={() => {
							mobileStepsOpen = false;
							showFormateurs = true;
						}}
					>
						<IconUsers class="mr-2 h-4 w-4" />
						Formateurs ({formateurs.length})
					</Button.Root>
					<Button.Root
						variant="outline"
						size="sm"
						class="flex-1"
						onclick={() => {
							mobileStepsOpen = false;
							showSeances = true;
						}}
					>
						<IconCalendar class="mr-2 h-4 w-4" />
						Séances ({seances.length})
					</Button.Root>
				</div>
			</Sheet.Content>
		</Sheet.Root>
	</div>
</div>
</Tooltip.Provider>

<!-- ========== STEP CONTENT SNIPPETS ========== -->

{#snippet completedStepContent(step: typeof currentStep)}
	<!-- Review mode for completed steps -->
	<div class="rounded-lg border bg-green-50/50 p-6 dark:bg-green-950/20">
		<div class="mb-4 flex items-start gap-3">
			<div class="rounded-full bg-green-500 p-2 text-white">
				<IconCheck class="h-5 w-5" />
			</div>
			<div>
				<p class="font-medium text-green-800 dark:text-green-200">Étape complétée</p>
				<p class="text-sm text-green-700 dark:text-green-300">
					Validée le 15 janvier 2026 par Marie D.
				</p>
			</div>
		</div>

		<!-- Step-specific completed content -->
		{@render stepSpecificContent(step?.key)}

		<div class="mt-6 flex gap-2">
			<Button.Root variant="outline" size="sm">Voir les documents</Button.Root>
			<Button.Root variant="ghost" size="sm">Régénérer</Button.Root>
		</div>
	</div>
{/snippet}

{#snippet currentStepContent(step: typeof currentStep)}
	<!-- Action mode for current step -->
	<div class="space-y-6">
		<!-- Primary CTA -->
		<div class="rounded-lg border-2 border-primary/20 bg-primary/5 p-6">
			<p class="mb-4 text-muted-foreground">
				{@render stepDescription(step?.key)}
			</p>
			<Button.Root size="lg" class="w-full sm:w-auto">
				{step?.primaryButton || 'Valider l\'étape'}
			</Button.Root>
		</div>

		<!-- Step-specific content -->
		{@render stepSpecificContent(step?.key)}
	</div>
{/snippet}

{#snippet futureStepContent(step: typeof currentStep)}
	<!-- Preview mode for future steps -->
	<div class="rounded-lg border border-dashed bg-muted/30 p-6">
		<div class="mb-4 flex items-start gap-3">
			<div class="rounded-full bg-muted p-2 text-muted-foreground">
				<IconInfoCircle class="h-5 w-5" />
			</div>
			<div>
				<p class="font-medium">Étape à venir</p>
				<p class="text-sm text-muted-foreground">
					Cette étape sera disponible après avoir complété les précédentes.
				</p>
			</div>
		</div>

		<div class="mb-4">
			<h4 class="mb-2 text-sm font-medium">Ce dont vous aurez besoin :</h4>
			<ul class="list-inside list-disc space-y-1 text-sm text-muted-foreground">
				{@render stepPrerequisites(step?.key)}
			</ul>
		</div>

		<Button.Root variant="outline" size="sm">
			Commencer quand même
		</Button.Root>
	</div>
{/snippet}

{#snippet stepDescription(stepKey: string | undefined)}
	{#if stepKey === 'info_verification'}
		Vérifiez les informations de la formation et la liste des apprenants inscrits.
	{:else if stepKey === 'convention_program'}
		Générez la convention de formation et renseignez le programme.
	{:else if stepKey === 'needs_analysis'}
		Envoyez le questionnaire d'analyse des besoins aux apprenants.
	{:else if stepKey === 'convocation'}
		Envoyez les convocations aux {learners.length} apprenants inscrits.
	{:else if stepKey === 'mission_order'}
		Générez l'ordre de mission pour le formateur.
	{:else if stepKey === 'end_certificate'}
		Générez les attestations de fin de formation pour les apprenants.
	{:else if stepKey === 'satisfaction_questionnaires'}
		Programmez les questionnaires de satisfaction (à chaud et à froid).
	{:else if stepKey === 'instructor_documents'}
		Collectez et validez les documents administratifs du formateur.
	{:else if stepKey === 'billing'}
		Gérez la facturation client et le paiement formateur.
	{:else if stepKey === 'complete_file'}
		Finalisez le dossier Qualiopi avec tous les documents requis.
	{:else}
		Complétez cette étape pour avancer dans le processus.
	{/if}
{/snippet}

{#snippet stepPrerequisites(stepKey: string | undefined)}
	{#if stepKey === 'mission_order'}
		<li>Liste des apprenants convoqués</li>
		<li>Formateur assigné à la formation</li>
	{:else if stepKey === 'end_certificate'}
		<li>Formation terminée</li>
		<li>Feuilles d'émargement signées</li>
	{:else if stepKey === 'billing'}
		<li>Attestations générées</li>
		<li>Documents formateur validés</li>
	{:else if stepKey === 'complete_file'}
		<li>Toutes les étapes précédentes complétées</li>
		<li>Documents signés par toutes les parties</li>
	{:else}
		<li>Étapes précédentes complétées</li>
	{/if}
{/snippet}

{#snippet stepSpecificContent(stepKey: string | undefined)}
	{#if stepKey === 'info_verification'}
		<div class="space-y-4">
			<h4 class="font-medium">Apprenants inscrits ({learners.length})</h4>
			<div class="space-y-2">
				{#each learners as learner}
					<div class="flex items-center justify-between rounded-lg border p-3">
						<div>
							<p class="font-medium">{learner.firstName} {learner.lastName}</p>
							<p class="text-sm text-muted-foreground">{learner.email}</p>
						</div>
						<IconCheck class="h-5 w-5 text-green-500" />
					</div>
				{/each}
			</div>
			<div class="flex gap-2">
				<Button.Root variant="outline" size="sm">Ajouter un apprenant</Button.Root>
				<Button.Root variant="outline" size="sm">Importer CSV</Button.Root>
			</div>
		</div>
	{:else if stepKey === 'convention_program'}
		<div class="grid gap-4 sm:grid-cols-2">
			<div class="rounded-lg border p-4">
				<h4 class="mb-2 font-medium">Convention</h4>
				<p class="mb-3 text-sm text-muted-foreground">Document contractuel avec le client</p>
				<div class="flex gap-2">
					<Button.Root size="sm">Générer</Button.Root>
					<Button.Root variant="outline" size="sm">Voir</Button.Root>
				</div>
			</div>
			<div class="rounded-lg border p-4">
				<h4 class="mb-2 font-medium">Programme</h4>
				<p class="mb-3 text-sm text-muted-foreground">Contenu détaillé de la formation</p>
				<div class="flex gap-2">
					<Button.Root variant="outline" size="sm">Renseigner</Button.Root>
					<Button.Root variant="outline" size="sm">Voir</Button.Root>
				</div>
			</div>
		</div>
	{:else if stepKey === 'convocation'}
		<div class="space-y-4">
			<h4 class="font-medium">Apprenants à convoquer ({learners.length})</h4>
			<div class="space-y-2">
				{#each learners as learner}
					{@const hasEmail = !!learner.email?.trim()}
					<div class="flex items-center justify-between rounded-lg border p-3">
						<div class="flex items-center gap-3">
							{#if hasEmail}
								<IconCheck class="h-5 w-5 shrink-0 text-green-500" />
							{:else}
								<IconAlertTriangle class="h-5 w-5 shrink-0 text-amber-500" />
							{/if}
							<div>
								<p class="font-medium">{learner.firstName} {learner.lastName}</p>
								<p class="text-sm text-muted-foreground">{hasEmail ? learner.email : 'Email manquant'}</p>
							</div>
						</div>
						{#if !hasEmail}
							<Button.Root variant="outline" size="sm">Ajouter email</Button.Root>
						{/if}
					</div>
				{/each}
			</div>
			<Button.Root variant="outline" size="sm">Programmer l'envoi</Button.Root>
		</div>
	{:else if stepKey === 'instructor_documents'}
		<div class="space-y-3">
			{#each ['Fiche d\'entretien', 'CV', 'Diplôme', 'Attestation URSSAF', 'Attestation NDA', 'Contrat signé'] as doc, i}
				<div class="flex items-center justify-between rounded-lg border p-3">
					<div class="flex items-center gap-3">
						{#if i < 2}
							<IconCheck class="h-5 w-5 text-green-500" />
						{:else}
							<IconCircle class="h-5 w-5 text-muted-foreground" />
						{/if}
						<span>{doc}</span>
					</div>
					{#if i >= 2}
						<Button.Root variant="outline" size="sm">Téléverser</Button.Root>
					{:else}
						<Button.Root variant="ghost" size="sm">Voir</Button.Root>
					{/if}
				</div>
			{/each}
		</div>
	{:else if stepKey === 'billing'}
		<div class="grid gap-4 sm:grid-cols-2">
			<div class="rounded-lg border p-4">
				<h4 class="mb-3 font-medium">Facture entreprise</h4>
				<div class="space-y-2 text-sm">
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
			<div class="rounded-lg border p-4">
				<h4 class="mb-3 font-medium">Facture formateur</h4>
				<div class="space-y-2 text-sm">
					<div class="flex justify-between">
						<span class="text-muted-foreground">Virement</span>
						<Badge variant="outline">En attente</Badge>
					</div>
				</div>
			</div>
		</div>
	{:else if stepKey === 'complete_file'}
		<div class="rounded-lg bg-muted/50 p-4">
			<h4 class="mb-3 font-medium">Récapitulatif du dossier</h4>
			<div class="grid gap-3 text-sm sm:grid-cols-2">
				<div class="flex justify-between">
					<span class="text-muted-foreground">Documents générés</span>
					<span class="font-medium">8/10</span>
				</div>
				<div class="flex justify-between">
					<span class="text-muted-foreground">Signatures</span>
					<span class="font-medium">4/6</span>
				</div>
				<div class="flex justify-between">
					<span class="text-muted-foreground">Questionnaires</span>
					<span class="font-medium">0/8</span>
				</div>
				<div class="flex justify-between">
					<span class="text-muted-foreground">Paiements</span>
					<span class="font-medium">En attente</span>
				</div>
			</div>
		</div>
	{:else}
		<p class="text-sm text-muted-foreground">
			Contenu détaillé de l'étape à implémenter.
		</p>
	{/if}
{/snippet}

<!-- ========== MODALS & SHEETS ========== -->

<!-- Edit Formation Modal -->
<Dialog.Root bind:open={showModifier}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Modifier la formation</Dialog.Title>
			<Dialog.Description>Modifiez les informations de la formation</Dialog.Description>
		</Dialog.Header>
		<div class="py-4">
			<p class="text-sm text-muted-foreground">Formulaire à implémenter en Phase 3.</p>
		</div>
		<Dialog.Footer>
			<Button.Root variant="outline" onclick={() => (showModifier = false)}>Annuler</Button.Root>
			<Button.Root onclick={() => (showModifier = false)}>Enregistrer</Button.Root>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Formateurs Sheet (slides from right) -->
<Sheet.Root bind:open={showFormateurs}>
	<Sheet.Content side="right" class="w-full sm:max-w-md">
		<Sheet.Header>
			<Sheet.Title>Formateurs ({formateurs.length})</Sheet.Title>
			<Sheet.Description>Gérez les formateurs assignés aux modules de cette formation</Sheet.Description>
		</Sheet.Header>
		<div class="mt-6 space-y-6">
			<div>
				<h4 class="mb-3 text-sm font-medium">Par module</h4>
				<div class="space-y-2">
					{#each modules as module}
						<div class="rounded-lg border p-3">
							<p class="font-medium">{module.name}</p>
							{#if module.formateurId || (module as { formateurName?: string }).formateurName}
								<p class="text-sm text-muted-foreground">{(module as { formateurName?: string }).formateurName || 'Assigné'}</p>
								<Button.Root variant="link" size="sm" class="mt-1 h-auto p-0">
									Modifier
								</Button.Root>
							{:else}
								<p class="text-sm text-amber-600 dark:text-amber-400">Aucun formateur assigné</p>
								<Button.Root variant="link" size="sm" class="mt-1 h-auto p-0 font-medium">
									Trouver sur le Marketplace →
								</Button.Root>
							{/if}
						</div>
					{/each}
				</div>
			</div>
			{#if formateurs.length > 0}
				<div>
					<h4 class="mb-3 text-sm font-medium">Formateurs de votre base</h4>
					<div class="space-y-2">
						{#each formateurs as formateur}
							<div class="rounded-lg border p-3">
								<p class="font-medium">{formateur.name}</p>
								{#if formateur.specialite}
									<p class="text-xs text-muted-foreground">{(formateur as { specialite?: string }).specialite}</p>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- Séances Sheet (slides from right) -->
<Sheet.Root bind:open={showSeances}>
	<Sheet.Content side="right" class="w-full sm:max-w-lg">
		<Sheet.Header>
			<Sheet.Title>Séances ({seances.length})</Sheet.Title>
			<Sheet.Description>Planning des sessions de formation</Sheet.Description>
		</Sheet.Header>
		<div class="mt-6">
			<!-- View toggle -->
			<div class="mb-4 flex gap-2">
				<Button.Root
					variant={seancesViewMode === 'list' ? 'secondary' : 'ghost'}
					size="sm"
					onclick={() => (seancesViewMode = 'list')}
				>
					Liste
				</Button.Root>
				<Button.Root
					variant={seancesViewMode === 'calendar' ? 'secondary' : 'ghost'}
					size="sm"
					onclick={() => (seancesViewMode = 'calendar')}
				>
					Calendrier
				</Button.Root>
			</div>
			{#if seancesViewMode === 'list'}
				<div class="space-y-3">
					{#each seances as seance}
						<div class="rounded-lg border p-4">
							<div class="mb-2 flex items-start justify-between gap-2">
								<div class="flex items-center gap-2">
									<IconCalendar class="h-4 w-4 shrink-0 text-muted-foreground" />
									<span class="font-medium">{seance.date}</span>
								</div>
								{#if seance.emargementTotal != null}
									<Badge variant={seance.emargementSigned === seance.emargementTotal ? 'default' : 'outline'} class="text-xs">
										{seance.emargementSigned}/{seance.emargementTotal} émargé{seance.emargementSigned === seance.emargementTotal ? 's' : ''}
									</Badge>
								{/if}
							</div>
							<p class="text-sm text-muted-foreground">{seance.startTime} → {seance.endTime}</p>
							{#if seance.moduleName}
								<p class="mt-1 text-sm font-medium">{seance.moduleName}</p>
							{/if}
							{#if seance.formateurName}
								<p class="text-xs text-muted-foreground">Formateur : {seance.formateurName}</p>
							{:else}
								<p class="text-xs text-amber-600 dark:text-amber-400">Formateur non assigné</p>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<div class="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
					<IconCalendar class="mx-auto mb-2 h-10 w-10 opacity-50" />
					<p>Vue calendrier à venir</p>
				</div>
			{/if}
			<Button.Root variant="outline" class="mt-4 w-full">
				Ajouter une séance
			</Button.Root>
		</div>
	</Sheet.Content>
</Sheet.Root>
