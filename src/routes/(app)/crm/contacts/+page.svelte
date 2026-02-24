<script lang="ts">
	import type { PageProps } from './$types';
	import * as Table from '$lib/components/ui/table';
	import * as Button from '$lib/components/ui/button';
	import * as Input from '$lib/components/ui/input';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import * as Select from '$lib/components/ui/select';
	import ContactSheet from '$lib/components/crm/ContactSheet.svelte';
	import { goto } from '$app/navigation';

	let { data }: PageProps = $props();
	let search = $state('');
	let posteFilter = $state<string>('all');
	let contactSheetOpen = $state(false);
	let contactSheetContact = $state<typeof data.editContact>(null);

	$effect(() => {
		search = data?.query ?? '';
		posteFilter = data?.poste && data.poste !== '' ? data.poste : 'all';
	});

	$effect(() => {
		if (data?.editContact) {
			contactSheetOpen = true;
			contactSheetContact = data.editContact;
			// Retirer ?edit= de l’URL pour que, après enregistrement, le sheet ne se rouvre pas
			const params = new URLSearchParams();
			if (data?.query) params.set('q', data.query);
			if (data?.poste && data.poste !== 'all') params.set('poste', data.poste);
			const qs = params.toString();
			goto(qs ? `/crm/contacts?${qs}` : '/crm/contacts', { replaceState: true });
		}
	});

	const contacts = $derived(data?.contacts ?? []);
	const companies = $derived(data?.companies ?? []);
	const workspaceId = $derived(data?.workspaceId);

	function fullName(c: { firstName?: string | null; lastName?: string | null }) {
		return [c.firstName, c.lastName].filter(Boolean).join(' ') || '—';
	}

	function companyBadges(
		c: { contactCompanies: { companyId: string }[] },
		companyList: { id: string; name: string }[]
	) {
		return (
			c.contactCompanies?.map((cc) => companyList.find((co) => co.id === cc.companyId)?.name).filter(Boolean) ?? []
		);
	}

	const POSTE_OPTIONS = [
		{ value: 'all', label: 'Tous les postes' },
		{ value: 'Responsable RH', label: 'Responsable RH' },
		{ value: 'CEO', label: 'CEO' },
		{ value: 'Autre', label: 'Autre' }
	];

	function applyFilters() {
		const params = new URLSearchParams();
		if (search) params.set('q', search);
		if (posteFilter && posteFilter !== 'all') params.set('poste', posteFilter);
		goto(`/crm/contacts?${params.toString()}`, { replaceState: true });
	}
</script>

<svelte:head>
	<title>Contacts</title>
</svelte:head>

{#if !workspaceId}
	<div class="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
		<p class="text-sm">Aucun espace de travail assigné.</p>
	</div>
{:else}
	<div class="flex min-h-0 flex-1 flex-col gap-4">
		<div class="flex flex-wrap items-center gap-2">
			<Input.Root
				type="search"
				placeholder="Rechercher par nom ou email..."
				class="max-w-xs"
				bind:value={search}
				onkeydown={(e) => e.key === 'Enter' && applyFilters()}
			/>
			<Select.Root type="single" bind:value={posteFilter}>
				<Select.Trigger class="w-[180px]">
					{POSTE_OPTIONS.find((o) => o.value === posteFilter)?.label ?? 'Poste'}
				</Select.Trigger>
				<Select.Content>
					{#each POSTE_OPTIONS as opt (opt.value)}
						<Select.Item value={opt.value}>{opt.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			<Button.Root onclick={() => applyFilters()}>Filtrer</Button.Root>
		</div>

		{#if contacts.length === 0}
			<div class="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
				<p class="text-sm">Aucun contact pour le moment.</p>
				<Button.Root href="/crm/contacts/creer" class="mt-2">
					Ajouter un contact
				</Button.Root>
			</div>
		{:else}
			<div class="rounded-md border overflow-auto">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Nom</Table.Head>
							<Table.Head>Entreprise(s)</Table.Head>
							<Table.Head>Poste</Table.Head>
							<Table.Head>Email</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each contacts as c (c.id)}
							<Table.Row
								class="cursor-pointer hover:bg-muted/50"
								tabindex={0}
								role="link"
								aria-label={fullName(c)}
								onclick={() => goto(`/crm/contacts/${c.id}`)}
								onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && goto(`/crm/contacts/${c.id}`)}
							>
								<Table.Cell class="font-medium">{fullName(c)}</Table.Cell>
								<Table.Cell>
									{#each companyBadges(c, companies) as name (name)}
										<Badge variant="secondary" class="mr-1 text-xs">{name}</Badge>
									{/each}
									{#if companyBadges(c, companies).length === 0}
										<span class="text-muted-foreground">—</span>
									{/if}
								</Table.Cell>
								<Table.Cell>
									{#if c.poste}
										<Badge variant="outline">{c.poste}</Badge>
									{:else}
										<span class="text-muted-foreground">—</span>
									{/if}
								</Table.Cell>
								<Table.Cell>
									{#if c.email}
										<a href="mailto:{c.email}" class="text-primary hover:underline" onclick={(e) => e.stopPropagation()}>{c.email}</a>
									{:else}
										<span class="text-muted-foreground">—</span>
									{/if}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		{/if}
	</div>

	<ContactSheet bind:open={contactSheetOpen} contact={contactSheetContact} companies={companies} />
{/if}
