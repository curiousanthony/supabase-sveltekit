<script lang="ts">
	import type { PageProps } from './$types';
	import HealthBanner from '$lib/components/formations/pulse/health-banner.svelte';
	import LifecycleIndicator from '$lib/components/formations/pulse/lifecycle-indicator.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { cn } from '$lib/utils';
	import {
		getQuestTemplate,
		getNextQuest,
		getQuestProgress,
		PHASE_LABELS,
		type QuestPhase
	} from '$lib/formation-quests';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import CheckCircle from '@lucide/svelte/icons/check-circle';
	import Clock from '@lucide/svelte/icons/clock';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Users from '@lucide/svelte/icons/users';
	import Building2 from '@lucide/svelte/icons/building-2';
	import Layout from '@lucide/svelte/icons/layout';
	import Upload from '@lucide/svelte/icons/upload';
	import Send from '@lucide/svelte/icons/send';
	import Hourglass from '@lucide/svelte/icons/hourglass';

	let { data }: PageProps = $props();

	const formation = $derived(data?.formation);
	const formationId = $derived(formation?.id ?? '');
	const actions = $derived(formation?.actions ?? []);

	type ActionItem = (typeof actions)[number];

	const questProgress = $derived(getQuestProgress(actions));
	const nextQuest = $derived(getNextQuest(actions));
	const questTemplate = $derived(
		nextQuest?.questKey ? getQuestTemplate(nextQuest.questKey) : undefined
	);
	const allComplete = $derived(
		actions.length > 0 && actions.every((a) => a.status === 'Terminé')
	);

	const today = new Date().toISOString().slice(0, 10);
	const nowIso = new Date().toISOString();

	const overdueActions = $derived(
		actions.filter(
			(a) => a.dueDate != null && a.dueDate < today && a.status !== 'Terminé'
		)
	);

	const activeActions = $derived(
		actions.filter((a) => a.status === 'En cours')
	);

	const readyActions = $derived.by(() => {
		if (!nextQuest) return [];
		const nextKey = nextQuest.questKey;
		return actions.filter((a) => {
			if (a.status !== 'Pas commencé') return false;
			if (nextKey && a.questKey === nextKey) return true;
			const tmpl = a.questKey ? getQuestTemplate(a.questKey) : null;
			if (!tmpl || tmpl.dependencies.length === 0) return true;
			return tmpl.dependencies.every((depKey: string) =>
				actions.some((d) => d.questKey === depKey && d.status === 'Terminé')
			);
		});
	});

	const maintenantActions = $derived.by(() => {
		const items: ActionItem[] = [];
		const seen = new Set<string>();
		const add = (a: ActionItem) => {
			if (!seen.has(a.id)) { seen.add(a.id); items.push(a); }
		};
		for (const a of overdueActions) add(a);
		for (const a of activeActions) add(a);
		for (const a of readyActions) add(a);
		return items.slice(0, 3);
	});

	const blockedActions = $derived(
		actions.filter(
			(a) =>
				a.status === 'Pas commencé' &&
				a.blockedByActionId != null &&
				actions.some(
					(b) => b.id === a.blockedByActionId && b.status !== 'Terminé'
				)
		)
	);

	const upcomingActions = $derived.by(() => {
		const mainIds = new Set(maintenantActions.map((a) => a.id));
		const blockedIds = new Set(blockedActions.map((a) => a.id));
		return actions
			.filter(
				(a) =>
					a.status !== 'Terminé' &&
					!mainIds.has(a.id) &&
					!blockedIds.has(a.id)
			)
			.slice(0, 4);
	});

	const completedActions = $derived(
		actions.filter((a) => a.status === 'Terminé')
	);

	type BannerState = 'on-track' | 'action-required' | 'overdue' | 'blocked' | 'complete';

	const bannerState = $derived.by<BannerState>(() => {
		if (allComplete) return 'complete';
		if (overdueActions.length > 0) return 'overdue';
		if (maintenantActions.length > 0) return 'action-required';
		if (blockedActions.length > 0) return 'blocked';
		return 'on-track';
	});

	const bannerMessage = $derived.by(() => {
		if (bannerState === 'complete') return 'Formation terminée — Dossier prêt pour l\'audit.';
		if (bannerState === 'overdue') {
			const count = overdueActions.length;
			if (count === 1) return `1 action en retard — ${getActionTitle(overdueActions[0])}`;
			return `${count} actions en retard — la plus urgente : ${getActionTitle(overdueActions[0])}`;
		}
		if (bannerState === 'action-required') {
			if (maintenantActions.length === 1) return `1 action à traiter — ${getActionTitle(maintenantActions[0])}`;
			return `${maintenantActions.length} actions à traiter — prochaine : ${getActionTitle(maintenantActions[0])}`;
		}
		if (bannerState === 'blocked') return `En attente — ${blockedActions.length} action(s) bloquée(s) par des prérequis.`;

		const seancesList = formation?.seances ?? [];
		const upcoming = seancesList.filter((s) => s.startAt >= nowIso);
		if (upcoming.length > 0) {
			return `Tout est à jour. Prochaine échéance : Séance le ${formatDate(upcoming[0].startAt)}.`;
		}
		return 'Tout est à jour. Aucune action requise.';
	});

	const bannerCtaLabel = $derived.by(() => {
		if (bannerState === 'overdue') return 'Traiter maintenant';
		if (bannerState === 'action-required') return 'Traiter';
		return undefined;
	});

	// Participants
	const apprenants = $derived(
		(formation?.formationApprenants ?? []).map((fa) => ({
			id: fa.contact.id,
			fullName:
				[fa.contact.firstName, fa.contact.lastName].filter(Boolean).join(' ') || 'Sans nom'
		}))
	);

	const formateurs = $derived(
		(formation?.formationFormateurs ?? []).map((ff) => ({
			id: ff.formateur?.user?.id ?? ff.formateur?.id ?? '',
			fullName:
				[ff.formateur?.user?.firstName, ff.formateur?.user?.lastName]
					.filter(Boolean)
					.join(' ') || 'Formateur'
		}))
	);

	// Finances
	const montant = $derived(
		formation?.montantAccorde ? Number(formation.montantAccorde) : null
	);

	const totalFormateurCost = $derived.by(() => {
		const ffs = formation?.formationFormateurs ?? [];
		if (ffs.length === 0) return null;
		let total = 0;
		let hasAny = false;
		for (const ff of ffs) {
			const tjm = ff.tjm ? Number(ff.tjm) : 0;
			const days = ff.numberOfDays ? Number(ff.numberOfDays) : 0;
			const deplacement = ff.deplacementCost ? Number(ff.deplacementCost) : 0;
			const hebergement = ff.hebergementCost ? Number(ff.hebergementCost) : 0;
			const cost = tjm * days + deplacement + hebergement;
			if (cost > 0) hasAny = true;
			total += cost;
		}
		return hasAny ? total : null;
	});

	const marge = $derived(
		montant != null && totalFormateurCost != null ? montant - totalFormateurCost : null
	);

	const margePercent = $derived(
		montant != null && montant > 0 && marge != null
			? Math.round((marge / montant) * 100)
			: null
	);

	// Upcoming sessions
	const seances = $derived(formation?.seances ?? []);
	const upcomingSeances = $derived(
		seances.filter((s) => s.startAt >= nowIso).slice(0, 2)
	);

	let completedExpanded = $state(false);

	function getActionTitle(action: ActionItem): string {
		const tmpl = action.questKey ? getQuestTemplate(action.questKey) : null;
		return action.title ?? tmpl?.title ?? 'Action';
	}

	function getPhaseLabel(phase: QuestPhase | null | undefined): string {
		if (!phase) return 'Conception';
		return PHASE_LABELS[phase] ?? phase;
	}

	function formatDate(isoDate: string) {
		return new Date(isoDate).toLocaleDateString('fr-FR', {
			day: 'numeric',
			month: 'short'
		});
	}

	function formatTime(isoDate: string) {
		return new Date(isoDate).toLocaleTimeString('fr-FR', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatDateRange() {
		if (!formation?.dateDebut && !formation?.dateFin) return null;
		if (formation.dateDebut && formation.dateFin) {
			return `${new Date(formation.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – ${new Date(formation.dateFin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
		}
		if (formation.dateDebut) {
			return `À partir du ${new Date(formation.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
		}
		return null;
	}

	function getInitials(name: string) {
		return name
			.split(' ')
			.filter(Boolean)
			.map((p) => p[0])
			.join('')
			.slice(0, 2)
			.toUpperCase();
	}

	function isOverdue(action: ActionItem): boolean {
		return action.dueDate != null && action.dueDate < today && action.status !== 'Terminé';
	}

	function scrollToMaintenant() {
		document.getElementById('maintenant')?.scrollIntoView({ behavior: 'smooth' });
	}

	function hasDocSubtask(action: ActionItem): boolean {
		return (action.subActions ?? []).some((sa: { documentRequired: boolean | null }) => sa.documentRequired);
	}
</script>

<div class="flex flex-col gap-6">
	<!-- Health Banner -->
	<HealthBanner
		state={bannerState}
		message={bannerMessage}
		ctaLabel={bannerCtaLabel}
		onCtaClick={scrollToMaintenant}
	/>

	<!-- Lifecycle Indicator -->
	<LifecycleIndicator
		phases={questProgress.phases}
		overallCompleted={questProgress.overall.completed}
		overallTotal={questProgress.overall.total}
	/>

	<!-- MAINTENANT — What needs doing NOW -->
	{#if !allComplete}
		{#if maintenantActions.length > 0}
			<section id="maintenant" class="flex flex-col gap-3">
				<h2 class="text-sm font-semibold text-foreground">Maintenant</h2>
				{#each maintenantActions as action (action.id)}
					{@const overdue = isOverdue(action)}
					{@const template = action.questKey ? getQuestTemplate(action.questKey) : null}
					{@const hasDocs = hasDocSubtask(action)}
					<Card.Root
						class={cn(
							'transition-colors',
							overdue
								? 'border-red-200 bg-red-50/30 dark:border-red-900 dark:bg-red-950/20'
								: 'border-border'
						)}
					>
						<Card.Content class="py-0">
							<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
								<div class="min-w-0 flex-1 space-y-1.5">
									<div class="flex flex-wrap items-center gap-2">
										<Badge variant="secondary" class="text-xs">
											{getPhaseLabel(action.phase)}
										</Badge>
										{#if overdue && action.dueDate}
											<span class="text-xs font-medium text-red-600 dark:text-red-400">
												En retard depuis le {formatDate(action.dueDate)}
											</span>
										{:else if action.dueDate}
											<span class="text-xs text-muted-foreground">
												Échéance : {formatDate(action.dueDate)}
											</span>
										{/if}
									</div>
									<h3 class="text-sm font-semibold text-foreground">
										{getActionTitle(action)}
									</h3>
									{#if template?.description}
										<p class="text-sm text-muted-foreground line-clamp-2">
											{template.description}
										</p>
									{/if}
								</div>
								<div class="flex shrink-0 items-center gap-2">
									{#if hasDocs}
										<Button variant="outline" size="sm" class="gap-1.5 cursor-pointer">
											<Upload class="size-3.5" />
											Téléverser
										</Button>
									{/if}
									<Button
										size="sm"
										class="gap-1.5 cursor-pointer"
										href="/formations/{formationId}/actions{action.questKey ? `?quest=${action.questKey}` : ''}"
									>
										{#if hasDocs}
											Générer
											<Send class="size-3.5" />
										{:else}
											Traiter
											<ChevronRight class="size-3.5" />
										{/if}
									</Button>
								</div>
							</div>
						</Card.Content>
					</Card.Root>
				{/each}
			</section>
		{/if}
	{:else}
		<Card.Root class="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30">
			<Card.Content class="py-0">
				<div class="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
					<CheckCircle class="size-10 shrink-0 text-green-600 dark:text-green-400" aria-hidden="true" />
					<div>
						<h2 class="text-base font-semibold text-foreground">Toutes les actions sont terminées</h2>
						<p class="text-sm text-muted-foreground">
							La formation est à jour. Le dossier est prêt pour l'audit.
						</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- PROCHAINEMENT — What's coming -->
	{#if upcomingActions.length > 0}
		<section class="flex flex-col gap-2">
			<h2 class="text-sm font-semibold text-foreground">Prochainement</h2>
			<div class="divide-y divide-border rounded-lg border bg-card">
				{#each upcomingActions as action (action.id)}
					<div class="flex items-center justify-between px-4 py-3">
						<div class="flex items-center gap-2 min-w-0">
							<Clock class="size-3.5 shrink-0 text-muted-foreground" />
							<span class="truncate text-sm text-foreground">{getActionTitle(action)}</span>
						</div>
						{#if action.dueDate}
							<span class="shrink-0 text-xs text-muted-foreground">
								{formatDate(action.dueDate)}
							</span>
						{:else}
							<Badge variant="outline" class="text-xs shrink-0">{getPhaseLabel(action.phase)}</Badge>
						{/if}
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<!-- EN ATTENTE — Blocked items -->
	{#if blockedActions.length > 0}
		<section class="flex flex-col gap-2">
			<h2 class="text-sm font-semibold text-foreground">En attente</h2>
			<div class="divide-y divide-border rounded-lg border bg-muted/30">
				{#each blockedActions.slice(0, 3) as action (action.id)}
					<div class="flex items-start gap-3 px-4 py-3">
						<Hourglass class="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm text-foreground">{getActionTitle(action)}</p>
							{#if action.blockedByActionId}
								{@const blocker = actions.find((a) => a.id === action.blockedByActionId)}
								{#if blocker}
									<p class="text-xs text-muted-foreground">
										Bloqué par : {getActionTitle(blocker)}
									</p>
								{/if}
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Context Cards — Formation · Participants · Finances -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<!-- Formation summary -->
		<Card.Root>
			<Card.Content class="py-0 space-y-2">
				<h3 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Formation</h3>
				<div class="space-y-1.5 text-sm">
					{#if formation?.modalite}
						<div class="flex items-center gap-2">
							<Layout class="size-3.5 shrink-0 text-muted-foreground" />
							<span>{formation.modalite}</span>
						</div>
					{/if}
					{#if formation?.duree}
						<div class="flex items-center gap-2">
							<Clock class="size-3.5 shrink-0 text-muted-foreground" />
							<span>{formation.duree}h</span>
						</div>
					{/if}
					{#if formatDateRange()}
						<div class="flex items-center gap-2">
							<Calendar class="size-3.5 shrink-0 text-muted-foreground" />
							<span>{formatDateRange()}</span>
						</div>
					{/if}
					{#if formation?.location}
						<div class="flex items-center gap-2">
							<MapPin class="size-3.5 shrink-0 text-muted-foreground" />
							<span>{formation.location}</span>
						</div>
					{:else}
						<div class="flex items-center gap-2">
							<MapPin class="size-3.5 shrink-0 text-muted-foreground/50" />
							<span class="text-muted-foreground/60 italic">Lieu non renseigné</span>
						</div>
					{/if}
					{#if formation?.client}
						<div class="flex items-center gap-2">
							<Building2 class="size-3.5 shrink-0 text-muted-foreground" />
							<span>{formation.client.legalName}</span>
						</div>
					{/if}
				</div>
				<a
					href="/formations/{formationId}/fiche"
					class="inline-flex items-center gap-1 text-xs text-primary hover:underline underline-offset-2"
				>
					Voir la fiche
					<ChevronRight class="size-3" />
				</a>
			</Card.Content>
		</Card.Root>

		<!-- Participants -->
		<Card.Root>
			<Card.Content class="py-0 space-y-2">
				<h3 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Participants</h3>
				<div class="space-y-2">
					{#if apprenants.length > 0}
						<div class="flex items-center gap-2">
							<Users class="size-3.5 shrink-0 text-muted-foreground" />
							<span class="text-sm">{apprenants.length} apprenant{apprenants.length > 1 ? 's' : ''}</span>
						</div>
						<div class="flex -space-x-1.5">
							{#each apprenants.slice(0, 5) as learner (learner.id)}
								<Avatar.Root class="size-6 border-2 border-background">
									<Avatar.Fallback class="text-[10px]">{getInitials(learner.fullName)}</Avatar.Fallback>
								</Avatar.Root>
							{/each}
							{#if apprenants.length > 5}
								<div class="flex size-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium">
									+{apprenants.length - 5}
								</div>
							{/if}
						</div>
					{:else}
						<p class="text-sm text-muted-foreground/60 italic">Aucun apprenant inscrit</p>
					{/if}
					{#if formateurs.length > 0}
						<div class="flex items-center gap-2">
							<Users class="size-3.5 shrink-0 text-muted-foreground" />
							<span class="text-sm">{formateurs.length} formateur{formateurs.length > 1 ? 's' : ''}</span>
						</div>
					{:else}
						<p class="text-sm text-muted-foreground/60 italic">Aucun formateur assigné</p>
					{/if}
				</div>
				<a
					href="/formations/{formationId}/apprenants"
					class="inline-flex items-center gap-1 text-xs text-primary hover:underline underline-offset-2"
				>
					Gérer
					<ChevronRight class="size-3" />
				</a>
			</Card.Content>
		</Card.Root>

		<!-- Finances -->
		<Card.Root>
			<Card.Content class="py-0 space-y-2">
				<h3 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Finances</h3>
				<div class="space-y-1.5 text-sm">
					<div>
						<span class="text-lg font-semibold tabular-nums">
							{montant != null ? montant.toLocaleString('fr-FR') + ' €' : '—'}
						</span>
						{#if montant != null}
							{#if formation?.financementAccorde}
								<Badge variant="default" class="ml-2 text-xs">Accordé</Badge>
							{:else}
								<Badge variant="secondary" class="ml-2 text-xs">En attente</Badge>
							{/if}
						{/if}
					</div>
					{#if marge != null}
						<p class="text-xs text-muted-foreground">
							Marge :
							<span
								class={cn(
									'font-medium',
									marge > 0 ? 'text-green-600' : marge < 0 ? 'text-red-600' : ''
								)}
							>
								{marge.toLocaleString('fr-FR')} €
								{#if margePercent != null}({margePercent} %){/if}
							</span>
						</p>
					{/if}
				</div>
				<a
					href="/formations/{formationId}/finances"
					class="inline-flex items-center gap-1 text-xs text-primary hover:underline underline-offset-2"
				>
					Détail
					<ChevronRight class="size-3" />
				</a>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Upcoming Sessions -->
	{#if upcomingSeances.length > 0}
		<section class="flex flex-col gap-2">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-semibold text-foreground">Prochaines séances</h2>
				<a
					href="/formations/{formationId}/seances"
					class="text-xs text-primary hover:underline underline-offset-2"
				>
					Voir toutes les séances
				</a>
			</div>
			<div class="divide-y divide-border rounded-lg border bg-card">
				{#each upcomingSeances as seance (seance.id)}
					<div class="flex items-center justify-between px-4 py-3">
						<div class="flex items-center gap-3 min-w-0">
							<div class="flex flex-col items-center">
								<span class="text-xs font-semibold text-foreground">{formatDate(seance.startAt)}</span>
								<span class="text-[10px] text-muted-foreground">{formatTime(seance.startAt)}</span>
							</div>
							<div class="min-w-0">
								{#if seance.module}
									<p class="truncate text-sm font-medium text-foreground">{seance.module.name}</p>
								{/if}
								{#if seance.formateur?.user}
									<p class="text-xs text-muted-foreground">
										{[seance.formateur.user.firstName, seance.formateur.user.lastName]
											.filter(Boolean)
											.join(' ')}
									</p>
								{/if}
							</div>
						</div>
						{#if (seance.emargements?.length ?? 0) > 0}
							<span class="shrink-0 text-xs text-muted-foreground">
								Émargement : {seance.emargements?.filter((e) => e.signedAt).length ?? 0}/{seance.emargements?.length ?? 0}
							</span>
						{/if}
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<!-- COMPLÉTÉS — Collapsed by default -->
	{#if completedActions.length > 0}
		<section class="flex flex-col gap-2">
			<button
				type="button"
				class="flex w-full cursor-pointer items-center justify-between rounded-lg px-1 py-1 text-left transition-colors hover:bg-muted/50"
				onclick={() => (completedExpanded = !completedExpanded)}
			>
				<h2 class="text-sm font-semibold text-foreground">
					Complétés ({completedActions.length}/{actions.length})
				</h2>
				<ChevronDown
					class={cn(
						'size-4 text-muted-foreground transition-transform',
						completedExpanded && 'rotate-180'
					)}
				/>
			</button>
			{#if completedExpanded}
				<div class="divide-y divide-border rounded-lg border bg-card">
					{#each completedActions as action (action.id)}
						<div class="flex items-center gap-3 px-4 py-2.5">
							<CheckCircle class="size-4 shrink-0 text-green-500" />
							<span class="truncate text-sm text-foreground">{getActionTitle(action)}</span>
							{#if action.completedAt}
								<span class="ml-auto shrink-0 text-xs text-muted-foreground">
									{formatDate(action.completedAt)}
								</span>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</section>
	{/if}
</div>
