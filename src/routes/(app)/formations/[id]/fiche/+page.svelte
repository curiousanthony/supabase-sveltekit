<script lang="ts">
	import type { PageProps } from './$types';
	import * as Card from '$lib/components/ui/card';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Switch } from '$lib/components/ui/switch';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import { CardCheckboxGroup, CardCheckbox } from '$lib/components/ui/card-checkbox';
	import Stepper from '$lib/components/ui/stepper/stepper.svelte';
	import { deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { tick } from 'svelte';
	import { cn } from '$lib/utils';
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
	const TYPEFINANCEMENT_OPTIONS = [
		{ value: 'CPF', label: 'CPF' },
		{ value: 'OPCO', label: 'OPCO' },
		{ value: 'Inter', label: 'Inter' },
		{ value: 'Intra', label: 'Intra' }
	];

	let editingField = $state<string | null>(null);
	let editValue = $state('');
	let isSaving = $state(false);

	let openTypePopover = $state(false);
	let openFinancementPopover = $state(false);
	let openCompanyPopover = $state(false);
	let companySearchValue = $state('');
	let openThematiquePopover = $state(false);
	let thematiqueSearchValue = $state('');
	let openSousthematiquePopover = $state(false);
	let sousthematiqueSearchValue = $state('');

	let dateDebutInputEl: HTMLInputElement | undefined = $state();
	let dateFinInputEl: HTMLInputElement | undefined = $state();

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
				await invalidateAll();
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
		const str = String(current ?? '');
		if (editValue !== str) {
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

	async function openDatePicker(field: 'dateDebut' | 'dateFin') {
		startEdit(field, formation?.[field] ?? null);
		await tick();
		const el = field === 'dateDebut' ? dateDebutInputEl : dateFinInputEl;
		el?.focus();
		try { el?.showPicker(); } catch { /* not supported in all browsers */ }
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

				<!-- codeRncp -->
				<div class="flex flex-col gap-1 sm:col-span-2">
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
					<p class="text-xs text-muted-foreground">Code du Répertoire National des Certifications Professionnelles, si applicable.</p>
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
				<div class="flex flex-col gap-1">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date début</span>
					{#if editingField === 'dateDebut'}
						<div class="relative">
							<CalendarIcon class="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
							<input
								bind:this={dateDebutInputEl}
								type="date"
								bind:value={editValue}
								onblur={() => handleBlur('dateDebut', formation?.dateDebut ?? null)}
								onkeydown={(e) => handleKeydown('dateDebut', formation?.dateDebut ?? null, e)}
								class="w-full rounded-md border border-input bg-background pl-8 pr-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
								autofocus
							/>
						</div>
					{:else}
						<button
							type="button"
							class="inline-flex items-center gap-2 cursor-pointer rounded-md border border-input bg-background px-2 py-1.5 text-sm text-left transition-colors hover:bg-accent hover:text-accent-foreground"
							onclick={() => openDatePicker('dateDebut')}
						>
							<CalendarIcon class="size-4 text-muted-foreground shrink-0" />
							{#if formation?.dateDebut}
								<span>{formatDateFr(formation.dateDebut)}</span>
							{:else}
								<span class="text-muted-foreground">JJ/MM/AAAA</span>
							{/if}
						</button>
					{/if}
				</div>

				<!-- dateFin -->
				<div class="flex flex-col gap-1">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date fin</span>
					{#if editingField === 'dateFin'}
						<div class="relative">
							<CalendarIcon class="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
							<input
								bind:this={dateFinInputEl}
								type="date"
								bind:value={editValue}
								onblur={() => handleBlur('dateFin', formation?.dateFin ?? null)}
								onkeydown={(e) => handleKeydown('dateFin', formation?.dateFin ?? null, e)}
								class="w-full rounded-md border border-input bg-background pl-8 pr-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
								autofocus
							/>
						</div>
					{:else}
						<button
							type="button"
							class="inline-flex items-center gap-2 cursor-pointer rounded-md border border-input bg-background px-2 py-1.5 text-sm text-left transition-colors hover:bg-accent hover:text-accent-foreground"
							onclick={() => openDatePicker('dateFin')}
						>
							<CalendarIcon class="size-4 text-muted-foreground shrink-0" />
							{#if formation?.dateFin}
								<span>{formatDateFr(formation.dateFin)}</span>
							{:else}
								<span class="text-muted-foreground">JJ/MM/AAAA</span>
							{/if}
						</button>
					{/if}
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
				<div class="flex flex-col gap-1 sm:col-span-2">
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

	<!-- Section 3: Financement -->
	<Card.Root class="flex flex-col gap-4">
		<Card.Header>
			<Card.Title>Financement</Card.Title>
		</Card.Header>
		<Card.Content class="flex flex-col gap-4">
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<!-- typeFinancement (combobox) -->
				<div class="flex flex-col gap-1">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type financement</span>
					<Popover.Root bind:open={openFinancementPopover}>
						<Popover.Trigger
							type="button"
							role="combobox"
							aria-expanded={openFinancementPopover}
							class="inline-flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-input bg-background px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<span class={cn(!formation?.typeFinancement && 'text-muted-foreground')}>
								{formation?.typeFinancement ?? 'Sélectionner'}
							</span>
							<ChevronsUpDown class="size-3.5 shrink-0 opacity-50" />
						</Popover.Trigger>
						<Popover.Content class="w-[--bits-popover-anchor-width] p-0" align="start">
							<Command.Root>
								<Command.List>
									<Command.Group>
										{#each TYPEFINANCEMENT_OPTIONS as opt}
											<Command.Item
												value={opt.value}
												class="cursor-pointer"
												onSelect={() => {
													saveField('typeFinancement', opt.value);
													openFinancementPopover = false;
												}}
											>
												<Check class={cn('mr-2 size-4', formation?.typeFinancement !== opt.value && 'text-transparent')} />
												{opt.label}
											</Command.Item>
										{/each}
									</Command.Group>
								</Command.List>
							</Command.Root>
						</Popover.Content>
					</Popover.Root>
				</div>

				<!-- montantAccorde -->
				<div class="flex flex-col gap-1">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Montant accordé (€)</span>
					{#if editingField === 'montantAccorde'}
						<input
							type="number"
							step="0.01"
							bind:value={editValue}
							onblur={() => handleBlur('montantAccorde', formation?.montantAccorde ?? null)}
							onkeydown={(e) => handleKeydown('montantAccorde', formation?.montantAccorde ?? null, e)}
							placeholder="0.00"
							class="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
							autofocus
						/>
					{:else}
						<button
							type="button"
							class="cursor-text rounded-md border border-transparent px-2 py-1.5 text-sm text-left transition-colors hover:bg-muted/50 hover:border-input"
							onclick={() => startEdit('montantAccorde', formation?.montantAccorde ?? null)}
						>
							{#if formation?.montantAccorde}
								{Number(formation.montantAccorde).toLocaleString('fr-FR')} €
							{:else}
								<span class="text-muted-foreground">0.00</span>
							{/if}
						</button>
					{/if}
				</div>

				<!-- financementAccorde (toggle) -->
				<div class="flex flex-col gap-1">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Financement accordé</span>
					<div class="flex items-center gap-2 pt-1">
						<Switch
							checked={formation?.financementAccorde ?? false}
							onCheckedChange={(v) => saveField('financementAccorde', v ? 'true' : 'false')}
						/>
						<span class="text-sm">{formation?.financementAccorde ? 'Oui' : 'Non'}</span>
					</div>
				</div>

				<!-- tjmFormateur -->
				<div class="flex flex-col gap-1">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">TJM formateur (€)</span>
					{#if editingField === 'tjmFormateur'}
						<input
							type="number"
							step="0.01"
							bind:value={editValue}
							onblur={() => handleBlur('tjmFormateur', formation?.tjmFormateur ?? null)}
							onkeydown={(e) => handleKeydown('tjmFormateur', formation?.tjmFormateur ?? null, e)}
							placeholder="0.00"
							class="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
							autofocus
						/>
					{:else}
						<button
							type="button"
							class="cursor-text rounded-md border border-transparent px-2 py-1.5 text-sm text-left transition-colors hover:bg-muted/50 hover:border-input"
							onclick={() => startEdit('tjmFormateur', formation?.tjmFormateur ?? null)}
						>
							{#if formation?.tjmFormateur}
								{Number(formation.tjmFormateur).toLocaleString('fr-FR')} €
							{:else}
								<span class="text-muted-foreground">0.00</span>
							{/if}
						</button>
					{/if}
					<p class="text-xs text-muted-foreground">Taux Journalier Moyen du formateur. Utilisé pour calculer le coût et la marge de la formation.</p>
				</div>
			</div>
		</Card.Content>
	</Card.Root>
</div>
