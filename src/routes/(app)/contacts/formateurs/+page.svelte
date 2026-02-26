<script lang="ts">
	import type { PageProps } from './$types';
	import * as Table from '$lib/components/ui/table';
	import * as Button from '$lib/components/ui/button';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Label from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Input } from '$lib/components/ui/input';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import StarRating from '$lib/components/custom/starRating.svelte';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { IconChalkboardTeacher, IconUserPlus } from '@tabler/icons-svelte';
	import LayoutGrid from '@lucide/svelte/icons/layout-grid';
	import LayoutList from '@lucide/svelte/icons/layout-list';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import X from '@lucide/svelte/icons/x';

	let { data }: PageProps = $props();
	let { formateurs } = $derived(data);

	// ── Sort state (3-state: asc → desc → unsorted) ──────────────────────────
	type SortKey = 'firstName' | 'lastName' | 'disponible' | 'rating';
	let sortKey = $state<SortKey | null>(null);
	let sortDir = $state<'asc' | 'desc'>('asc');

	function toggleSort(key: SortKey) {
		if (sortKey === key) {
			if (sortDir === 'asc') {
				sortDir = 'desc';
			} else {
				sortKey = null;
				sortDir = 'asc';
			}
		} else {
			sortKey = key;
			sortDir = 'asc';
		}
	}

	const sortedFormateurs = $derived.by(() => {
		if (!sortKey) return formateurs ?? [];
		const list = [...(formateurs ?? [])];
		const mult = sortDir === 'asc' ? 1 : -1;
		list.sort((a, b) => {
			if (sortKey === 'firstName') {
				const va = (a.user?.firstName ?? '').toLowerCase();
				const vb = (b.user?.firstName ?? '').toLowerCase();
				return mult * va.localeCompare(vb, 'fr', { sensitivity: 'base' });
			}
			if (sortKey === 'lastName') {
				const va = (a.user?.lastName ?? '').toLowerCase();
				const vb = (b.user?.lastName ?? '').toLowerCase();
				return mult * va.localeCompare(vb, 'fr', { sensitivity: 'base' });
			}
			if (sortKey === 'disponible') {
				const va = a.disponible7J ? 1 : 0;
				const vb = b.disponible7J ? 1 : 0;
				return mult * (va - vb);
			}
			if (sortKey === 'rating') {
				const va = Number(a.rating ?? 0);
				const vb = Number(b.rating ?? 0);
				return mult * (va - vb);
			}
			return 0;
		});
		return list;
	});

	// ── Search & filter ───────────────────────────────────────────────────────
	let search = $state('');
	let disponibiliteFilter = $state<'all' | 'disponible' | 'indisponible'>('all');

	const DISPO_OPTIONS = [
		{ value: 'all', label: 'Toutes les disponibilités' },
		{ value: 'disponible', label: 'Disponible' },
		{ value: 'indisponible', label: 'Indisponible' }
	];

	const filteredFormateurs = $derived.by(() => {
		let list = sortedFormateurs;
		const q = search.trim().toLowerCase();
		if (q) {
			list = list.filter((f) => {
				const name = [f.user?.firstName, f.user?.lastName]
					.filter(Boolean)
					.join(' ')
					.toLowerCase();
				const ville = (f.ville ?? '').toLowerCase();
				const dept = (f.departement ?? '').toLowerCase();
				const themes = f.formateursThematiques
					.map((ft) => ft.thematique.name.toLowerCase())
					.join(' ');
				return (
					name.includes(q) || ville.includes(q) || dept.includes(q) || themes.includes(q)
				);
			});
		}
		if (disponibiliteFilter === 'disponible') {
			list = list.filter((f) => f.disponible7J === true);
		} else if (disponibiliteFilter === 'indisponible') {
			list = list.filter((f) => f.disponible7J !== true);
		}
		return list;
	});

	const hasActiveFilters = $derived(
		search.trim() !== '' || disponibiliteFilter !== 'all'
	);

	function clearFilters() {
		search = '';
		disponibiliteFilter = 'all';
	}

	// ── Layout toggle (table / gallery) ──────────────────────────────────────
	let viewMode = $state<'table' | 'gallery'>('table');

	$effect(() => {
		const saved = localStorage.getItem('formateurs-view');
		if (saved === 'gallery' || saved === 'table') viewMode = saved;
	});

	$effect(() => {
		localStorage.setItem('formateurs-view', viewMode);
	});

	// ── Gallery helpers ───────────────────────────────────────────────────────
	const avatarColors = [
		{ bg: 'bg-blue-100', text: 'text-blue-700', banner: 'from-blue-50 to-blue-100/60' },
		{ bg: 'bg-violet-100', text: 'text-violet-700', banner: 'from-violet-50 to-violet-100/60' },
		{ bg: 'bg-emerald-100', text: 'text-emerald-700', banner: 'from-emerald-50 to-emerald-100/60' },
		{ bg: 'bg-amber-100', text: 'text-amber-700', banner: 'from-amber-50 to-amber-100/60' },
		{ bg: 'bg-rose-100', text: 'text-rose-700', banner: 'from-rose-50 to-rose-100/60' },
		{ bg: 'bg-cyan-100', text: 'text-cyan-700', banner: 'from-cyan-50 to-cyan-100/60' }
	];

	function avatarColor(name: string) {
		let hash = 0;
		for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
		return avatarColors[Math.abs(hash) % avatarColors.length];
	}

	function initials(firstName?: string | null, lastName?: string | null) {
		const f = firstName?.[0] ?? '';
		const l = lastName?.[0] ?? '';
		return (f + l).toUpperCase() || '?';
	}

	function fullName(firstName?: string | null, lastName?: string | null) {
		return [firstName, lastName].filter(Boolean).join(' ') || '—';
	}

	// ── Creation dialog ───────────────────────────────────────────────────────
	let createDialogOpen = $state(false);
	let creating = $state(false);

	$effect(() => {
		if (data.openNewModal) {
			createDialogOpen = true;
			const url = new URL(window.location.href);
			url.searchParams.delete('new');
			goto(url.pathname + (url.search ? url.search : ''), { replaceState: true, noScroll: true });
		}
	});
</script>

<!-- Create formateur dialog -->
<Dialog.Root bind:open={createDialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Nouveau formateur</Dialog.Title>
			<Dialog.Description>
				Renseignez les informations du formateur. Vous pourrez compléter son profil après création.
			</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/createFormateur"
			use:enhance={() => {
				creating = true;
				return async ({ result }) => {
					creating = false;
					if (result.type === 'failure') {
						toast.error((result.data as { message?: string })?.message ?? 'Erreur');
					} else if (result.type === 'error') {
						toast.error('Erreur serveur. Veuillez réessayer.');
					} else if (result.type === 'redirect') {
						createDialogOpen = false;
						toast.success('Formateur créé');
						goto(result.location);
					}
				};
			}}
		>
			<div class="flex flex-col gap-4 py-2">
				<div class="grid grid-cols-2 gap-3">
					<div class="flex flex-col gap-1.5">
						<Label.Root for="firstName">Prénom</Label.Root>
						<Input id="firstName" name="firstName" placeholder="Jean" autocomplete="off" />
					</div>
					<div class="flex flex-col gap-1.5">
						<Label.Root for="lastName">Nom <span class="text-destructive">*</span></Label.Root>
						<Input id="lastName" name="lastName" placeholder="Dupont" required autocomplete="off" />
					</div>
				</div>
				<div class="flex flex-col gap-1.5">
					<Label.Root for="email">Email</Label.Root>
					<Input
						id="email"
						name="email"
						type="email"
						placeholder="jean.dupont@email.com"
						autocomplete="off"
					/>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div class="flex flex-col gap-1.5">
						<Label.Root for="ville">Ville</Label.Root>
						<Input id="ville" name="ville" placeholder="Paris" autocomplete="off" />
					</div>
					<div class="flex flex-col gap-1.5">
						<Label.Root for="departement">Département</Label.Root>
						<Input id="departement" name="departement" placeholder="75" autocomplete="off" />
					</div>
				</div>
			</div>
			<Dialog.Footer class="pt-2">
				<Dialog.Close>
					<Button.Root type="button" variant="outline">Annuler</Button.Root>
				</Dialog.Close>
				<Button.Root type="submit" disabled={creating}>
					{creating ? 'Création...' : 'Créer le formateur'}
				</Button.Root>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

{#if !formateurs || formateurs.length === 0}
	<Empty.Root>
		<Empty.Header>
			<Empty.Media variant="icon">
				<IconChalkboardTeacher />
			</Empty.Media>
			<Empty.Title>Aucun formateur ajouté</Empty.Title>
		</Empty.Header>
		<Empty.Content>
			<Button.Root onclick={() => (createDialogOpen = true)}>
				<IconUserPlus class="size-4" />
				Nouveau formateur
			</Button.Root>
		</Empty.Content>
	</Empty.Root>
{:else}
	<div class="flex min-h-0 flex-1 flex-col gap-4">
		<!-- Search / filter bar -->
		<div class="flex flex-wrap items-center gap-2">
			<div class="relative min-w-[180px] flex-1 max-w-sm">
				<Input
					type="search"
					placeholder="Rechercher par nom, ville, thématique..."
					bind:value={search}
					class="pr-8"
					aria-label="Rechercher un formateur"
				/>
			</div>
			<Select.Root type="single" bind:value={disponibiliteFilter}>
				<Select.Trigger class="w-[200px]">
					{DISPO_OPTIONS.find((o) => o.value === disponibiliteFilter)?.label ?? 'Disponibilité'}
				</Select.Trigger>
				<Select.Content>
					{#each DISPO_OPTIONS as opt (opt.value)}
						<Select.Item value={opt.value}>{opt.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			{#if hasActiveFilters}
				<Button.Root variant="ghost" size="sm" onclick={clearFilters} class="gap-1.5">
					<X class="size-3.5" />
					Effacer
				</Button.Root>
			{/if}
			<!-- Layout toggle -->
			<div class="ml-auto flex items-center rounded-lg border bg-card p-1 gap-0.5">
				<button
					type="button"
					onclick={() => (viewMode = 'table')}
					class="inline-flex items-center justify-center rounded-md px-2 py-1.5 text-sm transition-colors
						{viewMode === 'table'
						? 'bg-muted text-foreground shadow-sm'
						: 'text-muted-foreground hover:text-foreground'}"
					aria-label="Vue tableau"
					title="Vue tableau"
				>
					<LayoutList class="size-4" />
				</button>
				<button
					type="button"
					onclick={() => (viewMode = 'gallery')}
					class="inline-flex items-center justify-center rounded-md px-2 py-1.5 text-sm transition-colors
						{viewMode === 'gallery'
						? 'bg-muted text-foreground shadow-sm'
						: 'text-muted-foreground hover:text-foreground'}"
					aria-label="Vue galerie"
					title="Vue galerie"
				>
					<LayoutGrid class="size-4" />
				</button>
			</div>
		</div>

		<!-- Empty state for filters -->
		{#if filteredFormateurs.length === 0 && hasActiveFilters}
			<div
				class="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center gap-3"
			>
				<div class="flex size-12 items-center justify-center rounded-full bg-muted">
					<IconChalkboardTeacher class="size-5 text-muted-foreground" />
				</div>
				<div>
					<p class="text-sm font-medium">Aucun résultat pour cette recherche</p>
					<p class="mt-1 text-sm text-muted-foreground">Essayez d'autres critères ou effacez les filtres.</p>
				</div>
				<Button.Root variant="secondary" onclick={clearFilters}>Effacer les filtres</Button.Root>
			</div>
		{:else if viewMode === 'gallery'}
			<!-- ── Gallery view ─────────────────────────────────────────────── -->
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#each filteredFormateurs as formateur (formateur.id)}
					{@const name = fullName(formateur.user?.firstName, formateur.user?.lastName)}
					{@const color = avatarColor(name)}
					{@const init = initials(formateur.user?.firstName, formateur.user?.lastName)}
					{@const visibleThemes = formateur.formateursThematiques.slice(0, 3)}
					{@const hiddenCount = formateur.formateursThematiques.length - 3}
					<a
						href="/contacts/formateurs/{formateur.id}"
						class="group flex flex-col rounded-xl border bg-card overflow-hidden shadow-sm
							hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 focus:outline-none
							focus-visible:ring-2 focus-visible:ring-ring"
					>
						<!-- Card banner with avatar -->
						<div
							class="flex items-end gap-3 bg-linear-to-br {color.banner} px-4 pb-3 pt-4 border-b"
						>
							<div
								class="flex size-12 shrink-0 items-center justify-center rounded-full {color.bg} {color.text}
									text-base font-semibold shadow-sm ring-2 ring-background"
							>
								{init}
							</div>
							<div class="min-w-0 flex-1 pb-0.5">
								<p class="truncate text-sm font-semibold leading-tight">{name}</p>
								{#if formateur.disponible7J}
									<span class="mt-0.5 inline-flex items-center gap-1 text-xs text-green-600">
										<span class="relative flex size-1.5">
											<span
												class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"
											></span>
											<span class="relative inline-flex size-1.5 rounded-full bg-green-500"></span>
										</span>
										Disponible
									</span>
								{:else}
									<span class="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
										<span class="relative inline-flex size-1.5 rounded-full bg-muted-foreground/40"
										></span>
										Indisponible
									</span>
								{/if}
							</div>
						</div>

						<!-- Card body -->
						<div class="flex flex-1 flex-col gap-2.5 p-4">
							<!-- Rating -->
							<div class="flex items-center gap-2">
								<StarRating ratingValue={Number(formateur.rating)} size={13} />
								{#if formateur.rating}
									<span class="text-xs text-muted-foreground">{Number(formateur.rating).toFixed(1)}</span>
								{:else}
									<span class="text-xs text-muted-foreground">Non noté</span>
								{/if}
							</div>

							<!-- Location -->
							{#if formateur.ville || formateur.departement}
								<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
									<MapPin class="size-3 shrink-0" />
									<span class="truncate">
										{[formateur.ville, formateur.departement].filter(Boolean).join(', ')}
									</span>
								</div>
							{/if}

							<!-- Thématiques -->
							{#if formateur.formateursThematiques.length > 0}
								<div class="flex flex-wrap gap-1">
									{#each visibleThemes as ft}
										<Badge variant="secondary" class="text-xs">{ft.thematique.name}</Badge>
									{/each}
									{#if hiddenCount > 0}
										<Badge variant="outline" class="text-xs text-muted-foreground">+{hiddenCount}</Badge>
									{/if}
								</div>
							{:else}
								<p class="text-xs text-muted-foreground/60">Aucune thématique</p>
							{/if}

							<!-- Hover CTA -->
							<div
								class="mt-auto pt-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100"
							>
								Voir le profil →
							</div>
						</div>
					</a>
				{/each}
			</div>
		{:else}
			<!-- ── Table view ───────────────────────────────────────────────── -->
			<!-- Desktop table -->
			<div class="hidden md:block overflow-auto rounded-xl border bg-card">
				<Table.Root>
					<Table.Header>
						<Table.Row class="hover:bg-transparent border-b">
							<Table.Head
								class="w-[160px]"
								aria-sort={sortKey === 'firstName'
									? sortDir === 'asc'
										? 'ascending'
										: 'descending'
									: 'none'}
							>
								<Table.SortableTableHead
									label="Prénom"
									active={sortKey === 'firstName'}
									direction={sortKey === 'firstName' ? sortDir : null}
									onclick={() => toggleSort('firstName')}
								/>
							</Table.Head>
							<Table.Head
								class="w-[160px]"
								aria-sort={sortKey === 'lastName'
									? sortDir === 'asc'
										? 'ascending'
										: 'descending'
									: 'none'}
							>
								<Table.SortableTableHead
									label="Nom"
									active={sortKey === 'lastName'}
									direction={sortKey === 'lastName' ? sortDir : null}
									onclick={() => toggleSort('lastName')}
								/>
							</Table.Head>
							<Table.Head
								class="w-[130px]"
								aria-sort={sortKey === 'disponible'
									? sortDir === 'asc'
										? 'ascending'
										: 'descending'
									: 'none'}
							>
								<Table.SortableTableHead
									label="Disponibilité"
									active={sortKey === 'disponible'}
									direction={sortKey === 'disponible' ? sortDir : null}
									onclick={() => toggleSort('disponible')}
								/>
							</Table.Head>
							<Table.Head
								class="w-[150px]"
								aria-sort={sortKey === 'rating'
									? sortDir === 'asc'
										? 'ascending'
										: 'descending'
									: 'none'}
							>
								<Table.SortableTableHead
									label="Note"
									active={sortKey === 'rating'}
									direction={sortKey === 'rating' ? sortDir : null}
									onclick={() => toggleSort('rating')}
								/>
							</Table.Head>
							<Table.Head>Thématiques</Table.Head>
							<Table.Head class="w-[120px] text-right">Profil</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each filteredFormateurs as formateur (formateur.id)}
							<Table.Row
								class="cursor-pointer hover:bg-muted/40 transition-colors"
								tabindex={0}
								role="row"
								onclick={() => goto(`/contacts/formateurs/${formateur.id}`)}
								onkeydown={(e: KeyboardEvent) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										goto(`/contacts/formateurs/${formateur.id}`);
									}
								}}
							>
								<Table.Cell>
									<a
										href="/contacts/formateurs/{formateur.id}"
										class="font-medium text-sm hover:underline focus:outline-none focus:underline"
										onclick={(e: MouseEvent) => e.stopPropagation()}
									>
										{formateur.user?.firstName || '—'}
									</a>
								</Table.Cell>
								<Table.Cell>
									<a
										href="/contacts/formateurs/{formateur.id}"
										class="font-medium text-sm hover:underline focus:outline-none focus:underline"
										onclick={(e: MouseEvent) => e.stopPropagation()}
									>
										{formateur.user?.lastName || '—'}
									</a>
								</Table.Cell>
								<Table.Cell>
									{#if formateur.disponible7J}
										<Badge variant="outline" class="text-xs gap-1.5">
											<span class="relative flex size-1.5">
												<span
													class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"
												></span>
												<span class="relative inline-flex size-1.5 rounded-full bg-green-500"></span>
											</span>
											Disponible
										</Badge>
									{:else}
										<Badge variant="outline" class="text-xs text-muted-foreground gap-1.5">
											<span
												class="relative inline-flex size-1.5 rounded-full bg-muted-foreground/50"
											></span>
											Indisponible
										</Badge>
									{/if}
								</Table.Cell>
								<Table.Cell>
									<StarRating ratingValue={Number(formateur.rating)} size={14} />
								</Table.Cell>
								<Table.Cell>
									<div class="flex flex-wrap gap-1">
										{#each formateur.formateursThematiques as ft}
											<Badge variant="secondary" class="text-xs">{ft.thematique.name}</Badge>
										{/each}
										{#if formateur.formateursThematiques.length === 0}
											<span class="text-muted-foreground text-sm">—</span>
										{/if}
									</div>
								</Table.Cell>
								<Table.Cell class="text-right">
									<Button.Root
										href="/contacts/formateurs/{formateur.id}"
										variant="ghost"
										size="sm"
										class="text-xs"
										onclick={(e: MouseEvent) => e.stopPropagation()}
									>
										Voir le profil
									</Button.Root>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>

			<!-- Mobile card list -->
			<div class="flex flex-col gap-2 md:hidden">
				{#each filteredFormateurs as formateur (formateur.id)}
					{@const name = fullName(formateur.user?.firstName, formateur.user?.lastName)}
					<button
						type="button"
						class="flex items-start gap-3 rounded-xl border bg-card p-4 text-left hover:bg-muted/40 transition-colors w-full"
						onclick={() => goto(`/contacts/formateurs/${formateur.id}`)}
					>
						<div class="min-w-0 flex-1">
							<div class="flex items-center justify-between gap-2 mb-1">
								<span class="font-medium text-sm truncate">{name}</span>
								{#if formateur.disponible7J}
									<span class="flex items-center gap-1 text-xs text-green-600 shrink-0">
										<span class="relative inline-flex size-1.5 rounded-full bg-green-500"></span>
										Disponible
									</span>
								{:else}
									<span class="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
										<span
											class="relative inline-flex size-1.5 rounded-full bg-muted-foreground/50"
										></span>
										Indisponible
									</span>
								{/if}
							</div>
							<StarRating ratingValue={Number(formateur.rating)} size={12} />
							{#if formateur.ville || formateur.departement}
								<div class="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
									<MapPin class="size-3 shrink-0" />
									{[formateur.ville, formateur.departement].filter(Boolean).join(', ')}
								</div>
							{/if}
							{#if formateur.formateursThematiques.length > 0}
								<div class="mt-2 flex flex-wrap gap-1">
									{#each formateur.formateursThematiques as ft}
										<Badge variant="secondary" class="text-xs">{ft.thematique.name}</Badge>
									{/each}
								</div>
							{/if}
						</div>
					</button>
				{/each}
			</div>
		{/if}
	</div>
{/if}
