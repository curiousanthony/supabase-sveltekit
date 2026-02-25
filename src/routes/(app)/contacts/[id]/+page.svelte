<script lang="ts">
	import type { PageProps } from './$types';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Button from '$lib/components/ui/button';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import InlineField from '$lib/components/crm/InlineField.svelte';
	import EntityCombobox from '$lib/components/crm/EntityCombobox.svelte';
	import { enhance, applyAction } from '$app/forms';
	import { headerTitleText } from '$lib/stores/header-store';
	import { posteOptions, validateContactName } from '$lib/crm/contact-schema';
	import Building2 from '@lucide/svelte/icons/building-2';
	import Briefcase from '@lucide/svelte/icons/briefcase';
	import Mail from '@lucide/svelte/icons/mail';
	import Phone from '@lucide/svelte/icons/phone';
	import Plus from '@lucide/svelte/icons/plus';
	import X from '@lucide/svelte/icons/x';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import DotsVertical from '@tabler/icons-svelte/icons/dots-vertical';
	import { deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	let { data }: PageProps = $props();

	const contact = $derived(data?.contact);
	const allCompanies = $derived(data?.allCompanies ?? []);
	const linkedCompanies = $derived(
		(contact?.contactCompanies ?? []).map((cc) => cc.company).filter(Boolean)
	);
	const linkedDeals = $derived(contact?.deals ?? []);
	const formationsFromDeals = $derived(
		linkedDeals
			.filter((d) => d.formation != null)
			.map((d) => ({ ...d.formation!, dealName: d.name }))
	);

	// Reactive local state for header badges and display (synced from server, updated on InlineField save)
	let localFirstName = $state('');
	let localLastName = $state('');
	let localPoste = $state('');
	let localEmail = $state('');
	let localPhone = $state('');
	let localLinkedinUrl = $state('');
	let localInternalNotes = $state('');

	$effect(() => {
		localFirstName = contact?.firstName ?? '';
		localLastName = contact?.lastName ?? '';
		localPoste = contact?.poste ?? '';
		localEmail = contact?.email ?? '';
		localPhone = contact?.phone ?? '';
		localLinkedinUrl = contact?.linkedinUrl ?? '';
		localInternalNotes = contact?.internalNotes ?? '';
	});

	const displayName = $derived(
		[localFirstName, localLastName].filter(Boolean).join(' ') || 'Contact'
	);

	$effect(() => {
		headerTitleText.set(displayName);
		return () => headerTitleText.set('');
	});

	// Unlink company
	let unlinkingCompanyId = $state<string | null>(null);
	async function unlinkCompany(companyId: string) {
		unlinkingCompanyId = companyId;
		try {
			const fd = new FormData();
			fd.append('companyId', companyId);
			const res = await fetch('?/unlinkCompany', { method: 'POST', body: fd });
			const result = deserialize(await res.text());
			if (result.type === 'success') {
				await invalidateAll();
			} else if (result.type === 'failure') {
				toast.error((result.data as { message?: string })?.message ?? 'Erreur');
			} else if (result.type === 'error') {
				const msg =
					typeof result.error === 'string'
						? result.error
						: (result.error as { message?: string })?.message ?? 'Erreur serveur. Veuillez réessayer.';
				toast.error(msg);
			}
		} catch (e) {
			toast.error('Erreur de connexion. Veuillez réessayer.');
		} finally {
			unlinkingCompanyId = null;
		}
	}

	// Link company
	let linkingCompany = $state(false);
	async function linkCompany(companyId: string) {
		linkingCompany = true;
		try {
			const fd = new FormData();
			fd.append('companyId', companyId);
			const res = await fetch('?/linkCompany', { method: 'POST', body: fd });
			const result = deserialize(await res.text());
			if (result.type === 'success') {
				await invalidateAll();
			} else if (result.type === 'failure') {
				toast.error((result.data as { message?: string })?.message ?? 'Erreur');
			} else if (result.type === 'error') {
				const msg =
					typeof result.error === 'string'
						? result.error
						: (result.error as { message?: string })?.message ?? 'Erreur serveur. Veuillez réessayer.';
				toast.error(msg);
			}
		} catch (e) {
			toast.error('Erreur de connexion. Veuillez réessayer.');
		} finally {
			linkingCompany = false;
		}
	}

	const allCompanyItems = $derived(
		allCompanies.map((c) => ({ id: c.id, label: c.name }))
	);
	const linkedCompanyIds = $derived(linkedCompanies.map((c) => c?.id ?? '').filter(Boolean));

	function formatCurrency(value: string | null | undefined): string {
		if (value == null) return '—';
		const n = Number(value);
		if (Number.isNaN(n)) return '—';
		return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
	}

	function ownerLabel(owner: {
		firstName?: string | null;
		lastName?: string | null;
		email?: string | null;
	} | null): string {
		if (!owner) return '—';
		const fullName = [owner.firstName, owner.lastName].filter(Boolean).join(' ');
		return fullName || owner.email || '—';
	}

	const posteSelectOptions = posteOptions.map((p) => ({ value: p, label: p }));

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
			<Dialog.Title>Supprimer le contact</Dialog.Title>
			<Dialog.Description>
				Êtes-vous sûr de vouloir supprimer « {displayName} » ? Cette action est irréversible.
			</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/deleteContact"
			use:enhance={() => {
				return async ({ result }) => {
					if (result.type === 'failure') {
						toast.error((result.data as { message?: string })?.message ?? 'Erreur');
					} else if (result.type === 'error') {
						toast.error('Erreur serveur. Veuillez réessayer.');
					} else {
						deleteDialogOpen = false;
						toast.success('Contact supprimé');
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
	<!-- Header row: compact avatar + at-a-glance info + actions menu -->
	<div class="flex items-start justify-between gap-4">
		<div class="flex items-center gap-3">
			<div class={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarBg}`}>
				{initials}
			</div>
			<div class="flex flex-col gap-1.5">
				<div class="flex flex-wrap items-center gap-1.5">
					{#if localPoste}
						<Badge variant="secondary" class="text-xs">{localPoste}</Badge>
					{/if}
					{#each linkedCompanies as company (company?.id)}
						{#if company}
							<a
								href="/contacts/entreprises/{company.id}"
								class="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
							>
								<Building2 class="size-3" />
								{company.name}
							</a>
						{/if}
					{/each}
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
					{#if localPhone}
						<a
							href="tel:{localPhone}"
							class="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
						>
							<Phone class="size-3" />
							{localPhone}
						</a>
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

	<!-- Two-column layout on lg+ -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Left: property grid (2/3) -->
		<div class="lg:col-span-2 flex flex-col gap-6">
			<!-- Identity section -->
			<section class="rounded-xl border bg-card p-5">
				<h2 class="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Identité</h2>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<InlineField
						label="Prénom"
						value={localFirstName}
						field="firstName"
						validate={(v) => validateContactName(v, { requiredMessage: 'Le prénom est requis' })}
						onSaved={(v: string) => { localFirstName = v; }}
					/>
					<InlineField
						label="Nom"
						value={localLastName}
						field="lastName"
						validate={(v) => validateContactName(v, { requiredMessage: 'Le nom est requis' })}
						onSaved={(v: string) => { localLastName = v; }}
					/>
					<InlineField
						label="Poste"
						value={localPoste}
						field="poste"
						type="select"
						options={posteSelectOptions}
						onSaved={(v: string) => { localPoste = v; }}
					/>
				</div>
			</section>

			<!-- Contact info section -->
			<section class="rounded-xl border bg-card p-5">
				<h2 class="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Coordonnées</h2>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<InlineField
						label="Email"
						value={localEmail}
						field="email"
						type="email"
						onSaved={(v: string) => { localEmail = v; }}
					/>
					<InlineField
						label="Téléphone"
						value={localPhone}
						field="phone"
						type="tel"
						onSaved={(v: string) => { localPhone = v; }}
					/>
					<InlineField
						label="LinkedIn"
						value={localLinkedinUrl}
						field="linkedinUrl"
						type="url"
						placeholder="https://linkedin.com/in/..."
						class="sm:col-span-2"
						onSaved={(v: string) => { localLinkedinUrl = v; }}
					/>
				</div>
			</section>

			<!-- Notes -->
			<section class="rounded-xl border bg-card p-5">
				<h2 class="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Notes internes</h2>
				<InlineField
					label=""
					value={localInternalNotes}
					field="internalNotes"
					type="textarea"
					placeholder="Ajouter une note..."
					onSaved={(v: string) => { localInternalNotes = v; }}
				/>
			</section>
		</div>

		<!-- Right sidebar (1/3) -->
		<div class="flex flex-col gap-4">
			<!-- Linked companies -->
			<section class="rounded-xl border bg-card p-4">
				<div class="flex items-center justify-between mb-3">
					<h2 class="text-sm font-semibold">Entreprises</h2>
					<EntityCombobox
						items={allCompanyItems}
						linkedIds={linkedCompanyIds}
						placeholder="Rechercher une entreprise..."
						buttonLabel="Lier une entreprise"
						onLink={linkCompany}
						loading={linkingCompany}
					/>
				</div>

				{#if linkedCompanies.length === 0}
					<p class="text-sm text-muted-foreground">Aucune entreprise liée.</p>
				{:else}
					<div class="flex flex-col gap-1">
						{#each linkedCompanies as company (company?.id)}
							{#if company}
								<div class="flex items-center justify-between gap-2 group/item rounded-md px-1 py-0.5 hover:bg-muted/50 transition-colors">
									<a
										href="/contacts/entreprises/{company.id}"
										class="flex items-center gap-2 text-sm hover:text-primary min-w-0 flex-1 truncate"
									>
										<Building2 class="size-3.5 shrink-0 text-muted-foreground" />
										{company.name}
									</a>
									<button
										type="button"
										onclick={() => unlinkCompany(company.id)}
										disabled={unlinkingCompanyId === company.id}
										class="flex size-5 items-center justify-center rounded text-muted-foreground opacity-0 group-hover/item:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all disabled:opacity-50"
										aria-label="Retirer {company.name}"
									>
										<X class="size-3" />
									</button>
								</div>
							{/if}
						{/each}
					</div>
				{/if}
			</section>

			<!-- Linked deals -->
			<section class="rounded-xl border bg-card p-4">
				<div class="flex items-center justify-between mb-3">
					<h2 class="text-sm font-semibold">Deals</h2>
					<a
						href={contact?.id ? `/deals/creer?contactId=${contact.id}` : '/deals/creer'}
						class="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
						aria-label="Créer un deal"
					>
						<Plus class="size-3.5" />
					</a>
				</div>

				{#if linkedDeals.length === 0}
					<p class="text-sm text-muted-foreground">Aucun deal lié.</p>
				{:else}
					<div class="flex flex-col gap-1">
						{#each linkedDeals as d (d.id)}
							<a
								href="/deals/{d.id}"
								class="flex items-center justify-between gap-2 rounded-md px-1 py-1 hover:bg-muted/50 transition-colors group/deal"
							>
								<div class="flex items-center gap-2 min-w-0 flex-1">
									<Briefcase class="size-3.5 shrink-0 text-muted-foreground" />
									<span class="text-sm truncate">{d.name}</span>
								</div>
								<div class="flex items-center gap-1.5 shrink-0">
									<Badge variant="outline" class="text-xs">{d.stage ?? '—'}</Badge>
									<ExternalLink class="size-3 text-muted-foreground opacity-0 group-hover/deal:opacity-60 transition-opacity" />
								</div>
							</a>
						{/each}
					</div>
				{/if}
			</section>

			<!-- Formations (read-only) -->
			{#if formationsFromDeals.length > 0}
				<section class="rounded-xl border bg-card p-4">
					<h2 class="mb-3 text-sm font-semibold">Formations</h2>
					<div class="flex flex-col gap-1">
						{#each formationsFromDeals as f, i (`${f.id}-${i}`)}
							<div class="flex items-center justify-between gap-2 rounded-md px-1 py-0.5">
								<span class="text-sm truncate flex-1">{f.name ?? '—'}</span>
								<Badge variant="outline" class="text-xs shrink-0">{f.statut ?? '—'}</Badge>
							</div>
						{/each}
					</div>
				</section>
			{/if}
		</div>
	</div>
</div>
