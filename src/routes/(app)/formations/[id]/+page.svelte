<script lang="ts">
	import type { PageProps } from './$types';
	import { goto } from '$app/navigation';
	import * as Card from '$lib/components/ui/card/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { cn } from '$lib/utils';
	import {
		getQuestTemplate,
		getNextQuest,
		PHASE_LABELS,
		type QuestPhase
	} from '$lib/formation-quests';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import CheckCircle from '@lucide/svelte/icons/check-circle';
	import Clock from '@lucide/svelte/icons/clock';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Wallet from '@lucide/svelte/icons/wallet';
	import Users from '@lucide/svelte/icons/users';
	import FileText from '@lucide/svelte/icons/file-text';
	import Building2 from '@lucide/svelte/icons/building-2';
	import Layout from '@lucide/svelte/icons/layout';

	let { data }: PageProps = $props();

	const formation = $derived(data?.formation);
	const formationId = $derived(formation?.id ?? '');

	const actions = $derived(formation?.actions ?? []);
	const nextQuest = $derived(getNextQuest(actions));
	const questTemplate = $derived(
		nextQuest?.questKey ? getQuestTemplate(nextQuest.questKey) : undefined
	);
	const nextQuestTitle = $derived(
		(nextQuest as { title?: string } | undefined)?.title ?? questTemplate?.title ?? 'Action'
	);
	const allComplete = $derived(
		actions.length > 0 && actions.every((a) => a.status === 'Terminé')
	);

	const apprenants = $derived(
		(formation?.formationApprenants ?? []).map((fa) => ({
			id: fa.contact.id,
			fullName:
				[fa.contact.firstName, fa.contact.lastName].filter(Boolean).join(' ') ||
				'Sans nom'
		}))
	);
	const apprenantsPreview = $derived(apprenants.slice(0, 3));

	const seances = $derived(formation?.seances ?? []);
	const now = $derived(new Date().toISOString());
	const upcomingSeances = $derived(
		seances
			.filter((s) => s.startAt >= now)
			.slice(0, 3)
	);

	const montant = $derived(
		formation?.montantAccorde ? Number(formation.montantAccorde) : null
	);
	const tjm = $derived(
		formation?.tjmFormateur ? Number(formation.tjmFormateur) : null
	);
	const duree = $derived(formation?.duree ?? 0);
	const jours = $derived(duree > 0 ? duree / 7 : 0);
	const totalFormateurCost = $derived(tjm && jours > 0 ? tjm * jours : null);
	const marge = $derived(
		montant != null && totalFormateurCost != null
			? montant - totalFormateurCost
			: null
	);

	function formatTime(isoDate: string) {
		return new Date(isoDate).toLocaleTimeString('fr-FR', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatDate(isoDate: string) {
		return new Date(isoDate).toLocaleDateString('fr-FR', {
			day: 'numeric',
			month: 'short'
		});
	}

	function formatDateRange() {
		if (!formation?.dateDebut && !formation?.dateFin) return '—';
		if (formation.dateDebut && formation.dateFin) {
			return `${new Date(formation.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – ${new Date(formation.dateFin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
		}
		if (formation.dateDebut) {
			return `À partir du ${new Date(formation.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
		}
		return '—';
	}

	function getInitials(name: string) {
		return name
			.split(' ')
			.map((p) => p[0])
			.join('')
			.slice(0, 2)
			.toUpperCase();
	}

	function getPhaseLabel(phase: QuestPhase | null | undefined): string {
		if (!phase) return 'Conception';
		return PHASE_LABELS[phase] ?? phase;
	}

	function goTo(segment: string) {
		goto(`/formations/${formationId}/${segment}`);
	}
</script>

<div class="flex flex-col gap-4">
	<!-- 1. Next Action Hero Card (full width) -->
	<Card.Root
		class={cn(
			'overflow-hidden',
			allComplete
				? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30'
				: 'border-primary/30 bg-primary/5'
		)}
	>
		<Card.Content class="p-6">
			{#if allComplete}
				<div class="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
					<CheckCircle
						class="size-12 shrink-0 text-green-600 dark:text-green-400"
						aria-hidden="true"
					/>
					<div>
						<h2 class="text-lg font-semibold text-foreground">
							Toutes les actions sont terminées
						</h2>
						<p class="text-sm text-muted-foreground">
							La formation est à jour. Consultez les autres onglets pour les détails.
						</p>
					</div>
					<Button
						variant="outline"
						class="shrink-0 cursor-pointer"
						onclick={() => goTo('suivi')}
					>
						Voir le suivi
					</Button>
				</div>
			{:else if nextQuest}
				<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div class="min-w-0 flex-1 space-y-2">
						<div class="flex flex-wrap items-center gap-2">
							<Badge variant="secondary" class="text-xs">
								{getPhaseLabel(nextQuest.phase)}
							</Badge>
							<span class="text-sm text-muted-foreground">Prochaine action</span>
						</div>
						<h2 class="text-lg font-semibold text-foreground">
							{nextQuestTitle}
						</h2>
						{#if questTemplate?.description}
							<p class="text-sm text-muted-foreground line-clamp-2">
								{questTemplate.description}
							</p>
						{/if}
					</div>
					<Button
						class="shrink-0 cursor-pointer"
						onclick={() => goTo('suivi')}
					>
						Faire
						<ChevronRight class="ml-1 size-4" />
					</Button>
				</div>
			{:else}
				<div class="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
					<p class="text-sm text-muted-foreground">
						Aucune action définie.
						<button
							type="button"
							class="text-primary underline-offset-4 hover:underline cursor-pointer ml-1"
							onclick={() => goTo('suivi')}
						>
							Configurer les actions
						</button>
					</p>
					<Button
						variant="outline"
						size="sm"
						class="shrink-0 cursor-pointer"
						onclick={() => goTo('suivi')}
					>
						Configurer
					</Button>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- 2 & 3. Key Info | Participants -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<!-- Key Info Card -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<FileText class="size-4" />
					Informations clés
				</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-3 text-sm">
				{#if formation?.type}
					<div class="flex items-center gap-2">
						<Badge variant="outline">{formation.type}</Badge>
					</div>
				{/if}
				<div class="flex items-center gap-2 text-foreground">
					<Layout class="size-4 shrink-0 text-muted-foreground" />
					<span>Modalité : {formation?.modalite ?? '—'}</span>
				</div>
				<div class="flex items-center gap-2 text-foreground">
					<Clock class="size-4 shrink-0 text-muted-foreground" />
					<span>Durée : {formation?.duree ?? '—'} heures</span>
				</div>
				<div class="flex items-center gap-2 text-foreground">
					<Calendar class="size-4 shrink-0 text-muted-foreground" />
					<span>{formatDateRange()}</span>
				</div>
				<div class="flex items-center gap-2 text-foreground">
					<MapPin class="size-4 shrink-0 text-muted-foreground" />
					<span>{formation?.location ?? '—'}</span>
				</div>
				{#if formation?.client}
					<div class="flex items-center gap-2 text-foreground">
						<Building2 class="size-4 shrink-0 text-muted-foreground" />
						<span>{formation.client.legalName ?? '—'}</span>
					</div>
				{/if}
				<a
					href="/formations/{formationId}/fiche"
					class="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
				>
					Voir la fiche
					<ChevronRight class="size-4" />
				</a>
			</Card.Content>
		</Card.Root>

		<!-- Participants Summary Card -->
		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between">
				<Card.Title class="flex items-center gap-2">
					<Users class="size-4" />
					Participants
					{#if apprenants.length > 0}
						<Badge variant="secondary" class="text-xs">{apprenants.length}</Badge>
					{/if}
				</Card.Title>
				{#if apprenants.length > 0}
					<Button
						variant="link"
						size="sm"
						class="h-auto p-0 font-medium cursor-pointer"
						onclick={() => goTo('apprenants')}
					>
						Voir tout
					</Button>
				{/if}
			</Card.Header>
			<Card.Content>
				{#if apprenants.length === 0}
					<p class="text-sm text-muted-foreground">Aucun apprenant inscrit.</p>
				{:else}
					<ul class="space-y-2">
						{#each apprenantsPreview as learner}
							<li class="flex items-center gap-2">
								<Avatar.Root class="size-8 shrink-0 border border-background">
									<Avatar.Fallback class="text-xs">
										{getInitials(learner.fullName)}
									</Avatar.Fallback>
								</Avatar.Root>
								<span class="truncate text-sm font-medium text-foreground">
									{learner.fullName}
								</span>
							</li>
						{/each}
					</ul>
					{#if apprenants.length > 3}
						<p class="mt-2 text-xs text-muted-foreground">
							+{apprenants.length - 3} autre{apprenants.length - 3 > 1 ? 's' : ''}
						</p>
					{/if}
				{/if}
			</Card.Content>
		</Card.Root>
	</div>

	<!-- 4 & 5. Upcoming Sessions | Financial Summary -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<!-- Upcoming Sessions Card -->
		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between">
				<Card.Title class="flex items-center gap-2">
					<Calendar class="size-4" />
					Prochaines séances
				</Card.Title>
				{#if upcomingSeances.length > 0}
					<Button
						variant="link"
						size="sm"
						class="h-auto p-0 font-medium cursor-pointer"
						onclick={() => goTo('seances')}
					>
						Voir tout
					</Button>
				{/if}
			</Card.Header>
			<Card.Content>
				{#if upcomingSeances.length === 0}
					<p class="text-sm text-muted-foreground">Aucune séance planifiée.</p>
				{:else}
					<ul class="space-y-4">
						{#each upcomingSeances as seance}
							{@const signed = seance.emargements?.filter((e) => e.signedAt).length ?? 0}
							{@const total = seance.emargements?.length ?? 0}
							<li class="border-b border-muted pb-4 last:border-0 last:pb-0">
								<button
									type="button"
									class="flex w-full flex-col gap-1.5 text-left cursor-pointer rounded-md -m-1 p-1 transition-colors hover:bg-muted/50"
									onclick={() => goTo('seances')}
								>
									<div class="flex items-baseline justify-between gap-2">
										<span class="font-medium text-foreground">
											{formatDate(seance.startAt)}
										</span>
										<span class="text-sm text-muted-foreground">
											{formatTime(seance.startAt)} – {formatTime(seance.endAt)}
										</span>
									</div>
									{#if seance.module}
										<p class="text-sm text-foreground">{seance.module.name}</p>
									{/if}
									{#if seance.formateur?.user}
										<p class="text-sm text-muted-foreground">
											{[seance.formateur.user.firstName, seance.formateur.user.lastName]
												.filter(Boolean)
												.join(' ') || 'Formateur'}
										</p>
									{/if}
									<p class="text-xs text-muted-foreground">
										Émargement : {signed}/{total}
									</p>
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- Financial Summary Card -->
		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between">
				<Card.Title class="flex items-center gap-2">
					<Wallet class="size-4" />
					Résumé financier
				</Card.Title>
				<Button
					variant="link"
					size="sm"
					class="h-auto p-0 font-medium cursor-pointer"
					onclick={() => goTo('finances')}
				>
					Voir les finances
				</Button>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div>
					<p class="text-xs text-muted-foreground">Montant accordé</p>
					<div class="mt-1 flex items-center gap-2">
						<span class="text-lg font-semibold tabular-nums">
							{montant != null ? montant.toLocaleString('fr-FR') + ' €' : '—'}
						</span>
						{#if montant != null}
							{#if formation?.financementAccorde}
								<Badge variant="default" class="text-xs">Accordé</Badge>
							{:else}
								<Badge variant="secondary" class="text-xs">En attente</Badge>
							{/if}
						{/if}
					</div>
				</div>
				<div>
					<p class="text-xs text-muted-foreground">TJM Formateur</p>
					<p class="mt-1 text-lg font-semibold tabular-nums">
						{tjm != null ? tjm.toLocaleString('fr-FR') + ' €' : '—'}
					</p>
				</div>
				<div>
					<p class="text-xs text-muted-foreground">Marge</p>
					<p
						class="mt-1 text-lg font-semibold tabular-nums"
						class:text-green-600={marge != null && marge > 0}
						class:text-red-600={marge != null && marge < 0}
					>
						{marge != null ? marge.toLocaleString('fr-FR') + ' €' : '—'}
					</p>
					{#if marge != null && tjm != null && duree > 0}
						<p class="text-xs text-muted-foreground">
							(montant − TJM × {jours.toFixed(1)} jours)
						</p>
					{/if}
				</div>
			</Card.Content>
		</Card.Root>
	</div>
</div>
