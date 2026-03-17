<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { cn } from '$lib/utils';
	import type { PageProps } from './$types';
	import {
		DEAL_STAGES,
		FUNDING_TYPES,
		DEAL_FORMATS,
		INTRA_INTER,
		MODALITIES,
		DEAL_SOURCES,
		FUNDING_STATUSES,
		STAGE_COLORS,
		type DealStage
	} from '$lib/crm/deal-schema';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import Check from '@lucide/svelte/icons/check';
	import User2 from '@lucide/svelte/icons/user-round';
	import Building2 from '@lucide/svelte/icons/building-2';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Plus from '@lucide/svelte/icons/plus';
	import ContactModal from '$lib/components/crm/ContactModal.svelte';

	let { data }: PageProps = $props();

	const DRAFT_KEY = 'deal_creer_draft';

	// Form state
	let name = $state('');
	let stage = $state<string>('Suspect');
	let contactId = $state<string | null>(null);
	let companyId = $state<string | null>(null);
	let programmeId = $state<string | null>(null);
	let dealAmount = $state<string>('');
	let fundedAmount = $state<string>('');
	let isFunded = $state(false);
	let fundingType = $state<string>('');
	let fundingStatus = $state<string>('');
	let fundingReference = $state('');
	let dealFormat = $state<string>('');
	let intraInter = $state<string>('');
	let selectedModalities = $state<string[]>([]);
	let desiredStartDate = $state('');
	let desiredEndDate = $state('');
	let expectedCloseDate = $state('');
	let durationHours = $state<string>('');
	let nbApprenants = $state<string>('');
	let probability = $state<string>('');
	let source = $state<string>('');
	let commercialId = $state<string>('');
	let description = $state('');

	let commercialIdInitialized = false;
	$effect(() => {
		if (!commercialIdInitialized && data.currentUserId) {
			commercialId = data.currentUserId;
			commercialIdInitialized = true;
		}
	});

	function saveDraftToSession() {
		try {
			sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
				name, stage, contactId, companyId, programmeId, dealAmount, fundedAmount,
				isFunded, fundingType, fundingStatus, fundingReference, dealFormat, intraInter,
				selectedModalities, desiredStartDate, desiredEndDate, expectedCloseDate,
				durationHours, nbApprenants, probability, source, commercialId, description,
				clientSectionOpen, programmeSectionOpen, detailsSectionOpen
			}));
		} catch { /* quota exceeded – ignore */ }
	}

	$effect(() => {
		if (!data.preselectedProgrammeId) return;
		const raw = sessionStorage.getItem(DRAFT_KEY);
		if (raw) {
			try {
				const d = JSON.parse(raw);
				name = d.name ?? '';
				stage = d.stage ?? 'Suspect';
				contactId = d.contactId ?? null;
				companyId = d.companyId ?? null;
				dealAmount = d.dealAmount ?? '';
				fundedAmount = d.fundedAmount ?? '';
				isFunded = d.isFunded ?? false;
				fundingType = d.fundingType ?? '';
				fundingStatus = d.fundingStatus ?? '';
				fundingReference = d.fundingReference ?? '';
				dealFormat = d.dealFormat ?? '';
				intraInter = d.intraInter ?? '';
				selectedModalities = d.selectedModalities ?? [];
				desiredStartDate = d.desiredStartDate ?? '';
				desiredEndDate = d.desiredEndDate ?? '';
				expectedCloseDate = d.expectedCloseDate ?? '';
				durationHours = d.durationHours ?? '';
				nbApprenants = d.nbApprenants ?? '';
				probability = d.probability ?? '';
				source = d.source ?? '';
				commercialId = d.commercialId ?? data.currentUserId ?? '';
				description = d.description ?? '';
				clientSectionOpen = d.clientSectionOpen ?? true;
				programmeSectionOpen = d.programmeSectionOpen ?? true;
				detailsSectionOpen = d.detailsSectionOpen ?? false;
			} catch { /* corrupt data – ignore */ }
			sessionStorage.removeItem(DRAFT_KEY);
		}
		programmeId = data.preselectedProgrammeId;
	});

	// Picker state
	let contactOpen = $state(false);
	let contactSearch = $state('');
	let programmeOpen = $state(false);
	let programmeSearch = $state('');

	// Sections open state
	let clientSectionOpen = $state(true);
	let programmeSectionOpen = $state(true);
	let detailsSectionOpen = $state(false);

	// Contact modal
	let contactModalOpen = $state(false);

	const selectedContact = $derived(
		data.contacts?.find((c) => c.id === contactId) ?? null
	);
	const selectedProgramme = $derived(
		data.programmes?.find((p) => p.id === programmeId) ?? null
	);

	const filteredContacts = $derived(
		(data.contacts ?? []).filter((c) => {
			const q = contactSearch.toLowerCase();
			return (
				(c.firstName?.toLowerCase().includes(q) ?? false) ||
				(c.lastName?.toLowerCase().includes(q) ?? false) ||
				(c.email?.toLowerCase().includes(q) ?? false)
			);
		})
	);

	const filteredProgrammes = $derived(
		(data.programmes ?? []).filter((p) =>
			p.titre.toLowerCase().includes(programmeSearch.toLowerCase())
		)
	);

	function selectContact(id: string) {
		contactId = id;
		const contact = data.contacts?.find((c) => c.id === id);
		if (contact?.contactCompanies?.[0]?.company) {
			companyId = contact.contactCompanies[0].company.id;
		}
		contactOpen = false;
		contactSearch = '';
	}

	function selectProgramme(id: string) {
		programmeId = id;
		programmeOpen = false;
		programmeSearch = '';
	}

	function toggleModality(mod: string) {
		if (selectedModalities.includes(mod)) {
			selectedModalities = selectedModalities.filter((m) => m !== mod);
		} else {
			selectedModalities = [...selectedModalities, mod];
		}
	}

	const isValid = $derived(name.trim().length > 0);
</script>

<svelte:head>
	<title>Nouveau deal</title>
</svelte:head>

<ContactModal bind:open={contactModalOpen} companies={data.companies ?? []} />

<div class="mx-auto max-w-2xl space-y-6 pb-8">
	{#if !data.workspaceId}
		<Card.Root>
			<Card.Content class="py-8 text-center text-muted-foreground">
				<p>Aucun centre assigné.</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<form
			method="POST"
			action="?/createDeal"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'redirect') toast.success('Deal créé');
					if (result.type === 'failure' && result.data && 'message' in result.data)
						toast.error(String(result.data.message));
					await update();
				};
			}}
			class="space-y-5"
		>
			<input type="hidden" name="contactId" value={contactId ?? ''} />
			<input type="hidden" name="companyId" value={companyId ?? ''} />
			<input type="hidden" name="programmeId" value={programmeId ?? ''} />
			<input type="hidden" name="stage" value={stage} />
			<input type="hidden" name="dealFormat" value={dealFormat} />
			<input type="hidden" name="intraInter" value={intraInter} />
			<input type="hidden" name="fundingType" value={fundingType} />
			<input type="hidden" name="fundingStatus" value={fundingStatus} />
			<input type="hidden" name="source" value={source} />
			<input type="hidden" name="commercialId" value={commercialId} />
			<input type="hidden" name="isFunded" value={isFunded ? 'on' : ''} />
			{#each selectedModalities as mod}
				<input type="hidden" name="modalities" value={mod} />
			{/each}

			<!-- Section 1: Identification -->
			<Card.Root>
				<Card.Header class="pb-4">
					<Card.Title class="text-base">Identification</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4">
					<div class="space-y-1.5">
						<Label for="name">Nom du deal <span class="text-destructive">*</span></Label>
						<Input
							id="name"
							name="name"
							bind:value={name}
							required
							placeholder="Ex. Formation anglais B2B – Acme"
						/>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-1.5">
							<Label>Étape</Label>
							<Select.Root type="single" bind:value={stage}>
								<Select.Trigger class="w-full">
									{@const stageColor = STAGE_COLORS[stage as DealStage]}
									<span class="flex items-center gap-2">
										{#if stageColor}
											<span class={cn('size-2 rounded-full', stageColor.bg, stageColor.border, 'border')}></span>
										{/if}
										{stage || 'Suspect'}
									</span>
								</Select.Trigger>
								<Select.Content>
									{#each DEAL_STAGES as s}
										{@const sc = STAGE_COLORS[s]}
										<Select.Item value={s}>
											<span class="flex items-center gap-2">
												<span class={cn('size-2 rounded-full', sc.bg, sc.border, 'border')}></span>
												{s}
											</span>
										</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>
						<div class="space-y-1.5">
							<Label>Source</Label>
							<Select.Root type="single" bind:value={source}>
								<Select.Trigger class="w-full">
									{source || 'Sélectionner'}
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="">—</Select.Item>
									{#each DEAL_SOURCES as s}
										<Select.Item value={s}>{s}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Section 2: Client -->
			<Collapsible.Root bind:open={clientSectionOpen}>
				<Card.Root>
					<Collapsible.Trigger class="w-full">
						<Card.Header class="flex flex-row items-center justify-between pb-4">
							<Card.Title class="text-base">Client</Card.Title>
							<ChevronDown
								class={cn('size-4 text-muted-foreground transition-transform', clientSectionOpen && 'rotate-180')}
							/>
						</Card.Header>
					</Collapsible.Trigger>
					<Collapsible.Content>
						<Card.Content class="space-y-4 pt-0">
							<div class="space-y-1.5">
								<Label>Contact</Label>
								<div class="flex gap-2">
									<Popover.Root bind:open={contactOpen}>
										<Popover.Trigger class="flex-1">
											{#snippet child({ props })}
												<button
													{...props}
													type="button"
													class="flex h-9 w-full cursor-pointer items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm hover:bg-muted/50 transition-colors"
												>
													{#if selectedContact}
														<span class="flex items-center gap-2 truncate">
															<User2 class="size-3.5 text-muted-foreground" />
															{[selectedContact.firstName, selectedContact.lastName].filter(Boolean).join(' ')}
														</span>
													{:else}
														<span class="text-muted-foreground">Choisir un contact...</span>
													{/if}
													<ChevronsUpDown class="size-4 shrink-0 text-muted-foreground opacity-50" />
												</button>
											{/snippet}
										</Popover.Trigger>
										<Popover.Content class="w-80 p-0" align="start">
											<Command.Root shouldFilter={false}>
												<Command.Input placeholder="Rechercher un contact..." bind:value={contactSearch} />
												<Command.List>
													<Command.Empty>Aucun contact trouvé.</Command.Empty>
													{#each filteredContacts as c (c.id)}
														<Command.Item value={c.id} onSelect={() => selectContact(c.id)}>
															<div class="flex flex-col">
																<span class="font-medium">
																	{[c.firstName, c.lastName].filter(Boolean).join(' ')}
																</span>
																<span class="text-xs text-muted-foreground">{c.email ?? ''}</span>
															</div>
															{#if contactId === c.id}
																<Check class="ml-auto size-4" />
															{/if}
														</Command.Item>
													{/each}
												</Command.List>
											</Command.Root>
										</Popover.Content>
									</Popover.Root>
									<button
										type="button"
										onclick={() => (contactModalOpen = true)}
										class="flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-input px-3 text-sm text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
									>
										<Plus class="size-3.5" />
										Nouveau
									</button>
								</div>
							</div>

							{#if selectedContact?.contactCompanies?.length}
								{@const company = selectedContact.contactCompanies[0]?.company}
								{#if company}
									<div class="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
										<Building2 class="size-4 text-muted-foreground" />
										<span>{company.name}</span>
										<Badge variant="secondary" class="text-[10px] ml-auto">via contact</Badge>
									</div>
								{/if}
							{/if}
						</Card.Content>
					</Collapsible.Content>
				</Card.Root>
			</Collapsible.Root>

			<!-- Section 3: Programme souhaité -->
			<Collapsible.Root bind:open={programmeSectionOpen}>
				<Card.Root>
					<Collapsible.Trigger class="w-full">
						<Card.Header class="flex flex-row items-center justify-between pb-4">
							<Card.Title class="text-base">Programme souhaité</Card.Title>
							<ChevronDown
								class={cn('size-4 text-muted-foreground transition-transform', programmeSectionOpen && 'rotate-180')}
							/>
						</Card.Header>
					</Collapsible.Trigger>
					<Collapsible.Content>
						<Card.Content class="space-y-4 pt-0">
							<div class="space-y-1.5">
								<Label>Programme</Label>
								<div class="flex gap-2">
									<Popover.Root bind:open={programmeOpen}>
										<Popover.Trigger class="flex-1">
											{#snippet child({ props })}
												<button
													{...props}
													type="button"
													class="flex h-9 w-full cursor-pointer items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm hover:bg-muted/50 transition-colors"
												>
													{#if selectedProgramme}
														<span class="flex items-center gap-2 truncate">
															<BookOpen class="size-3.5 text-muted-foreground" />
															{selectedProgramme.titre}
														</span>
													{:else}
														<span class="text-muted-foreground">Choisir un programme...</span>
													{/if}
													<ChevronsUpDown class="size-4 shrink-0 text-muted-foreground opacity-50" />
												</button>
											{/snippet}
										</Popover.Trigger>
										<Popover.Content class="w-80 p-0" align="start">
											<Command.Root shouldFilter={false}>
												<Command.Input placeholder="Rechercher un programme..." bind:value={programmeSearch} />
												<Command.List>
													<Command.Empty>Aucun programme trouvé.</Command.Empty>
													{#each filteredProgrammes as p (p.id)}
														<Command.Item value={p.id} onSelect={() => selectProgramme(p.id)}>
															<div class="flex flex-col">
																<span class="font-medium">{p.titre}</span>
																{#if p.modalite || p.dureeHeures}
																	<span class="text-xs text-muted-foreground">
																		{[p.modalite, p.dureeHeures ? `${p.dureeHeures}h` : ''].filter(Boolean).join(' · ')}
																	</span>
																{/if}
															</div>
															{#if programmeId === p.id}
																<Check class="ml-auto size-4" />
															{/if}
														</Command.Item>
													{/each}
												</Command.List>
											</Command.Root>
										</Popover.Content>
									</Popover.Root>
								<a
									href="/bibliotheque/programmes/creer?returnTo=/deals/creer"
									onclick={saveDraftToSession}
									class="flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-dashed border-input px-3 text-sm text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
								>
									<Plus class="size-3.5" />
									Créer
								</a>
								</div>
							</div>

							{#if selectedProgramme}
								<div class="rounded-md border bg-muted/30 p-3 space-y-1">
									<div class="flex items-center justify-between">
										<span class="font-medium text-sm">{selectedProgramme.titre}</span>
										<a
											href="/bibliotheque/programmes/{selectedProgramme.id}"
											class="text-xs text-muted-foreground hover:text-foreground"
										>
											<ExternalLink class="size-3.5" />
										</a>
									</div>
									{#if selectedProgramme.modalite || selectedProgramme.dureeHeures || selectedProgramme.prixPublic}
										<div class="flex gap-3 text-xs text-muted-foreground">
											{#if selectedProgramme.modalite}
												<span>{selectedProgramme.modalite}</span>
											{/if}
											{#if selectedProgramme.dureeHeures}
												<span>{selectedProgramme.dureeHeures}h</span>
											{/if}
											{#if selectedProgramme.prixPublic}
												<span>{Number(selectedProgramme.prixPublic).toLocaleString('fr-FR')} €</span>
											{/if}
										</div>
									{/if}
								</div>
							{/if}
						</Card.Content>
					</Collapsible.Content>
				</Card.Root>
			</Collapsible.Root>

			<!-- Section 4: Détails de l'opportunité -->
			<Collapsible.Root bind:open={detailsSectionOpen}>
				<Card.Root>
					<Collapsible.Trigger class="w-full">
						<Card.Header class="flex flex-row items-center justify-between pb-4">
							<Card.Title class="text-base">Détails de l'opportunité</Card.Title>
							<ChevronDown
								class={cn('size-4 text-muted-foreground transition-transform', detailsSectionOpen && 'rotate-180')}
							/>
						</Card.Header>
					</Collapsible.Trigger>
					<Collapsible.Content>
						<Card.Content class="space-y-4 pt-0">
							<!-- Montants -->
							<div class="grid grid-cols-2 gap-4">
								<div class="space-y-1.5">
									<Label for="dealAmount">Montant du deal (€)</Label>
									<Input id="dealAmount" name="dealAmount" type="number" min="0" step="0.01" bind:value={dealAmount} placeholder="3 500" />
								</div>
								<div class="space-y-1.5">
									<Label for="fundedAmount">Montant financé (€)</Label>
									<Input id="fundedAmount" name="fundedAmount" type="number" min="0" step="0.01" bind:value={fundedAmount} placeholder="2 800" />
								</div>
							</div>

							<!-- Financement -->
							<div class="grid grid-cols-2 gap-4">
								<div class="space-y-1.5">
									<Label>Type de financement</Label>
									<Select.Root type="single" bind:value={fundingType}>
										<Select.Trigger class="w-full">
											<span class="truncate">{fundingType || 'Sélectionner'}</span>
										</Select.Trigger>
										<Select.Content>
											<Select.Item value="">—</Select.Item>
											{#each FUNDING_TYPES as ft}
												<Select.Item value={ft}>{ft}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								</div>
								<div class="space-y-1.5">
									<Label>Statut financement</Label>
									<Select.Root type="single" bind:value={fundingStatus}>
										<Select.Trigger class="w-full">
											<span class="truncate">{fundingStatus || 'Sélectionner'}</span>
										</Select.Trigger>
										<Select.Content>
											<Select.Item value="">—</Select.Item>
											{#each FUNDING_STATUSES as fs}
												<Select.Item value={fs}>{fs}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								</div>
							</div>

							<div class="grid grid-cols-2 gap-4">
								<div class="flex items-center gap-2 pt-4">
									<Checkbox id="isFunded" bind:checked={isFunded} />
									<Label for="isFunded" class="cursor-pointer">Financement accordé</Label>
								</div>
								<div class="space-y-1.5">
									<Label for="fundingReference">Réf. dossier OPCO</Label>
									<Input id="fundingReference" name="fundingReference" bind:value={fundingReference} placeholder="N° dossier" />
								</div>
							</div>

							<!-- Format & Modalités -->
							<div class="grid grid-cols-2 gap-4">
								<div class="space-y-1.5">
									<Label>Format</Label>
									<Select.Root type="single" bind:value={dealFormat}>
										<Select.Trigger class="w-full">{dealFormat || 'Sélectionner'}</Select.Trigger>
										<Select.Content>
											<Select.Item value="">—</Select.Item>
											{#each DEAL_FORMATS as f}
												<Select.Item value={f}>{f}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								</div>
								<div class="space-y-1.5">
									<Label>Intra / Inter</Label>
									<Select.Root type="single" bind:value={intraInter}>
										<Select.Trigger class="w-full">{intraInter || 'Sélectionner'}</Select.Trigger>
										<Select.Content>
											<Select.Item value="">—</Select.Item>
											{#each INTRA_INTER as ii}
												<Select.Item value={ii}>{ii}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								</div>
							</div>

							<div class="space-y-1.5">
								<Label>Modalité(s)</Label>
								<div class="flex flex-wrap gap-2">
									{#each MODALITIES as mod}
										<button
											type="button"
											onclick={() => toggleModality(mod)}
											class={cn(
												'rounded-md border px-3 py-1.5 text-sm transition-colors cursor-pointer',
												selectedModalities.includes(mod)
													? 'border-primary bg-primary/10 text-primary'
													: 'border-input text-muted-foreground hover:border-foreground hover:text-foreground'
											)}
										>
											{mod}
										</button>
									{/each}
								</div>
							</div>

							<!-- Dates & Logistique -->
							<div class="grid grid-cols-3 gap-4">
								<div class="space-y-1.5">
									<Label for="desiredStartDate">Début souhaité</Label>
									<Input id="desiredStartDate" name="desiredStartDate" type="date" bind:value={desiredStartDate} />
								</div>
								<div class="space-y-1.5">
									<Label for="desiredEndDate">Fin souhaitée</Label>
									<Input id="desiredEndDate" name="desiredEndDate" type="date" bind:value={desiredEndDate} />
								</div>
								<div class="space-y-1.5">
									<Label for="expectedCloseDate">Clôture prévue</Label>
									<Input id="expectedCloseDate" name="expectedCloseDate" type="date" bind:value={expectedCloseDate} />
								</div>
							</div>

							<div class="grid grid-cols-3 gap-4">
								<div class="space-y-1.5">
									<Label for="durationHours">Durée (h)</Label>
									<Input id="durationHours" name="durationHours" type="number" min="0" bind:value={durationHours} />
								</div>
								<div class="space-y-1.5">
									<Label for="nbApprenants">Nb apprenants</Label>
									<Input id="nbApprenants" name="nbApprenants" type="number" min="0" bind:value={nbApprenants} />
								</div>
								<div class="space-y-1.5">
									<Label for="probability">Probabilité (%)</Label>
									<Input id="probability" name="probability" type="number" min="0" max="100" bind:value={probability} />
								</div>
							</div>

							<!-- Commercial responsable -->
							<div class="space-y-1.5">
								<Label>Commercial responsable</Label>
								<Select.Root type="single" bind:value={commercialId}>
									<Select.Trigger class="w-full">
										{#if commercialId}
											{@const member = data.members?.find((m) => m.id === commercialId)}
											{member ? [member.firstName, member.lastName].filter(Boolean).join(' ') : 'Sélectionner'}
										{:else}
											Sélectionner
										{/if}
									</Select.Trigger>
									<Select.Content>
										<Select.Item value="">—</Select.Item>
										{#each data.members ?? [] as m}
											<Select.Item value={m.id}>
												{[m.firstName, m.lastName].filter(Boolean).join(' ') || m.email}
											</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							</div>

							<!-- Notes -->
							<div class="space-y-1.5">
								<Label for="description">Notes / Description</Label>
								<Textarea
									id="description"
									name="description"
									bind:value={description}
									placeholder="Contexte, besoins du client..."
									class="min-h-[80px]"
								/>
							</div>
						</Card.Content>
					</Collapsible.Content>
				</Card.Root>
			</Collapsible.Root>

			<!-- Actions -->
			<div class="flex gap-3 pt-2">
				<Button type="submit" disabled={!isValid}>Créer le deal</Button>
				<Button variant="outline" href="/deals">Annuler</Button>
			</div>
		</form>
	{/if}
</div>
