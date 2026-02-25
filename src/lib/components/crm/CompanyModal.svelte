<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as Button from '$lib/components/ui/button';
	import * as Input from '$lib/components/ui/input';
	import * as Label from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import CityCombobox from '$lib/components/crm/CityCombobox.svelte';
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

{#snippet formContent(close: () => void)}
	<form
		method="POST"
		action="?/{isEdit ? 'updateCompany' : 'createCompany'}"
		use:enhance={handleEnhance}
		class="flex flex-col gap-4"
	>
		{#if company?.id}
			<input type="hidden" name="companyId" value={company.id} />
		{/if}
		<input type="hidden" name="legalStatus" value={legalStatus} />
		<input type="hidden" name="industry" value={industry} />
		<input type="hidden" name="companySize" value={companySize} />
		<div class="space-y-1.5">
			<Label.Root for="cmo-name">Nom</Label.Root>
			<Input.Root id="cmo-name" name="name" bind:value={name} required />
		</div>
		<div class="space-y-1.5">
			<Label.Root for="cmo-siret">SIRET</Label.Root>
			<Input.Root id="cmo-siret" name="siret" bind:value={siret} />
		</div>
		<div class="grid grid-cols-2 gap-3">
			<div class="space-y-1.5">
				<Label.Root for="cmo-legalStatus">Statut juridique</Label.Root>
				<Select.Root type="single" bind:value={legalStatus} name="legalStatus">
					<Select.Trigger id="cmo-legalStatus" class="w-full">
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
			<div class="space-y-1.5">
				<Label.Root for="cmo-industry">Industrie</Label.Root>
				<Select.Root type="single" bind:value={industry} name="industry">
					<Select.Trigger id="cmo-industry" class="w-full">
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
		</div>
		<div class="space-y-1.5">
			<Label.Root for="cmo-size">Taille</Label.Root>
			<Select.Root type="single" bind:value={companySize} name="companySize">
				<Select.Trigger id="cmo-size" class="w-full">
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
		<div class="space-y-1.5">
			<Label.Root for="cmo-website">Site web</Label.Root>
			<Input.Root
				id="cmo-website"
				name="websiteUrl"
				type="url"
				bind:value={websiteUrl}
				placeholder="https://..."
			/>
		</div>
		<div class="space-y-1.5">
			<Label.Root for="cmo-address">Adresse</Label.Root>
			<Input.Root id="cmo-address" name="address" bind:value={address} />
		</div>
		<input type="hidden" name="city" value={city} />
		<input type="hidden" name="region" value={region} />
		<CityCombobox
			{city}
			{region}
			onSelect={(c: string, r: string) => { city = c; region = r; }}
		/>
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
		<div class="flex justify-end gap-2 pt-2">
			<Button.Root type="button" variant="outline" onclick={close}>Annuler</Button.Root>
			<Button.Root type="submit">{isEdit ? 'Enregistrer' : 'Créer'}</Button.Root>
		</div>
	</form>
{/snippet}

{#if isDesktop}
	<Dialog.Root bind:open>
		<Dialog.Content class="sm:max-w-lg max-h-[90vh] overflow-y-auto">
			<Dialog.Header>
				<Dialog.Title>{isEdit ? "Modifier l'entreprise" : 'Nouvelle entreprise'}</Dialog.Title>
				<Dialog.Description>
					{isEdit
						? "Modifiez les informations de l'entreprise."
						: "Renseignez les informations de l'entreprise."}
				</Dialog.Description>
			</Dialog.Header>
			{@render formContent(() => (open = false))}
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<Drawer.Root bind:open>
		<Drawer.Content class="px-4 pb-6">
			<Drawer.Header class="text-left">
				<Drawer.Title>{isEdit ? "Modifier l'entreprise" : 'Nouvelle entreprise'}</Drawer.Title>
				<Drawer.Description>
					{isEdit
						? "Modifiez les informations de l'entreprise."
						: "Renseignez les informations de l'entreprise."}
				</Drawer.Description>
			</Drawer.Header>
			<div class="overflow-y-auto">
				{@render formContent(() => (open = false))}
			</div>
		</Drawer.Content>
	</Drawer.Root>
{/if}
