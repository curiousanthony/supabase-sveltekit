<script lang="ts">
	import type { PageProps } from './$types';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import NavTabs from '$lib/components/nav-tabs.svelte';
	import * as Select from '$lib/components/ui/select';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { tick } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { cn } from '$lib/utils';
	import {
		DEAL_STAGES,
		STAGE_COLORS,
		STAGE_PROBABILITIES,
		FUNDING_TYPES,
		DEAL_FORMATS,
		INTRA_INTER,
		MODALITIES,
		DEAL_SOURCES,
		LOSS_REASONS,
		FUNDING_STATUSES,
		formatCurrency,
		userDisplayName,
		type DealStage
	} from '$lib/crm/deal-schema';
	import Building2 from '@lucide/svelte/icons/building-2';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Mail from '@lucide/svelte/icons/mail';
	import Phone from '@lucide/svelte/icons/phone';
	import Briefcase from '@lucide/svelte/icons/briefcase';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Pencil from '@lucide/svelte/icons/pencil';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import LayoutGrid from '@lucide/svelte/icons/layout-grid';
	import Banknote from '@lucide/svelte/icons/banknote';
	import Truck from '@lucide/svelte/icons/truck';
	import ContactModal from '$lib/components/crm/ContactModal.svelte';

	let { data }: PageProps = $props();
	let { deal, contacts, companies, programmes, members, header } = $derived(data);

	let activeTab = $state('apercu');
	let openCloseDialog = $state(false);
	let openLossDialog = $state(false);
	let lossReason = $state<string>('');
	let lossReasonDetail = $state('');
	let contactModalOpen = $state(false);

	function contactLabel(c: typeof deal.contact): string {
		if (!c) return '—';
		return [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email || '—';
	}

	function companyFromContact(c: typeof deal.contact): { id: string; name: string; industry?: { name: string } | null } | null {
		if (!c?.contactCompanies?.length) return null;
		return c.contactCompanies[0]?.company ?? null;
	}

	// Inline edit state
	let editingField = $state<string | null>(null);
	let editValue = $state('');
	let editInputEl = $state<HTMLInputElement | null>(null);

	async function startEdit(field: string, currentValue: string | number | null | undefined) {
		editingField = field;
		editValue = currentValue?.toString() ?? '';
		await tick();
		editInputEl?.focus();
		editInputEl?.select();
	}

	function cancelEdit() {
		editingField = null;
		editValue = '';
	}

	async function submitFieldUpdate(field: string, value: string) {
		const formData = new FormData();
		formData.set('field', field);
		formData.set('value', value);

		const response = await fetch('?/updateField', {
			method: 'POST',
			body: formData
		});

		if (response.ok) {
			toast.success('Mis à jour');
			editingField = null;
			editValue = '';
			await invalidateAll();
		} else {
			toast.error('Erreur lors de la mise à jour');
		}
	}

	function handleFieldKeydown(e: KeyboardEvent, field: string) {
		if (e.key === 'Enter') {
			e.preventDefault();
			submitFieldUpdate(field, editValue);
		}
		if (e.key === 'Escape') cancelEdit();
	}

	async function submitSelectUpdate(field: string, value: string) {
		await submitFieldUpdate(field, value);
	}

	async function submitPickerUpdate(field: string, value: string) {
		await submitFieldUpdate(field, value);
	}

	// Contact picker
	let contactPickerOpen = $state(false);
	let contactSearch = $state('');
	const filteredContacts = $derived(
		(contacts ?? []).filter((c) => {
			const q = contactSearch.toLowerCase();
			return (
				(c.firstName?.toLowerCase().includes(q) ?? false) ||
				(c.lastName?.toLowerCase().includes(q) ?? false) ||
				(c.email?.toLowerCase().includes(q) ?? false)
			);
		})
	);

	// Programme picker
	let programmePickerOpen = $state(false);
	let programmeSearch = $state('');
	const filteredProgrammes = $derived(
		(programmes ?? []).filter((p) =>
			p.titre.toLowerCase().includes(programmeSearch.toLowerCase())
		)
	);
</script>

<svelte:head>
	<title>{deal?.name ?? 'Deal'}</title>
</svelte:head>

<ContactModal bind:open={contactModalOpen} companies={companies ?? []} />

{#if deal}
	<div class="space-y-6">
		<!-- Stage Stepper -->
		<div class="flex items-center gap-1 overflow-x-auto rounded-lg border bg-card p-2">
			{#each DEAL_STAGES as stage, i}
				{@const colors = STAGE_COLORS[stage]}
				{@const isCurrent = deal.stage === stage}
				{@const isPast = DEAL_STAGES.indexOf(deal.stage as DealStage) > i && stage !== 'Perdu'}
				{@const isTerminal = stage === 'Gagné' || stage === 'Perdu'}
				<form
					method="POST"
					action="?/updateStage"
					class="flex-1"
					use:enhance={() => {
						return async ({ result, update }) => {
							if (result.type === 'success') {
								toast.success(`Étape mise à jour : ${stage}`);
								await invalidateAll();
							}
							if (result.type === 'failure' && result.data && 'message' in result.data) {
								toast.error(String(result.data.message));
							}
							await update();
						};
					}}
				>
					<input type="hidden" name="stage" value={stage} />
					{#if stage === 'Perdu'}
						<button
							type="button"
							onclick={() => (openLossDialog = true)}
							class={cn(
								'flex w-full flex-col items-center gap-0.5 rounded-md px-2 py-1.5 text-xs transition-all cursor-pointer',
								isCurrent
									? cn(colors.bg, colors.text, 'ring-2 ring-red-400/50 font-semibold')
									: 'text-muted-foreground hover:bg-muted'
							)}
						>
							<span class="font-medium">{stage}</span>
							<span class="text-[10px] opacity-70">{STAGE_PROBABILITIES[stage]}%</span>
						</button>
					{:else}
						<button
							type="submit"
							class={cn(
								'flex w-full flex-col items-center gap-0.5 rounded-md px-2 py-1.5 text-xs transition-all cursor-pointer',
								isCurrent
									? cn(colors.bg, colors.text, 'ring-2 ring-primary/30 font-semibold')
									: isPast
										? 'bg-primary/10 text-primary/70'
										: 'text-muted-foreground hover:bg-muted'
							)}
						>
							<span class="font-medium">{stage}</span>
							<span class="text-[10px] opacity-70">{STAGE_PROBABILITIES[stage]}%</span>
						</button>
					{/if}
				</form>
			{/each}
		</div>

		<!-- Loss reason dialog -->
		<Dialog.Root bind:open={openLossDialog}>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Marquer comme Perdu</Dialog.Title>
					<Dialog.Description>Indiquez la raison de la perte pour le suivi analytics.</Dialog.Description>
				</Dialog.Header>
				<form
					method="POST"
					action="?/updateStage"
					class="space-y-4"
					use:enhance={() => {
						return async ({ result, update }) => {
							if (result.type === 'success') {
								openLossDialog = false;
								toast.success('Deal marqué comme Perdu');
								await invalidateAll();
							}
							await update();
						};
					}}
				>
					<input type="hidden" name="stage" value="Perdu" />
					<div class="space-y-1.5">
						<Label>Raison de la perte</Label>
						<Select.Root type="single" bind:value={lossReason} name="lossReason">
							<Select.Trigger class="w-full">{lossReason || 'Sélectionner'}</Select.Trigger>
							<Select.Content>
								{#each LOSS_REASONS as r}
									<Select.Item value={r}>{r}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
						<input type="hidden" name="lossReason" value={lossReason} />
					</div>
					<div class="space-y-1.5">
						<Label for="lossDetail">Détails (optionnel)</Label>
						<textarea
							id="lossDetail"
							name="lossReasonDetail"
							bind:value={lossReasonDetail}
							rows="2"
							class="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							placeholder="Précisions sur la perte..."
						></textarea>
					</div>
					<Dialog.Footer>
						<Dialog.Close><Button variant="outline">Annuler</Button></Dialog.Close>
						<Button type="submit" variant="destructive" disabled={!lossReason}>Marquer comme Perdu</Button>
					</Dialog.Footer>
				</form>
			</Dialog.Content>
		</Dialog.Root>

		<div class="grid gap-6 lg:grid-cols-[300px_1fr]">
			<!-- Left Sidebar: Contact & Company -->
			<div class="space-y-4">
				<!-- Contact Card -->
				<Card.Root>
					<Card.Header class="pb-3">
						<div class="flex items-center justify-between">
							<Card.Title class="text-sm font-medium text-muted-foreground">Contact</Card.Title>
							<div class="flex gap-1">
								<button
									type="button"
									onclick={() => (contactPickerOpen = !contactPickerOpen)}
									class="text-muted-foreground hover:text-foreground transition-colors"
								>
									<Pencil class="size-3.5" />
								</button>
							</div>
						</div>
					</Card.Header>
					<Card.Content class="space-y-3">
						{#if contactPickerOpen}
							<Popover.Root bind:open={contactPickerOpen}>
								<Popover.Trigger class="w-full">
									{#snippet child({ props })}
										<button
											{...props}
											type="button"
											class="flex h-9 w-full cursor-pointer items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm"
										>
											<span class="text-muted-foreground">Changer le contact...</span>
											<ChevronsUpDown class="size-4 opacity-50" />
										</button>
									{/snippet}
								</Popover.Trigger>
								<Popover.Content class="w-72 p-0" align="start">
									<Command.Root shouldFilter={false}>
										<Command.Input placeholder="Rechercher..." bind:value={contactSearch} />
										<Command.List>
											<Command.Empty>Aucun contact.</Command.Empty>
											<Command.Item value="" onSelect={() => { submitPickerUpdate('contactId', ''); contactPickerOpen = false; }}>
												<span class="text-muted-foreground">Aucun</span>
											</Command.Item>
											{#each filteredContacts as c (c.id)}
												<Command.Item value={c.id} onSelect={() => { submitPickerUpdate('contactId', c.id); contactPickerOpen = false; }}>
													{[c.firstName, c.lastName].filter(Boolean).join(' ')}
												</Command.Item>
											{/each}
										</Command.List>
									</Command.Root>
								</Popover.Content>
							</Popover.Root>
							<button
								type="button"
								onclick={() => { contactModalOpen = true; contactPickerOpen = false; }}
								class="w-full text-xs text-primary hover:underline text-left"
							>
								+ Créer un nouveau contact
							</button>
						{/if}

						{#if deal.contact}
							{@const c = deal.contact}
							<div class="space-y-2">
								<div class="flex items-center gap-2">
									<div class="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
										{(c.firstName?.[0] ?? '').toUpperCase()}{(c.lastName?.[0] ?? '').toUpperCase()}
									</div>
									<div>
										<p class="text-sm font-medium">{contactLabel(c)}</p>
										{#if c.poste}
											<p class="text-xs text-muted-foreground">{c.poste}</p>
										{/if}
									</div>
								</div>
								{#if c.email}
									<a href="mailto:{c.email}" class="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
										<Mail class="size-3" />
										{c.email}
									</a>
								{/if}
								{#if c.phone}
									<a href="tel:{c.phone}" class="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
										<Phone class="size-3" />
										{c.phone}
									</a>
								{/if}
								{#if c.linkedinUrl}
									<a href={c.linkedinUrl} target="_blank" rel="noopener" class="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
										<ExternalLink class="size-3" />
										LinkedIn
									</a>
								{/if}
								<a href="/contacts/{c.id}" class="block text-xs text-primary hover:underline pt-1">
									Voir la fiche contact
								</a>
							</div>
						{:else}
							<p class="text-sm text-muted-foreground">Aucun contact lié</p>
						{/if}
					</Card.Content>
				</Card.Root>

				<!-- Company Card (from contact or direct) -->
				{#if deal.company || companyFromContact(deal.contact)}
				{@const resolvedCompany = (deal.company ?? companyFromContact(deal.contact))!}
					<Card.Root>
						<Card.Header class="pb-3">
							<Card.Title class="text-sm font-medium text-muted-foreground">Entreprise</Card.Title>
						</Card.Header>
						<Card.Content class="space-y-2">
							<div class="flex items-center gap-2">
								<Building2 class="size-4 text-muted-foreground" />
								<span class="text-sm font-medium">{resolvedCompany.name}</span>
							</div>
							{#if resolvedCompany.industry}
								<div class="flex items-center gap-2 text-xs text-muted-foreground">
									<Briefcase class="size-3" />
									{resolvedCompany.industry.name}
								</div>
							{/if}
							{#if !deal.company && deal.contact}
								<Badge variant="secondary" class="text-[10px]">via contact</Badge>
							{/if}
							<a href="/contacts/entreprises/{resolvedCompany.id}" class="block text-xs text-primary hover:underline pt-1">
								Voir l'entreprise
							</a>
						</Card.Content>
					</Card.Root>
				{/if}

				<!-- Programme Card -->
				<Card.Root>
					<Card.Header class="pb-3">
						<div class="flex items-center justify-between">
							<Card.Title class="text-sm font-medium text-muted-foreground">Programme</Card.Title>
							<button
								type="button"
								onclick={() => (programmePickerOpen = !programmePickerOpen)}
								class="text-muted-foreground hover:text-foreground transition-colors"
							>
								<Pencil class="size-3.5" />
							</button>
						</div>
					</Card.Header>
					<Card.Content class="space-y-3">
						{#if programmePickerOpen}
							<Popover.Root bind:open={programmePickerOpen}>
								<Popover.Trigger class="w-full">
									{#snippet child({ props })}
										<button
											{...props}
											type="button"
											class="flex h-9 w-full cursor-pointer items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm"
										>
											<span class="text-muted-foreground">Changer le programme...</span>
											<ChevronsUpDown class="size-4 opacity-50" />
										</button>
									{/snippet}
								</Popover.Trigger>
								<Popover.Content class="w-72 p-0" align="start">
									<Command.Root shouldFilter={false}>
										<Command.Input placeholder="Rechercher..." bind:value={programmeSearch} />
										<Command.List>
											<Command.Empty>Aucun programme.</Command.Empty>
											<Command.Item value="" onSelect={() => { submitPickerUpdate('programmeId', ''); programmePickerOpen = false; }}>
												<span class="text-muted-foreground">Aucun</span>
											</Command.Item>
											{#each filteredProgrammes as p (p.id)}
												<Command.Item value={p.id} onSelect={() => { submitPickerUpdate('programmeId', p.id); programmePickerOpen = false; }}>
													{p.titre}
												</Command.Item>
											{/each}
										</Command.List>
									</Command.Root>
								</Popover.Content>
							</Popover.Root>
						{/if}

						{#if deal.programme}
							<div class="space-y-2">
								<div class="flex items-center gap-2">
									<BookOpen class="size-4 text-muted-foreground" />
									<span class="text-sm font-medium">{deal.programme.titre}</span>
								</div>
								{#if deal.programme.modalite || deal.programme.dureeHeures || deal.programme.prixPublic}
									<div class="flex flex-wrap gap-2 text-xs text-muted-foreground">
										{#if deal.programme.modalite}
											<span>{deal.programme.modalite}</span>
										{/if}
										{#if deal.programme.dureeHeures}
											<span>{deal.programme.dureeHeures}h</span>
										{/if}
										{#if deal.programme.prixPublic}
											<span>{Number(deal.programme.prixPublic).toLocaleString('fr-FR')} €</span>
										{/if}
									</div>
								{/if}
								<a href="/bibliotheque/programmes/{deal.programme.id}" class="block text-xs text-primary hover:underline pt-1">
									Voir le programme
								</a>
							</div>
						{:else}
							<p class="text-sm text-muted-foreground">Aucun programme lié</p>
						{/if}
					</Card.Content>
				</Card.Root>
			</div>

			<!-- Right Main: Tabs -->
			<div>
				{#snippet editableRow(label: string, field: string, value: string | null | undefined, type: string = 'text')}
					<div class="flex items-start justify-between gap-4">
						<div class="min-w-0 flex-1">
							<p class="text-xs font-medium text-muted-foreground mb-1">{label}</p>
						{#if editingField === field}
							<Input
								bind:ref={editInputEl}
								type={type}
								bind:value={editValue}
								onkeydown={(e) => handleFieldKeydown(e, field)}
								onblur={() => submitFieldUpdate(field, editValue)}
								class="h-8 text-sm"
							/>
							{:else}
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div
									onclick={() => startEdit(field, value)}
									class="group flex cursor-text items-center gap-2 rounded px-1 py-0.5 -mx-1 hover:bg-accent/50 transition-colors"
								>
									<span class={cn('text-sm', value ? '' : 'text-muted-foreground')}>{value || '—'}</span>
									<Pencil class="size-3 opacity-0 group-hover:opacity-50 transition-opacity" />
								</div>
							{/if}
						</div>
					</div>
				{/snippet}

				{#snippet editableSelect(label: string, field: string, currentValue: string | null | undefined, options: readonly string[])}
					<div class="flex items-start justify-between gap-4">
						<div class="min-w-0 flex-1">
							<p class="text-xs font-medium text-muted-foreground mb-1">{label}</p>
							<Select.Root
								type="single"
								value={currentValue ?? ''}
								onValueChange={(v) => submitSelectUpdate(field, v)}
							>
								<Select.Trigger class="h-8 w-full text-sm">
									<span class={cn(!currentValue && 'text-muted-foreground')}>
										{currentValue || '—'}
									</span>
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="">—</Select.Item>
									{#each options as opt}
										<Select.Item value={opt}>{opt}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>
					</div>
				{/snippet}

			<div class="w-full">
				<NavTabs
					tabs={[
						{ value: 'apercu', label: 'Aperçu', icon: LayoutGrid },
						{ value: 'financement', label: 'Financement', icon: Banknote },
						{ value: 'logistique', label: 'Logistique', icon: Truck }
					]}
					activeValue={activeTab}
					onTabChange={(v) => (activeTab = v)}
					ariaLabel="Sections du deal"
				/>

				{#if activeTab === 'apercu'}
				<div class="space-y-4 mt-4">
						<Card.Root>
							<Card.Content class="pt-6 space-y-5">
								{@render editableRow('Nom du deal', 'name', deal.name)}

								<div class="grid grid-cols-2 gap-x-6 gap-y-5">
									{@render editableRow('Montant (€)', 'dealAmount', deal.dealAmount, 'number')}
									{@render editableSelect('Source', 'source', deal.source, DEAL_SOURCES)}
									{@render editableRow('Probabilité (%)', 'probability', deal.probability?.toString(), 'number')}
									{@render editableRow('Date clôture prévue', 'expectedCloseDate', deal.expectedCloseDate, 'date')}
								</div>

								{@render editableRow('Description', 'description', deal.description)}

								<!-- Commercial -->
								<div>
									<p class="text-xs font-medium text-muted-foreground mb-1">Commercial responsable</p>
									<Select.Root
										type="single"
										value={deal.commercialId ?? ''}
										onValueChange={(v) => submitSelectUpdate('commercialId', v)}
									>
										<Select.Trigger class="h-8 w-full max-w-xs text-sm">
											{#if deal.commercial}
												{userDisplayName(deal.commercial)}
											{:else}
												<span class="text-muted-foreground">—</span>
											{/if}
										</Select.Trigger>
										<Select.Content>
											<Select.Item value="">—</Select.Item>
											{#each members ?? [] as m}
												<Select.Item value={m.id}>
													{[m.firstName, m.lastName].filter(Boolean).join(' ') || m.email}
												</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								</div>

								{#if deal.formation}
									<div class="pt-2 border-t">
										<p class="text-xs font-medium text-muted-foreground mb-2">Formation liée</p>
										<a
											href="/formations/{deal.formation.id}"
											class="flex items-center gap-2 rounded-md border bg-green-50 dark:bg-green-950/30 p-3 text-sm font-medium hover:border-green-400 transition-colors"
										>
											<BookOpen class="size-4 text-green-600" />
											{deal.formation.name}
											<Badge variant="secondary" class="ml-auto text-xs">{deal.formation.statut}</Badge>
										</a>
									</div>
								{/if}

								{#if deal.lossReason}
									<div class="pt-2 border-t">
										<p class="text-xs font-medium text-muted-foreground mb-1">Raison de la perte</p>
										<p class="text-sm">{deal.lossReason}</p>
										{#if deal.lossReasonDetail}
											<p class="text-xs text-muted-foreground mt-1">{deal.lossReasonDetail}</p>
										{/if}
									</div>
								{/if}
							</Card.Content>
						</Card.Root>

						{#if deal.stage !== 'Gagné' && deal.stage !== 'Perdu' && !deal.formation}
							<Card.Root>
								<Card.Content class="flex items-center justify-between pt-6">
									<div>
										<p class="text-sm font-medium">Convertir en formation</p>
										<p class="text-xs text-muted-foreground">Créer une formation à partir de ce deal</p>
									</div>
									<Dialog.Root bind:open={openCloseDialog}>
										<Dialog.Trigger>
											<Button>Convertir en Formation</Button>
										</Dialog.Trigger>
										<Dialog.Content>
											<Dialog.Header>
												<Dialog.Title>Créer une formation ?</Dialog.Title>
												<Dialog.Description>
													Une formation sera créée avec les informations du deal. Le deal sera marqué comme Gagné.
												</Dialog.Description>
											</Dialog.Header>
											<Dialog.Footer>
												<Dialog.Close><Button variant="outline">Annuler</Button></Dialog.Close>
												<form method="POST" action="?/closeAndCreateFormation" use:enhance>
													<Button type="submit" onclick={() => (openCloseDialog = false)}>Créer la formation</Button>
												</form>
											</Dialog.Footer>
										</Dialog.Content>
									</Dialog.Root>
								</Card.Content>
							</Card.Root>
						{/if}
				</div>
				{/if}

				{#if activeTab === 'financement'}
				<div class="space-y-4 mt-4">
						<Card.Root>
							<Card.Content class="pt-6 space-y-5">
								<div class="grid grid-cols-2 gap-x-6 gap-y-5">
									{@render editableRow('Montant du deal (€)', 'dealAmount', deal.dealAmount, 'number')}
									{@render editableRow('Montant financé (€)', 'fundedAmount', deal.fundedAmount, 'number')}
									{@render editableSelect('Type de financement', 'fundingType', deal.fundingType, FUNDING_TYPES)}
									{@render editableSelect('Statut financement', 'fundingStatus', deal.fundingStatus, FUNDING_STATUSES)}
								</div>

								<!-- Funding gap indicator -->
								{#if deal.dealAmount && deal.fundedAmount}
									{@const total = Number(deal.dealAmount)}
									{@const funded = Number(deal.fundedAmount)}
									{@const gap = total - funded}
									{#if gap > 0}
										<div class="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3 text-sm">
											<p class="font-medium text-amber-800 dark:text-amber-200">
												Reste à charge client : {formatCurrency(gap)}
											</p>
											<div class="mt-2 h-2 w-full rounded-full bg-amber-200 dark:bg-amber-800">
												<div
													class="h-2 rounded-full bg-amber-500 transition-all"
													style="width: {Math.min((funded / total) * 100, 100)}%"
												></div>
											</div>
											<p class="text-xs text-amber-700 dark:text-amber-300 mt-1">
												{Math.round((funded / total) * 100)}% financé
											</p>
										</div>
									{/if}
								{/if}

								<div>
									<p class="text-xs font-medium text-muted-foreground mb-1">Financement accordé</p>
									<Checkbox
										checked={deal.isFunded ?? false}
										onCheckedChange={(v) => submitFieldUpdate('isFunded', v ? 'true' : 'false')}
									/>
								</div>

								{@render editableRow('Réf. dossier OPCO', 'fundingReference', deal.fundingReference)}
							</Card.Content>
						</Card.Root>
				</div>
				{/if}

				{#if activeTab === 'logistique'}
				<div class="space-y-4 mt-4">
						<Card.Root>
							<Card.Content class="pt-6 space-y-5">
								<div class="grid grid-cols-2 gap-x-6 gap-y-5">
									{@render editableSelect('Format', 'dealFormat', deal.dealFormat, DEAL_FORMATS)}
									{@render editableSelect('Intra / Inter', 'intraInter', deal.intraInter, INTRA_INTER)}
									{@render editableRow('Durée (heures)', 'durationHours', deal.durationHours?.toString(), 'number')}
									{@render editableRow('Nb apprenants', 'nbApprenants', deal.nbApprenants?.toString(), 'number')}
									{@render editableRow('Début souhaité', 'desiredStartDate', deal.desiredStartDate, 'date')}
									{@render editableRow('Fin souhaitée', 'desiredEndDate', deal.desiredEndDate, 'date')}
								</div>

								<!-- Modalities -->
								<div>
									<p class="text-xs font-medium text-muted-foreground mb-2">Modalité(s)</p>
									<div class="flex flex-wrap gap-2">
										{#each MODALITIES as mod}
											{@const isSelected = (deal.modalities ?? []).includes(mod)}
											<form method="POST" action="?/updateModalities" use:enhance={() => async ({ update }) => { await update(); await invalidateAll(); }}>
												{#each (deal.modalities ?? []).includes(mod) ? (deal.modalities ?? []).filter((m) => m !== mod) : [...(deal.modalities ?? []), mod] as m}
													<input type="hidden" name="modalities" value={m} />
												{/each}
												<button
													type="submit"
													class={cn(
														'rounded-md border px-3 py-1.5 text-sm transition-colors cursor-pointer',
														isSelected
															? 'border-primary bg-primary/10 text-primary'
															: 'border-input text-muted-foreground hover:border-foreground hover:text-foreground'
													)}
												>
													{mod}
												</button>
											</form>
										{/each}
									</div>
								</div>
							</Card.Content>
						</Card.Root>
				</div>
				{/if}
			</div>
			</div>
		</div>
	</div>
{/if}
