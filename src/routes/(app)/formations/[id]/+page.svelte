<script lang="ts">
	import type { PageProps } from './$types';
	import { goto } from '$app/navigation';
	import * as Card from '$lib/components/ui/card/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as Progress from '$lib/components/ui/progress/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { RangeCalendar } from 'bits-ui';
	import { CalendarDate } from '@internationalized/date';
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
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right'; // for calendar nav

	let { data }: PageProps = $props();

	const formation = $derived(data?.formation);
	const formationId = $derived(formation?.id ?? '');

	// Dummy: 7 steps; labels as action verbs. Doable = !done && !locked. Show completed (reward), doable (action), locked (unlock me).
	const QUEST_STEPS = [
		{ id: '1', label: 'Vérifier les informations', done: true, locked: false, href: null },
		{ id: '2', label: 'Générer la convention', done: true, locked: false, href: null },
		{ id: '3', label: 'Assigner un formateur', done: false, locked: false, href: 'formateurs' },
		{ id: '4', label: 'Envoyer les questionnaires de satisfaction', done: false, locked: false, href: 'suivi' },
		{ id: '5', label: "Contacter l'OPCO", done: false, locked: true, href: 'suivi' },
		{ id: '6', label: 'Collecter les documents formateur', done: false, locked: true, href: 'formateurs' },
		{ id: '7', label: 'Émettre la facturation', done: false, locked: true, href: 'suivi' }
	];
	const completedSteps = $derived(QUEST_STEPS.filter((s) => s.done));
	const doableSteps = $derived(QUEST_STEPS.filter((s) => !s.done && !s.locked).slice(0, 3));
	const lockedSteps = $derived(QUEST_STEPS.filter((s) => !s.done && s.locked).slice(0, 2));
	const completedCount = $derived(completedSteps.length);
	const totalCount = $derived(QUEST_STEPS.length);
	const allComplete = $derived(completedCount === totalCount && totalCount > 0);

	// Session date as YYYY-MM-DD for past/today/future; displayLabel for UI
	const DUMMY_SESSIONS = [
		{
			dateLabel: '12 oct.',
			dateKey: '2025-10-12',
			moduleName: 'Module 1 : Fondamentaux',
			time: '09:00 – 12:30',
			educator: 'P. Martin',
			emargement: { signed: 3, total: 4 }
		},
		{
			dateLabel: '13 oct.',
			dateKey: '2026-02-20',
			moduleName: 'Module 2 : Avancé',
			time: '09:00 – 17:00',
			educator: 'P. Martin',
			emargement: { signed: 0, total: 4 }
		}
		// In real app: derive status from session date vs today
	];
	const todayKey = $derived(new Date().toISOString().slice(0, 10));
	function sessionStatus(dateKey: string): 'past' | 'today' | 'future' {
		if (dateKey < todayKey) return 'past';
		if (dateKey === todayKey) return 'today';
		return 'future';
	}

	const DUMMY_LEARNERS = [
		{ id: '1', fullName: 'Philippe Mejia', company: 'Acme Inc.' },
		{ id: '2', fullName: 'Martine Ruffin', company: 'Acme Inc.' }
	];

	const DUMMY_COMPANY_POPOVER = {
		name: 'Acme Inc.',
		address: '12 avenue des fleurs, 51100 Reims',
		siret: '123 456 789 00012'
	};

	// Dummy: 2 formateurs to show stacked avatars + names (toggle to [] to see "Aucun formateur assigné")
	const DUMMY_FORMATEURS: { name: string; avatarUrl: string }[] = [
		{ name: 'Pierre Martin', avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Martin' },
		{ name: 'Sophie Bernard', avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Bernard' }
	];

	// Date range for formation (dummy) – used by RangeCalendar dialog
	const dateRangeStart = new CalendarDate(2026, 2, 16);
	const dateRangeEnd = new CalendarDate(2026, 2, 21);
	let dateRange = $state<{ start: CalendarDate; end: CalendarDate }>({
		start: dateRangeStart,
		end: dateRangeEnd
	});
	let dateRangePopoverOpen = $state(false);
	let addressPopoverOpen = $state(false);
	let fundingOrgPopoverOpen = $state(false);
	let formateursPopoverOpen = $state(false);
	/** For company popover: open on hover (and click on mobile). One learner's popover open at a time. */
	let openCompanyId = $state<string | null>(null);

	function goToTab(segment: string) {
		goto(`/formations/${formationId}/${segment}`);
	}

	function openCompany(learnerId: string) {
		openCompanyId = learnerId;
	}
	function closeCompany() {
		openCompanyId = null;
	}
</script>

<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
	<!-- Cell 1 – Quest tracker: doable → locked → progress at bottom; completed/locked visible for reward & motivation -->
	<Card.Root class="flex flex-col">
		<Card.Header>
			<Card.Title>Actions</Card.Title>
		</Card.Header>
		<Card.Content class="flex flex-1 flex-col gap-2">
			{#if doableSteps.length > 0}
				<div class="space-y-1.5">
					{#each doableSteps as step}
						<button
							type="button"
							class="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/50 focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring"
							onclick={() => step.href && goToTab(step.href)}
						>
							<span class="font-medium text-foreground">{step.label}</span>
							<ChevronRight class="size-4 shrink-0 text-muted-foreground" />
						</button>
					{/each}
				</div>
			{:else if allComplete}
				<p class="py-2 text-sm text-muted-foreground">Tout est complété.</p>
			{/if}
			{#if lockedSteps.length > 0}
				<div class="space-y-1">
					{#each lockedSteps as step}
						<div
							class="flex items-center gap-2 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 px-3 py-2 text-sm text-muted-foreground"
							aria-disabled="true"
						>
							<Lock class="size-3.5 shrink-0 opacity-60" aria-hidden="true" />
							<span>{step.label}</span>
						</div>
					{/each}
				</div>
			{/if}
			{#if completedSteps.length > 0}
				<div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
					{#each completedSteps as step}
						<span class="inline-flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-0.5">
							<Check class="size-3.5 shrink-0 text-primary" aria-hidden="true" />
							<span class="line-through">{step.label}</span>
						</span>
					{/each}
				</div>
			{/if}
			<div class="mt-2 space-y-1">
				<div class="flex items-center justify-between gap-2 text-xs text-muted-foreground">
					<span>{completedCount} complétées</span>
					<span class="tabular-nums">{completedCount}/{totalCount}</span>
				</div>
				<Progress.Root
					value={totalCount > 0 ? (completedCount / totalCount) * 100 : 0}
					class="h-1.5 w-full min-h-[6px] rounded-full"
				/>
			</div>
			<a
				href="/formations/{formationId}/suivi"
				class="mt-1 text-sm text-primary underline-offset-4 hover:underline cursor-pointer"
			>
				Voir toutes les actions
			</a>
		</Card.Content>
	</Card.Root>

	<!-- Cell 2 – Main information -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				{formation?.name ?? 'Formation'}
				<Badge variant="secondary" class="text-xs">#{formation?.idInWorkspace ?? '—'}</Badge>
				<Badge variant="outline">Intra</Badge>
			</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-3 text-sm">
			<div class="flex items-center gap-2 text-foreground">
				<Clock class="size-4 shrink-0 text-muted-foreground" />
				<span>{formation?.duree ?? 35} heures</span>
			</div>
			<Popover.Root bind:open={dateRangePopoverOpen}>
				<Popover.Trigger
					class="flex w-full items-center gap-2 text-left text-foreground underline-offset-4 hover:underline cursor-pointer"
				>
					<Calendar class="size-4 shrink-0 text-muted-foreground" />
					<span>16 fév. – 21 fév. 2026</span>
				</Popover.Trigger>
				<Popover.Content class="w-auto p-0" align="start">
					<div class="rounded-lg border bg-card p-2 shadow-sm">
						<p class="px-2 py-1 text-xs font-medium text-muted-foreground">Période de la formation</p>
						<RangeCalendar.Root
							value={dateRange}
							placeholder={dateRange.start}
							locale="fr-FR"
							weekdayFormat="short"
							class="rounded-md"
							readonly
						>
							{#snippet children({ months, weekdays })}
								{#each months as month (month.value.month)}
									<div class="space-y-2">
										<div class="flex items-center justify-between px-1">
											<RangeCalendar.PrevButton
												class="inline-flex size-8 items-center justify-center rounded-md hover:bg-accent cursor-pointer"
											>
												<ChevronLeft class="size-4" />
											</RangeCalendar.PrevButton>
											<RangeCalendar.Heading class="text-sm font-medium" />
											<RangeCalendar.NextButton
												class="inline-flex size-8 items-center justify-center rounded-md hover:bg-accent cursor-pointer"
											>
												<ChevronRightIcon class="size-4" />
											</RangeCalendar.NextButton>
										</div>
										<table class="w-full border-collapse text-center text-sm">
											<thead>
												<tr>
													{#each weekdays as day}
														<th class="p-1 text-muted-foreground">{day.slice(0, 2)}</th>
													{/each}
												</tr>
											</thead>
											<tbody>
												{#each month.weeks as weekDates}
													<tr>
														{#each weekDates as date}
															<RangeCalendar.Cell {date} month={month.value} class="p-0.5">
																<RangeCalendar.Day
																	class={cn(
																		'size-8 rounded-md flex items-center justify-center cursor-default',
																		'data-outside-month:text-muted-foreground/50',
																		'data-selected:bg-primary data-selected:text-primary-foreground',
																		'data-today:ring-1 data-today:ring-primary'
																	)}
																/>
															</RangeCalendar.Cell>
														{/each}
													</tr>
												{/each}
											</tbody>
										</table>
									</div>
								{/each}
							{/snippet}
						</RangeCalendar.Root>
					</div>
				</Popover.Content>
			</Popover.Root>
			<Popover.Root bind:open={addressPopoverOpen}>
				<Popover.Trigger
					class="flex w-full items-center gap-2 text-left text-foreground underline-offset-4 hover:underline"
				>
					<MapPin class="size-4 shrink-0 text-muted-foreground" />
					<span>{formation?.modalite ?? 'Présentiel'} – 12 avenue des fleurs, 51100 Reims</span>
				</Popover.Trigger>
				<Popover.Content class="w-72 text-sm" align="start">
					<p class="font-medium">Lieu</p>
					<p class="text-muted-foreground">12 avenue des fleurs, 51100 Reims</p>
					<p class="mt-2 text-xs text-muted-foreground">Carte (à intégrer)</p>
				</Popover.Content>
			</Popover.Root>
			<div class="flex flex-col gap-1">
				<div class="flex items-center gap-2 text-foreground">
					<Wallet class="size-4 shrink-0 text-muted-foreground" />
					<span class="font-medium">Financement</span>
				</div>
				<p class="pl-6 text-foreground">
					<Popover.Root bind:open={fundingOrgPopoverOpen}>
						<Popover.Trigger
							class="cursor-pointer underline-offset-4 hover:underline font-medium"
						>
							Akto
						</Popover.Trigger>
						<Popover.Content class="w-80 text-sm" align="start">
							<p class="font-semibold">Akto</p>
							<p class="text-muted-foreground mt-1">OPCO des secteurs de la communication, de la publicité et du numérique. Finance la formation professionnelle des salariés de ces branches.</p>
							<p class="text-muted-foreground mt-2 text-xs">Le contact peut varier selon la région de l'organisme ou du client (antennes régionales).</p>
							<div class="mt-3 flex flex-wrap gap-2">
								<a href="https://www.akto.fr" target="_blank" rel="noopener noreferrer" class="text-primary underline-offset-4 hover:underline cursor-pointer text-xs">Site web</a>
								<a href="tel:+33188131010" class="text-primary underline-offset-4 hover:underline cursor-pointer text-xs">01 88 13 10 10</a>
								<Button variant="outline" size="sm" class="cursor-pointer text-xs">Contacter l'OPCO</Button>
							</div>
						</Popover.Content>
					</Popover.Root>
					– 10 150 € <Badge variant="secondary">En attente</Badge>
				</p>
			</div>
			<div class="flex items-center justify-between border-t pt-3 gap-2">
				{#if DUMMY_FORMATEURS.length > 0}
					<Popover.Root bind:open={formateursPopoverOpen}>
						<Popover.Trigger
							class="flex min-w-0 flex-1 items-center gap-2 text-left cursor-pointer rounded-md -ml-1 pl-1 hover:bg-muted/50"
						>
							<div class="flex -space-x-2 shrink-0">
								{#each DUMMY_FORMATEURS as formateur}
									<Avatar.Root class="size-8 border-2 border-background" title={formateur.name}>
										<Avatar.Image src={formateur.avatarUrl} alt={formateur.name} />
										<Avatar.Fallback class="text-xs">{formateur.name.slice(0, 2)}</Avatar.Fallback>
									</Avatar.Root>
								{/each}
							</div>
							<span class="text-sm text-foreground min-w-0 truncate">
								{DUMMY_FORMATEURS.length === 1
									? DUMMY_FORMATEURS[0].name
									: `${DUMMY_FORMATEURS.length} formateurs`}
							</span>
						</Popover.Trigger>
						<Popover.Content class="w-56 text-sm" align="start">
							<p class="font-medium text-muted-foreground mb-2">Formateurs assignés</p>
							<ul class="space-y-1.5">
								{#each DUMMY_FORMATEURS as formateur}
									<li class="flex items-center gap-2">
										<Avatar.Root class="size-6 border border-background shrink-0">
											<Avatar.Image src={formateur.avatarUrl} alt={formateur.name} />
											<Avatar.Fallback class="text-[10px]">{formateur.name.slice(0, 2)}</Avatar.Fallback>
										</Avatar.Root>
										<span class="truncate">{formateur.name}</span>
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
				Voir tout le calendrier
			</Button>
		</Card.Header>
		<Card.Content>
			<ul class="space-y-4">
				{#each DUMMY_SESSIONS as session}
					{@const status = sessionStatus(session.dateKey)}
					<li class="border-b border-muted pb-4 last:border-0 last:pb-0">
						<button
							type="button"
							class="flex w-full flex-col gap-1.5 text-left transition-colors hover:bg-muted/50 rounded-md -m-1 p-1 cursor-pointer"
							onclick={() => goToTab('seances')}
						>
							<div class="flex items-baseline justify-between gap-2 flex-wrap">
								<span class="text-base font-semibold text-foreground">{session.dateLabel}</span>
								<span class={cn(
									'text-xs font-medium px-2 py-0.5 rounded-full',
									status === 'past' && 'bg-muted text-muted-foreground',
									status === 'today' && 'bg-primary/15 text-primary',
									status === 'future' && 'bg-muted text-muted-foreground'
								)}>
									{#if status === 'past'}Passé{:else if status === 'today'}Aujourd'hui{:else}À venir{/if}
								</span>
								<span class="text-sm text-foreground w-full sm:w-auto">{session.time}</span>
							</div>
							<p class="text-sm font-medium text-foreground">{session.moduleName}</p>
							<p class="text-sm text-foreground">{session.educator}</p>
							<div class="flex items-center gap-2 text-sm text-foreground flex-wrap">
								<FileSignature class="size-4 shrink-0 text-muted-foreground" />
								Émargement {session.emargement.signed}/{session.emargement.total}
								{#if status === 'future' && session.emargement.signed === 0}
									<span class="text-xs text-muted-foreground">(séance à venir)</span>
								{/if}
								<div class="flex gap-0.5" aria-hidden="true">
									{#each Array(session.emargement.total) as _, i}
										<span
											class={cn(
												'h-2 w-2.5 rounded-sm',
												i < session.emargement.signed ? 'bg-green-500' : 'bg-muted'
											)}
										></span>
									{/each}
								</div>
							</div>
						</button>
					</li>
				{/each}
			</ul>
		</Card.Content>
	</Card.Root>

	<!-- Cell 4 – Learners (row → fiche apprenant; quick actions don’t navigate) -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Apprenants</Card.Title>
		</Card.Header>
		<Card.Content>
			<ul class="space-y-1">
				{#each DUMMY_LEARNERS as learner}
					<li class="flex items-center gap-2 rounded-md border border-transparent hover:border-muted hover:bg-muted/30 transition-colors">
						<a
							href="/contacts/apprenants/{learner.id}"
							class="flex min-w-0 flex-1 items-center gap-2 py-2 pr-1 cursor-pointer"
						>
							<div class="min-w-0 flex-1">
								<p class="font-medium text-foreground truncate">{learner.fullName}</p>
								<Popover.Root
									open={openCompanyId === learner.id}
									onOpenChange={(open) => {
										openCompanyId = open ? learner.id : null;
									}}
								>
									<Popover.Trigger
										class="text-sm text-muted-foreground underline-offset-4 hover:underline cursor-pointer truncate block text-left"
										onmouseenter={() => openCompany(learner.id)}
										onmouseleave={() => closeCompany()}
										onclick={(e) => { e.preventDefault(); e.stopPropagation(); }}
									>
										{learner.company}
									</Popover.Trigger>
									<Popover.Content
										class="w-64 text-sm"
										align="start"
										onmouseenter={() => openCompany(learner.id)}
										onmouseleave={() => closeCompany()}
									>
										<p class="font-medium">{DUMMY_COMPANY_POPOVER.name}</p>
										<p class="text-muted-foreground">{DUMMY_COMPANY_POPOVER.address}</p>
										<p class="text-muted-foreground">SIRET : {DUMMY_COMPANY_POPOVER.siret}</p>
									</Popover.Content>
								</Popover.Root>
							</div>
						</a>
						<div class="flex shrink-0 gap-0.5" role="group" aria-label="Actions rapides">
							<Button variant="ghost" size="icon" class="size-8 cursor-pointer" href="/messagerie" aria-label="Envoyer un message" onclick={(e) => e.stopPropagation()}>
								<MessageCircle class="size-4" />
							</Button>
							<Button variant="ghost" size="icon" class="size-8 cursor-pointer" aria-label="Appeler" onclick={(e) => e.stopPropagation()}>
								<Phone class="size-4" />
							</Button>
						</div>
					</li>
				{/each}
			</ul>
		</Card.Content>
	</Card.Root>
</div>
