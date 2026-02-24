<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import * as Button from '$lib/components/ui/button';
	import * as Input from '$lib/components/ui/input';
	import * as Label from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import {
		legalStatusOptions,
		industryOptions,
		companySizeOptions
	} from '$lib/crm/company-form-options';

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

	let {
		open = $bindable(false),
		company = null as CompanyForForm | null
	}: {
		open?: boolean;
		company?: CompanyForForm | null;
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
			name = '';
			siret = '';
			legalStatus = '';
			industry = '';
			companySize = '';
			websiteUrl = '';
			address = '';
			city = '';
			region = '';
			internalNotes = '';
		}
	});
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="sm:max-w-lg overflow-y-auto">
		<Sheet.Header>
			<Sheet.Title>{isEdit ? 'Modifier l\'entreprise' : 'Nouvelle entreprise'}</Sheet.Title>
			<Sheet.Description>
				{isEdit ? 'Modifiez les informations de l\'entreprise.' : 'Renseignez les informations de l\'entreprise.'}
			</Sheet.Description>
		</Sheet.Header>
		<form
			method="POST"
			action="?/{isEdit ? 'updateCompany' : 'createCompany'}"
			use:enhance={() => {
				return async ({ result }) => {
					if (result.type === 'success') {
						toast.success(isEdit ? 'Entreprise mise à jour' : 'Entreprise créée');
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
			{#if company?.id}
				<input type="hidden" name="companyId" value={company.id} />
			{/if}
			<input type="hidden" name="legalStatus" value={legalStatus} />
			<input type="hidden" name="industry" value={industry} />
			<input type="hidden" name="companySize" value={companySize} />
			<div class="space-y-2">
				<Label.Root for="name">Nom</Label.Root>
				<Input.Root id="name" name="name" bind:value={name} required />
			</div>
			<div class="space-y-2">
				<Label.Root for="siret">SIRET</Label.Root>
				<Input.Root id="siret" name="siret" bind:value={siret} />
			</div>
			<div class="space-y-2">
				<Label.Root for="legalStatus">Statut juridique</Label.Root>
				<Select.Root type="single" bind:value={legalStatus} name="legalStatus">
					<Select.Trigger id="legalStatus" class="w-full">
						{legalStatus || 'Sélectionner'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="">—</Select.Item>
						{#each legalStatusOptions as opt (opt)}
							<Select.Item value={opt}>{opt}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
			<div class="space-y-2">
				<Label.Root for="industry">Industrie</Label.Root>
				<Select.Root type="single" bind:value={industry} name="industry">
					<Select.Trigger id="industry" class="w-full">
						{industry || 'Sélectionner'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="">—</Select.Item>
						{#each industryOptions as opt (opt)}
							<Select.Item value={opt}>{opt}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
			<div class="space-y-2">
				<Label.Root for="companySize">Taille</Label.Root>
				<Select.Root type="single" bind:value={companySize} name="companySize">
					<Select.Trigger id="companySize" class="w-full">
						{companySize || 'Sélectionner'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="">—</Select.Item>
						{#each companySizeOptions as opt (opt)}
							<Select.Item value={opt}>{opt}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
			<div class="space-y-2">
				<Label.Root for="websiteUrl">Site web</Label.Root>
				<Input.Root id="websiteUrl" name="websiteUrl" type="url" bind:value={websiteUrl} placeholder="https://..." />
			</div>
			<div class="space-y-2">
				<Label.Root for="address">Adresse</Label.Root>
				<Input.Root id="address" name="address" bind:value={address} />
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label.Root for="city">Ville</Label.Root>
					<Input.Root id="city" name="city" bind:value={city} />
				</div>
				<div class="space-y-2">
					<Label.Root for="region">Région</Label.Root>
					<Input.Root id="region" name="region" bind:value={region} />
				</div>
			</div>
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
