<script lang="ts">
	import type { PageProps } from './$types';
	import { goto } from '$app/navigation';
	import * as Card from '$lib/components/ui/card/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as Progress from '$lib/components/ui/progress/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { cn } from '$lib/utils';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Check from '@lucide/svelte/icons/check';
	import Lock from '@lucide/svelte/icons/lock';
	import Clock from '@lucide/svelte/icons/clock';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Wallet from '@lucide/svelte/icons/wallet';
	import MessageCircle from '@lucide/svelte/icons/message-circle';
	import Phone from '@lucide/svelte/icons/phone';
	import FileSignature from '@lucide/svelte/icons/file-signature';
	import Users from '@lucide/svelte/icons/users';
	import BookOpen from '@lucide/svelte/icons/book-open';

	let { data }: PageProps = $props();

	const formation = $derived(data?.formation);
	const formationId = $derived(formation?.id ?? '');

	const actions = $derived(formation?.actions ?? []);
	const doableActions = $derived(
		actions
			.filter((a) => a.status === 'Pas commencé' && !a.blockedByActionId)
			.slice(0, 3)
	);
	const inProgressActions = $derived(
		actions.filter((a) => a.status === 'En cours')
	);
	const completedActions = $derived(
		actions.filter((a) => a.status === 'Terminé')
	);
	const blockedActions = $derived(
		actions
			.filter((a) => a.status === 'Pas commencé' && a.blockedByActionId)
			.slice(0, 2)
	);
	const completedCount = $derived(completedActions.length);
	const totalCount = $derived(actions.length);
	const allComplete = $derived(completedCount === totalCount && totalCount > 0);
	const hasActions = $derived(totalCount > 0);

	const seances = $derived(formation?.seances ?? []);
	const upcomingSeances = $derived(
		seances
			.filter((s) => new Date(s.startAt) >= new Date())
			.slice(0, 3)
	);
	const recentSeances = $derived(
		seances
			.filter((s) => new Date(s.startAt) < new Date())
			.slice(-2)
			.reverse()
	);
	const displaySeances = $derived([...recentSeances, ...upcomingSeances].slice(0, 4));

	const formateurs = $derived(
		(formation?.formationFormateurs ?? []).map((ff) => {
			const u = ff.formateur.user;
			const name = [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.email || 'Formateur';
			return { id: ff.formateur.id, name, avatarUrl: u?.avatarUrl ?? '' };
		})
	);

	const apprenants = $derived(
		(formation?.formationApprenants ?? []).map((fa) => ({
			id: fa.contact.id,
			fullName: [fa.contact.firstName, fa.contact.lastName].filter(Boolean).join(' ') || 'Sans nom',
			company: fa.contact.contactCompanies?.[0]?.company?.name ?? null,
			companyId: fa.contact.contactCompanies?.[0]?.company?.id ?? null,
			email: fa.contact.email,
			phone: fa.contact.phone
		}))
	);

	const todayKey = $derived(new Date().toISOString().slice(0, 10));

	function sessionStatus(startAt: string): 'past' | 'today' | 'future' {
		const dateKey = startAt.slice(0, 10);
		if (dateKey < todayKey) return 'past';
		if (dateKey === todayKey) return 'today';
		return 'future';
	}

	function formatTime(isoDate: string) {
		return new Date(isoDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
	}

	function formatDate(isoDate: string) {
		return new Date(isoDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
	}

	let formateursPopoverOpen = $state(false);
	let openCompanyId = $state<string | null>(null);

	function goToTab(segment: string) {
		goto(`/formations/${formationId}/${segment}`);
	}

	function getInitials(name: string) {
		return name
			.split(' ')
			.map((p) => p[0])
			.join('')
			.slice(0, 2)
			.toUpperCase();
	}
</script>

<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
	<!-- Cell 1 – Actions (Quest Tracker) -->
	<Card.Root class="flex flex-col">
		<Card.Header>
			<Card.Title>Actions</Card.Title>
		</Card.Header>
		<Card.Content class="flex flex-1 flex-col gap-2">
			{#if !hasActions}
				<p class="py-2 text-sm text-muted-foreground">
					Aucune action définie.
					<button
						type="button"
						class="text-primary underline-offset-4 hover:underline cursor-pointer"
						onclick={() => goToTab('suivi')}
					>
						Configurer les actions
					</button>
				</p>
			{:else}
				{#if inProgressActions.length > 0}
					<div class="space-y-1.5">
						{#each inProgressActions as action}
							<button
								type="button"
								class="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30 px-3 py-2.5 text-left shadow-sm transition-colors hover:border-blue-300 focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring"
								onclick={() => goToTab('suivi')}
							>
								<span class="font-medium text-foreground">{action.title}</span>
								<Badge variant="secondary" class="text-xs shrink-0">En cours</Badge>
							</button>
						{/each}
					</div>
				{/if}
				{#if doableActions.length > 0}
					<div class="space-y-1.5">
						{#each doableActions as action}
							<button
								type="button"
								class="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/50 focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring"
								onclick={() => goToTab('suivi')}
							>
								<span class="font-medium text-foreground">{action.title}</span>
								<ChevronRight class="size-4 shrink-0 text-muted-foreground" />
							</button>
						{/each}
					</div>
				{:else if allComplete}
					<p class="py-2 text-sm text-muted-foreground">Toutes les actions sont complétées.</p>
				{/if}
				{#if blockedActions.length > 0}
					<div class="space-y-1">
						{#each blockedActions as action}
							<div
								class="flex items-center gap-2 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 px-3 py-2 text-sm text-muted-foreground"
								aria-disabled="true"
							>
								<Lock class="size-3.5 shrink-0 opacity-60" aria-hidden="true" />
								<span>{action.title}</span>
							</div>
						{/each}
					</div>
				{/if}
				{#if completedActions.length > 0}
					<div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
						{#each completedActions.slice(0, 5) as action}
							<span class="inline-flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-0.5">
								<Check class="size-3.5 shrink-0 text-primary" aria-hidden="true" />
								<span class="line-through">{action.title}</span>
							</span>
						{/each}
						{#if completedActions.length > 5}
							<span class="text-xs">+{completedActions.length - 5} complétées</span>
						{/if}
					</div>
				{/if}
				<div class="mt-2 space-y-1">
					<div class="flex items-center justify-between gap-2 text-xs text-muted-foreground">
						<span>{completedCount} complétée{completedCount > 1 ? 's' : ''}</span>
						<span class="tabular-nums">{completedCount}/{totalCount}</span>
					</div>
					<Progress.Root
						value={totalCount > 0 ? (completedCount / totalCount) * 100 : 0}
						class="h-1.5 w-full min-h-[6px] rounded-full"
					/>
				</div>
			{/if}
			<a
				href="/formations/{formationId}/suivi"
				class="mt-1 text-sm text-primary underline-offset-4 hover:underline cursor-pointer"
			>
				Voir toutes les actions
			</a>
		</Card.Content>
	</Card.Root>

	<!-- Cell 2 – Main Information -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				{formation?.name ?? 'Formation'}
				<Badge variant="secondary" class="text-xs">#{formation?.idInWorkspace ?? '—'}</Badge>
				{#if formation?.type}
					<Badge variant="outline">{formation.type}</Badge>
				{/if}
			</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-3 text-sm">
			<div class="flex items-center gap-2 text-foreground">
				<Clock class="size-4 shrink-0 text-muted-foreground" />
				<span>{formation?.duree ?? '—'} heures</span>
			</div>
			{#if formation?.dateDebut || formation?.dateFin}
				<div class="flex items-center gap-2 text-foreground">
					<Calendar class="size-4 shrink-0 text-muted-foreground" />
					<span>
						{#if formation.dateDebut && formation.dateFin}
							{new Date(formation.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
							–
							{new Date(formation.dateFin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
						{:else if formation.dateDebut}
							À partir du {new Date(formation.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
						{/if}
					</span>
				</div>
			{/if}
			<div class="flex items-center gap-2 text-foreground">
				<MapPin class="size-4 shrink-0 text-muted-foreground" />
				<span>{formation?.modalite ?? '—'}{formation?.location ? ` – ${formation.location}` : ''}</span>
			</div>
			{#if formation?.programmeSource}
				<div class="flex items-center gap-2 text-foreground">
					<BookOpen class="size-4 shrink-0 text-muted-foreground" />
					<a
						href="/formations/{formationId}/programme"
						class="underline-offset-4 hover:underline cursor-pointer"
					>
						{formation.programmeSource.titre}
					</a>
				</div>
			{/if}
			{#if formation?.typeFinancement || formation?.financementAccorde != null}
				<div class="flex flex-col gap-1">
					<div class="flex items-center gap-2 text-foreground">
						<Wallet class="size-4 shrink-0 text-muted-foreground" />
						<span class="font-medium">Financement</span>
					</div>
					<p class="pl-6 text-foreground">
						{formation?.typeFinancement ?? '—'}
						{#if formation?.montantAccorde}
							– {Number(formation.montantAccorde).toLocaleString('fr-FR')} €
						{/if}
						{#if formation?.financementAccorde}
							<Badge variant="default" class="text-xs ml-1">Accordé</Badge>
						{:else}
							<Badge variant="secondary" class="text-xs ml-1">En attente</Badge>
						{/if}
					</p>
				</div>
			{/if}
			<div class="flex items-center justify-between border-t pt-3 gap-2">
				{#if formateurs.length > 0}
					<Popover.Root bind:open={formateursPopoverOpen}>
						<Popover.Trigger
							class="flex min-w-0 flex-1 items-center gap-2 text-left cursor-pointer rounded-md -ml-1 pl-1 hover:bg-muted/50"
						>
							<div class="flex -space-x-2 shrink-0">
								{#each formateurs.slice(0, 3) as f}
									<Avatar.Root class="size-8 border-2 border-background" title={f.name}>
										{#if f.avatarUrl}
											<Avatar.Image src={f.avatarUrl} alt={f.name} />
										{/if}
										<Avatar.Fallback class="text-xs">{getInitials(f.name)}</Avatar.Fallback>
									</Avatar.Root>
								{/each}
							</div>
							<span class="text-sm text-foreground min-w-0 truncate">
								{formateurs.length === 1
									? formateurs[0].name
									: `${formateurs.length} formateurs`}
							</span>
						</Popover.Trigger>
						<Popover.Content class="w-56 text-sm" align="start">
							<p class="font-medium text-muted-foreground mb-2">Formateurs assignés</p>
							<ul class="space-y-1.5">
								{#each formateurs as f}
									<li class="flex items-center gap-2">
										<Avatar.Root class="size-6 border border-background shrink-0">
											{#if f.avatarUrl}
												<Avatar.Image src={f.avatarUrl} alt={f.name} />
											{/if}
											<Avatar.Fallback class="text-[10px]">{getInitials(f.name)}</Avatar.Fallback>
										</Avatar.Root>
										<span class="truncate">{f.name}</span>
									</li>
								{/each}
							</ul>
							<Button variant="outline" size="sm" class="mt-3 w-full cursor-pointer" onclick={() => { formateursPopoverOpen = false; goToTab('formateurs'); }}>
								Gérer les formateurs
							</Button>
						</Popover.Content>
					</Popover.Root>
				{:else}
					<span class="text-sm text-muted-foreground flex-1">Aucun formateur assigné.</span>
				{/if}
				<Button variant="outline" size="sm" class="shrink-0 cursor-pointer" onclick={() => goToTab('formateurs')}>
					Gérer
				</Button>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Cell 3 – Séances -->
	<Card.Root>
		<Card.Header class="flex flex-row items-center justify-between">
			<Card.Title class="flex items-center gap-2">
				<Calendar class="size-4" />
				Séances
			</Card.Title>
			<Button variant="link" size="sm" class="h-auto p-0 font-medium" onclick={() => goToTab('seances')}>
				Voir tout
			</Button>
		</Card.Header>
		<Card.Content>
			{#if displaySeances.length === 0}
				<p class="text-sm text-muted-foreground py-2">
					Aucune séance planifiée.
					<button
						type="button"
						class="text-primary underline-offset-4 hover:underline cursor-pointer"
						onclick={() => goToTab('seances')}
					>
						Planifier une séance
					</button>
				</p>
			{:else}
				<ul class="space-y-4">
				{#each displaySeances as seance}
					{@const status = sessionStatus(seance.startAt)}
					{@const signed = seance.emargements?.filter((e) => e.signedAt).length ?? 0}
					{@const total = seance.emargements?.length ?? 0}
					<li class="border-b border-muted pb-4 last:border-0 last:pb-0">
						<button
							type="button"
							class="flex w-full flex-col gap-1.5 text-left transition-colors hover:bg-muted/50 rounded-md -m-1 p-1 cursor-pointer"
							onclick={() => goToTab('seances')}
						>
							<div class="flex items-baseline justify-between gap-2 flex-wrap">
								<span class="text-base font-semibold text-foreground">{formatDate(seance.startAt)}</span>
								<span class={cn(
									'text-xs font-medium px-2 py-0.5 rounded-full',
									status === 'past' && 'bg-muted text-muted-foreground',
									status === 'today' && 'bg-primary/15 text-primary',
									status === 'future' && 'bg-muted text-muted-foreground'
								)}>
									{#if status === 'past'}Passé{:else if status === 'today'}Aujourd'hui{:else}À venir{/if}
								</span>
								<span class="text-sm text-foreground w-full sm:w-auto">{formatTime(seance.startAt)} – {formatTime(seance.endAt)}</span>
							</div>
							{#if seance.module}
								<p class="text-sm font-medium text-foreground">{seance.module.name}</p>
							{/if}
							{#if seance.formateur?.user}
								<p class="text-sm text-foreground">
									{[seance.formateur.user.firstName, seance.formateur.user.lastName].filter(Boolean).join(' ') || 'Formateur'}
								</p>
							{/if}
							<div class="flex items-center gap-2 text-sm text-foreground flex-wrap">
								<FileSignature class="size-4 shrink-0 text-muted-foreground" />
								Émargement {signed}/{total}
								{#if total > 0}
									<div class="flex gap-0.5" aria-hidden="true">
										{#each Array(total) as _, i}
											<span
												class={cn(
													'h-2 w-2.5 rounded-sm',
													i < signed ? 'bg-green-500' : 'bg-muted'
												)}
											></span>
										{/each}
									</div>
								{/if}
							</div>
						</button>
					</li>
				{/each}
				</ul>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Cell 4 – Apprenants -->
	<Card.Root>
		<Card.Header class="flex flex-row items-center justify-between">
			<Card.Title class="flex items-center gap-2">
				<Users class="size-4" />
				Apprenants
				{#if apprenants.length > 0}
					<Badge variant="secondary" class="text-xs">{apprenants.length}</Badge>
				{/if}
			</Card.Title>
		</Card.Header>
		<Card.Content>
			{#if apprenants.length === 0}
				<p class="text-sm text-muted-foreground py-2">
					Aucun apprenant inscrit.
				</p>
			{:else}
				<ul class="space-y-1">
					{#each apprenants as learner}
						<li class="flex items-center gap-2 rounded-md border border-transparent hover:border-muted hover:bg-muted/30 transition-colors">
							<a
								href="/contacts/{learner.id}"
								class="flex min-w-0 flex-1 items-center gap-2 py-2 pr-1 cursor-pointer"
							>
								<div class="min-w-0 flex-1">
									<p class="font-medium text-foreground truncate">{learner.fullName}</p>
									{#if learner.company}
										<p class="text-sm text-muted-foreground truncate">{learner.company}</p>
									{/if}
								</div>
							</a>
							<div class="flex shrink-0 gap-0.5" role="group" aria-label="Actions rapides">
								{#if learner.email}
									<Button variant="ghost" size="icon" class="size-8 cursor-pointer" href="mailto:{learner.email}" aria-label="Envoyer un email" onclick={(e) => e.stopPropagation()}>
										<MessageCircle class="size-4" />
									</Button>
								{/if}
								{#if learner.phone}
									<Button variant="ghost" size="icon" class="size-8 cursor-pointer" href="tel:{learner.phone}" aria-label="Appeler" onclick={(e) => e.stopPropagation()}>
										<Phone class="size-4" />
									</Button>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
