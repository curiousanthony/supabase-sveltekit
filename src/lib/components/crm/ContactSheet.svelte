<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import * as Button from '$lib/components/ui/button';
	import * as Input from '$lib/components/ui/input';
	import * as Label from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';

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
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="sm:max-w-lg overflow-y-auto">
		<Sheet.Header>
			<Sheet.Title>{isEdit ? 'Modifier le contact' : 'Nouveau contact'}</Sheet.Title>
			<Sheet.Description>
				{isEdit ? 'Modifiez les informations du contact.' : 'Renseignez les informations du contact.'}
			</Sheet.Description>
		</Sheet.Header>
		<form
			method="POST"
			action="?/{isEdit ? 'updateContact' : 'createContact'}"
			use:enhance={() => {
				return async ({ result }) => {
					if (result.type === 'success') {
						toast.success(isEdit ? 'Contact mis à jour' : 'Contact créé');
						open = false;
						await invalidateAll();
					}
					if (result.type === 'failure' && result.data?.message) {
						toast.error(result.data.message as string);
					}
				};
			}}
			class="flex flex-col gap-4 py-4"
		>
			{#if contact?.id}
				<input type="hidden" name="contactId" value={contact.id} />
			{/if}
			<input type="hidden" name="poste" value={poste} />
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label.Root for="firstName">Prénom</Label.Root>
					<Input.Root id="firstName" name="firstName" bind:value={firstName} required />
				</div>
				<div class="space-y-2">
					<Label.Root for="lastName">Nom</Label.Root>
					<Input.Root id="lastName" name="lastName" bind:value={lastName} required />
				</div>
			</div>
			<div class="space-y-2">
				<Label.Root for="email">Email</Label.Root>
				<Input.Root id="email" name="email" type="email" bind:value={email} required />
			</div>
			<div class="space-y-2">
				<Label.Root for="phone">Téléphone</Label.Root>
				<Input.Root id="phone" name="phone" type="tel" bind:value={phone} />
			</div>
			<div class="space-y-2">
				<Label.Root for="poste">Poste</Label.Root>
				<Select.Root type="single" bind:value={poste} name="poste">
					<Select.Trigger id="poste" class="w-full">
						{poste || 'Sélectionner'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="">—</Select.Item>
						<Select.Item value="Responsable RH">Responsable RH</Select.Item>
						<Select.Item value="CEO">CEO</Select.Item>
						<Select.Item value="Autre">Autre</Select.Item>
					</Select.Content>
				</Select.Root>
			</div>
			<div class="space-y-2">
				<Label.Root for="linkedinUrl">LinkedIn</Label.Root>
				<Input.Root id="linkedinUrl" name="linkedinUrl" type="url" bind:value={linkedinUrl} placeholder="https://..." />
			</div>
			{#if companies.length > 0}
				<div class="space-y-2">
					<Label.Root>Entreprise(s)</Label.Root>
					<div class="flex flex-wrap gap-2 rounded-md border p-3">
						{#each companies as company (company.id)}
							<label class="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									name="companyIds"
									value={company.id}
									checked={companyIds.includes(company.id)}
									onchange={() => toggleCompany(company.id)}
								/>
								<span class="text-sm">{company.name}</span>
							</label>
						{/each}
					</div>
				</div>
			{/if}
			<div class="space-y-2">
				<Label.Root for="internalNotes">Commentaire interne</Label.Root>
				<textarea
					id="internalNotes"
					name="internalNotes"
					bind:value={internalNotes}
					class="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
					rows="3"
				></textarea>
			</div>
			<Sheet.Footer class="gap-2 sm:gap-0">
				<Button.Root type="button" variant="outline" onclick={() => (open = false)}>
					Annuler
				</Button.Root>
				<Button.Root type="submit">{isEdit ? 'Enregistrer' : 'Créer'}</Button.Root>
			</Sheet.Footer>
		</form>
	</Sheet.Content>
</Sheet.Root>
