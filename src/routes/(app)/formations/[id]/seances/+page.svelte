<script lang="ts">
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { PageProps } from './$types';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
	import { cn } from '$lib/utils';
	import { toast } from 'svelte-sonner';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Clock from '@lucide/svelte/icons/clock';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Plus from '@lucide/svelte/icons/plus';
	import FileSignature from '@lucide/svelte/icons/file-signature';
	import Check from '@lucide/svelte/icons/check';
	import User from '@lucide/svelte/icons/user';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import LayoutList from '@lucide/svelte/icons/layout-list';
	import Grid3x3 from '@lucide/svelte/icons/grid-3x3';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import DoorOpen from '@lucide/svelte/icons/door-open';
	import Monitor from '@lucide/svelte/icons/monitor';

	const VIEW_STORAGE_KEY = 'formation-seances-view';

	let { data }: PageProps = $props();

	const formation = $derived(data?.formation);
	const seances = $derived(formation?.seances ?? []);
	const modules = $derived(formation?.modules ?? []);
	const formationFormateurs = $derived(formation?.formationFormateurs ?? []);
	const formationApprenants = $derived(formation?.formationApprenants ?? []);
	const defaultModalite = $derived((formation?.modalite as string | null | undefined) ?? 'Présentiel');

	const apprenantRows = $derived(
		formationApprenants.map((fa) => ({
			contactId: fa.contact.id,
			name:
				[fa.contact.firstName, fa.contact.lastName].filter(Boolean).join(' ') || 'Sans nom',
			email: fa.contact.email
		}))
	);

	let viewMode = $state<'list' | 'calendar'>('list');
	let isMd = $state(true);
	let calendarYear = $state(new Date().getFullYear());
	let calendarMonth = $state(new Date().getMonth());

	let dialogOpen = $state(false);
	let dialogMode = $state<'create' | 'edit'>('create');
	let createStep = $state<1 | 2>(1);
	let editingSessionId = $state<string | null>(null);

	let deleteConfirmOpen = $state(false);

	// Create / edit form state (create step 1 + edit)
	let fieldDate = $state('');
	let fieldStart = $state('09:00');
	let fieldEnd = $state('17:00');
	let fieldModuleId = $state('');
	let fieldFormateurId = $state('');
	let fieldModalityOverride = $state('inherit');
	let fieldLocation = $state('');
	let fieldRoom = $state('');

	let participantSelection = $state<Record<string, boolean>>({});

	$effect(() => {
		if (!browser) return;
		const mq = window.matchMedia('(min-width: 768px)');
		const sync = () => {
			isMd = mq.matches;
			if (!mq.matches) viewMode = 'list';
		};
		sync();
		mq.addEventListener('change', sync);
		return () => mq.removeEventListener('change', sync);
	});

	$effect(() => {
		if (!browser) return;
		const raw = localStorage.getItem(VIEW_STORAGE_KEY);
		if (raw === 'list' || raw === 'calendar') {
			viewMode = raw;
		}
	});

	$effect(() => {
		if (!browser || !isMd) return;
		localStorage.setItem(VIEW_STORAGE_KEY, viewMode);
	});

	function initCalendarMonthFromSessions() {
		const sorted = [...seances].sort((a, b) => a.startAt.localeCompare(b.startAt));
		const ref = sorted[0];
		if (!ref) {
			const n = new Date();
			calendarYear = n.getFullYear();
			calendarMonth = n.getMonth();
			return;
		}
		const d = new Date(ref.startAt);
		calendarYear = d.getFullYear();
		calendarMonth = d.getMonth();
	}

	$effect(() => {
		if (!browser) return;
		if (viewMode !== 'calendar') return;
		initCalendarMonthFromSessions();
	});

	function dateKeyFromDate(d: Date): string {
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${y}-${m}-${day}`;
	}

	function dateKeyLocal(iso: string): string {
		return dateKeyFromDate(new Date(iso));
	}

	const todayStr = $derived(dateKeyFromDate(new Date()));

	function sessionStatus(startAt: string): 'past' | 'today' | 'future' {
		const dateKey = dateKeyLocal(startAt);
		if (dateKey < todayStr) return 'past';
		if (dateKey === todayStr) return 'today';
		return 'future';
	}

	function formatDateLong(iso: string) {
		return new Date(iso).toLocaleDateString('fr-FR', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	function formatTime(iso: string) {
		return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
	}

	function durationHours(start: string, end: string) {
		const diff = (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60);
		return Math.round(diff * 10) / 10;
	}

	function effectiveModality(override: string | null | undefined): string {
		if (override != null && override !== '') return override;
		return defaultModalite;
	}

	function needsRoomOrLocation(modality: string): boolean {
		return modality === 'Présentiel' || modality === 'Hybride';
	}

	const effectiveFieldModality = $derived(
		fieldModalityOverride === 'inherit' || fieldModalityOverride === ''
			? defaultModalite
			: fieldModalityOverride
	);

	const showLocationFields = $derived(needsRoomOrLocation(effectiveFieldModality));

	const sessionsByDate = $derived.by(() => {
		const map: Record<string, typeof seances> = {};
		for (const s of seances) {
			const k = dateKeyLocal(s.startAt);
			if (!map[k]) map[k] = [];
			map[k].push(s);
		}
		return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
	});

	const moduleColorMap = $derived.by(() => {
		const palette = [
			'bg-blue-500',
			'bg-emerald-500',
			'bg-amber-500',
			'bg-violet-500',
			'bg-rose-500',
			'bg-cyan-500'
		];
		const m: Record<string, string> = {};
		let i = 0;
		for (const mod of modules) {
			m[mod.id] = palette[i % palette.length];
			i++;
		}
		return m;
	});

	function sessionsOnDay(isoDay: string) {
		return seances.filter((s) => dateKeyLocal(s.startAt) === isoDay);
	}

	type CalendarCell = { iso: string; inMonth: boolean; dayNum: number };

	function buildMonthGrid(year: number, month: number): CalendarCell[] {
		const first = new Date(year, month, 1);
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		const dow = first.getDay();
		const startPad = dow === 0 ? 6 : dow - 1;
		const cells: CalendarCell[] = [];
		const prevLast = new Date(year, month, 0).getDate();
		for (let i = 0; i < startPad; i++) {
			const day = prevLast - startPad + i + 1;
			const d = new Date(year, month - 1, day);
			cells.push({
				iso: dateKeyFromDate(d),
				inMonth: false,
				dayNum: day
			});
		}
		for (let d = 1; d <= daysInMonth; d++) {
			const dt = new Date(year, month, d);
			cells.push({
				iso: dateKeyFromDate(dt),
				inMonth: true,
				dayNum: d
			});
		}
		let n = 1;
		while (cells.length % 7 !== 0) {
			const dt = new Date(year, month + 1, n);
			cells.push({
				iso: dateKeyFromDate(dt),
				inMonth: false,
				dayNum: n
			});
			n++;
		}
		return cells;
	}

	const calendarCells = $derived(buildMonthGrid(calendarYear, calendarMonth));

	const monthLabel = $derived(
		new Date(calendarYear, calendarMonth, 1).toLocaleDateString('fr-FR', {
			month: 'long',
			year: 'numeric'
		})
	);

	function prevMonth() {
		if (calendarMonth === 0) {
			calendarMonth = 11;
			calendarYear -= 1;
		} else {
			calendarMonth -= 1;
		}
	}

	function nextMonth() {
		if (calendarMonth === 11) {
			calendarMonth = 0;
			calendarYear += 1;
		} else {
			calendarMonth += 1;
		}
	}

	function resetParticipantSelection(all = true) {
		const next: Record<string, boolean> = {};
		for (const a of apprenantRows) {
			next[a.contactId] = all;
		}
		participantSelection = next;
	}

	function openCreate(prefillDate?: string) {
		dialogMode = 'create';
		createStep = 1;
		editingSessionId = null;
		fieldDate = prefillDate ?? todayStr;
		fieldStart = '09:00';
		fieldEnd = '17:00';
		fieldModuleId = '';
		fieldFormateurId = '';
		fieldModalityOverride = 'inherit';
		fieldLocation = '';
		fieldRoom = '';
		resetParticipantSelection(true);
		dialogOpen = true;
	}

	function openEdit(seance: (typeof seances)[number]) {
		dialogMode = 'edit';
		createStep = 1;
		editingSessionId = seance.id;
		fieldDate = dateKeyLocal(seance.startAt);
		fieldStart = formatTimeForInput(seance.startAt);
		fieldEnd = formatTimeForInput(seance.endAt);
		fieldModuleId = seance.moduleId ?? '';
		fieldFormateurId = seance.formateurId ?? '';
		fieldModalityOverride = seance.modalityOverride ?? 'inherit';
		fieldLocation = seance.location ?? '';
		fieldRoom = seance.room ?? '';
		const sel: Record<string, boolean> = {};
		for (const a of apprenantRows) {
			sel[a.contactId] = !!(seance.emargements ?? []).some((e) => e.contactId === a.contactId);
		}
		if (apprenantRows.length > 0 && Object.values(sel).every((v) => !v)) {
			for (const a of apprenantRows) sel[a.contactId] = true;
		}
		participantSelection = sel;
		dialogOpen = true;
	}

	function formatTimeForInput(iso: string): string {
		const d = new Date(iso);
		const h = String(d.getHours()).padStart(2, '0');
		const mi = String(d.getMinutes()).padStart(2, '0');
		return `${h}:${mi}`;
	}

	function formateurDisplayName(
		ff: (typeof formationFormateurs)[number]
	): string {
		const u = ff.formateur?.user;
		if (!u) return 'Formateur';
		const n = [u.firstName, u.lastName].filter(Boolean).join(' ');
		return n || u.email || 'Formateur';
	}

	const selectedModuleLabel = $derived(
		modules.find((m) => m.id === fieldModuleId)?.name ?? 'Aucun module'
	);

	const selectedFfRow = $derived(
		formationFormateurs.find((ff) => ff.formateur?.id === fieldFormateurId)
	);

	const selectedFormateurLabel = $derived(
		selectedFfRow ? formateurDisplayName(selectedFfRow) : 'Aucun formateur'
	);

	function validateStep1(): boolean {
		if (!fieldDate) {
			toast.error('La date est requise');
			return false;
		}
		if (!fieldStart || !fieldEnd) {
			toast.error('Les horaires sont requis');
			return false;
		}
		const start = new Date(`${fieldDate}T${fieldStart}:00`);
		const end = new Date(`${fieldDate}T${fieldEnd}:00`);
		if (end <= start) {
			toast.error('L\'heure de fin doit être après l\'heure de début');
			return false;
		}
		return true;
	}

	function goCreateStep2() {
		if (!validateStep1()) return;
		const em =
			fieldModalityOverride === 'inherit' || fieldModalityOverride === ''
				? defaultModalite
				: fieldModalityOverride;
		if (!needsRoomOrLocation(em)) {
			fieldLocation = '';
			fieldRoom = '';
		}
		createStep = 2;
	}

	const learnerIdsJson = $derived(
		JSON.stringify(
			apprenantRows.filter((a) => participantSelection[a.contactId]).map((a) => a.contactId)
		)
	);

	const editLearnerIdsJson = $derived(
		JSON.stringify(
			apprenantRows.filter((a) => participantSelection[a.contactId]).map((a) => a.contactId)
		)
	);

	function enhanceHandler(closeDialog: boolean) {
		return () =>
			async ({ result }: { result: { type: string; data?: { message?: string } } }) => {
				if (result.type === 'success') {
					toast.success('Enregistré');
					await invalidateAll();
					if (closeDialog) {
						dialogOpen = false;
						createStep = 1;
					}
				} else if (result.type === 'failure') {
					toast.error(result.data?.message ?? 'Une erreur est survenue');
				}
			};
	}

	function enhanceDelete() {
		return () =>
			async ({ result }: { result: { type: string; data?: { message?: string } } }) => {
				if (result.type === 'success') {
					toast.success('Séance supprimée');
					await invalidateAll();
					deleteConfirmOpen = false;
					dialogOpen = false;
				} else if (result.type === 'failure') {
					toast.error(result.data?.message ?? 'Suppression impossible');
				}
			};
	}
</script>

<div class="space-y-6">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<h2 class="text-lg font-semibold flex items-center gap-2 flex-wrap">
			<Calendar class="size-5 shrink-0" />
			Séances
			{#if seances.length > 0}
				<Badge variant="secondary" class="text-xs">{seances.length}</Badge>
			{/if}
		</h2>
		<div class="flex flex-wrap items-center gap-2 justify-end">
			{#if isMd}
				<ToggleGroup.Root
					type="single"
					bind:value={viewMode}
					class="rounded-md border shadow-xs overflow-hidden"
				>
					<ToggleGroup.Item value="list" class="px-3 py-1.5 gap-1.5" aria-label="Vue liste">
						<LayoutList class="size-4" />
						Liste
					</ToggleGroup.Item>
					<ToggleGroup.Item
						value="calendar"
						class="px-3 py-1.5 gap-1.5"
						aria-label="Vue calendrier"
					>
						<Grid3x3 class="size-4" />
						Calendrier
					</ToggleGroup.Item>
				</ToggleGroup.Root>
			{/if}
			<Button type="button" onclick={() => openCreate()}>
				<Plus class="size-4 mr-1" />
				Ajouter une séance
			</Button>
		</div>
	</div>

	{#if viewMode === 'list' || !isMd}
		{#if seances.length === 0}
			<Card.Root>
				<Card.Content class="py-12 text-center">
					<Calendar class="size-12 mx-auto text-muted-foreground/30 mb-3" />
					<p class="text-muted-foreground">Aucune séance planifiée pour cette formation.</p>
					<p class="text-sm text-muted-foreground mt-1">
						Créez des séances pour planifier les sessions et suivre les émargements.
					</p>
					<Button class="mt-4" type="button" onclick={() => openCreate()}>
						<Plus class="size-4 mr-1" />
						Ajouter une séance
					</Button>
				</Card.Content>
			</Card.Root>
		{:else}
			<div class="space-y-8">
				{#each sessionsByDate as [dateKey, daySessions] (dateKey)}
					<div class="space-y-3">
						<h3 class="text-sm font-medium text-muted-foreground capitalize">
							{formatDateLong(daySessions[0].startAt)}
						</h3>
						<div class="space-y-3">
							{#each daySessions as seance (seance.id)}
								{@const status = sessionStatus(seance.startAt)}
								{@const signed = seance.emargements?.filter((e) => e.signedAt).length ?? 0}
								{@const totalEmargements = seance.emargements?.length ?? 0}
								{@const allSigned = totalEmargements > 0 && signed === totalEmargements}
								{@const em = effectiveModality(seance.modalityOverride)}
								<button
									type="button"
									class={cn(
										'w-full text-left rounded-lg border bg-card transition-colors hover:bg-muted/40',
										status === 'today' && 'ring-2 ring-primary/40',
										status === 'past' && 'opacity-70'
									)}
									onclick={() => openEdit(seance)}
								>
									<Card.Root class="border-0 shadow-none bg-transparent">
										<Card.Content class="pt-5 pb-5">
											<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
												<div class="flex-1 space-y-2 min-w-0">
													<div class="flex items-center gap-2 flex-wrap">
														<span class="text-base font-semibold">
															{formatTime(seance.startAt)} – {formatTime(seance.endAt)}
														</span>
														<Badge
															variant={status === 'today' ? 'default' : 'outline'}
															class="text-xs"
														>
															{#if status === 'past'}
																Passée
															{:else if status === 'today'}
																Aujourd'hui
															{:else}
																À venir
															{/if}
														</Badge>
														<span class="text-xs text-muted-foreground">
															({durationHours(seance.startAt, seance.endAt)} h)
														</span>
													</div>

													<div class="flex flex-wrap gap-3 text-sm text-muted-foreground">
														<span class="flex items-center gap-1.5">
															<Clock class="size-4 shrink-0" />
															{formatDateLong(seance.startAt)}
														</span>
														{#if seance.module}
															<span class="font-medium text-foreground">{seance.module.name}</span>
														{/if}
													</div>

													{#if seance.formateur?.user}
														<p class="text-sm flex items-center gap-1.5">
															<User class="size-4 text-muted-foreground shrink-0" />
															{[seance.formateur.user.firstName, seance.formateur.user.lastName]
																.filter(Boolean)
																.join(' ') || 'Formateur'}
														</p>
													{/if}

													<div class="flex flex-wrap gap-2 text-sm text-muted-foreground">
														<Badge variant="outline" class="text-xs">{em}</Badge>
														{#if needsRoomOrLocation(em)}
															{#if seance.location}
																<span class="flex items-center gap-1.5">
																	<MapPin class="size-4 shrink-0" />
																	{seance.location}
																</span>
															{/if}
															{#if seance.room}
																<span class="flex items-center gap-1.5">
																	<DoorOpen class="size-4 shrink-0" />
																	Salle {seance.room}
																</span>
															{/if}
														{:else}
															<span class="flex items-center gap-1.5">
																<Monitor class="size-4 shrink-0" />
																À distance / e-learning
															</span>
														{/if}
													</div>
												</div>

												<div class="sm:text-right space-y-2 shrink-0 w-full sm:w-48">
													<div class="flex items-center gap-2 sm:justify-end">
														<FileSignature class="size-4 text-muted-foreground" />
														<span class="text-sm font-medium">
															Émargement {signed}/{totalEmargements}
														</span>
														{#if allSigned && totalEmargements > 0}
															<Badge variant="default" class="text-xs">
																<Check class="size-3 mr-0.5" />Complet
															</Badge>
														{/if}
													</div>
													{#if totalEmargements > 0}
														<Progress
															value={Math.round((signed / totalEmargements) * 100)}
															class="h-2"
														/>
													{:else}
														<p class="text-xs text-muted-foreground">Aucun participant</p>
													{/if}
												</div>
											</div>

											{#if totalEmargements > 0 && (status === 'today' || status === 'past')}
												<div class="mt-4 border-t pt-3">
													<p class="text-xs font-medium text-muted-foreground mb-2">
														Détail des émargements
													</p>
													<div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
														{#each seance.emargements ?? [] as emargement (emargement.id)}
															{@const apprenant = apprenantRows.find(
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
																	class={cn(!emargement.signedAt && 'text-muted-foreground')}
																>
																	{apprenant?.name ?? 'Participant'}
																</span>
																{#if emargement.signedAt}
																	<span class="text-xs text-muted-foreground ml-auto">
																		{new Date(emargement.signedAt).toLocaleTimeString('fr-FR', {
																			hour: '2-digit',
																			minute: '2-digit'
																		})}
																	</span>
																{/if}
															</div>
														{/each}
													</div>
												</div>
											{/if}
										</Card.Content>
									</Card.Root>
								</button>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{:else}
		<Card.Root>
			<Card.Content class="pt-6">
				<div class="flex items-center justify-between gap-2 mb-4">
					<Button type="button" variant="outline" size="icon" onclick={prevMonth} aria-label="Mois précédent">
						<ChevronLeft class="size-4" />
					</Button>
					<h3 class="text-base font-semibold capitalize text-center flex-1">{monthLabel}</h3>
					<Button type="button" variant="outline" size="icon" onclick={nextMonth} aria-label="Mois suivant">
						<ChevronRight class="size-4" />
					</Button>
				</div>

				<div class="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
					<span>Lun</span><span>Mar</span><span>Mer</span><span>Jeu</span><span>Ven</span><span>Sam</span
					><span>Dim</span>
				</div>

				<div class="grid grid-cols-7 gap-1">
					{#each calendarCells as cell (cell.iso + '-' + cell.dayNum + '-' + cell.inMonth)}
						{@const daySessions = sessionsOnDay(cell.iso)}
						<button
							type="button"
							class={cn(
								'min-h-[72px] rounded-md border p-1 flex flex-col items-stretch gap-0.5 transition-colors',
								cell.inMonth ? 'bg-background' : 'bg-muted/20 text-muted-foreground',
								cell.iso === todayStr && cell.inMonth && 'ring-1 ring-primary/50'
							)}
							onclick={() => {
								if (daySessions.length > 0) {
									openEdit(daySessions[0]);
								} else {
									openCreate(cell.iso);
								}
							}}
						>
							<span class="text-xs font-medium">{cell.dayNum}</span>
							<div class="flex flex-wrap gap-0.5 justify-center mt-auto">
								{#each daySessions as s (s.id)}
									<span
										class={cn(
											'size-1.5 rounded-full shrink-0',
											moduleColorMap[s.moduleId ?? ''] ?? 'bg-primary'
										)}
										title={s.module?.name ?? 'Séance'}
									></span>
								{/each}
							</div>
						</button>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	{/if}
</div>

<Dialog.Root
	bind:open={dialogOpen}
	onOpenChange={(open) => {
		if (!open) createStep = 1;
	}}
>
	<Dialog.Content class="max-w-lg max-h-[90vh] overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title>
				{dialogMode === 'create'
					? createStep === 1
						? 'Nouvelle séance'
						: 'Participants'
					: 'Modifier la séance'}
			</Dialog.Title>
			<Dialog.Description>
				{#if dialogMode === 'create' && createStep === 2}
					Sélectionnez les apprenants convoqués à cette séance.
				{:else if dialogMode === 'create'}
					Planifiez la séance puis attribuez les participants.
				{:else}
					Modifiez les informations et les participants.
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		{#if dialogMode === 'create' && createStep === 1}
			<div class="space-y-4 py-2">
				<div class="grid gap-2">
					<Label for="seance-date">Date</Label>
					<Input id="seance-date" type="date" bind:value={fieldDate} />
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div class="grid gap-2">
						<Label for="seance-start">Début</Label>
						<Input id="seance-start" type="time" bind:value={fieldStart} />
					</div>
					<div class="grid gap-2">
						<Label for="seance-end">Fin</Label>
						<Input id="seance-end" type="time" bind:value={fieldEnd} />
					</div>
				</div>
				<div class="grid gap-2">
					<Label for="seance-module">Module</Label>
					<Select.Root type="single" bind:value={fieldModuleId}>
						<Select.Trigger id="seance-module" class="w-full">
							<span class="truncate">{selectedModuleLabel}</span>
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="">Aucun module</Select.Item>
							{#each modules as m (m.id)}
								<Select.Item value={m.id}>{m.name}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="grid gap-2">
					<Label for="seance-formateur">Formateur</Label>
					<Select.Root type="single" bind:value={fieldFormateurId}>
						<Select.Trigger id="seance-formateur" class="w-full">
							<span class="truncate">{selectedFormateurLabel}</span>
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="">Aucun formateur</Select.Item>
							{#each formationFormateurs as ff (ff.id)}
								{#if ff.formateur}
									<Select.Item value={ff.formateur.id}>{formateurDisplayName(ff)}</Select.Item>
								{/if}
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="grid gap-2">
					<Label>Modalité</Label>
					<Select.Root type="single" bind:value={fieldModalityOverride}>
						<Select.Trigger class="w-full">
							<span class="truncate">
								{fieldModalityOverride === 'inherit'
									? `Hériter (${defaultModalite})`
									: fieldModalityOverride}
							</span>
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="inherit">Hériter ({defaultModalite})</Select.Item>
							<Select.Item value="Présentiel">Présentiel</Select.Item>
							<Select.Item value="Distanciel">Distanciel</Select.Item>
							<Select.Item value="Hybride">Hybride</Select.Item>
							<Select.Item value="E-Learning">E-Learning</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>
				{#if showLocationFields}
					<div class="grid gap-2">
						<Label for="seance-loc">Lieu</Label>
						<Input id="seance-loc" bind:value={fieldLocation} />
					</div>
					<div class="grid gap-2">
						<Label for="seance-room">Salle</Label>
						<Input id="seance-room" bind:value={fieldRoom} />
					</div>
				{/if}
			</div>
			<Dialog.Footer class="gap-2 sm:justify-between">
				<Button type="button" variant="outline" onclick={() => (dialogOpen = false)}>Annuler</Button>
				<Button type="button" onclick={goCreateStep2}>Suivant</Button>
			</Dialog.Footer>
		{:else if dialogMode === 'create' && createStep === 2}
			<form
				method="POST"
				action="?/createSession"
				use:enhance={enhanceHandler(true)}
				class="space-y-4"
			>
				<input type="hidden" name="date" value={fieldDate} />
				<input type="hidden" name="startTime" value={fieldStart} />
				<input type="hidden" name="endTime" value={fieldEnd} />
				<input type="hidden" name="moduleId" value={fieldModuleId} />
				<input type="hidden" name="formateurId" value={fieldFormateurId} />
				<input type="hidden" name="modalityOverride" value={fieldModalityOverride} />
				<input type="hidden" name="location" value={fieldLocation} />
				<input type="hidden" name="room" value={fieldRoom} />
				<input type="hidden" name="learnerIds" value={learnerIdsJson} />

				<div class="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
					<p class="text-sm text-muted-foreground">Apprenants</p>
					{#each apprenantRows as a (a.contactId)}
						<label
							class="flex items-center gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/40"
						>
							<Checkbox
								checked={participantSelection[a.contactId] ?? false}
								onCheckedChange={(v) => {
									participantSelection = {
										...participantSelection,
										[a.contactId]: v === true
									};
								}}
							/>
							<span class="flex flex-col min-w-0">
								<span class="text-sm font-medium truncate">{a.name}</span>
								{#if a.email}
									<span class="text-xs text-muted-foreground truncate">{a.email}</span>
								{/if}
							</span>
						</label>
					{/each}
				</div>

				<Dialog.Footer class="gap-2 sm:justify-between">
					<Button type="button" variant="outline" onclick={() => (createStep = 1)}>Retour</Button>
					<Button type="submit">Créer la séance</Button>
				</Dialog.Footer>
			</form>
		{:else}
			<form method="POST" action="?/updateSession" use:enhance={enhanceHandler(false)} class="space-y-4">
				<input type="hidden" name="sessionId" value={editingSessionId ?? ''} />
				<div class="grid gap-2">
					<Label for="edit-date">Date</Label>
					<Input id="edit-date" type="date" name="date" bind:value={fieldDate} />
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div class="grid gap-2">
						<Label for="edit-start">Début</Label>
						<Input id="edit-start" type="time" name="startTime" bind:value={fieldStart} />
					</div>
					<div class="grid gap-2">
						<Label for="edit-end">Fin</Label>
						<Input id="edit-end" type="time" name="endTime" bind:value={fieldEnd} />
					</div>
				</div>
				<div class="grid gap-2">
					<Label for="edit-module">Module</Label>
					<Select.Root type="single" bind:value={fieldModuleId}>
						<Select.Trigger id="edit-module" class="w-full">
							<span class="truncate">{selectedModuleLabel}</span>
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="">Aucun module</Select.Item>
							{#each modules as m (m.id)}
								<Select.Item value={m.id}>{m.name}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					<input type="hidden" name="moduleId" value={fieldModuleId} />
				</div>
				<div class="grid gap-2">
					<Label for="edit-formateur">Formateur</Label>
					<Select.Root type="single" bind:value={fieldFormateurId}>
						<Select.Trigger id="edit-formateur" class="w-full">
							<span class="truncate">{selectedFormateurLabel}</span>
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="">Aucun formateur</Select.Item>
							{#each formationFormateurs as ff (ff.id)}
								{#if ff.formateur}
									<Select.Item value={ff.formateur.id}>{formateurDisplayName(ff)}</Select.Item>
								{/if}
							{/each}
						</Select.Content>
					</Select.Root>
					<input type="hidden" name="formateurId" value={fieldFormateurId} />
				</div>
				<div class="grid gap-2">
					<Label>Modalité</Label>
					<Select.Root type="single" bind:value={fieldModalityOverride}>
						<Select.Trigger class="w-full">
							<span class="truncate">
								{fieldModalityOverride === 'inherit'
									? `Hériter (${defaultModalite})`
									: fieldModalityOverride}
							</span>
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="inherit">Hériter ({defaultModalite})</Select.Item>
							<Select.Item value="Présentiel">Présentiel</Select.Item>
							<Select.Item value="Distanciel">Distanciel</Select.Item>
							<Select.Item value="Hybride">Hybride</Select.Item>
							<Select.Item value="E-Learning">E-Learning</Select.Item>
						</Select.Content>
					</Select.Root>
					<input type="hidden" name="modalityOverride" value={fieldModalityOverride} />
				</div>
				{#if showLocationFields}
					<div class="grid gap-2">
						<Label for="edit-loc">Lieu</Label>
						<Input id="edit-loc" name="location" bind:value={fieldLocation} />
					</div>
					<div class="grid gap-2">
						<Label for="edit-room">Salle</Label>
						<Input id="edit-room" name="room" bind:value={fieldRoom} />
					</div>
				{:else}
					<input type="hidden" name="location" value="" />
					<input type="hidden" name="room" value="" />
				{/if}
				<Dialog.Footer class="flex-col gap-2 sm:flex-row sm:justify-between">
					<Button type="button" variant="destructive" class="sm:mr-auto" onclick={() => (deleteConfirmOpen = true)}>
						<Trash2 class="size-4 mr-1" />
						Supprimer
					</Button>
					<div class="flex gap-2 w-full sm:w-auto justify-end">
						<Button type="button" variant="outline" onclick={() => (dialogOpen = false)}
							>Fermer</Button
						>
						<Button type="submit">Enregistrer</Button>
					</div>
				</Dialog.Footer>
			</form>

			<form
				method="POST"
				action="?/updateEmargementParticipants"
				use:enhance={enhanceHandler(false)}
				class="space-y-3 border-t pt-4 mt-2"
			>
				<input type="hidden" name="sessionId" value={editingSessionId ?? ''} />
				<input type="hidden" name="learnerIds" value={editLearnerIdsJson} />
				<p class="text-sm font-medium">Participants</p>
				<div class="space-y-2 max-h-[36vh] overflow-y-auto pr-1">
					{#each apprenantRows as a (a.contactId)}
						<label
							class="flex items-center gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/40"
						>
							<Checkbox
								checked={participantSelection[a.contactId] ?? false}
								onCheckedChange={(v) => {
									participantSelection = {
										...participantSelection,
										[a.contactId]: v === true
									};
								}}
							/>
							<span class="flex flex-col min-w-0">
								<span class="text-sm font-medium truncate">{a.name}</span>
								{#if a.email}
									<span class="text-xs text-muted-foreground truncate">{a.email}</span>
								{/if}
							</span>
						</label>
					{/each}
				</div>
				<Button type="submit" variant="secondary" class="w-full sm:w-auto">Mettre à jour les participants</Button>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<AlertDialog.Root bind:open={deleteConfirmOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Supprimer cette séance ?</AlertDialog.Title>
			<AlertDialog.Description>
				Cette action est irréversible. Les émargements associés seront supprimés.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer class="gap-2 sm:gap-3">
			<AlertDialog.Cancel type="button">Annuler</AlertDialog.Cancel>
			<form method="POST" action="?/deleteSession" use:enhance={enhanceDelete()} class="inline">
				<input type="hidden" name="sessionId" value={editingSessionId ?? ''} />
				<Button type="submit" variant="destructive">Supprimer</Button>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
