<script lang="ts">
	import type { PageProps } from './$types';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import * as Select from '$lib/components/ui/select';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { cn } from '$lib/utils';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { browser } from '$app/environment';
	import Calendar from '@lucide/svelte/icons/calendar';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import Clock from '@lucide/svelte/icons/clock';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Plus from '@lucide/svelte/icons/plus';
	import FileSignature from '@lucide/svelte/icons/file-signature';
	import Check from '@lucide/svelte/icons/check';
	import User from '@lucide/svelte/icons/user';
	import List from '@lucide/svelte/icons/list';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Copy from '@lucide/svelte/icons/copy';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Users from '@lucide/svelte/icons/users';
	import DoorOpen from '@lucide/svelte/icons/door-open';

	let { data }: PageProps = $props();

	const formation = $derived(data?.formation);
	const seances = $derived(formation?.seances ?? []);
	const modules = $derived(formation?.modules ?? []);
	const formateurs = $derived(
		(formation?.formationFormateurs ?? [])
			.map((ff) => ff.formateur)
			.filter((f): f is NonNullable<typeof f> => f != null)
	);
	const apprenants = $derived(
		(formation?.formationApprenants ?? []).map((fa) => ({
			contactId: fa.contact.id,
			name:
				[fa.contact.firstName, fa.contact.lastName].filter(Boolean).join(' ') || 'Sans nom'
		}))
	);

	const todayStr = $derived(new Date().toISOString().slice(0, 10));

	// --- View toggle ---
	const STORAGE_KEY = 'formation-seances-view';
	let viewMode = $state<'list' | 'calendar'>(
		browser
			? ((localStorage.getItem(STORAGE_KEY) as 'list' | 'calendar') ?? 'list')
			: 'list'
	);

	$effect(() => {
		if (browser) localStorage.setItem(STORAGE_KEY, viewMode);
	});

	// --- Session dialog state ---
	let dialogOpen = $state(false);
	let editingSeance = $state<(typeof seances)[number] | null>(null);
	let dialogStep = $state<'form' | 'participants'>('form');
	let submitting = $state(false);
	let createdSeanceId = $state<string | null>(null);

	let formDate = $state('');
	let formStartTime = $state('09:00');
	let formEndTime = $state('17:00');
	let formModuleId = $state('');
	let formFormateurId = $state('');
	let formModalityOverride = $state('');
	let formLocation = $state('');
	let formRoom = $state('');

	const effectiveModality = $derived(
		formModalityOverride || formation?.modalite || null
	);
	const showLocationFields = $derived(
		effectiveModality === 'Présentiel' || effectiveModality === 'Hybride'
	);

	let participantChecked = $state<Record<string, boolean>>({});

	function openCreateDialog(prefilledDate?: string) {
		editingSeance = null;
		dialogStep = 'form';
		createdSeanceId = null;
		formDate = prefilledDate ?? '';
		formStartTime = '09:00';
		formEndTime = '17:00';
		formModuleId = modules[0]?.id ?? '';
		formFormateurId = '';
		formModalityOverride = '';
		formLocation = formation?.location ?? '';
		formRoom = '';
		dialogOpen = true;
	}

	function openEditDialog(seance: (typeof seances)[number]) {
		editingSeance = seance;
		dialogStep = 'form';
		createdSeanceId = null;
		formDate = seance.startAt.slice(0, 10);
		formStartTime = new Date(seance.startAt).toLocaleTimeString('fr-FR', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		});
		formEndTime = new Date(seance.endAt).toLocaleTimeString('fr-FR', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		});
		formModuleId = seance.moduleId ?? '';
		formFormateurId = seance.formateurId ?? '';
		formModalityOverride = seance.modalityOverride ?? '';
		formLocation = seance.location ?? '';
		formRoom = seance.room ?? '';
		dialogOpen = true;
	}

	function openParticipantsStep(seanceId: string) {
		createdSeanceId = seanceId;
		dialogStep = 'participants';
		const seance = seances.find((s) => s.id === seanceId);
		const existingContactIds = new Set(
			(seance?.emargements ?? []).map((e) => e.contactId)
		);
		participantChecked = {};
		for (const a of apprenants) {
			participantChecked[a.contactId] =
				existingContactIds.size > 0
					? existingContactIds.has(a.contactId)
					: true;
		}
	}

	const formStartAt = $derived(formDate && formStartTime ? `${formDate}T${formStartTime}:00` : '');
	const formEndAt = $derived(formDate && formEndTime ? `${formDate}T${formEndTime}:00` : '');

	const selectedContactIds = $derived(
		Object.entries(participantChecked)
			.filter(([, v]) => v)
			.map(([k]) => k)
	);

	// --- Delete confirmation ---
	let deleteDialogOpen = $state(false);
	let deletingSeance = $state<(typeof seances)[number] | null>(null);

	const deleteSignatureCount = $derived(
		(deletingSeance?.emargements ?? []).filter((e) => e.signedAt).length
	);

	function openDeleteDialog(seance: (typeof seances)[number]) {
		deletingSeance = seance;
		deleteDialogOpen = true;
	}

	// --- Emargement detail panel ---
	let detailSeanceId = $state<string | null>(null);

	function toggleDetail(seanceId: string) {
		detailSeanceId = detailSeanceId === seanceId ? null : seanceId;
	}

	// --- Helpers ---
	function sessionStatus(startAt: string): 'past' | 'today' | 'future' {
		const dateKey = startAt.slice(0, 10);
		if (dateKey < todayStr) return 'past';
		if (dateKey === todayStr) return 'today';
		return 'future';
	}

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('fr-FR', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	function formatDateShort(iso: string) {
		return new Date(iso).toLocaleDateString('fr-FR', {
			day: 'numeric',
			month: 'short'
		});
	}

	function formatTime(iso: string) {
		return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
	}

	function durationHours(start: string, end: string) {
		const diff = (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60);
		return Math.round(diff * 10) / 10;
	}

	function formateurName(formateur: { user?: { firstName?: string | null; lastName?: string | null } | null } | null) {
		if (!formateur?.user) return null;
		return [formateur.user.firstName, formateur.user.lastName].filter(Boolean).join(' ') || null;
	}

	async function copyToClipboard(token: string) {
		const url = `${browser ? window.location.origin : ''}/emargement/${token}`;
		try {
			await navigator.clipboard.writeText(url);
			toast.success('Lien copié');
		} catch {
			toast.error('Impossible de copier');
		}
	}

	// --- List: Group sessions by date ---
	const groupedSeances = $derived.by(() => {
		const groups: { dateKey: string; dateLabel: string; sessions: typeof seances }[] = [];
		const map = new Map<string, typeof seances>();
		for (const s of seances) {
			const key = s.startAt.slice(0, 10);
			if (!map.has(key)) map.set(key, []);
			map.get(key)!.push(s);
		}
		for (const [dateKey, sessions] of map) {
			groups.push({ dateKey, dateLabel: formatDate(sessions[0].startAt), sessions });
		}
		return groups;
	});

	// --- Calendar state ---
	const initialCalDate = $derived(seances.length > 0 ? new Date(seances[0].startAt) : new Date());
	let calYear = $state(new Date().getFullYear());
	let calMonth = $state(new Date().getMonth());
	let calInitialized = $state(false);

	$effect(() => {
		if (!calInitialized && initialCalDate) {
			calYear = initialCalDate.getFullYear();
			calMonth = initialCalDate.getMonth();
			calInitialized = true;
		}
	});

	const calMonthLabel = $derived(
		new Date(calYear, calMonth).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
	);

	function calPrev() {
		if (calMonth === 0) {
			calMonth = 11;
			calYear--;
		} else {
			calMonth--;
		}
	}
	function calNext() {
		if (calMonth === 11) {
			calMonth = 0;
			calYear++;
		} else {
			calMonth++;
		}
	}

	const calDays = $derived.by(() => {
		const firstDay = new Date(calYear, calMonth, 1);
		const lastDay = new Date(calYear, calMonth + 1, 0);
		const startDow = (firstDay.getDay() + 6) % 7;
		const days: { date: Date; inMonth: boolean; dateStr: string }[] = [];

		for (let i = startDow - 1; i >= 0; i--) {
			const d = new Date(calYear, calMonth, -i);
			days.push({ date: d, inMonth: false, dateStr: d.toISOString().slice(0, 10) });
		}
		for (let d = 1; d <= lastDay.getDate(); d++) {
			const date = new Date(calYear, calMonth, d);
			days.push({ date, inMonth: true, dateStr: date.toISOString().slice(0, 10) });
		}
		const remaining = 7 - (days.length % 7);
		if (remaining < 7) {
			for (let i = 1; i <= remaining; i++) {
				const d = new Date(calYear, calMonth + 1, i);
				days.push({ date: d, inMonth: false, dateStr: d.toISOString().slice(0, 10) });
			}
		}
		return days;
	});

	const seancesByDate = $derived.by(() => {
		const map = new Map<string, typeof seances>();
		for (const s of seances) {
			const key = s.startAt.slice(0, 10);
			if (!map.has(key)) map.set(key, []);
			map.get(key)!.push(s);
		}
		return map;
	});

	const formationDateRange = $derived({
		start: formation?.dateDebut ?? null,
		end: formation?.dateFin ?? null
	});

	function isInFormationRange(dateStr: string) {
		if (!formationDateRange.start || !formationDateRange.end) return false;
		return dateStr >= formationDateRange.start && dateStr <= formationDateRange.end;
	}

	const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between gap-4">
		<h2 class="text-lg font-semibold flex items-center gap-2">
			<Calendar class="size-5" />
			Séances
			{#if seances.length > 0}
				<Badge variant="secondary" class="text-xs">{seances.length}</Badge>
			{/if}
		</h2>

		<div class="flex items-center gap-2">
			<div class="hidden sm:flex items-center rounded-md border">
				<button
					type="button"
					class={cn(
						'flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors rounded-l-md',
						viewMode === 'list'
							? 'bg-muted text-foreground font-medium'
							: 'text-muted-foreground hover:text-foreground'
					)}
					onclick={() => (viewMode = 'list')}
				>
					<List class="size-4" />
					Liste
				</button>
				<button
					type="button"
					class={cn(
						'flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors rounded-r-md',
						viewMode === 'calendar'
							? 'bg-muted text-foreground font-medium'
							: 'text-muted-foreground hover:text-foreground'
					)}
					onclick={() => (viewMode = 'calendar')}
				>
					<CalendarDays class="size-4" />
					Calendrier
				</button>
			</div>

			<Button size="sm" onclick={() => openCreateDialog()}>
				<Plus class="size-4 mr-1.5" />
				Ajouter une séance
			</Button>
		</div>
	</div>

	<!-- Empty state -->
	{#if seances.length === 0}
		<Card.Root>
			<Card.Content class="py-12 text-center">
				<Calendar class="size-12 mx-auto text-muted-foreground/30 mb-3" />
				<p class="text-muted-foreground">Aucune séance planifiée pour cette formation.</p>
				<p class="text-sm text-muted-foreground mt-1">
					Créez des séances pour planifier les sessions de formation et suivre les émargements.
				</p>
				<Button variant="outline" class="mt-4" onclick={() => openCreateDialog()}>
					<Plus class="size-4 mr-1.5" />
					Créer la première séance
				</Button>
			</Card.Content>
		</Card.Root>
	{:else if viewMode === 'list'}
		<!-- List View: Grouped by date -->
		<div class="space-y-6">
			{#each groupedSeances as group (group.dateKey)}
				<div>
					<h3 class="text-sm font-medium text-muted-foreground mb-3 capitalize">
						{group.dateLabel}
					</h3>
					<div class="space-y-3">
						{#each group.sessions as seance (seance.id)}
							{@const status = sessionStatus(seance.startAt)}
							{@const signed = seance.emargements?.filter((e) => e.signedAt).length ?? 0}
							{@const total = seance.emargements?.length ?? 0}
							{@const allSigned = total > 0 && signed === total}
							{@const isExpanded = detailSeanceId === seance.id}
							<Card.Root
								class={cn(
									'transition-colors cursor-pointer hover:border-foreground/20',
									status === 'today' && 'ring-2 ring-primary/30',
									status === 'past' && 'opacity-75'
								)}
							>
								<Card.Content class="pt-5 pb-4">
									<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
										<div class="flex-1 space-y-1.5" role="button" tabindex="0" onclick={() => openEditDialog(seance)} onkeydown={(e) => e.key === 'Enter' && openEditDialog(seance)}>
											<div class="flex items-center gap-2 flex-wrap">
												<span class="text-sm font-semibold">
													{formatTime(seance.startAt)} – {formatTime(seance.endAt)}
												</span>
												<span class="text-xs text-muted-foreground">
													({durationHours(seance.startAt, seance.endAt)}h)
												</span>
												<Badge
													variant={status === 'today' ? 'default' : 'outline'}
													class="text-xs"
												>
													{#if status === 'past'}Passée{:else if status === 'today'}Aujourd'hui{:else}À venir{/if}
												</Badge>
											</div>

											<div class="flex flex-wrap gap-3 text-sm text-muted-foreground">
												{#if seance.module}
													<span class="font-medium text-foreground">{seance.module.name}</span>
												{/if}
												{#if seance.formateur?.user}
													<span class="flex items-center gap-1">
														<User class="size-3.5 shrink-0" />
														{formateurName(seance.formateur)}
													</span>
												{/if}
												{#if seance.location}
													<span class="flex items-center gap-1">
														<MapPin class="size-3.5 shrink-0" />
														{seance.location}
													</span>
												{/if}
												{#if seance.room}
													<span class="flex items-center gap-1">
														<DoorOpen class="size-3.5 shrink-0" />
														{seance.room}
													</span>
												{/if}
											</div>
										</div>

										<!-- Emargement summary -->
										<div class="flex items-center gap-3">
											<button
												type="button"
												class="flex items-center gap-2 text-sm hover:underline"
												onclick={() => toggleDetail(seance.id)}
											>
												<FileSignature class="size-4 text-muted-foreground" />
												<span class="font-medium">{signed}/{total}</span>
												{#if allSigned && total > 0}
													<Badge variant="default" class="text-xs">
														<Check class="size-3 mr-0.5" />Complet
													</Badge>
												{/if}
											</button>
											{#if total > 0}
												<div class="flex gap-0.5">
													{#each Array(total) as _, idx}
														<span
															class={cn(
																'h-2 w-2.5 rounded-sm',
																idx < signed ? 'bg-green-500' : 'bg-muted'
															)}
														></span>
													{/each}
												</div>
											{/if}
											<Button
												variant="ghost"
												size="icon"
												class="size-8"
												onclick={() => openEditDialog(seance)}
											>
												<Pencil class="size-3.5" />
											</Button>
										</div>
									</div>

									<!-- Emargement detail (expanded) -->
									{#if isExpanded && total > 0}
										<div class="mt-4 border-t pt-3">
											<div class="flex items-center justify-between mb-2">
												<p class="text-xs font-medium text-muted-foreground">
													Détail des émargements
												</p>
												<Button
													variant="outline"
													size="sm"
													class="h-7 text-xs"
													onclick={() => openParticipantsStep(seance.id)}
												>
													<Users class="size-3 mr-1" />
													Gérer
												</Button>
											</div>
											<div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
												{#each seance.emargements ?? [] as emargement}
													{@const apprenant = apprenants.find(
														(a) => a.contactId === emargement.contactId
													)}
													<div
														class="flex items-center gap-2 text-sm rounded-md px-2 py-1.5 bg-muted/30"
													>
														{#if emargement.signedAt}
															<Check class="size-3.5 text-green-500 shrink-0" />
														{:else}
															<div
																class="size-3.5 rounded-full border border-muted-foreground/30 shrink-0"
															></div>
														{/if}
														<span
															class={cn(
																'flex-1 truncate',
																!emargement.signedAt && 'text-muted-foreground'
															)}
														>
															{apprenant?.name ?? 'Participant'}
														</span>
														{#if emargement.signedAt}
															<span class="text-xs text-muted-foreground">
																{new Date(emargement.signedAt).toLocaleTimeString(
																	'fr-FR',
																	{ hour: '2-digit', minute: '2-digit' }
																)}
															</span>
														{:else if emargement.signatureToken}
															<button
																type="button"
																class="text-muted-foreground hover:text-foreground transition-colors"
																title="Copier le lien de signature"
																onclick={() => copyToClipboard(emargement.signatureToken)}
															>
																<Copy class="size-3.5" />
															</button>
														{/if}
													</div>
												{/each}
											</div>
										</div>
									{/if}
								</Card.Content>
							</Card.Root>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<!-- Calendar View -->
		<Card.Root>
			<Card.Content class="pt-5 pb-4">
				<div class="flex items-center justify-between mb-4">
					<Button variant="ghost" size="icon" onclick={calPrev}>
						<ChevronLeft class="size-5" />
					</Button>
					<h3 class="text-base font-semibold capitalize">{calMonthLabel}</h3>
					<Button variant="ghost" size="icon" onclick={calNext}>
						<ChevronRight class="size-5" />
					</Button>
				</div>

				<div class="grid grid-cols-7 gap-px">
					{#each DAY_NAMES as day}
						<div class="text-center text-xs font-medium text-muted-foreground py-2">
							{day}
						</div>
					{/each}

					{#each calDays as day (day.dateStr)}
						{@const daySessions = seancesByDate.get(day.dateStr) ?? []}
						{@const hasSession = daySessions.length > 0}
						{@const isToday = day.dateStr === todayStr}
						{@const inRange = isInFormationRange(day.dateStr)}
						<button
							type="button"
							class={cn(
								'relative flex flex-col items-center py-2 px-1 rounded-md text-sm transition-colors min-h-12',
								!day.inMonth && 'text-muted-foreground/40',
								day.inMonth && !isToday && 'text-foreground',
								isToday && 'font-bold',
								inRange && day.inMonth && 'bg-primary/5',
								hasSession && 'hover:bg-muted cursor-pointer',
								!hasSession && day.inMonth && 'hover:bg-muted/50 cursor-pointer'
							)}
							onclick={() => {
								if (hasSession && daySessions.length === 1) {
									openEditDialog(daySessions[0]);
								} else if (hasSession) {
									viewMode = 'list';
								} else {
									openCreateDialog(day.dateStr);
								}
							}}
						>
							<span
								class={cn(
									'flex items-center justify-center size-7 rounded-full',
									isToday && 'bg-primary text-primary-foreground'
								)}
							>
								{day.date.getDate()}
							</span>
							{#if hasSession}
								<div class="flex gap-0.5 mt-1">
									{#each daySessions.slice(0, 3) as s (s.id)}
										<span
											class={cn(
												'size-1.5 rounded-full',
												sessionStatus(s.startAt) === 'past'
													? 'bg-muted-foreground/40'
													: 'bg-primary'
											)}
										></span>
									{/each}
									{#if daySessions.length > 3}
										<span class="text-[10px] text-muted-foreground leading-none">
											+{daySessions.length - 3}
										</span>
									{/if}
								</div>
							{/if}
						</button>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	{/if}
</div>

<!-- Session Create/Edit Dialog -->
<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>
				{#if dialogStep === 'participants'}
					Participants à la séance
				{:else if editingSeance}
					Modifier la séance
				{:else}
					Nouvelle séance
				{/if}
			</Dialog.Title>
			<Dialog.Description>
				{#if dialogStep === 'participants'}
					Sélectionnez les apprenants qui participent à cette séance.
				{:else if editingSeance}
					Modifiez les informations de la séance.
				{:else}
					Renseignez les informations de la séance.
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		{#if dialogStep === 'form'}
			<form
				method="POST"
				action={editingSeance ? '?/updateSession' : '?/createSession'}
			use:enhance={() => {
				submitting = true;
				return async ({ result, update }) => {
					submitting = false;
					if (result.type === 'failure') {
						toast.error(
							(result.data as { message?: string })?.message ?? 'Erreur'
						);
					} else if (result.type === 'error') {
						toast.error('Erreur serveur. Veuillez réessayer.');
					} else if (result.type === 'success') {
						await update();
						if (editingSeance) {
							toast.success('Séance modifiée');
							dialogOpen = false;
						} else {
							toast.success('Séance créée');
							const newId =
								(result.data as { seanceId?: string })?.seanceId ?? null;
							if (newId && apprenants.length > 0) {
								openParticipantsStep(newId);
							} else {
								dialogOpen = false;
							}
						}
					}
				};
			}}
			>
				{#if editingSeance}
					<input type="hidden" name="seanceId" value={editingSeance.id} />
				{/if}
				<input type="hidden" name="startAt" value={formStartAt} />
				<input type="hidden" name="endAt" value={formEndAt} />

				<div class="flex flex-col gap-4 py-2">
					<div class="space-y-1.5">
						<Label for="s-date">Date <span class="text-destructive">*</span></Label>
						<Input
							id="s-date"
							type="date"
							bind:value={formDate}
							required
						/>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<div class="space-y-1.5">
							<Label for="s-start">Début <span class="text-destructive">*</span></Label>
							<Input
								id="s-start"
								type="time"
								bind:value={formStartTime}
								required
							/>
						</div>
						<div class="space-y-1.5">
							<Label for="s-end">Fin <span class="text-destructive">*</span></Label>
							<Input
								id="s-end"
								type="time"
								bind:value={formEndTime}
								required
							/>
						</div>
					</div>

					<div class="space-y-1.5">
						<Label for="s-module">Module <span class="text-destructive">*</span></Label>
						<Select.Root type="single" bind:value={formModuleId} name="moduleId">
							<Select.Trigger id="s-module" class="w-full">
								{modules.find((m) => m.id === formModuleId)?.name || 'Sélectionner un module'}
							</Select.Trigger>
							<Select.Content>
								{#each modules as mod (mod.id)}
									<Select.Item value={mod.id}>{mod.name}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<div class="space-y-1.5">
						<Label for="s-formateur">Formateur</Label>
						<Select.Root type="single" bind:value={formFormateurId} name="formateurId">
							<Select.Trigger id="s-formateur" class="w-full">
								{#if formFormateurId}
									{@const f = formateurs.find((f) => f.id === formFormateurId)}
									{f?.user
										? [f.user.firstName, f.user.lastName].filter(Boolean).join(' ')
										: 'Formateur'}
								{:else}
									Aucun
								{/if}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="">Aucun</Select.Item>
								{#each formateurs as f (f.id)}
									<Select.Item value={f.id}>
										{f.user
											? [f.user.firstName, f.user.lastName].filter(Boolean).join(' ')
											: 'Formateur'}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<div class="space-y-1.5">
						<Label for="s-modality">Modalité</Label>
						<Select.Root
							type="single"
							bind:value={formModalityOverride}
							name="modalityOverride"
						>
							<Select.Trigger id="s-modality" class="w-full">
								{formModalityOverride || `Hériter (${formation?.modalite ?? '—'})` }
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="">Hériter de la formation</Select.Item>
								<Select.Item value="Présentiel">Présentiel</Select.Item>
								<Select.Item value="Distanciel">Distanciel</Select.Item>
								<Select.Item value="Hybride">Hybride</Select.Item>
								<Select.Item value="E-Learning">E-Learning</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>

					{#if showLocationFields}
						<div class="grid grid-cols-2 gap-3">
							<div class="space-y-1.5">
								<Label for="s-location">Lieu</Label>
								<Input
									id="s-location"
									name="location"
									bind:value={formLocation}
									placeholder="Adresse"
								/>
							</div>
							<div class="space-y-1.5">
								<Label for="s-room">Salle</Label>
								<Input
									id="s-room"
									name="room"
									bind:value={formRoom}
									placeholder="Salle A"
								/>
							</div>
						</div>
					{/if}
				</div>

				<Dialog.Footer class="mt-4">
					{#if editingSeance}
						<Button
							type="button"
							variant="destructive"
							size="sm"
							onclick={() => {
								if (editingSeance) {
									dialogOpen = false;
									openDeleteDialog(editingSeance);
								}
							}}
						>
							<Trash2 class="size-4 mr-1" />
							Supprimer
						</Button>
						<div class="flex-1"></div>
					{/if}
					<Button
						type="button"
						variant="outline"
						onclick={() => (dialogOpen = false)}
					>
						Annuler
					</Button>
					<Button type="submit" disabled={submitting || !formModuleId || !formDate}>
						{submitting
							? 'Enregistrement...'
							: editingSeance
								? 'Enregistrer'
								: 'Créer'}
					</Button>
				</Dialog.Footer>
			</form>
		{:else if dialogStep === 'participants'}
			<form
				method="POST"
				action="?/updateEmargementParticipants"
			use:enhance={() => {
				submitting = true;
				return async ({ result, update }) => {
					submitting = false;
					if (result.type === 'failure') {
						toast.error(
							(result.data as { message?: string })?.message ?? 'Erreur'
						);
					} else if (result.type === 'success') {
						await update();
						toast.success('Participants mis à jour');
						dialogOpen = false;
					}
				};
			}}
			>
				<input type="hidden" name="seanceId" value={createdSeanceId ?? ''} />

				<div class="py-2 max-h-[400px] overflow-y-auto space-y-1">
					{#if apprenants.length === 0}
						<p class="text-sm text-muted-foreground text-center py-4">
							Aucun apprenant inscrit à cette formation.
						</p>
					{:else}
						<div class="flex items-center justify-between px-2 pb-2">
							<span class="text-sm text-muted-foreground">
								{selectedContactIds.length}/{apprenants.length} sélectionnés
							</span>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								class="h-7 text-xs"
								onclick={() => {
									const allChecked = selectedContactIds.length === apprenants.length;
									for (const a of apprenants) {
										participantChecked[a.contactId] = !allChecked;
									}
								}}
							>
								{selectedContactIds.length === apprenants.length
									? 'Tout décocher'
									: 'Tout cocher'}
							</Button>
						</div>
						{#each apprenants as apprenant (apprenant.contactId)}
							<label
								class="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted/50 cursor-pointer"
							>
								<Checkbox
									checked={participantChecked[apprenant.contactId] ?? false}
									onCheckedChange={(v) => {
										participantChecked[apprenant.contactId] = v === true;
									}}
								/>
								<span class="text-sm">{apprenant.name}</span>
								{#if participantChecked[apprenant.contactId]}
									<input
										type="hidden"
										name="contactIds"
										value={apprenant.contactId}
									/>
								{/if}
							</label>
						{/each}
					{/if}
				</div>

				<Dialog.Footer class="mt-4">
					<Button
						type="button"
						variant="outline"
						onclick={() => {
							if (editingSeance) {
								dialogStep = 'form';
							} else {
								dialogOpen = false;
							}
						}}
					>
						{editingSeance ? 'Retour' : 'Ignorer'}
					</Button>
					<Button type="submit" disabled={submitting}>
						{submitting ? 'Enregistrement...' : 'Enregistrer'}
					</Button>
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<!-- Delete confirmation -->
<AlertDialog.Root bind:open={deleteDialogOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Supprimer cette séance ?</AlertDialog.Title>
			<AlertDialog.Description>
				{#if deleteSignatureCount > 0}
					<span class="text-destructive font-medium">
						Attention : {deleteSignatureCount} signature{deleteSignatureCount > 1
							? 's'
							: ''} sera{deleteSignatureCount > 1 ? 'ont' : ''} supprimée{deleteSignatureCount >
						1
							? 's'
							: ''}.
					</span>
					<br />
				{/if}
				Cette action est irréversible. La séance et tous ses émargements seront supprimés.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Annuler</AlertDialog.Cancel>
			<form
				method="POST"
				action="?/deleteSession"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'failure') {
						toast.error(
							(result.data as { message?: string })?.message ?? 'Erreur'
						);
					} else if (result.type === 'success') {
						await update();
						toast.success('Séance supprimée');
						deleteDialogOpen = false;
						dialogOpen = false;
					}
				};
			}}
			>
				<input type="hidden" name="seanceId" value={deletingSeance?.id ?? ''} />
				<AlertDialog.Action type="submit" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
					Supprimer
				</AlertDialog.Action>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
