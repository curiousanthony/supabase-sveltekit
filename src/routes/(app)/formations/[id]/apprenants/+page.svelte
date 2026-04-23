<script lang="ts">
	import type { PageProps } from './$types';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import Users from '@lucide/svelte/icons/users';
	import Plus from '@lucide/svelte/icons/plus';
	import Search from '@lucide/svelte/icons/search';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Building2 from '@lucide/svelte/icons/building-2';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import Mail from '@lucide/svelte/icons/mail';
	import Phone from '@lucide/svelte/icons/phone';
	import CalendarCheck from '@lucide/svelte/icons/calendar-check';
	import * as Select from '$lib/components/ui/select/index.js';
	import { posteOptions } from '$lib/crm/contact-schema';
	import QuestGuideBanner from '$lib/components/formations/quest-guide-banner.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';

	let { data }: PageProps = $props();

	const formation = $derived(data?.formation);
	const seancesData = $derived(formation?.seances ?? []);

	const apprenants = $derived(
		(formation?.formationApprenants ?? []).map((fa) => {
			const c = fa.contact;
			const fullName =
				[c.firstName, c.lastName].filter(Boolean).join(' ') || 'Sans nom';
			const company = c.contactCompanies?.[0]?.company?.name ?? null;

			const learnerEmargements = seancesData.flatMap(
				(s) => s.emargements?.filter((e) => e.contactId === c.id) ?? []
			);
			const totalEmargements = learnerEmargements.length;
			const signedCount = learnerEmargements.filter((e) => e.signedAt).length;
			const attendancePercent =
				totalEmargements > 0 ? Math.round((signedCount / totalEmargements) * 100) : null;

			return {
				id: c.id,
				fullName,
				email: c.email,
				phone: c.phone,
				company,
				totalEmargements,
				signedCount,
				attendancePercent
			};
		})
	);

	const enrolledContactIds = $derived(new Set(apprenants.map((a) => a.id)));

	const availableContacts = $derived(
		(data?.workspaceContacts ?? []).filter((c) => !enrolledContactIds.has(c.id))
	);

	let addDialogOpen = $state(false);
	let removeDialogOpen = $state(false);
	let searchQuery = $state('');
	let showCreateForm = $state(false);
	let selectedContactId = $state<string | null>(null);
	let learnerToRemove = $state<(typeof apprenants)[number] | null>(null);
	let addToFutureSessions = $state(true);
	let submitting = $state(false);

	let newFirstName = $state('');
	let newLastName = $state('');
	let newEmail = $state('');
	let newPhone = $state('');
	let newPoste = $state('');
	let selectedCompanyId = $state('');
	let newCompanyName = $state('');
	let showNewCompanyInput = $state(false);

	const filteredContacts = $derived(
		searchQuery.trim().length === 0
			? availableContacts.slice(0, 20)
			: availableContacts.filter((c) => {
					const q = searchQuery.toLowerCase();
					const name = [c.firstName, c.lastName].filter(Boolean).join(' ').toLowerCase();
					return name.includes(q) || (c.email?.toLowerCase().includes(q) ?? false);
				}).slice(0, 20)
	);

	const selectedContact = $derived(
		availableContacts.find((c) => c.id === selectedContactId) ?? null
	);

	const futureSeances = $derived(
		seancesData.filter((s) => new Date(s.startAt) > new Date())
	);

	function resetAddDialog() {
		searchQuery = '';
		showCreateForm = false;
		selectedContactId = null;
		addToFutureSessions = true;
		newFirstName = '';
		newLastName = '';
		newEmail = '';
		newPhone = '';
		newPoste = '';
		selectedCompanyId = '';
		newCompanyName = '';
		showNewCompanyInput = false;
		submitting = false;
	}

	function openRemoveDialog(learner: (typeof apprenants)[number]) {
		learnerToRemove = learner;
		removeDialogOpen = true;
	}

	// ── Focus handler for ?preflightFocus=email&focusContactId=... (T-14) ─────
	onMount(() => {
		requestAnimationFrame(() => {
			const focusKey = page.url.searchParams.get('preflightFocus');
			const focusContactId = page.url.searchParams.get('focusContactId');
			if (!focusKey) return;

			const root: Element | null = focusContactId
				? document.querySelector(`[data-contact-row="${CSS.escape(focusContactId)}"]`)
				: document.documentElement;
			if (!root) return;

			const el =
				(root as Element).querySelector?.(`[data-preflight-target="${CSS.escape(focusKey)}"]`) ??
				root;
			if (!el) return;

			(el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
			(el as HTMLElement).focus?.();
			(el as HTMLElement).classList.add('ring-2', 'ring-primary');
			setTimeout(() => (el as HTMLElement).classList.remove('ring-2', 'ring-primary'), 1500);

			const url = new URL(page.url);
			url.searchParams.delete('preflightFocus');
			url.searchParams.delete('focusContactId');
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			replaceState(url.toString(), {});
		});
	});

	function formatSeanceDate(iso: string) {
		return new Date(iso).toLocaleDateString('fr-FR', {
			weekday: 'short',
			day: 'numeric',
			month: 'short'
		});
	}

	function formatSeanceTime(iso: string) {
		return new Date(iso).toLocaleTimeString('fr-FR', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="space-y-6">
	<QuestGuideBanner />
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h2 class="flex items-center gap-2 text-lg font-semibold">
			<Users class="size-5" />
			Apprenants
			{#if apprenants.length > 0}
				<Badge variant="secondary" class="text-xs">{apprenants.length}</Badge>
			{/if}
		</h2>
		<Button
			variant="outline"
			size="sm"
			class="cursor-pointer"
			onclick={() => {
				resetAddDialog();
				addDialogOpen = true;
			}}
		>
			<Plus class="mr-1.5 size-4" />
			Ajouter
		</Button>
	</div>

	<!-- Learner list or empty state -->
	{#if apprenants.length === 0}
		<Card.Root>
			<Card.Content class="py-12 text-center">
				<Users class="mx-auto mb-3 size-12 text-muted-foreground/30" />
				<p class="text-muted-foreground">Aucun apprenant inscrit.</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Ajoutez des apprenants pour suivre leur présence.
				</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="space-y-2">
			{#each apprenants as learner (learner.id)}
				<Card.Root>
					<Card.Content class="flex items-center gap-4 py-4" data-contact-row={learner.id}>
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2">
								<a
									href="/contacts/{learner.id}"
									class="truncate font-medium text-foreground hover:underline"
								>
									{learner.fullName}
								</a>
								{#if learner.company}
									<span
										class="hidden items-center gap-1 text-xs text-muted-foreground sm:inline-flex"
									>
										<Building2 class="size-3" />
										{learner.company}
									</span>
								{/if}
							</div>
							<div class="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
								{#if learner.email}
									<span class="flex items-center gap-1" data-preflight-target="email">
										<Mail class="size-3.5" />
										{learner.email}
									</span>
								{:else}
									<span class="flex items-center gap-1 italic text-muted-foreground" data-preflight-target="email">
										<Mail class="size-3.5" />
										Aucun e-mail
									</span>
								{/if}
								{#if learner.phone}
									<span class="flex items-center gap-1">
										<Phone class="size-3.5" />
										{learner.phone}
									</span>
								{/if}
							</div>
						</div>

						<!-- Attendance -->
						<div class="flex shrink-0 items-center gap-3">
							{#if learner.totalEmargements > 0}
								<div class="text-right">
									<div class="flex items-center gap-1.5 text-sm font-medium">
										<CalendarCheck class="size-4 text-muted-foreground" />
										{learner.signedCount}/{learner.totalEmargements} séances
									</div>
									<div class="mt-0.5 text-xs text-muted-foreground">
										{learner.attendancePercent}%
									</div>
								</div>
							{/if}

							<Button
								variant="ghost"
								size="icon"
								class="size-8 cursor-pointer text-destructive hover:text-destructive"
								onclick={() => openRemoveDialog(learner)}
								aria-label="Retirer {learner.fullName}"
							>
								<Trash2 class="size-4" />
							</Button>
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{/if}
</div>

<!-- Add Learner Dialog -->
<Dialog.Root bind:open={addDialogOpen} onOpenChange={(open) => { if (!open) resetAddDialog(); }}>
	<Dialog.Content class="max-h-[85vh] overflow-y-auto sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>{showCreateForm ? 'Nouvel apprenant' : 'Ajouter un apprenant'}</Dialog.Title>
			<Dialog.Description>
				{showCreateForm ? "Renseignez les informations de l'apprenant à créer." : 'Recherchez un contact existant ou créez-en un nouveau.'}
			</Dialog.Description>
		</Dialog.Header>

		{#if !showCreateForm && !selectedContactId}
			<!-- Search existing contacts -->
			<div class="space-y-3">
				<div class="relative">
					<Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Rechercher par nom ou email..."
						class="pl-9"
						bind:value={searchQuery}
					/>
				</div>

				<div class="max-h-60 space-y-1 overflow-y-auto">
					{#each filteredContacts as contact (contact.id)}
						{@const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Sans nom'}
						{@const company = contact.contactCompanies?.[0]?.company?.name ?? null}
						<button
							type="button"
							class="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-muted"
							onclick={() => { selectedContactId = contact.id; }}
						>
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium">{name}</p>
								<p class="truncate text-xs text-muted-foreground">
									{contact.email ?? ''}
									{#if company}
										· {company}
									{/if}
								</p>
							</div>
						</button>
					{:else}
						<p class="py-4 text-center text-sm text-muted-foreground">
							{searchQuery.trim().length > 0
								? 'Aucun contact trouvé.'
								: 'Aucun contact disponible.'}
						</p>
					{/each}
				</div>

				<button
					type="button"
					class="flex w-full items-center gap-2 rounded-md border border-dashed px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					onclick={() => { showCreateForm = true; }}
				>
					<UserPlus class="size-4" />
					Créer un nouveau contact
				</button>
			</div>
		{:else if showCreateForm}
			<!-- Create new contact form -->
			<form
				method="POST"
				action="?/createContact"
				use:enhance={() => {
					submitting = true;
					return async ({ result, update }) => {
						submitting = false;
						if (result.type === 'success') {
							toast.success('Contact créé et ajouté');
							addDialogOpen = false;
							resetAddDialog();
							await update();
						} else if (result.type === 'failure') {
							toast.error((result.data as { message?: string })?.message ?? 'Erreur');
						}
					};
				}}
			>
				<input type="hidden" name="addToFutureSessions" value={addToFutureSessions ? 'true' : 'false'} />
				<input type="hidden" name="companyId" value={selectedCompanyId} />
				<input type="hidden" name="newCompanyName" value={newCompanyName} />

				<div class="space-y-4">
					<div class="grid grid-cols-2 gap-3">
						<div class="space-y-1.5">
							<Label for="new-first-name">Prénom</Label>
							<Input id="new-first-name" name="firstName" bind:value={newFirstName} required />
						</div>
						<div class="space-y-1.5">
							<Label for="new-last-name">Nom</Label>
							<Input id="new-last-name" name="lastName" bind:value={newLastName} required />
						</div>
					</div>
					<div class="space-y-1.5">
						<Label for="new-email">Email</Label>
						<Input id="new-email" name="email" type="email" bind:value={newEmail} />
					</div>
					<div class="space-y-1.5">
						<Label for="new-phone">Téléphone</Label>
						<Input id="new-phone" name="phone" type="tel" bind:value={newPhone} />
					</div>

					<div class="space-y-1.5">
						<Label for="new-poste">Poste</Label>
						<Select.Root type="single" bind:value={newPoste}>
							<Select.Trigger class="w-full">
								{#if newPoste}{newPoste}{:else}<span class="text-muted-foreground">Sélectionner un poste...</span>{/if}
							</Select.Trigger>
							<Select.Content>
								{#each posteOptions as option (option)}
									<Select.Item value={option}>{option}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<div class="space-y-1.5">
						<Label>Entreprise</Label>
						{#if !showNewCompanyInput}
							<Select.Root type="single" bind:value={selectedCompanyId}>
								<Select.Trigger class="w-full">
									{#if selectedCompanyId}
										{data.workspaceCompanies?.find((c) => c.id === selectedCompanyId)?.name ?? ''}
									{:else}
										<span class="text-muted-foreground">Sélectionner une entreprise...</span>
									{/if}
								</Select.Trigger>
								<Select.Content>
									{#each data.workspaceCompanies ?? [] as co (co.id)}
										<Select.Item value={co.id}>{co.name}</Select.Item>
									{/each}
									{#if (data.workspaceCompanies ?? []).length > 0}
										<div class="mt-1 border-t pt-1">
											<button
												type="button"
												class="w-full px-2 py-1.5 text-left text-sm text-muted-foreground hover:text-foreground"
												onclick={() => {
													showNewCompanyInput = true;
													selectedCompanyId = '';
												}}
											>
												+ Créer une nouvelle entreprise
											</button>
										</div>
									{/if}
								</Select.Content>
							</Select.Root>
							{#if (data.workspaceCompanies ?? []).length === 0}
								<button
									type="button"
									class="text-sm text-primary hover:underline"
									onclick={() => {
										showNewCompanyInput = true;
									}}
								>
									+ Créer une nouvelle entreprise
								</button>
							{/if}
						{:else}
							<div class="flex items-center gap-2">
								<Input
									bind:value={newCompanyName}
									placeholder="Nom de l'entreprise"
									class="flex-1"
								/>
								<button
									type="button"
									class="shrink-0 text-xs text-muted-foreground hover:text-foreground"
									onclick={() => {
										showNewCompanyInput = false;
										newCompanyName = '';
									}}
								>Annuler</button>
							</div>
						{/if}
					</div>

					{#if futureSeances.length > 0}
						<div class="space-y-2 rounded-md border p-3">
							<label class="flex items-center gap-2 text-sm font-medium">
								<input
									type="checkbox"
									bind:checked={addToFutureSessions}
									class="size-4 rounded border-input"
								/>
								Ajouter aux {futureSeances.length} séance{futureSeances.length > 1 ? 's' : ''} à venir
							</label>
							{#if addToFutureSessions}
								<ul class="ml-6 space-y-0.5 text-xs text-muted-foreground">
									{#each futureSeances as s}
										<li>{formatSeanceDate(s.startAt)} · {formatSeanceTime(s.startAt)}–{formatSeanceTime(s.endAt)}</li>
									{/each}
								</ul>
							{/if}
						</div>
					{/if}
				</div>

				<Dialog.Footer class="mt-4">
					<Button
						variant="outline"
						type="button"
						class="cursor-pointer"
						onclick={() => { showCreateForm = false; }}
					>
						Retour
					</Button>
					<Button type="submit" class="cursor-pointer" disabled={submitting || (!newFirstName.trim() && !newLastName.trim())}>
						{submitting ? 'Création...' : 'Créer et ajouter'}
					</Button>
				</Dialog.Footer>
			</form>
		{:else if selectedContact}
			<!-- Confirm adding selected contact -->
			{@const name = [selectedContact.firstName, selectedContact.lastName].filter(Boolean).join(' ') || 'Sans nom'}
			<form
				method="POST"
				action="?/addLearner"
				use:enhance={() => {
					submitting = true;
					return async ({ result, update }) => {
						submitting = false;
						if (result.type === 'success') {
							toast.success(`${name} ajouté`);
							addDialogOpen = false;
							resetAddDialog();
							await update();
						} else if (result.type === 'failure') {
							toast.error((result.data as { message?: string })?.message ?? 'Erreur');
						}
					};
				}}
			>
				<input type="hidden" name="contactId" value={selectedContact.id} />
				<input type="hidden" name="addToFutureSessions" value={addToFutureSessions ? 'true' : 'false'} />

				<div class="space-y-4">
					<div class="rounded-md border p-3">
						<p class="font-medium">{name}</p>
						{#if selectedContact.email}
							<p class="text-sm text-muted-foreground">{selectedContact.email}</p>
						{/if}
					</div>

					{#if futureSeances.length > 0}
						<div class="space-y-2 rounded-md border p-3">
							<label class="flex items-center gap-2 text-sm font-medium">
								<input
									type="checkbox"
									bind:checked={addToFutureSessions}
									class="size-4 rounded border-input"
								/>
								Ajouter aux {futureSeances.length} séance{futureSeances.length > 1 ? 's' : ''} à venir
							</label>
							{#if addToFutureSessions}
								<ul class="ml-6 space-y-0.5 text-xs text-muted-foreground">
									{#each futureSeances as s}
										<li>{formatSeanceDate(s.startAt)} · {formatSeanceTime(s.startAt)}–{formatSeanceTime(s.endAt)}</li>
									{/each}
								</ul>
							{/if}
						</div>
					{/if}
				</div>

				<Dialog.Footer class="mt-4">
					<Button
						variant="outline"
						type="button"
						class="cursor-pointer"
						onclick={() => { selectedContactId = null; }}
					>
						Retour
					</Button>
					<Button type="submit" class="cursor-pointer" disabled={submitting}>
						{submitting ? 'Ajout...' : 'Ajouter'}
					</Button>
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<!-- Remove Learner Confirmation Dialog -->
<Dialog.Root bind:open={removeDialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Retirer un apprenant</Dialog.Title>
			<Dialog.Description>
				Retirer {learnerToRemove?.fullName ?? ''} de cette formation ? Ses émargements passés seront conservés.
			</Dialog.Description>
		</Dialog.Header>

		{#if learnerToRemove}
			<form
				method="POST"
				action="?/removeLearner"
				use:enhance={() => {
					submitting = true;
					return async ({ result, update }) => {
						submitting = false;
						if (result.type === 'success') {
							toast.success(`${learnerToRemove?.fullName ?? 'Apprenant'} retiré`);
							removeDialogOpen = false;
							learnerToRemove = null;
							await update();
						} else if (result.type === 'failure') {
							toast.error((result.data as { message?: string })?.message ?? 'Erreur');
						}
					};
				}}
			>
				<input type="hidden" name="contactId" value={learnerToRemove.id} />
				<Dialog.Footer>
					<Button
						variant="outline"
						type="button"
						class="cursor-pointer"
						onclick={() => { removeDialogOpen = false; learnerToRemove = null; }}
					>
						Annuler
					</Button>
					<Button type="submit" variant="destructive" class="cursor-pointer" disabled={submitting}>
						{submitting ? 'Suppression...' : 'Retirer'}
					</Button>
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>
