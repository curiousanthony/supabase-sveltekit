<script lang="ts">
	import type { PageProps } from './$types';
	import type { DateValue } from '@internationalized/date';
	import { CalendarDate, today, getLocalTimeZone } from '@internationalized/date';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import * as Select from '$lib/components/ui/select';
	import * as CalendarUI from '$lib/components/ui/calendar/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { cn } from '$lib/utils';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { browser } from '$app/environment';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Plus from '@lucide/svelte/icons/plus';
	import Check from '@lucide/svelte/icons/check';
	import User from '@lucide/svelte/icons/user';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Copy from '@lucide/svelte/icons/copy';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Users from '@lucide/svelte/icons/users';
	import DoorOpen from '@lucide/svelte/icons/door-open';
	import QuestGuideBanner from '$lib/components/formations/quest-guide-banner.svelte';

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

	function formatTimeCompact(iso: string) {
		const d = new Date(iso);
		return `${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`;
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
	const seancesByDate = $derived.by(() => {
		const map = new Map<string, typeof seances>();
		for (const s of seances) {
			const key = s.startAt.slice(0, 10);
			if (!map.has(key)) map.set(key, []);
			map.get(key)!.push(s);
		}
		return map;
	});

	function dateValueToKey(d: DateValue): string {
		return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
	}

	let calendarValue = $state<DateValue | undefined>(undefined);
	let calendarPlaceholder = $state<DateValue>(today(getLocalTimeZone()));
	let _calInitialized = false;

	$effect(() => {
		if (!_calInitialized && seances.length > 0) {
			const d = new Date(seances[0].startAt);
			calendarPlaceholder = new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
			_calInitialized = true;
		}
	});

	function handleCalendarClick(value: DateValue | undefined) {
		if (!value) return;
		const dateKey = dateValueToKey(value);
		const daySessions = seancesByDate.get(dateKey);
		if (daySessions && daySessions.length > 0) {
			const el = document.getElementById(`date-${dateKey}`);
			el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		} else {
			openCreateDialog(dateKey);
		}
	}
</script>

<div class="space-y-6">
	<QuestGuideBanner />
	<!-- Header -->
	<div class="flex items-center justify-between gap-4">
		<h2 class="text-lg font-semibold flex items-center gap-2">
			<CalendarIcon class="size-5" />
			Séances
			{#if seances.length > 0}
				<Badge variant="secondary" class="text-xs">{seances.length}</Badge>
			{/if}
		</h2>
		<Button size="sm" onclick={() => openCreateDialog()}>
			<Plus class="size-4 mr-1.5" />
			Ajouter une séance
		</Button>
	</div>

	<!-- Empty state -->
	{#if seances.length === 0}
		<Card.Root>
			<Card.Content class="py-12 text-center">
				<CalendarIcon class="size-12 mx-auto text-muted-foreground/30 mb-3" />
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
	{:else}
		<!-- 2-column layout -->
		<div class="flex flex-col md:flex-row gap-6">
			<!-- Left: scrollable list -->
			<div class="flex-1 min-w-0 space-y-6 md:max-h-[calc(100vh-12rem)] md:overflow-y-auto md:pr-2">
				{#each groupedSeances as group (group.dateKey)}
					<div id="date-{group.dateKey}">
						<h3 class="text-sm font-medium text-muted-foreground mb-3 capitalize">
							{group.dateLabel}
						</h3>
						<div class="space-y-3">
							{#each group.sessions as seance (seance.id)}
								{@const status = sessionStatus(seance.startAt)}
								{@const signed = seance.emargements?.filter((e) => e.signedAt).length ?? 0}
								{@const total = seance.emargements?.length ?? 0}
								{@const isExpanded = detailSeanceId === seance.id}
								<Card.Root
									class={cn(
										'transition-colors cursor-pointer hover:border-foreground/20',
										status === 'today' && 'ring-2 ring-primary/30',
										status === 'past' && 'opacity-75'
									)}
								>
									<Card.Content class="pt-4 pb-3">
										<div
											class="flex items-start justify-between gap-3"
											role="button"
											tabindex="0"
											onclick={() => openEditDialog(seance)}
											onkeydown={(e) => e.key === 'Enter' && openEditDialog(seance)}
										>
											<div class="flex-1 min-w-0 space-y-1.5">
												<div class="flex items-center gap-2 flex-wrap">
													<span class="text-sm font-semibold">
														{formatTimeCompact(seance.startAt)} – {formatTimeCompact(seance.endAt)}
													</span>
													{#if seance.module}
														<span class="text-sm text-foreground">{seance.module.name}</span>
													{/if}
													<Badge
														variant={status === 'today' ? 'default' : 'outline'}
														class="text-xs"
													>
														{#if status === 'past'}Passée{:else if status === 'today'}Aujourd'hui{:else}À venir{/if}
													</Badge>
												</div>

												<div class="flex flex-wrap gap-3 text-xs text-muted-foreground">
													{#if seance.formateur?.user}
														<span class="flex items-center gap-1">
															<User class="size-3 shrink-0" />
															{formateurName(seance.formateur)}
														</span>
													{/if}
													{#if seance.location}
														<span class="flex items-center gap-1">
															<MapPin class="size-3 shrink-0" />
															{seance.location}
														</span>
													{/if}
													{#if seance.room}
														<span class="flex items-center gap-1">
															<DoorOpen class="size-3 shrink-0" />
															{seance.room}
														</span>
													{/if}
												</div>
											</div>

											<Button
												variant="ghost"
												size="icon"
												class="size-7 shrink-0"
												onclick={(e: MouseEvent) => { e.stopPropagation(); openEditDialog(seance); }}
											>
												<Pencil class="size-3.5" />
											</Button>
										</div>

										<!-- Emargement progress bar -->
										{#if total > 0}
											<button
												type="button"
												class="w-full mt-3 text-left"
												onclick={(e) => { e.stopPropagation(); toggleDetail(seance.id); }}
											>
												<div class="flex items-center gap-2">
													<div class="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
														<div
															class="h-full bg-green-500 rounded-full transition-all"
															style="width: {total > 0 ? (signed / total) * 100 : 0}%"
														></div>
													</div>
													<span class="text-xs text-muted-foreground tabular-nums">
														{signed}/{total} signés
													</span>
												</div>
											</button>
										{/if}

										<!-- Emargement detail (expanded) -->
										{#if isExpanded && total > 0}
											<div class="mt-3 border-t pt-3">
												<div class="flex items-center justify-between mb-2">
													<p class="text-xs font-medium text-muted-foreground">
														Détail des émargements
													</p>
													<Button
														variant="outline"
														size="sm"
														class="h-7 text-xs"
														onclick={(e: MouseEvent) => { e.stopPropagation(); openParticipantsStep(seance.id); }}
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

		<!-- Right: sticky calendar -->
		{#snippet calendarDay({ day: dateValue, outsideMonth }: { day: DateValue; outsideMonth: boolean })}
			{@const dateKey = dateValueToKey(dateValue)}
			{@const daySessions = seancesByDate.get(dateKey) ?? []}
			<CalendarUI.Day>
				{dateValue.day}
				{#if daySessions.length > 0 && !outsideMonth}
					<span class="flex gap-0.5">
						{#each daySessions.slice(0, 3) as s (s.id)}
							<span
								class={cn(
									'size-1 rounded-full',
									sessionStatus(s.startAt) === 'past'
										? 'bg-muted-foreground/40'
										: 'bg-primary'
								)}
							></span>
						{/each}
					</span>
				{/if}
			</CalendarUI.Day>
		{/snippet}
		<div class="w-full md:w-[340px] md:shrink-0 md:sticky md:top-4 md:self-start order-first md:order-last">
			<Card.Root>
				<Card.Content class="p-2">
					<CalendarUI.Calendar
						type="single"
						locale="fr-FR"
						bind:value={calendarValue}
						bind:placeholder={calendarPlaceholder}
						onValueChange={handleCalendarClick}
						day={calendarDay}
					/>
				</Card.Content>
			</Card.Root>
		</div>
		</div>
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
