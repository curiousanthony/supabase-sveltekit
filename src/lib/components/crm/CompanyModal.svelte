<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as Button from '$lib/components/ui/button';
	import * as Input from '$lib/components/ui/input';
	import * as Label from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import CityCombobox from '$lib/components/crm/CityCombobox.svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import {
		legalStatusOptions,
		industryOptions,
		companySizeOptions
	} from '$lib/crm/company-form-options';
	import { posteOptions } from '$lib/crm/contact-schema';
	import X from '@lucide/svelte/icons/x';
	import Users from '@lucide/svelte/icons/users';
	import Plus from '@lucide/svelte/icons/plus';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';

	type CompanyForForm = {
		id: string;
		name?: string | null;
		siret?: string | null;
		legalStatus?: string | null;
		industry?: string | null;
		companySize?: string | null;
		websiteUrl?: string | null;
		address?: string | null;
		city?: string | null;
		region?: string | null;
		internalNotes?: string | null;
	};

	type Contact = { id: string; firstName?: string | null; lastName?: string | null; email?: string | null };

	let {
		open = $bindable(false),
		company = null as CompanyForForm | null,
		contacts = [] as Contact[]
	}: {
		open?: boolean;
		company?: CompanyForForm | null;
		contacts?: Contact[];
	} = $props();

	const isEdit = $derived(!!company?.id);

	let name = $state('');
	let siret = $state('');
	let legalStatus = $state<string>('');
	let industry = $state<string>('');
	let companySize = $state<string>('');
	let websiteUrl = $state('');
	let address = $state('');
	let city = $state('');
	let region = $state('');
	let internalNotes = $state('');

	// Contact linking state
	let selectedContactIds = $state<string[]>([]);
	let contactPopoverOpen = $state(false);
	let contactSearch = $state('');
	let newContactMode = $state(false);
	let newContactFirstName = $state('');
	let newContactLastName = $state('');
	let newContactEmail = $state('');
	let newContactPoste = $state('');

	$effect(() => {
		if (company) {
			name = company.name ?? '';
			siret = company.siret ?? '';
			legalStatus = company.legalStatus ?? '';
			industry = company.industry ?? '';
			companySize = company.companySize ?? '';
			websiteUrl = company.websiteUrl ?? '';
			address = company.address ?? '';
			city = company.city ?? '';
			region = company.region ?? '';
			internalNotes = company.internalNotes ?? '';
		} else {
			name = ''; siret = ''; legalStatus = ''; industry = ''; companySize = '';
			websiteUrl = ''; address = ''; city = ''; region = ''; internalNotes = '';
		}
		selectedContactIds = [];
		contactSearch = '';
		newContactMode = false;
		newContactFirstName = ''; newContactLastName = ''; newContactEmail = ''; newContactPoste = '';
	});

	function fullName(c: Contact) {
		const n = [c.firstName, c.lastName].filter(Boolean).join(' ');
		return n || c.email || '—';
	}

	function removeContact(id: string) { selectedContactIds = selectedContactIds.filter((c) => c !== id); }
	function selectContact(id: string) {
		if (!selectedContactIds.includes(id)) selectedContactIds = [...selectedContactIds, id];
		contactPopoverOpen = false;
		contactSearch = '';
	}

	const selectedContacts = $derived(contacts.filter((c) => selectedContactIds.includes(c.id)));
	const availableContacts = $derived(
		contacts.filter((c) => {
			if (selectedContactIds.includes(c.id)) return false;
			const q = contactSearch.toLowerCase();
			return (
				(c.firstName?.toLowerCase().includes(q) ?? false) ||
				(c.lastName?.toLowerCase().includes(q) ?? false) ||
				(c.email?.toLowerCase().includes(q) ?? false)
			);
		})
	);

	// Validation: only company name is required
	const isValid = $derived(name.trim().length > 0);

	let isDesktop = $state(true);
	$effect(() => {
		const mq = window.matchMedia('(min-width: 768px)');
		isDesktop = mq.matches;
		const handler = (e: MediaQueryListEvent) => (isDesktop = e.matches);
		mq.addEventListener('change', handler);
		return () => mq.removeEventListener('change', handler);
	});

	function handleEnhance() {
		return async ({ result }: { result: { type: string; data?: { message?: string } } }) => {
			if (result.type === 'success') {
				toast.success(isEdit ? 'Entreprise mise à jour' : 'Entreprise créée');
				open = false;
				await invalidateAll();
			}
			if (result.type === 'failure' && result.data?.message) {
				toast.error(result.data.message as string);
			}
		};
	}
</script>

{#snippet req()}
	<span class="text-destructive ml-0.5">*</span>
{/snippet}

{#snippet formBody(close: () => void)}
	<form
		method="POST"
		action="?/{isEdit ? 'updateCompany' : 'createCompany'}"
		use:enhance={handleEnhance}
		class="flex min-h-0 flex-1 flex-col"
	>
		{#if company?.id}
			<input type="hidden" name="companyId" value={company.id} />
		{/if}
		{#each selectedContactIds as id (id)}
			<input type="hidden" name="contactIds" value={id} />
		{/each}
		{#if newContactMode && (newContactFirstName.trim() || newContactEmail.trim())}
			<input type="hidden" name="newContactFirstName" value={newContactFirstName.trim()} />
			<input type="hidden" name="newContactLastName" value={newContactLastName.trim()} />
			<input type="hidden" name="newContactEmail" value={newContactEmail.trim()} />
			{#if newContactPoste}
				<input type="hidden" name="newContactPoste" value={newContactPoste} />
			{/if}
		{/if}

		<!-- Scrollable form fields -->
		<div class="flex-1 overflow-y-auto px-6 py-5 space-y-4">
			<div class="space-y-1.5">
				<Label.Root for="cmo-name">Nom {@render req()}</Label.Root>
				<Input.Root id="cmo-name" name="name" bind:value={name} required autofocus />
			</div>
			<div class="space-y-1.5">
				<Label.Root for="cmo-siret">SIRET</Label.Root>
				<Input.Root id="cmo-siret" name="siret" bind:value={siret} placeholder="14 chiffres" />
			</div>
			<div class="grid grid-cols-2 gap-3">
				<div class="space-y-1.5">
					<Label.Root for="cmo-legalStatus">Statut juridique</Label.Root>
					<Select.Root type="single" bind:value={legalStatus} name="legalStatus">
						<Select.Trigger id="cmo-legalStatus" class="w-full">{legalStatus || 'Sélectionner'}</Select.Trigger>
						<Select.Content>
							<Select.Item value="">—</Select.Item>
							{#each legalStatusOptions as opt (opt)}<Select.Item value={opt}>{opt}</Select.Item>{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="space-y-1.5">
					<Label.Root for="cmo-industry">Industrie</Label.Root>
					<Select.Root type="single" bind:value={industry} name="industry">
						<Select.Trigger id="cmo-industry" class="w-full">{industry || 'Sélectionner'}</Select.Trigger>
						<Select.Content>
							<Select.Item value="">—</Select.Item>
							{#each industryOptions as opt (opt)}<Select.Item value={opt}>{opt}</Select.Item>{/each}
						</Select.Content>
					</Select.Root>
				</div>
			</div>
			<div class="space-y-1.5">
				<Label.Root for="cmo-size">Taille</Label.Root>
				<Select.Root type="single" bind:value={companySize} name="companySize">
					<Select.Trigger id="cmo-size" class="w-full">{companySize || 'Sélectionner'}</Select.Trigger>
					<Select.Content>
						<Select.Item value="">—</Select.Item>
						{#each companySizeOptions as opt (opt)}<Select.Item value={opt}>{opt}</Select.Item>{/each}
					</Select.Content>
				</Select.Root>
			</div>
			<div class="space-y-1.5">
				<Label.Root for="cmo-website">Site web</Label.Root>
				<Input.Root id="cmo-website" name="websiteUrl" bind:value={websiteUrl} placeholder="google.com" />
			</div>
			<div class="space-y-1.5">
				<Label.Root for="cmo-address">Adresse</Label.Root>
				<Input.Root id="cmo-address" name="address" bind:value={address} />
			</div>
			<input type="hidden" name="city" value={city} />
			<input type="hidden" name="region" value={region} />
			<CityCombobox {city} {region} onSelect={(c: string, r: string) => { city = c; region = r; }} />

			<!-- Contact linking (create mode only) -->
			{#if !isEdit}
				<div class="space-y-2">
					<Label.Root>Contact(s) lié(s)</Label.Root>
					{#if selectedContacts.length > 0}
						<div class="flex flex-wrap gap-1.5">
							{#each selectedContacts as contact (contact.id)}
								<span class="inline-flex items-center gap-1 rounded-md border bg-muted px-2 py-0.5 text-xs font-medium">
									<Users class="size-3 text-muted-foreground" />
									{fullName(contact)}
									<button
										type="button"
										onclick={() => removeContact(contact.id)}
										class="ml-0.5 text-muted-foreground hover:text-foreground transition-colors"
										aria-label="Retirer"
									><X class="size-3" /></button>
								</span>
							{/each}
						</div>
					{/if}
					{#if !newContactMode}
						<div class="flex items-center gap-2">
							{#if contacts.length > 0}
								<Popover.Root bind:open={contactPopoverOpen}>
									<Popover.Trigger>
										{#snippet child({ props })}
											<button
												{...props}
												type="button"
												class="flex h-9 flex-1 cursor-pointer items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm hover:bg-muted/50 transition-colors"
											>
												<span class="text-muted-foreground">
													{availableContacts.length > 0 ? 'Lier un contact...' : 'Tous liés'}
												</span>
												<ChevronsUpDown class="size-4 shrink-0 text-muted-foreground opacity-50" />
											</button>
										{/snippet}
									</Popover.Trigger>
									<Popover.Content class="w-72 p-0" align="start">
										<Command.Root shouldFilter={false}>
											<Command.Input placeholder="Rechercher..." bind:value={contactSearch} />
											<Command.List>
												<Command.Empty>Aucun contact trouvé.</Command.Empty>
												{#each availableContacts as contact (contact.id)}
													<Command.Item value={contact.id} onSelect={() => selectContact(contact.id)}>
														<Users class="mr-2 size-4 text-muted-foreground" />
														{fullName(contact)}
													</Command.Item>
												{/each}
											</Command.List>
										</Command.Root>
									</Popover.Content>
								</Popover.Root>
							{/if}
							<button
								type="button"
								onclick={() => { newContactMode = true; }}
								class="flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-input px-3 text-sm text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
							>
								<Plus class="size-3.5" />
								Nouveau
							</button>
						</div>
					{:else}
						<div class="rounded-lg border bg-muted/30 p-3 space-y-2">
							<div class="flex items-center justify-between">
								<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nouveau contact</span>
								<button
									type="button"
									onclick={() => { newContactMode = false; newContactFirstName = ''; newContactLastName = ''; newContactEmail = ''; newContactPoste = ''; }}
									class="text-muted-foreground hover:text-foreground transition-colors"
									aria-label="Annuler"
								><X class="size-3.5" /></button>
							</div>
							<div class="grid grid-cols-2 gap-2">
								<Input.Root placeholder="Prénom" bind:value={newContactFirstName} autofocus />
								<Input.Root placeholder="Nom" bind:value={newContactLastName} />
							</div>
							<Input.Root type="email" placeholder="Email" bind:value={newContactEmail} />
							<Select.Root type="single" bind:value={newContactPoste}>
								<Select.Trigger class="w-full">{newContactPoste || 'Poste (optionnel)'}</Select.Trigger>
								<Select.Content>
									<Select.Item value="">—</Select.Item>
									{#each posteOptions as opt (opt)}<Select.Item value={opt}>{opt}</Select.Item>{/each}
								</Select.Content>
							</Select.Root>
							<p class="text-xs text-muted-foreground">Sera créé et lié automatiquement.</p>
						</div>
					{/if}
				</div>
			{/if}

			<div class="space-y-1.5">
				<Label.Root for="cmo-notes">Commentaire interne</Label.Root>
				<textarea
					id="cmo-notes"
					name="internalNotes"
					bind:value={internalNotes}
					rows="3"
					class="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
				></textarea>
			</div>
		</div>

		<!-- Sticky footer -->
		<div class="flex shrink-0 items-center justify-between gap-2 border-t px-6 py-4">
			<p class="text-xs text-muted-foreground"><span class="text-destructive">*</span> Champ obligatoire</p>
			<div class="flex gap-2">
				<Button.Root type="button" variant="outline" onclick={close}>Annuler</Button.Root>
				<Button.Root type="submit" disabled={!isValid}>{isEdit ? 'Enregistrer' : 'Créer'}</Button.Root>
			</div>
		</div>
	</form>
{/snippet}

{#if isDesktop}
	<Dialog.Root bind:open>
		<Dialog.Content class="flex flex-col gap-0 p-0 sm:max-w-lg max-h-[90vh] overflow-hidden">
			<Dialog.Header class="shrink-0 border-b px-6 py-4 pr-12">
				<Dialog.Title>{isEdit ? "Modifier l'entreprise" : 'Nouvelle entreprise'}</Dialog.Title>
				<Dialog.Description>
					{isEdit ? "Modifiez les informations de l'entreprise." : "Renseignez les informations de l'entreprise."}
				</Dialog.Description>
			</Dialog.Header>
			{@render formBody(() => (open = false))}
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<Drawer.Root bind:open>
		<Drawer.Content class="flex flex-col overflow-hidden max-h-[92dvh]">
			<Drawer.Header class="shrink-0 border-b px-4 py-4 text-left">
				<Drawer.Title>{isEdit ? "Modifier l'entreprise" : 'Nouvelle entreprise'}</Drawer.Title>
				<Drawer.Description>
					{isEdit ? "Modifiez les informations de l'entreprise." : "Renseignez les informations de l'entreprise."}
				</Drawer.Description>
			</Drawer.Header>
			{@render formBody(() => (open = false))}
		</Drawer.Content>
	</Drawer.Root>
{/if}
