<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as Button from '$lib/components/ui/button';
	import * as Input from '$lib/components/ui/input';
	import * as Label from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { posteOptions } from '$lib/crm/contact-schema';

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
	let companyIds = $state<string[]>([]);

	$effect(() => {
		if (contact) {
			firstName = contact.firstName ?? '';
			lastName = contact.lastName ?? '';
			email = contact.email ?? '';
			phone = contact.phone ?? '';
			poste = contact.poste ?? '';
			linkedinUrl = contact.linkedinUrl ?? '';
			internalNotes = contact.internalNotes ?? '';
			companyIds = contact.contactCompanies?.map((cc) => cc.companyId) ?? [];
		} else {
			firstName = '';
			lastName = '';
			email = '';
			phone = '';
			poste = '';
			linkedinUrl = '';
			internalNotes = '';
			companyIds = [];
		}
	});

	function toggleCompany(id: string) {
		companyIds = companyIds.includes(id) ? companyIds.filter((c) => c !== id) : [...companyIds, id];
	}

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
				toast.success(isEdit ? 'Contact mis à jour' : 'Contact créé');
				open = false;
				await invalidateAll();
			}
			if (result.type === 'failure' && result.data?.message) {
				toast.error(result.data.message as string);
			}
		};
	}
</script>

{#snippet formContent(close: () => void)}
	<form
		method="POST"
		action="?/{isEdit ? 'updateContact' : 'createContact'}"
		use:enhance={handleEnhance}
		class="flex flex-col gap-4"
	>
		{#if contact?.id}
			<input type="hidden" name="contactId" value={contact.id} />
		{/if}
		<input type="hidden" name="poste" value={poste} />
		<div class="grid grid-cols-2 gap-3">
			<div class="space-y-1.5">
				<Label.Root for="cm-firstName">Prénom</Label.Root>
				<Input.Root id="cm-firstName" name="firstName" bind:value={firstName} required />
			</div>
			<div class="space-y-1.5">
				<Label.Root for="cm-lastName">Nom</Label.Root>
				<Input.Root id="cm-lastName" name="lastName" bind:value={lastName} required />
			</div>
		</div>
		<div class="space-y-1.5">
			<Label.Root for="cm-email">Email</Label.Root>
			<Input.Root id="cm-email" name="email" type="email" bind:value={email} required />
		</div>
		<div class="space-y-1.5">
			<Label.Root for="cm-phone">Téléphone</Label.Root>
			<Input.Root id="cm-phone" name="phone" type="tel" bind:value={phone} />
		</div>
		<div class="space-y-1.5">
			<Label.Root for="cm-poste">Poste</Label.Root>
			<Select.Root type="single" bind:value={poste} name="poste">
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
				type="url"
				bind:value={linkedinUrl}
				placeholder="https://linkedin.com/in/..."
			/>
		</div>
		{#if companies.length > 0}
			<div class="space-y-1.5">
				<Label.Root>Entreprise(s)</Label.Root>
				<div class="flex flex-wrap gap-2 rounded-md border p-3">
					{#each companies as company (company.id)}
						<label class="flex cursor-pointer items-center gap-2">
							<input
								type="checkbox"
								name="companyIds"
								value={company.id}
								checked={companyIds.includes(company.id)}
								onchange={() => toggleCompany(company.id)}
								class="rounded border-input"
							/>
							<span class="text-sm">{company.name}</span>
						</label>
					{/each}
				</div>
			</div>
		{/if}
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
		<div class="flex justify-end gap-2 pt-2">
			<Button.Root type="button" variant="outline" onclick={close}>Annuler</Button.Root>
			<Button.Root type="submit">{isEdit ? 'Enregistrer' : 'Créer'}</Button.Root>
		</div>
	</form>
{/snippet}

{#if isDesktop}
	<Dialog.Root bind:open>
		<Dialog.Content class="sm:max-w-lg overflow-y-auto max-h-[90vh]">
			<Dialog.Header>
				<Dialog.Title>{isEdit ? 'Modifier le contact' : 'Nouveau contact'}</Dialog.Title>
				<Dialog.Description>
					{isEdit
						? 'Modifiez les informations du contact.'
						: 'Renseignez les informations du contact.'}
				</Dialog.Description>
			</Dialog.Header>
			{@render formContent(() => (open = false))}
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<Drawer.Root bind:open>
		<Drawer.Content class="px-4 pb-6">
			<Drawer.Header class="text-left">
				<Drawer.Title>{isEdit ? 'Modifier le contact' : 'Nouveau contact'}</Drawer.Title>
				<Drawer.Description>
					{isEdit
						? 'Modifiez les informations du contact.'
						: 'Renseignez les informations du contact.'}
				</Drawer.Description>
			</Drawer.Header>
			<div class="overflow-y-auto">
				{@render formContent(() => (open = false))}
			</div>
		</Drawer.Content>
	</Drawer.Root>
{/if}
