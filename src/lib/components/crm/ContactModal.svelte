<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as Button from '$lib/components/ui/button';
	import * as Input from '$lib/components/ui/input';
	import * as Label from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { posteOptions } from '$lib/crm/contact-schema';
	import X from '@lucide/svelte/icons/x';
	import Building2 from '@lucide/svelte/icons/building-2';
	import Plus from '@lucide/svelte/icons/plus';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';

	type ContactForForm = {
		id: string;
		firstName?: string | null;
		lastName?: string | null;
		email?: string | null;
		phone?: string | null;
		poste?: string | null;
		linkedinUrl?: string | null;
		internalNotes?: string | null;
		contactCompanies?: { companyId: string }[];
	};

	type Company = { id: string; name: string };

	let {
		open = $bindable(false),
		contact = null as ContactForForm | null,
		companies = [] as Company[]
	}: {
		open?: boolean;
		contact?: ContactForForm | null;
		companies?: Company[];
	} = $props();

	const isEdit = $derived(!!contact?.id);

	let firstName = $state('');
	let lastName = $state('');
	let email = $state('');
	let phone = $state('');
	let poste = $state<string>('');
	let linkedinUrl = $state('');
	let internalNotes = $state('');
	let selectedCompanyIds = $state<string[]>([]);

	// Company combobox state
	let companyPopoverOpen = $state(false);
	let companySearch = $state('');

	// Inline new company state
	let newCompanyMode = $state(false);
	let newCompanyName = $state('');

	$effect(() => {
		if (!open) return;
		if (contact) {
			firstName = contact.firstName ?? '';
			lastName = contact.lastName ?? '';
			email = contact.email ?? '';
			phone = contact.phone ?? '';
			poste = contact.poste ?? '';
			linkedinUrl = contact.linkedinUrl ?? '';
			internalNotes = contact.internalNotes ?? '';
			selectedCompanyIds = contact.contactCompanies?.map((cc) => cc.companyId) ?? [];
		} else {
			firstName = '';
			lastName = '';
			email = '';
			phone = '';
			poste = '';
			linkedinUrl = '';
			internalNotes = '';
			selectedCompanyIds = [];
		}
		companySearch = '';
		newCompanyMode = false;
		newCompanyName = '';
	});

	function removeCompany(id: string) {
		selectedCompanyIds = selectedCompanyIds.filter((c) => c !== id);
	}

	function selectCompany(id: string) {
		if (!selectedCompanyIds.includes(id)) {
			selectedCompanyIds = [...selectedCompanyIds, id];
		}
		companyPopoverOpen = false;
		companySearch = '';
	}

	const selectedCompanies = $derived(companies.filter((c) => selectedCompanyIds.includes(c.id)));
	const availableCompanies = $derived(
		companies.filter(
			(c) =>
				!selectedCompanyIds.includes(c.id) &&
				c.name.toLowerCase().includes(companySearch.toLowerCase())
		)
	);

	// Validation: required fields
	const isValid = $derived(
		firstName.trim().length > 0 &&
		lastName.trim().length > 0 &&
		/\S+@\S+\.\S+/.test(email.trim()) &&
		(!newCompanyMode || newCompanyName.trim().length > 0)
	);

	let isDesktop = $state<boolean | null>(null);
	$effect(() => {
		if (typeof window === 'undefined') return;
		const mq = window.matchMedia('(min-width: 768px)');
		const handler = (e: MediaQueryListEvent) => (isDesktop = e.matches);
		isDesktop = mq.matches;
		mq.addEventListener('change', handler);
		return () => mq.removeEventListener('change', handler);
	});

	function handleEnhance() {
		return async ({
			result
		}: {
			result:
				| { type: 'success'; data?: { message?: string } }
				| { type: 'failure'; data?: { message?: string } }
				| { type: 'error'; data?: { message?: string } }
				| { type: 'redirect'; location: string };
		}) => {
			if (result.type === 'success') {
				toast.success(isEdit ? 'Contact mis à jour' : 'Contact créé');
				open = false;
				await invalidateAll();
			}
			if (result.type === 'failure' && result.data?.message) {
				toast.error(result.data.message);
			}
			if (result.type === 'error') {
				toast.error(result.data?.message ?? 'Une erreur est survenue');
				// keep modal open so the user can fix things
			}
			if (result.type === 'redirect') {
				window.location.href = result.location;
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
		action="?/{isEdit ? 'updateContact' : 'createContact'}"
		use:enhance={handleEnhance}
		class="flex min-h-0 flex-1 flex-col"
	>
		{#if contact?.id}
			<input type="hidden" name="contactId" value={contact.id} />
		{/if}
		<input type="hidden" name="poste" value={poste} />
		{#each selectedCompanyIds as id (id)}
			<input type="hidden" name="companyIds" value={id} />
		{/each}
		{#if newCompanyMode && newCompanyName.trim()}
			<input type="hidden" name="newCompanyName" value={newCompanyName.trim()} />
		{/if}

		<!-- Scrollable form fields -->
		<div class="flex-1 overflow-y-auto px-6 py-5 space-y-4">
			<div class="grid grid-cols-2 gap-3">
				<div class="space-y-1.5">
					<Label.Root for="cm-firstName">Prénom {@render req()}</Label.Root>
					<Input.Root id="cm-firstName" name="firstName" bind:value={firstName} required />
				</div>
				<div class="space-y-1.5">
					<Label.Root for="cm-lastName">Nom {@render req()}</Label.Root>
					<Input.Root id="cm-lastName" name="lastName" bind:value={lastName} required />
				</div>
			</div>
			<div class="space-y-1.5">
				<Label.Root for="cm-email">Email {@render req()}</Label.Root>
				<Input.Root id="cm-email" name="email" type="email" bind:value={email} required />
			</div>
			<div class="space-y-1.5">
				<Label.Root for="cm-phone">Téléphone</Label.Root>
				<Input.Root id="cm-phone" name="phone" type="tel" bind:value={phone} />
			</div>
			<div class="space-y-1.5">
				<Label.Root for="cm-poste">Poste</Label.Root>
				<Select.Root type="single" bind:value={poste}>
					<Select.Trigger id="cm-poste" class="w-full">
						{poste || 'Sélectionner'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="">—</Select.Item>
						{#each posteOptions as opt (opt)}
							<Select.Item value={opt}>{opt}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
			<div class="space-y-1.5">
				<Label.Root for="cm-linkedin">LinkedIn</Label.Root>
				<Input.Root
					id="cm-linkedin"
					name="linkedinUrl"
					bind:value={linkedinUrl}
					placeholder="linkedin.com/in/..."
				/>
			</div>

			<!-- Company linking -->
			<div class="space-y-2">
				<Label.Root>Entreprise(s)</Label.Root>
				{#if selectedCompanies.length > 0}
					<div class="flex flex-wrap gap-1.5">
						{#each selectedCompanies as company (company.id)}
							<span class="inline-flex items-center gap-1 rounded-md border bg-muted px-2 py-0.5 text-xs font-medium">
								<Building2 class="size-3 text-muted-foreground" />
								{company.name}
								<button
									type="button"
									onclick={() => removeCompany(company.id)}
									class="ml-0.5 text-muted-foreground hover:text-foreground transition-colors"
									aria-label="Retirer {company.name}"
								>
									<X class="size-3" />
								</button>
							</span>
						{/each}
					</div>
				{/if}
				{#if !newCompanyMode}
					<div class="flex items-center gap-2">
						{#if companies.length > 0}
							<Popover.Root bind:open={companyPopoverOpen}>
								<Popover.Trigger>
									{#snippet child({ props })}
										<button
											{...props}
											type="button"
											class="flex h-9 flex-1 cursor-pointer items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm hover:bg-muted/50 transition-colors"
										>
											<span class="text-muted-foreground">
												{availableCompanies.length > 0 ? 'Lier une entreprise...' : 'Toutes liées'}
											</span>
											<ChevronsUpDown class="size-4 shrink-0 text-muted-foreground opacity-50" />
										</button>
									{/snippet}
								</Popover.Trigger>
								<Popover.Content class="w-72 p-0" align="start">
									<Command.Root shouldFilter={false}>
										<Command.Input placeholder="Rechercher..." bind:value={companySearch} />
										<Command.List>
											<Command.Empty>Aucune entreprise trouvée.</Command.Empty>
											{#each availableCompanies as company (company.id)}
												<Command.Item value={company.id} onSelect={() => selectCompany(company.id)}>
													<Building2 class="mr-2 size-4 text-muted-foreground" />
													{company.name}
												</Command.Item>
											{/each}
										</Command.List>
									</Command.Root>
								</Popover.Content>
							</Popover.Root>
						{/if}
						<button
							type="button"
							onclick={() => { newCompanyMode = true; }}
							class="flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-input px-3 text-sm text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
						>
							<Plus class="size-3.5" />
							Nouvelle
						</button>
					</div>
				{:else}
					<div class="rounded-lg border bg-muted/30 p-3 space-y-2">
						<div class="flex items-center justify-between">
							<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nouvelle entreprise</span>
							<button
								type="button"
								onclick={() => { newCompanyMode = false; newCompanyName = ''; }}
								class="text-muted-foreground hover:text-foreground transition-colors"
								aria-label="Annuler"
							>
								<X class="size-3.5" />
							</button>
						</div>
						<Input.Root placeholder="Nom de l'entreprise{newCompanyMode ? ' *' : ''}" bind:value={newCompanyName} autofocus />
						<p class="text-xs text-muted-foreground">Sera créée et liée automatiquement.</p>
					</div>
				{/if}
			</div>

			<div class="space-y-1.5">
				<Label.Root for="cm-notes">Commentaire interne</Label.Root>
				<textarea
					id="cm-notes"
					name="internalNotes"
					bind:value={internalNotes}
					rows="3"
					class="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
				></textarea>
			</div>
		</div>

		<!-- Sticky footer -->
		<div class="flex shrink-0 items-center justify-between gap-2 border-t px-6 py-4">
			<p class="text-xs text-muted-foreground"><span class="text-destructive">*</span> Champs obligatoires</p>
			<div class="flex gap-2">
				<Button.Root type="button" variant="outline" onclick={close}>Annuler</Button.Root>
				<Button.Root type="submit" disabled={!isValid}>{isEdit ? 'Enregistrer' : 'Créer'}</Button.Root>
			</div>
		</div>
	</form>
{/snippet}

{#if isDesktop === null}
	<!-- Defer Dialog/Drawer until after hydration to avoid SSR flash -->
{:else if isDesktop}
	<Dialog.Root bind:open>
		<Dialog.Content class="flex flex-col gap-0 p-0 sm:max-w-lg max-h-[90vh] overflow-hidden">
			<Dialog.Header class="shrink-0 border-b px-6 py-4 pr-12">
				<Dialog.Title>{isEdit ? 'Modifier le contact' : 'Nouveau contact'}</Dialog.Title>
				<Dialog.Description>
					{isEdit ? 'Modifiez les informations du contact.' : 'Renseignez les informations du contact.'}
				</Dialog.Description>
			</Dialog.Header>
			{@render formBody(() => (open = false))}
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<Drawer.Root bind:open>
		<Drawer.Content class="flex flex-col overflow-hidden max-h-[92dvh]">
			<Drawer.Header class="shrink-0 border-b px-4 py-4 text-left">
				<Drawer.Title>{isEdit ? 'Modifier le contact' : 'Nouveau contact'}</Drawer.Title>
				<Drawer.Description>
					{isEdit ? 'Modifiez les informations du contact.' : 'Renseignez les informations du contact.'}
				</Drawer.Description>
			</Drawer.Header>
			{@render formBody(() => (open = false))}
		</Drawer.Content>
	</Drawer.Root>
{/if}
