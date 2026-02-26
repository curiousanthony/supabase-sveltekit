<script lang="ts">
	import type { PageProps } from './$types';
	import InlineField from '$lib/components/crm/InlineField.svelte';
	import StarRating from '$lib/components/custom/starRating.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import * as Button from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { enhance, applyAction } from '$app/forms';
	import { headerTitleText } from '$lib/stores/header-store';
	import { toast } from 'svelte-sonner';
	import DotsVertical from '@tabler/icons-svelte/icons/dots-vertical';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Mail from '@lucide/svelte/icons/mail';

	let { data }: PageProps = $props();

	const formateur = $derived(data.formateur);

	// Local reactive state for display
	let localFirstName = $state('');
	let localLastName = $state('');
	let localEmail = $state('');
	let localVille = $state('');
	let localDepartement = $state('');
	let localDescription = $state('');
	let localTauxMin = $state('');
	let localTauxMax = $state('');
	let localRating = $state('');
	let localDisponible = $state('');

	$effect(() => {
		localFirstName = formateur?.user?.firstName ?? '';
		localLastName = formateur?.user?.lastName ?? '';
		localEmail = formateur?.user?.email ?? '';
		localVille = formateur?.ville ?? '';
		localDepartement = formateur?.departement ?? '';
		localDescription = formateur?.description ?? '';
		localTauxMin = formateur?.tauxHoraireMin ?? '';
		localTauxMax = formateur?.tauxHoraireMax ?? '';
		localRating = formateur?.rating ?? '';
		localDisponible = formateur?.disponible7J != null ? String(formateur.disponible7J) : '';
	});

	const displayName = $derived(
		[localFirstName, localLastName].filter(Boolean).join(' ') || 'Formateur'
	);

	$effect(() => {
		headerTitleText.set(displayName);
		return () => headerTitleText.set('');
	});

	// Avatar initials
	const avatarColors = [
		'bg-blue-100 text-blue-700',
		'bg-purple-100 text-purple-700',
		'bg-green-100 text-green-700',
		'bg-orange-100 text-orange-700',
		'bg-pink-100 text-pink-700',
		'bg-teal-100 text-teal-700'
	];
	function avatarColor(name: string) {
		let hash = 0;
		for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
		return avatarColors[Math.abs(hash) % avatarColors.length];
	}
	const initials = $derived(
		((localFirstName?.[0] ?? '') + (localLastName?.[0] ?? '')).toUpperCase() || '?'
	);
	const avatarBg = $derived(avatarColor(displayName));

	const disponibiliteOptions = [
		{ value: 'true', label: 'Disponible' },
		{ value: 'false', label: 'Indisponible' }
	];

	const thematiques = $derived(
		(formateur?.formateursThematiques ?? []).map((ft) => ft.thematique.name)
	);

	// Delete dialog
	let deleteDialogOpen = $state(false);
</script>

<svelte:head>
	<title>{displayName}</title>
</svelte:head>

<!-- Delete confirmation dialog -->
<Dialog.Root bind:open={deleteDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Supprimer le formateur</Dialog.Title>
			<Dialog.Description>
				Êtes-vous sûr de vouloir supprimer « {displayName} » ? Cette action est irréversible.
			</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/deleteFormateur"
			use:enhance={() => {
				return async ({ result }) => {
					if (result.type === 'failure') {
						toast.error((result.data as { message?: string })?.message ?? 'Erreur');
					} else if (result.type === 'error') {
						toast.error('Erreur serveur. Veuillez réessayer.');
					} else {
						deleteDialogOpen = false;
						toast.success('Formateur supprimé');
					}
					await applyAction(result);
				};
			}}
		>
			<Dialog.Footer>
				<Dialog.Close>
					<Button.Root type="button" variant="outline">Annuler</Button.Root>
				</Dialog.Close>
				<Button.Root type="submit" variant="destructive">Supprimer</Button.Root>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<div class="flex flex-col gap-6">
	<!-- Header row: avatar + at-a-glance info + actions menu -->
	<div class="flex items-start justify-between gap-4">
		<div class="flex items-center gap-3">
			<div
				class={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarBg}`}
			>
				{initials}
			</div>
			<div class="flex flex-col gap-1.5">
				<div class="flex flex-wrap items-center gap-2">
					{#if localDisponible === 'true'}
						<Badge variant="outline" class="text-xs gap-1.5">
							<span class="relative flex size-1.5">
								<span
									class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"
								></span>
								<span class="relative inline-flex size-1.5 rounded-full bg-green-500"></span>
							</span>
							Disponible
						</Badge>
					{:else if localDisponible === 'false'}
						<Badge variant="outline" class="text-xs text-muted-foreground gap-1.5">
							<span class="relative inline-flex size-1.5 rounded-full bg-muted-foreground/50"></span>
							Indisponible
						</Badge>
					{/if}
					{#if localRating}
						<StarRating ratingValue={Number(localRating)} size={14} />
					{/if}
				</div>
				<div class="flex flex-wrap items-center gap-2">
					{#if localEmail}
						<a
							href="mailto:{localEmail}"
							class="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
						>
							<Mail class="size-3" />
							{localEmail}
						</a>
					{/if}
					{#if localVille || localDepartement}
						<span
							class="inline-flex items-center gap-1 text-xs text-muted-foreground"
						>
							<MapPin class="size-3" />
							{[localVille, localDepartement].filter(Boolean).join(', ')}
						</span>
					{/if}
				</div>
			</div>
		</div>

		<!-- Actions menu -->
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Button.Root {...props} variant="outline" size="icon" class="size-8 shrink-0">
						<DotsVertical class="size-4" />
					</Button.Root>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end" class="w-44">
				<DropdownMenu.Item variant="destructive" onclick={() => (deleteDialogOpen = true)}>
					<Trash2 class="size-4" />
					Supprimer
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>

	<!-- Two-column layout -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Left: main fields (2/3) -->
		<div class="lg:col-span-2 flex flex-col gap-6">
			<!-- Identity (from users table) -->
			<section class="rounded-xl border bg-card p-5">
				<h2 class="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
					Identité
				</h2>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<InlineField
						label="Prénom"
						value={localFirstName}
						field="firstName"
						action="?/updateUserField"
						onSaved={(v: string) => {
							localFirstName = v;
						}}
					/>
					<InlineField
						label="Nom"
						value={localLastName}
						field="lastName"
						action="?/updateUserField"
						onSaved={(v: string) => {
							localLastName = v;
						}}
					/>
					<InlineField
						label="Email"
						value={localEmail}
						field="email"
						type="email"
						action="?/updateUserField"
						class="sm:col-span-2"
						onSaved={(v: string) => {
							localEmail = v;
						}}
					/>
				</div>
			</section>

			<!-- Formateur profile fields -->
			<section class="rounded-xl border bg-card p-5">
				<h2 class="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
					Profil formateur
				</h2>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<InlineField
						label="Ville"
						value={localVille}
						field="ville"
						action="?/updateFormateurField"
						onSaved={(v: string) => {
							localVille = v;
						}}
					/>
					<InlineField
						label="Département"
						value={localDepartement}
						field="departement"
						action="?/updateFormateurField"
						onSaved={(v: string) => {
							localDepartement = v;
						}}
					/>
					<InlineField
						label="Taux horaire min (€/h)"
						value={localTauxMin}
						field="tauxHoraireMin"
						action="?/updateFormateurField"
						placeholder="ex: 80"
						onSaved={(v: string) => {
							localTauxMin = v;
						}}
					/>
					<InlineField
						label="Taux horaire max (€/h)"
						value={localTauxMax}
						field="tauxHoraireMax"
						action="?/updateFormateurField"
						placeholder="ex: 120"
						onSaved={(v: string) => {
							localTauxMax = v;
						}}
					/>
					<InlineField
						label="Note (0 – 5)"
						value={localRating}
						field="rating"
						action="?/updateFormateurField"
						placeholder="ex: 4.5"
						onSaved={(v: string) => {
							localRating = v;
						}}
					/>
					<InlineField
						label="Disponibilité"
						value={localDisponible}
						field="disponible7J"
						type="select"
						options={disponibiliteOptions}
						action="?/updateFormateurField"
						onSaved={(v: string) => {
							localDisponible = v;
						}}
					/>
				</div>
			</section>

			<!-- Description -->
			<section class="rounded-xl border bg-card p-5">
				<h2 class="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
					Description
				</h2>
				<InlineField
					label=""
					value={localDescription}
					field="description"
					type="textarea"
					action="?/updateFormateurField"
					placeholder="Description du formateur, expertises, expériences..."
					onSaved={(v: string) => {
						localDescription = v;
					}}
				/>
			</section>
		</div>

		<!-- Right sidebar (1/3) -->
		<div class="flex flex-col gap-4">
			<!-- Thématiques -->
			<section class="rounded-xl border bg-card p-4">
				<h2 class="mb-3 text-sm font-semibold">Thématiques</h2>
				{#if thematiques.length === 0}
					<p class="text-sm text-muted-foreground">Aucune thématique associée.</p>
				{:else}
					<div class="flex flex-wrap gap-1.5">
						{#each thematiques as name (name)}
							<Badge variant="secondary" class="text-xs">{name}</Badge>
						{/each}
					</div>
				{/if}
			</section>

			<!-- Taux horaire summary -->
			{#if localTauxMin || localTauxMax}
				<section class="rounded-xl border bg-card p-4">
					<h2 class="mb-3 text-sm font-semibold">Taux horaire</h2>
					<p class="text-sm text-muted-foreground">
						{#if localTauxMin && localTauxMax}
							{localTauxMin} – {localTauxMax} €/h
						{:else if localTauxMin}
							À partir de {localTauxMin} €/h
						{:else}
							Jusqu'à {localTauxMax} €/h
						{/if}
					</p>
				</section>
			{/if}
		</div>
	</div>
</div>
