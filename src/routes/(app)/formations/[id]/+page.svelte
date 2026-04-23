<script lang="ts">
	import type { PageProps } from './$types';
	import { goto } from '$app/navigation';
	import * as Card from '$lib/components/ui/card/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Clock from '@lucide/svelte/icons/clock';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Wallet from '@lucide/svelte/icons/wallet';
	import Users from '@lucide/svelte/icons/users';
	import FileText from '@lucide/svelte/icons/file-text';
	import Building2 from '@lucide/svelte/icons/building-2';
	import Layout from '@lucide/svelte/icons/layout';
	import Plus from '@lucide/svelte/icons/plus';

	let { data }: PageProps = $props();

	const formation = $derived(data?.formation);
	const formationId = $derived(formation?.id ?? '');

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
	let now = $state(new Date().toISOString());
	$effect(() => {
		const interval = setInterval(() => { now = new Date().toISOString(); }, 60_000);
		return () => clearInterval(interval);
	});
	const upcomingSeances = $derived(
		seances
			.filter((s) => s.startAt >= now)
			.slice(0, 3)
	);

	const totalSeances = $derived(seances.length);
	const upcomingCount = $derived(seances.filter((s) => s.startAt >= now).length);
	const nextSessionDate = $derived(
		upcomingSeances.length > 0 ? upcomingSeances[0].startAt : null
	);

	const attendanceRate = $derived.by(() => {
		const pastSeances = seances.filter(
			(s) => s.endAt < now && (s.emargements?.length ?? 0) > 0
		);
		if (pastSeances.length === 0) return null;
		let totalEm = 0;
		let signedEm = 0;
		for (const s of pastSeances) {
			for (const e of s.emargements ?? []) {
				totalEm++;
				if (e.signedAt) signedEm++;
			}
		}
		return totalEm > 0 ? Math.round((signedEm / totalEm) * 100) : null;
	});

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
			.filter(Boolean)
			.map((p) => p[0])
			.join('')
			.slice(0, 2)
			.toUpperCase();
	}

	function goTo(segment: string) {
		goto(`/formations/${formationId}/${segment}`);
	}
</script>

<div class="flex flex-col gap-4">
	<!-- Key Info | Participants -->
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
				{#if attendanceRate != null}
					<p class="mt-3 text-xs text-muted-foreground">
						Taux de présence : <span class="font-medium text-foreground">{attendanceRate}%</span>
					</p>
				{/if}
				{/if}
				<a
					href="/formations/{formationId}/apprenants"
					class="mt-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
				>
					<Plus class="size-3.5" />
					Ajouter un apprenant
				</a>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Upcoming Sessions | Financial Summary -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<!-- Upcoming Sessions Card -->
		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between">
				<Card.Title class="flex items-center gap-2">
					<Calendar class="size-4" />
					Séances
					{#if totalSeances > 0}
						<Badge variant="secondary" class="text-xs">{upcomingCount}/{totalSeances}</Badge>
					{/if}
				</Card.Title>
				{#if totalSeances > 0}
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
				{#if totalSeances > 0 && nextSessionDate}
					<p class="mb-3 text-xs text-muted-foreground">
						Prochaine séance : <span class="font-medium text-foreground">{formatDate(nextSessionDate)}</span>
					</p>
				{/if}
				{#if upcomingSeances.length === 0}
					<p class="text-sm text-muted-foreground">Aucune séance à venir.</p>
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
				<a
					href="/formations/{formationId}/seances"
					class="mt-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
				>
					<Plus class="size-3.5" />
					Ajouter une séance
				</a>
			</Card.Content>
		</Card.Root>

		<!-- Financial Summary Card -->
		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between">
				<Card.Title class="flex items-center gap-2">
					<Wallet class="size-4" />
					Résumé financier
				</Card.Title>
				<a
					href="/formations/{formationId}/finances"
					class="text-sm font-medium text-primary underline-offset-4 hover:underline"
				>
					Voir les finances
				</a>
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
					<p class="text-xs text-muted-foreground">Coûts formateurs</p>
				<p class="mt-1 text-lg font-semibold tabular-nums">
					{totalFormateurCost != null ? totalFormateurCost.toLocaleString('fr-FR') + ' €' : '—'}
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
					{#if marge != null}
						<p class="text-xs text-muted-foreground">
							(montant − coûts formateurs)
						</p>
					{/if}
				</div>
			</Card.Content>
		</Card.Root>
	</div>
</div>
