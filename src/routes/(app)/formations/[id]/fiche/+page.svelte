<script lang="ts">
	import type { PageProps } from './$types';
	import * as Card from '$lib/components/ui/card';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Switch } from '$lib/components/ui/switch';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import { CardCheckboxGroup, CardCheckbox } from '$lib/components/ui/card-checkbox';
	import Stepper from '$lib/components/ui/stepper/stepper.svelte';
	import ObjectifsRollup from '$lib/components/formations/fiche/objectifs-rollup.svelte';
	import PedagogiqueTextarea from '$lib/components/formations/fiche/pedagogique-textarea.svelte';
	import { deserialize } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { cn } from '$lib/utils';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import {
		CalendarDate,
		today,
		getLocalTimeZone,
		type DateValue
	} from '@internationalized/date';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import Check from '@lucide/svelte/icons/check';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import Clock from '@lucide/svelte/icons/clock';
	import School from '@lucide/svelte/icons/school';
	import Monitor from '@lucide/svelte/icons/monitor';
	import Shuffle from '@lucide/svelte/icons/shuffle';
	import GraduationCap from '@lucide/svelte/icons/graduation-cap';
	import Building2 from '@lucide/svelte/icons/building-2';
	import X from '@lucide/svelte/icons/x';
	import QuestGuideBanner from '$lib/components/formations/quest-guide-banner.svelte';

	let { data }: PageProps = $props();

	const formation = $derived(data?.formation);
	const dealFromFormation = $derived((formation?.dealsFromFormation ?? [])[0]);
	const companiesList = $derived(data?.companies ?? []);
	const thematiquesList = $derived(data?.thematiques ?? []);
	const sousthematiquesList = $derived(data?.sousthematiques ?? []);

	const TYPE_OPTIONS = [
		{ value: 'Intra', label: 'Intra' },
		{ value: 'Inter', label: 'Inter' },
		{ value: 'CPF', label: 'CPF' }
	];

	const NIVEAU_OPTIONS: Array<{ value: number; label: string }> = [
		{ value: 3, label: 'Niveau 3 — CAP / BEP' },
		{ value: 4, label: 'Niveau 4 — Baccalauréat' },
		{ value: 5, label: 'Niveau 5 — Bac+2 (BTS, DUT)' },
		{ value: 6, label: 'Niveau 6 — Licence / Bac+3' },
		{ value: 7, label: 'Niveau 7 — Master / Bac+5' },
		{ value: 8, label: 'Niveau 8 — Doctorat / Bac+8' }
	];

	let editingField = $state<string | null>(null);
	let editValue = $state('');
	let isSaving = $state(false);

	let openTypePopover = $state(false);
	let openCompanyPopover = $state(false);
	let companySearchValue = $state('');
	let openThematiquePopover = $state(false);
	let thematiqueSearchValue = $state('');
	let openSousthematiquePopover = $state(false);
	let sousthematiqueSearchValue = $state('');

	let openDateDebutPopover = $state(false);
	let openDateFinPopover = $state(false);
	let dateDebutPickerValue = $state<CalendarDate | undefined>(undefined);
	let dateFinPickerValue = $state<CalendarDate | undefined>(undefined);
	let dateDebutPlaceholder = $state<DateValue>(today(getLocalTimeZone()));
	let dateFinPlaceholder = $state<DateValue>(today(getLocalTimeZone()));

	const companyName = $derived(
		formation?.company?.name ?? formation?.client?.legalName ?? null
	);
	const companyId = $derived(formation?.companyId ?? null);

	const filteredSousthematiques = $derived(
		formation?.topicId
			? sousthematiquesList.filter((s) => s.parentTopicId === formation.topicId)
			: []
	);

	let dureeValue = $state(0);
	$effect(() => {
		dureeValue = formation?.duree ?? 0;
	});
	let dureeDebounceTimer: ReturnType<typeof setTimeout> | undefined;

	let modalityArray = $state<(string | number)[]>([]);
	$effect(() => {
		modalityArray = formation?.modalite ? [formation.modalite] : [];
	});

	function dateValueToDbKey(d: DateValue): string {
		return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
	}

	/** YYYY-MM-DD for DB — Drizzle/JSON may use full ISO timestamps. */
	function toDateInputValue(v: string | null | undefined): string {
		if (!v) return '';
		const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(v).trim());
		return m ? m[1] : '';
	}

	function dbStringToCalendarDate(v: string | null | undefined): CalendarDate | undefined {
		const key = toDateInputValue(v);
		if (!key) return undefined;
		const [y, m, d] = key.split('-').map(Number);
		return new CalendarDate(y, m, d);
	}

	$effect(() => {
		dateDebutPickerValue = dbStringToCalendarDate(formation?.dateDebut ?? null);
	});
	$effect(() => {
		dateFinPickerValue = dbStringToCalendarDate(formation?.dateFin ?? null);
	});
	$effect(() => {
		if (dateDebutPickerValue) {
			dateDebutPlaceholder = dateDebutPickerValue;
		}
	});
	$effect(() => {
		if (dateFinPickerValue) {
			dateFinPlaceholder = dateFinPickerValue;
		}
	});

	function handleDateDebutChange(v: DateValue | undefined) {
		if (!v) return;
		const next = dateValueToDbKey(v);
		const prev = toDateInputValue(formation?.dateDebut ?? null);
		if (next !== prev) {
			saveField('dateDebut', next);
		}
		openDateDebutPopover = false;
	}

	function handleDateFinChange(v: DateValue | undefined) {
		if (!v) return;
		const next = dateValueToDbKey(v);
		const prev = toDateInputValue(formation?.dateFin ?? null);
		if (next !== prev) {
			saveField('dateFin', next);
		}
		openDateFinPopover = false;
	}

	async function saveField(field: string, value: string) {
		if (isSaving) return;
		isSaving = true;
		editingField = null;
		try {
			const formData = new FormData();
			formData.append('field', field);
			formData.append('value', value);
			const response = await fetch('?/updateField', { method: 'POST', body: formData });
			const result = deserialize(await response.text());
			if (result.type === 'success') {
				toast.success('Enregistré');
				if (formation?.id) {
					await invalidate(`formation:${formation.id}`);
				}
			} else if (result.type === 'failure') {
				toast.error((result.data as { message?: string })?.message ?? 'Erreur');
			}
		} catch {
			toast.error('Erreur réseau');
		} finally {
			isSaving = false;
		}
	}

	function startEdit(field: string, current: string | number | boolean | null) {
		editingField = field;
		editValue = current === true ? 'true' : current === false ? 'false' : String(current ?? '');
	}

	function handleBlur(field: string, current: string | number | boolean | null) {
		if (editingField !== field) return;
		const nextVal = editValue;
		const prevVal = String(current ?? '');
		if (nextVal !== prevVal) {
			saveField(field, editValue);
		} else {
			editingField = null;
		}
	}

	function handleKeydown(field: string, current: string | number | boolean | null, e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleBlur(field, current);
		}
		if (e.key === 'Escape') {
			editingField = null;
		}
	}

	function formatDateFr(v: string | null | undefined): string {
		if (!v) return '';
		const d = new Date(v + 'T00:00:00');
		if (isNaN(d.getTime())) return String(v);
		return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
	}

	function handleDureeChange(newValue: number) {
		dureeValue = newValue;
		clearTimeout(dureeDebounceTimer);
		dureeDebounceTimer = setTimeout(() => {
			if (newValue !== (formation?.duree ?? 0)) {
				saveField('duree', String(newValue));
			}
		}, 600);
	}

	function handleModalityChange(newValues: (string | number)[]) {
		const newModalite = newValues[0] as string | undefined;
		const currentModalite = formation?.modalite ?? null;
		if (newModalite && newModalite !== currentModalite) {
			saveField('modalite', newModalite);
		}
	}

	$effect(() => {
		handleModalityChange(modalityArray);
	});

	// ── Référencement (certifying) ────────────────────────────────────────────
	// Defensive: never destroy values on toggle off (per UX review). The toggle
	// reflects an *intent* the user can change; underlying field values are
	// preserved so an accidental click is recoverable.
	const hasAnyCertField = $derived(
		!!(
			formation?.codeRncp ||
			formation?.codeRs ||
			formation?.codeCpfFiche ||
			formation?.niveauQualification ||
			formation?.certificateur ||
			formation?.dateEnregistrementRncp
		)
	);
	let certifyingOverride = $state<boolean | null>(null);
	const isCertifying = $derived(certifyingOverride ?? hasAnyCertField);

	function toggleCertifying(checked: boolean) {
		certifyingOverride = checked;
	}

	// ── Niveau qualification (Select bound to int) ────────────────────────────
	const niveauValue = $derived(
		formation?.niveauQualification != null ? String(formation.niveauQualification) : ''
	);
	function handleNiveauChange(v: string) {
		const next = v === '' ? '' : v;
		const prev = niveauValue;
		if (next !== prev) saveField('niveauQualification', next);
	}

	// ── Pédagogique (explicit save handler shared by the textareas) ───────────
	async function savePedagogique(field: 'prerequis' | 'publicVise', value: string) {
		await saveField(field, value);
	}

	// ── Preflight deep link focus ─────────────────────────────────────────────
	onMount(() => {
		requestAnimationFrame(() => {
			const focusKey = page.url.searchParams.get('preflightFocus');
			if (!focusKey) return;
			const el = document.getElementById(`preflight-${focusKey}`) ?? document.querySelector(`[data-preflight-target="${focusKey}"]`);
			if (el) {
				el.scrollIntoView({ block: 'center' });
				if ('focus' in el && typeof el.focus === 'function') (el as HTMLElement).focus();
			} else {
				toast.info(`Impossible d'afficher le champ — ouvrez l'onglet Fiche`);
			}
		});
	});
</script>

<div class="flex flex-col gap-6">
	<QuestGuideBanner />
	{#if dealFromFormation}
		<div class="rounded-lg border bg-muted/50 px-4 py-3 text-sm">
			<span class="text-muted-foreground">Créée depuis le deal</span>
			<a
				href="/deals/{dealFromFormation.id}"
				class="ml-1 font-medium text-primary hover:underline"
			>
				{dealFromFormation.name}
			</a>
		</div>
	{/if}

	<!-- Section 1: Informations generales -->
	<Card.Root class="flex flex-col gap-4">
		<Card.Header>
			<Card.Title>Informations générales</Card.Title>
		</Card.Header>
		<Card.Content class="flex flex-col gap-4">
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<!-- name -->
				<div class="flex flex-col gap-1">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Intitulé</span>
					{#if editingField === 'name'}
						<input
							type="text"
							bind:value={editValue}
							onblur={() => handleBlur('name', formation?.name ?? null)}
							onkeydown={(e) => handleKeydown('name', formation?.name ?? null, e)}
							placeholder="Nom de la formation"
							class="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
							autofocus
						/>
					{:else}
						<button
							type="button"
							class="cursor-text rounded-md border border-transparent px-2 py-1.5 text-sm text-left transition-colors hover:bg-muted/50 hover:border-input"
							onclick={() => startEdit('name', formation?.name ?? null)}
						>
							{#if formation?.name}
								{formation.name}
							{:else}
								<span class="text-muted-foreground">Nom de la formation</span>
							{/if}
						</button>
					{/if}
				</div>

				<!-- type (combobox) -->
				<div class="flex flex-col gap-1">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</span>
					<Popover.Root bind:open={openTypePopover}>
						<Popover.Trigger
							type="button"
							role="combobox"
							aria-expanded={openTypePopover}
							class="inline-flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-input bg-background px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<span class={cn(!formation?.type && 'text-muted-foreground')}>
								{formation?.type ?? 'Sélectionner le type'}
							</span>
							<ChevronsUpDown class="size-3.5 shrink-0 opacity-50" />
						</Popover.Trigger>
						<Popover.Content class="w-[--bits-popover-anchor-width] p-0" align="start">
							<Command.Root>
								<Command.List>
									<Command.Group>
										{#each TYPE_OPTIONS as opt}
											<Command.Item
												value={opt.value}
												class="cursor-pointer"
												onSelect={() => {
													saveField('type', opt.value);
													openTypePopover = false;
												}}
											>
												<Check class={cn('mr-2 size-4', formation?.type !== opt.value && 'text-transparent')} />
												{opt.label}
											</Command.Item>
										{/each}
									</Command.Group>
								</Command.List>
							</Command.Root>
						</Popover.Content>
					</Popover.Root>
				</div>

				<!-- modalite (CardCheckboxGroup) -->
				<div class="flex flex-col gap-1 sm:col-span-2">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Modalité</span>
					<CardCheckboxGroup multiple={false} disallowEmpty={true} bind:value={modalityArray} class="grid-cols-2 sm:grid-cols-4 gap-3">
						<CardCheckbox value="Présentiel" title="Présentiel" subtitle="En salle" icon={School} />
						<CardCheckbox value="Distanciel" title="Distanciel" subtitle="En ligne" icon={Monitor} />
						<CardCheckbox value="Hybride" title="Hybride" subtitle="Mixte" icon={Shuffle} />
						<CardCheckbox value="E-Learning" title="E-Learning" subtitle="Autonome" icon={GraduationCap} />
					</CardCheckboxGroup>
				</div>

				<!-- duree (Stepper + presets) -->
				<div class="flex flex-col gap-1 sm:col-span-2">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Durée (heures)</span>
					<div class="flex flex-wrap items-center gap-2">
						<div class="relative inline-flex items-center">
							<Clock class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
							<Stepper
								bind:value={dureeValue}
								min={0}
								class="pl-8 h-10"
							/>
						</div>
						<ButtonGroup.Root class="h-10">
							<Button type="button" variant="ghost" size="sm" class="h-10 px-4" onclick={() => { dureeValue = 7; handleDureeChange(7); }}>7h</Button>
							<Button type="button" variant="ghost" size="sm" class="h-10 px-4" onclick={() => { dureeValue = 14; handleDureeChange(14); }}>14h</Button>
							<Button type="button" variant="ghost" size="sm" class="h-10 px-4" onclick={() => { dureeValue = 21; handleDureeChange(21); }}>21h</Button>
							<Button type="button" variant="ghost" size="sm" class="h-10 px-4" onclick={() => { dureeValue = 35; handleDureeChange(35); }}>35h</Button>
							<Button type="button" variant="ghost" size="sm" class="h-10 px-4" onclick={() => { dureeValue = 70; handleDureeChange(70); }}>70h</Button>
						</ButtonGroup.Root>
					</div>
				</div>

				<!-- description -->
				<div class="flex flex-col gap-1 sm:col-span-2">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</span>
					{#if editingField === 'description'}
						<textarea
							bind:value={editValue}
							onblur={() => handleBlur('description', formation?.description ?? null)}
							onkeydown={(e) => {
								if (e.key === 'Escape') editingField = null;
								if (e.key === 'Enter' && !e.shiftKey) {
									e.preventDefault();
									handleBlur('description', formation?.description ?? null);
								}
							}}
							rows="3"
							placeholder="Décrivez la formation..."
							class="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
							autofocus
						></textarea>
					{:else}
						<button
							type="button"
							class="cursor-text whitespace-pre-wrap rounded-md border border-transparent px-2 py-1.5 text-sm text-left transition-colors hover:bg-muted/50 hover:border-input"
							onclick={() => startEdit('description', formation?.description ?? null)}
						>
							{#if formation?.description}
								{formation.description}
							{:else}
								<span class="text-muted-foreground">Décrivez la formation...</span>
							{/if}
						</button>
					{/if}
				</div>

				<!-- thematique (searchable combobox) -->
				<div class="flex flex-col gap-1">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Thématique</span>
					<Popover.Root bind:open={openThematiquePopover}>
						<Popover.Trigger
							type="button"
							role="combobox"
							aria-expanded={openThematiquePopover}
							class="inline-flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-input bg-background px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<span class={cn(!formation?.thematique && 'text-muted-foreground')}>
								{formation?.thematique?.name ?? 'Rechercher une thématique...'}
							</span>
							<ChevronsUpDown class="size-3.5 shrink-0 opacity-50" />
						</Popover.Trigger>
						<Popover.Content class="w-[--bits-popover-anchor-width] p-0" align="start">
							<Command.Root>
								<Command.Input placeholder="Rechercher..." class="h-9" bind:value={thematiqueSearchValue} />
								<Command.List>
									<Command.Empty>
										<p class="px-3 py-4 text-center text-sm text-muted-foreground">Aucune thématique trouvée.</p>
									</Command.Empty>
									<Command.Group>
										{#each thematiquesList as t}
											<Command.Item
												value={t.name}
												class="cursor-pointer"
												onSelect={() => {
													saveField('topicId', t.id);
													openThematiquePopover = false;
													thematiqueSearchValue = '';
												}}
											>
												<Check class={cn('mr-2 size-4', formation?.topicId !== t.id && 'text-transparent')} />
												{t.name}
											</Command.Item>
										{/each}
									</Command.Group>
								</Command.List>
							</Command.Root>
						</Popover.Content>
					</Popover.Root>
				</div>

				<!-- sous-thematique -->
				<div class="flex flex-col gap-1">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sous-thématique</span>
					{#if filteredSousthematiques.length > 0}
						<Popover.Root bind:open={openSousthematiquePopover}>
							<Popover.Trigger
								type="button"
								role="combobox"
								aria-expanded={openSousthematiquePopover}
								class="inline-flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-input bg-background px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<span class={cn(!formation?.sousthematique && 'text-muted-foreground')}>
									{formation?.sousthematique?.name ?? 'Choisir...'}
								</span>
								<ChevronsUpDown class="size-3.5 shrink-0 opacity-50" />
							</Popover.Trigger>
							<Popover.Content class="w-[--bits-popover-anchor-width] p-0" align="start">
								<Command.Root>
									<Command.Input placeholder="Rechercher..." class="h-9" bind:value={sousthematiqueSearchValue} />
									<Command.List>
										<Command.Empty>
											<p class="px-3 py-4 text-center text-sm text-muted-foreground">Aucune sous-thématique.</p>
										</Command.Empty>
										<Command.Group>
											{#each filteredSousthematiques as s}
												<Command.Item
													value={s.name}
													class="cursor-pointer"
													onSelect={() => {
														saveField('subtopicsIds', s.id);
														openSousthematiquePopover = false;
														sousthematiqueSearchValue = '';
													}}
												>
													<Check class={cn('mr-2 size-4', formation?.subtopicsIds !== s.id && 'text-transparent')} />
													{s.name}
												</Command.Item>
											{/each}
										</Command.Group>
									</Command.List>
								</Command.Root>
							</Popover.Content>
						</Popover.Root>
					{:else}
						<p class="px-2 py-1.5 text-sm text-muted-foreground">
							{formation?.topicId ? 'Aucune sous-thématique disponible' : 'Sélectionnez d\'abord une thématique'}
						</p>
					{/if}
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Section 2: Logistique -->
	<Card.Root class="flex flex-col gap-4">
		<Card.Header>
			<Card.Title>Logistique</Card.Title>
		</Card.Header>
		<Card.Content class="flex flex-col gap-4">
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<!-- dateDebut -->
			<div class="flex flex-col gap-1" data-preflight-target="dateDebut" id="preflight-dateDebut">
				<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date début</span>
					<Popover.Root bind:open={openDateDebutPopover}>
						<Popover.Trigger
							type="button"
							class="inline-flex h-9 w-full items-center gap-2 cursor-pointer rounded-md border border-input bg-background px-2 py-1.5 text-sm text-left transition-colors hover:bg-accent hover:text-accent-foreground"
						>
							<CalendarIcon class="size-4 text-muted-foreground shrink-0" />
							{#if formation?.dateDebut}
								<span>{formatDateFr(formation.dateDebut)}</span>
							{:else}
								<span class="text-muted-foreground">JJ/MM/AAAA</span>
							{/if}
						</Popover.Trigger>
						<Popover.Content class="w-auto overflow-hidden p-0" align="start">
							<Calendar
								type="single"
								locale="fr-FR"
								captionLayout="dropdown"
								bind:value={dateDebutPickerValue}
								bind:placeholder={dateDebutPlaceholder}
								onValueChange={handleDateDebutChange}
							/>
						</Popover.Content>
					</Popover.Root>
				</div>

				<!-- dateFin -->
				<div class="flex flex-col gap-1">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date fin</span>
					<Popover.Root bind:open={openDateFinPopover}>
						<Popover.Trigger
							type="button"
							class="inline-flex h-9 w-full items-center gap-2 cursor-pointer rounded-md border border-input bg-background px-2 py-1.5 text-sm text-left transition-colors hover:bg-accent hover:text-accent-foreground"
						>
							<CalendarIcon class="size-4 text-muted-foreground shrink-0" />
							{#if formation?.dateFin}
								<span>{formatDateFr(formation.dateFin)}</span>
							{:else}
								<span class="text-muted-foreground">JJ/MM/AAAA</span>
							{/if}
						</Popover.Trigger>
						<Popover.Content class="w-auto overflow-hidden p-0" align="start">
							<Calendar
								type="single"
								locale="fr-FR"
								captionLayout="dropdown"
								bind:value={dateFinPickerValue}
								bind:placeholder={dateFinPlaceholder}
								onValueChange={handleDateFinChange}
							/>
						</Popover.Content>
					</Popover.Root>
				</div>

				<!-- location -->
				<div class="flex flex-col gap-1 sm:col-span-2">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Lieu de formation</span>
					{#if editingField === 'location'}
						<input
							type="text"
							bind:value={editValue}
							onblur={() => handleBlur('location', formation?.location ?? null)}
							onkeydown={(e) => handleKeydown('location', formation?.location ?? null, e)}
							placeholder="Adresse ou lieu de la formation"
							class="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
							autofocus
						/>
					{:else}
						<button
							type="button"
							class="cursor-text rounded-md border border-transparent px-2 py-1.5 text-sm text-left transition-colors hover:bg-muted/50 hover:border-input"
							onclick={() => startEdit('location', formation?.location ?? null)}
						>
							{#if formation?.location}
								{formation.location}
							{:else}
								<span class="text-muted-foreground">Adresse ou lieu de la formation</span>
							{/if}
						</button>
					{/if}
					<p class="text-xs text-muted-foreground">Ex : 12 rue de la Paix, 75002 Paris ou Salle Zoom</p>
				</div>

			<!-- client / company (searchable combobox) -->
			<div class="flex flex-col gap-1 sm:col-span-2" data-preflight-target="client" id="preflight-client">
				<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Client (entreprise)</span>
				<div class="flex items-center gap-2">
					<Popover.Root bind:open={openCompanyPopover}>
						<Popover.Trigger
							type="button"
							role="combobox"
							aria-expanded={openCompanyPopover}
							class="inline-flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-input bg-background px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
								<span class="flex items-center gap-2">
									<Building2 class="size-4 text-muted-foreground shrink-0" />
									<span class={cn(!companyName && 'text-muted-foreground')}>
										{companyName ?? 'Rechercher une entreprise...'}
									</span>
								</span>
								<ChevronsUpDown class="size-3.5 shrink-0 opacity-50" />
							</Popover.Trigger>
							<Popover.Content class="w-[--bits-popover-anchor-width] p-0" align="start">
								<Command.Root>
									<Command.Input placeholder="Rechercher une entreprise..." class="h-9" bind:value={companySearchValue} />
									<Command.List>
										<Command.Empty>
											<p class="px-3 py-4 text-center text-sm text-muted-foreground">Aucune entreprise trouvée.</p>
										</Command.Empty>
										<Command.Group>
											{#each companiesList as company}
												<Command.Item
													value={company.name}
													class="cursor-pointer"
													onSelect={() => {
														saveField('companyId', company.id);
														openCompanyPopover = false;
														companySearchValue = '';
													}}
												>
													<Check class={cn('mr-2 size-4', companyId !== company.id && 'text-transparent')} />
													{company.name}
												</Command.Item>
											{/each}
										</Command.Group>
									</Command.List>
								</Command.Root>
							</Popover.Content>
						</Popover.Root>
						{#if companyId}
							<Button
								variant="ghost"
								size="icon"
								class="size-9 shrink-0"
								onclick={() => saveField('companyId', '')}
								aria-label="Retirer le client"
							>
								<X class="size-4" />
							</Button>
						{/if}
					</div>
					{#if companyId}
						<a
							href="/contacts/entreprises/{companyId}"
							class="text-xs text-primary hover:underline"
						>
							Voir la fiche entreprise
						</a>
					{/if}
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Section: Référencement (collapsible — Hick's Law: hidden by default) -->
	<Card.Root class="flex flex-col gap-4">
		<Card.Header class="flex-row items-center justify-between space-y-0 gap-4">
			<Card.Title>Référencement</Card.Title>
			<div class="flex items-center gap-2">
				<label for="ref-toggle" class="text-sm font-normal text-muted-foreground cursor-pointer">
					Cette formation prépare-t-elle à une certification&nbsp;?
				</label>
				<Switch id="ref-toggle" checked={isCertifying} onCheckedChange={toggleCertifying} />
			</div>
		</Card.Header>
		{#if isCertifying}
			<Card.Content class="flex flex-col gap-4">
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<!-- codeRncp -->
					<div class="flex flex-col gap-1">
						<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Code RNCP</span>
						{#if editingField === 'codeRncp'}
							<input
								type="text"
								bind:value={editValue}
								onblur={() => handleBlur('codeRncp', formation?.codeRncp ?? null)}
								onkeydown={(e) => handleKeydown('codeRncp', formation?.codeRncp ?? null, e)}
								placeholder="Ex : RNCP35584"
								class="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
								autofocus
							/>
						{:else}
							<button
								type="button"
								class="cursor-text rounded-md border border-transparent px-2 py-1.5 text-sm text-left transition-colors hover:bg-muted/50 hover:border-input"
								onclick={() => startEdit('codeRncp', formation?.codeRncp ?? null)}
							>
								{#if formation?.codeRncp}
									{formation.codeRncp}
								{:else}
									<span class="text-muted-foreground">Ex : RNCP35584</span>
								{/if}
							</button>
						{/if}
					</div>

					<!-- codeRs -->
					<div class="flex flex-col gap-1">
						<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Code RS</span>
						{#if editingField === 'codeRs'}
							<input
								type="text"
								bind:value={editValue}
								onblur={() => handleBlur('codeRs', formation?.codeRs ?? null)}
								onkeydown={(e) => handleKeydown('codeRs', formation?.codeRs ?? null, e)}
								placeholder="Ex : RS5692"
								class="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
								autofocus
							/>
						{:else}
							<button
								type="button"
								class="cursor-text rounded-md border border-transparent px-2 py-1.5 text-sm text-left transition-colors hover:bg-muted/50 hover:border-input"
								onclick={() => startEdit('codeRs', formation?.codeRs ?? null)}
							>
								{#if formation?.codeRs}
									{formation.codeRs}
								{:else}
									<span class="text-muted-foreground">Ex : RS5692</span>
								{/if}
							</button>
						{/if}
					</div>

					<!-- codeCpfFiche -->
					<div class="flex flex-col gap-1">
						<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
							Identifiant Mon Compte Formation
						</span>
						{#if editingField === 'codeCpfFiche'}
							<input
								type="text"
								bind:value={editValue}
								onblur={() => handleBlur('codeCpfFiche', formation?.codeCpfFiche ?? null)}
								onkeydown={(e) => handleKeydown('codeCpfFiche', formation?.codeCpfFiche ?? null, e)}
								placeholder="Ex : 1234567890"
								class="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
								autofocus
							/>
						{:else}
							<button
								type="button"
								class="cursor-text rounded-md border border-transparent px-2 py-1.5 text-sm text-left transition-colors hover:bg-muted/50 hover:border-input"
								onclick={() => startEdit('codeCpfFiche', formation?.codeCpfFiche ?? null)}
							>
								{#if formation?.codeCpfFiche}
									{formation.codeCpfFiche}
								{:else}
									<span class="text-muted-foreground">Ex : 1234567890</span>
								{/if}
							</button>
						{/if}
					</div>

					<!-- niveauQualification (Select 3..8) -->
					<div class="flex flex-col gap-1">
						<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
							Niveau de qualification
						</span>
						<Select.Root
							type="single"
							value={niveauValue}
							onValueChange={handleNiveauChange}
						>
							<Select.Trigger class="w-full">
								{#if formation?.niveauQualification != null}
									{NIVEAU_OPTIONS.find((o) => o.value === formation.niveauQualification)?.label ??
										`Niveau ${formation.niveauQualification}`}
								{:else}
									<span class="text-muted-foreground">Sélectionner un niveau</span>
								{/if}
							</Select.Trigger>
							<Select.Content>
								{#each NIVEAU_OPTIONS as opt (opt.value)}
									<Select.Item value={String(opt.value)} label={opt.label}>{opt.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<!-- certificateur -->
					<div class="flex flex-col gap-1">
						<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Certificateur</span>
						{#if editingField === 'certificateur'}
							<input
								type="text"
								bind:value={editValue}
								onblur={() => handleBlur('certificateur', formation?.certificateur ?? null)}
								onkeydown={(e) => handleKeydown('certificateur', formation?.certificateur ?? null, e)}
								placeholder="Nom de l'organisme certificateur"
								class="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
								autofocus
							/>
						{:else}
							<button
								type="button"
								class="cursor-text rounded-md border border-transparent px-2 py-1.5 text-sm text-left transition-colors hover:bg-muted/50 hover:border-input"
								onclick={() => startEdit('certificateur', formation?.certificateur ?? null)}
							>
								{#if formation?.certificateur}
									{formation.certificateur}
								{:else}
									<span class="text-muted-foreground">Nom de l'organisme certificateur</span>
								{/if}
							</button>
						{/if}
					</div>

					<!-- dateEnregistrementRncp -->
					<div class="flex flex-col gap-1">
						<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
							Date d'enregistrement RNCP
						</span>
						{#if editingField === 'dateEnregistrementRncp'}
							<input
								type="date"
								bind:value={editValue}
								onblur={() => handleBlur('dateEnregistrementRncp', formation?.dateEnregistrementRncp ?? null)}
								onkeydown={(e) => handleKeydown('dateEnregistrementRncp', formation?.dateEnregistrementRncp ?? null, e)}
								class="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
								autofocus
							/>
						{:else}
							<button
								type="button"
								class="cursor-text rounded-md border border-transparent px-2 py-1.5 text-sm text-left transition-colors hover:bg-muted/50 hover:border-input"
								onclick={() => startEdit(
									'dateEnregistrementRncp',
									toDateInputValue(formation?.dateEnregistrementRncp ?? null)
								)}
							>
								{#if formation?.dateEnregistrementRncp}
									{formatDateFr(toDateInputValue(formation.dateEnregistrementRncp))}
								{:else}
									<span class="text-muted-foreground">JJ/MM/AAAA</span>
								{/if}
							</button>
						{/if}
					</div>
				</div>
			</Card.Content>
		{/if}
	</Card.Root>

	<!-- Section: Pédagogique -->
	<Card.Root class="flex flex-col gap-4">
		<Card.Header>
			<Card.Title>Pédagogique</Card.Title>
		</Card.Header>
		<Card.Content class="flex flex-col gap-6">
			<ObjectifsRollup
				modules={(formation?.modules ?? []).map((m) => ({
					id: m.id,
					name: m.name,
					objectifs: m.objectifs ?? null,
					orderIndex: m.orderIndex
				}))}
				programmeHref="/formations/{page.params.id}/programme"
			/>

			<PedagogiqueTextarea
				field="prerequis"
				label="Prérequis"
				placeholder="Connaissances ou compétences attendues avant la formation…"
				current={formation?.prerequis ?? null}
				onSave={(val) => savePedagogique('prerequis', val)}
			/>

			<PedagogiqueTextarea
				field="publicVise"
				label="Public visé"
				placeholder="À qui s'adresse cette formation (ex : développeurs juniors, RH, …)"
				current={formation?.publicVise ?? null}
				onSave={(val) => savePedagogique('publicVise', val)}
			/>
		</Card.Content>
	</Card.Root>

	<!-- Section: Tarification -->
	<Card.Root class="flex flex-col gap-4">
		<Card.Header>
			<Card.Title>Tarification</Card.Title>
		</Card.Header>
		<Card.Content class="flex flex-col gap-4">
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<!-- prixPublic -->
				<div class="flex flex-col gap-1">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Prix public (€)</span>
					{#if editingField === 'prixPublic'}
						<input
							type="number"
							step="0.01"
							min="0"
							bind:value={editValue}
							onblur={() => handleBlur('prixPublic', formation?.prixPublic ?? null)}
							onkeydown={(e) => handleKeydown('prixPublic', formation?.prixPublic ?? null, e)}
							placeholder="0,00"
							class="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
							autofocus
						/>
					{:else}
						<button
							type="button"
							class="cursor-text rounded-md border border-transparent px-2 py-1.5 text-sm text-left transition-colors hover:bg-muted/50 hover:border-input"
							onclick={() => startEdit('prixPublic', formation?.prixPublic ?? null)}
						>
							{#if formation?.prixPublic}
								{Number(formation.prixPublic).toLocaleString('fr-FR')} €
							{:else}
								<span class="text-muted-foreground">Tarif affiché sur la fiche CPF / mentions légales</span>
							{/if}
						</button>
					{/if}
				</div>

				<!-- prixConvenu -->
				<div class="flex flex-col gap-1" data-preflight-target="prixConvenu" id="preflight-prixConvenu">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Prix convenu (€)</span>
					{#if editingField === 'prixConvenu'}
						<input
							type="number"
							step="0.01"
							min="0"
							bind:value={editValue}
							onblur={() => handleBlur('prixConvenu', formation?.prixConvenu ?? null)}
							onkeydown={(e) => handleKeydown('prixConvenu', formation?.prixConvenu ?? null, e)}
							placeholder="0,00"
							class="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
							autofocus
						/>
					{:else}
						<button
							type="button"
							class="cursor-text rounded-md border border-transparent px-2 py-1.5 text-sm text-left transition-colors hover:bg-muted/50 hover:border-input"
							onclick={() => startEdit('prixConvenu', formation?.prixConvenu ?? null)}
						>
							{#if formation?.prixConvenu}
								{Number(formation.prixConvenu).toLocaleString('fr-FR')} €
							{:else}
								<span class="text-muted-foreground">Tarif convenu avec le client (mention obligatoire dans la convention)</span>
							{/if}
						</button>
					{/if}
				</div>
			</div>
			<p class="text-xs text-muted-foreground">
				Le détail des financements (CPF, OPCO, employeur…) se gère dans l'onglet
				<a href="/formations/{page.params.id}/finances" class="font-medium text-primary hover:underline">Finances</a>.
			</p>
		</Card.Content>
	</Card.Root>
</div>
