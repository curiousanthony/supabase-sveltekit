<script lang="ts">
	import type { PageProps } from './$types';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Button from '$lib/components/ui/button';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import InlineField from '$lib/components/crm/InlineField.svelte';
	import EntityCombobox from '$lib/components/crm/EntityCombobox.svelte';
	import CityCombobox from '$lib/components/crm/CityCombobox.svelte';
	import { enhance } from '$app/forms';
	import { headerTitleText } from '$lib/stores/header-store';
	import {
		legalStatusOptions,
		industryOptions,
		companySizeOptions
	} from '$lib/crm/company-form-options';
	import Users from '@lucide/svelte/icons/users';
	import Briefcase from '@lucide/svelte/icons/briefcase';
	import X from '@lucide/svelte/icons/x';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Globe from '@lucide/svelte/icons/globe';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import DotsVertical from '@tabler/icons-svelte/icons/dots-vertical';
	import { deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	let { data }: PageProps = $props();

	const company = $derived(data?.company);
	const allContacts = $derived(data?.allContacts ?? []);
	const linkedContacts = $derived(data?.linkedContacts ?? []);
	const linkedDeals = $derived(data?.linkedDeals ?? []);

	// Reactive local state for header badges (synced from server, updated on InlineField save)
	let localName = $state('');
	let localIndustry = $state('');
	let localLegalStatus = $state('');
	let localCompanySize = $state('');
	let localWebsiteUrl = $state('');
	$effect(() => {
		localName = company?.name ?? '';
		localIndustry = company?.industry ?? '';
		localLegalStatus = company?.legalStatus ?? '';
		localCompanySize = company?.companySize ?? '';
		localWebsiteUrl = company?.websiteUrl ?? '';
	});

	$effect(() => {
		headerTitleText.set(localName || 'Entreprise');
		return () => headerTitleText.set('');
	});

	// Avatar color based on name
	const avatarColors = [
		'bg-blue-100 text-blue-700',
		'bg-violet-100 text-violet-700',
		'bg-emerald-100 text-emerald-700',
		'bg-amber-100 text-amber-700',
		'bg-rose-100 text-rose-700',
		'bg-cyan-100 text-cyan-700'
	];
	function avatarColor(name: string) {
		let hash = 0;
		for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
		return avatarColors[Math.abs(hash) % avatarColors.length];
	}
	const avatarBg = $derived(avatarColor(localName));
	const initial = $derived(localName.trim()[0]?.toUpperCase() ?? '?');

	function safeWebsiteHref(url: string): string | null {
		const trimmed = url.trim();
		// Bare domain — normalise to https://
		const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
		try {
			const { protocol } = new URL(withScheme);
			return protocol === 'https:' || protocol === 'http:' ? withScheme : null;
		} catch {
			return null;
		}
	}

	// Unlink contact
	let unlinkingContactId = $state<string | null>(null);
	async function unlinkContact(contactId: string) {
		unlinkingContactId = contactId;
		try {
			const fd = new FormData();
			fd.append('contactId', contactId);
			const res = await fetch('?/unlinkContact', { method: 'POST', body: fd });
			const result = deserialize(await res.text());
			if (result.type === 'failure') {
				toast.error((result.data as { message?: string })?.message ?? 'Erreur');
			} else {
				await invalidateAll();
			}
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Erreur réseau');
		} finally {
			unlinkingContactId = null;
		}
	}

	// Link contact
	let linkingContact = $state(false);
	async function linkContact(contactId: string) {
		linkingContact = true;
		try {
			const fd = new FormData();
			fd.append('contactId', contactId);
			const res = await fetch('?/linkContact', { method: 'POST', body: fd });
			const result = deserialize(await res.text());
			if (result.type === 'failure') {
				toast.error((result.data as { message?: string })?.message ?? 'Erreur');
			} else {
				await invalidateAll();
			}
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Erreur réseau');
		} finally {
			linkingContact = false;
		}
	}

	const allContactItems = $derived(
		allContacts.map((c) => ({ id: c.id, label: fullName(c) }))
	);
	const linkedContactIds = $derived(linkedContacts.map((c) => c.id));

	function fullName(c: { firstName?: string | null; lastName?: string | null; email?: string | null }) {
		const n = [c.firstName, c.lastName].filter(Boolean).join(' ');
		return n || c.email || '—';
	}

	function formatCurrency(value: string | null | undefined): string {
		if (value == null || value === '') return '—';
		const n = Number(value);
		if (Number.isNaN(n)) return '—';
		return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
	}

	const legalStatusOpts = legalStatusOptions.map((o) => ({ value: o, label: o }));
	const industryOpts = industryOptions.map((o) => ({ value: o, label: o }));
	const companySizeOpts = companySizeOptions.map((o) => ({ value: o, label: o }));

	let deleteDialogOpen = $state(false);

	// City / Region co-update
	let localCity = $state('');
	let localRegion = $state('');
	$effect(() => {
		localCity = company?.city ?? '';
		localRegion = company?.region ?? '';
	});

	async function saveCityRegion(cityValue: string, regionValue: string) {
		const saveField = async (field: string, value: string) => {
			const fd = new FormData();
			fd.append('field', field);
			fd.append('value', value);
			const res = await fetch('?/updateField', { method: 'POST', body: fd });
			const result = deserialize(await res.text());
			if (result.type === 'failure') {
				toast.error((result.data as { message?: string })?.message ?? 'Erreur');
				return false;
			}
			return true;
		};
		try {
			const cityOk = await saveField('city', cityValue);
			if (!cityOk) return;
			const regionOk = await saveField('region', regionValue);
			if (!regionOk) return;
			localCity = cityValue;
			localRegion = regionValue;
			await invalidateAll();
		} catch (err) {
			toast.error('Erreur réseau ou serveur. Veuillez réessayer.');
			return;
		}
	}
</script>

<svelte:head>
	<title>{localName || 'Entreprise'}</title>
</svelte:head>

<!-- Delete dialog -->
<Dialog.Root bind:open={deleteDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Supprimer l&apos;entreprise</Dialog.Title>
			<Dialog.Description>
				Êtes-vous sûr de vouloir supprimer « {localName} » ? Cette action est irréversible.
			</Dialog.Description>
		</Dialog.Header>
		<form method="POST" action="?/deleteCompany" use:enhance>
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
	<!-- Header row -->
	<div class="flex items-start justify-between gap-4">
		<div class="flex items-center gap-4">
			<div class={`flex size-14 shrink-0 items-center justify-center rounded-xl text-xl font-bold ${avatarBg}`}>
				{initial}
			</div>
			<div class="flex flex-col gap-1">
				<div class="flex flex-wrap items-center gap-2">
					{#if localIndustry}
						<Badge variant="secondary">{localIndustry}</Badge>
					{/if}
					{#if localLegalStatus}
						<Badge variant="outline">{localLegalStatus}</Badge>
					{/if}
					{#if localCompanySize}
						<Badge variant="outline">{localCompanySize}</Badge>
					{/if}
				</div>
				{#if localWebsiteUrl}
					{@const safeHref = safeWebsiteHref(localWebsiteUrl)}
					{#if safeHref}
						<a
							href={safeHref}
							target="_blank"
							rel="noopener noreferrer"
							class="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
						>
							<Globe class="size-3" />
							{localWebsiteUrl.replace(/^https?:\/\//, '')}
						</a>
					{:else}
						<span class="flex items-center gap-1 text-xs text-muted-foreground">
							<Globe class="size-3" />
							{localWebsiteUrl.replace(/^https?:\/\//, '')}
						</span>
					{/if}
				{/if}
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
		<!-- Left: property grid (2/3) -->
		<div class="lg:col-span-2 flex flex-col gap-6">
			<!-- Identity -->
			<section class="rounded-xl border bg-card p-5">
				<h2 class="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Informations</h2>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<InlineField
						label="Nom"
						value={localName}
						field="name"
						class="sm:col-span-2"
						onSaved={(v: string) => { localName = v; }}
					/>
					<InlineField
						label="SIRET"
						value={company?.siret ?? ''}
						field="siret"
					/>
					<InlineField
						label="Statut juridique"
						value={localLegalStatus}
						field="legalStatus"
						type="select"
						options={legalStatusOpts}
						onSaved={(v: string) => { localLegalStatus = v; }}
					/>
					<InlineField
						label="Industrie"
						value={localIndustry}
						field="industry"
						type="select"
						options={industryOpts}
						onSaved={(v: string) => { localIndustry = v; }}
					/>
					<InlineField
						label="Taille"
						value={localCompanySize}
						field="companySize"
						type="select"
						options={companySizeOpts}
						onSaved={(v: string) => { localCompanySize = v; }}
					/>
				</div>
			</section>

			<!-- Coordonnées -->
			<section class="rounded-xl border bg-card p-5">
				<h2 class="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Coordonnées</h2>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<InlineField
						label="Site web"
						value={localWebsiteUrl}
						field="websiteUrl"
						type="url"
						placeholder="https://..."
						class="sm:col-span-2"
						onSaved={(v: string) => { localWebsiteUrl = v; }}
					/>
					<InlineField
						label="Adresse"
						value={company?.address ?? ''}
						field="address"
						class="sm:col-span-2"
					/>
				<CityCombobox
					city={localCity}
					region={localRegion}
					onSelect={saveCityRegion}
				/>
				</div>
			</section>

			<!-- Notes -->
			<section class="rounded-xl border bg-card p-5">
				<h2 class="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Notes internes</h2>
				<InlineField
					label=""
					value={company?.internalNotes ?? ''}
					field="internalNotes"
					type="textarea"
					placeholder="Ajouter une note..."
				/>
			</section>
		</div>

		<!-- Right sidebar (1/3) -->
		<div class="flex flex-col gap-4">
			<!-- Linked contacts -->
			<section class="rounded-xl border bg-card p-4">
				<div class="flex items-center justify-between mb-3">
					<h2 class="text-sm font-semibold">Contacts</h2>
					<EntityCombobox
						items={allContactItems}
						linkedIds={linkedContactIds}
						placeholder="Rechercher un contact..."
						buttonLabel="Lier un contact"
						onLink={linkContact}
						loading={linkingContact}
					/>
				</div>

				{#if linkedContacts.length === 0}
					<p class="text-sm text-muted-foreground">Aucun contact lié.</p>
				{:else}
					<div class="flex flex-col gap-1">
						{#each linkedContacts as c (c.id)}
							<div class="flex items-center justify-between gap-2 group/item rounded-md px-1 py-0.5 hover:bg-muted/50 transition-colors">
								<a
									href="/contacts/{c.id}"
									class="flex items-center gap-2 text-sm hover:text-primary min-w-0 flex-1 truncate"
								>
									<Users class="size-3.5 shrink-0 text-muted-foreground" />
									{fullName(c)}
								</a>
								<button
									type="button"
									onclick={() => unlinkContact(c.id)}
									disabled={unlinkingContactId === c.id}
									class="flex size-5 items-center justify-center rounded text-muted-foreground opacity-0 group-hover/item:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all disabled:opacity-50"
									aria-label="Retirer {fullName(c)}"
								>
									<X class="size-3" />
								</button>
							</div>
						{/each}
					</div>
				{/if}
			</section>

			<!-- Linked deals -->
			<section class="rounded-xl border bg-card p-4">
				<h2 class="mb-3 text-sm font-semibold">Deals</h2>
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

			<!-- Budget / financement (read-only) -->
			{#if company?.estimatedBudget != null || (company?.fundingDevices?.length ?? 0) > 0}
				<section class="rounded-xl border bg-card p-4">
					<h2 class="mb-3 text-sm font-semibold">Financement</h2>
					{#if company?.estimatedBudget != null}
						<div class="flex items-center justify-between text-sm mb-2">
							<span class="text-muted-foreground">Budget estimé</span>
							<span class="font-medium">{formatCurrency(company.estimatedBudget)}</span>
						</div>
					{/if}
					{#if company?.fundingDevices?.length}
						<div class="flex flex-wrap gap-1">
							{#each company.fundingDevices as device (device)}
								<Badge variant="secondary" class="text-xs">{device}</Badge>
							{/each}
						</div>
					{/if}
				</section>
			{/if}
		</div>
	</div>
</div>
