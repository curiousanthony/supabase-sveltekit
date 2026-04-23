<script lang="ts">
	import type { PageProps } from './$types';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import * as Select from '$lib/components/ui/select';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import Wallet from '@lucide/svelte/icons/wallet';
	import Receipt from '@lucide/svelte/icons/receipt';
	import Calculator from '@lucide/svelte/icons/calculator';
	import Banknote from '@lucide/svelte/icons/banknote';
	import Plus from '@lucide/svelte/icons/plus';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import FileText from '@lucide/svelte/icons/file-text';
	import QuestGuideBanner from '$lib/components/formations/quest-guide-banner.svelte';
	import {
		groupedFundingSources,
		describeFundingSource,
		fundingSourceShort,
		fundingSourceLabel,
		PAYER_TYPE_LABELS,
		FUNDING_STATUS_LABELS,
		type FundingSourceCode,
		type FundingSourceStatusCode
	} from '$lib/utils/funding-source-labels';
	import type { PayerType, StatutGlobal } from '$lib/services/funding-summary';

	let { data }: PageProps = $props();

	const formation = $derived(data?.formation);
	const invoices = $derived(data?.invoices ?? []);
	const costItems = $derived(data?.costItems ?? []);
	const fundingSources = $derived(data?.fundingSources ?? []);
	const summary = $derived(data?.summary);

	const clientName = $derived(
		formation?.company?.name ?? formation?.client?.legalName ?? ''
	);

	const fundingGroups = groupedFundingSources();

	// --- Cost calculations (unchanged) ---
	const formateursCost = $derived.by(() => {
		const ffs = formation?.formationFormateurs ?? [];
		return ffs.reduce((sum, ff) => {
			const tjm = ff.tjm != null ? Number(ff.tjm) : 0;
			const days = ff.numberOfDays != null ? Number(ff.numberOfDays) : 0;
			return sum + tjm * days;
		}, 0);
	});

	const deplacementCost = $derived.by(() => {
		const ffs = formation?.formationFormateurs ?? [];
		return ffs.reduce((sum, ff) => {
			const dep = ff.deplacementCost != null ? Number(ff.deplacementCost) : 0;
			const heb = ff.hebergementCost != null ? Number(ff.hebergementCost) : 0;
			return sum + dep + heb;
		}, 0);
	});

	const salleCost = $derived(
		Number(costItems.find((c) => c.category === 'salle')?.amount ?? 0)
	);
	const materielCost = $derived(
		Number(costItems.find((c) => c.category === 'materiel')?.amount ?? 0)
	);

	const totalCosts = $derived(formateursCost + deplacementCost + salleCost + materielCost);
	// Marge is now anchored on "Financé" (granted sum from funding sources) so
	// the Fiche+Finances model is internally consistent. Falls back to
	// prixConvenu when no funding line has been entered yet.
	const revenuForMargin = $derived(
		summary?.totalGranted && summary.totalGranted > 0
			? summary.totalGranted
			: formation?.prixConvenu
				? Number(formation.prixConvenu)
				: null
	);
	const margin = $derived(revenuForMargin != null ? revenuForMargin - totalCosts : null);
	const marginPercent = $derived(
		revenuForMargin != null && revenuForMargin > 0
			? ((revenuForMargin - totalCosts) / revenuForMargin) * 100
			: null
	);

	// --- Editable cost fields ---
	let salleInput = $state('0');
	let materielInput = $state('0');

	$effect(() => {
		salleInput = salleCost.toString();
	});
	$effect(() => {
		materielInput = materielCost.toString();
	});

	let savingSalle = $state(false);
	let savingMateriel = $state(false);

	// --- Funding source dialog ---
	let fundingDialogOpen = $state(false);
	let fundingDeleteDialogOpen = $state(false);
	type FundingSource = (typeof fundingSources)[number];
	let editingFunding = $state<FundingSource | null>(null);
	let deletingFunding = $state<FundingSource | null>(null);

	let fsSource = $state<FundingSourceCode | ''>('');
	let fsPayerType = $state<PayerType>('apprenant');
	let fsPayerLabel = $state('');
	let fsRequestedAmount = $state('');
	let fsGrantedAmount = $state('');
	let fsStatus = $state<FundingSourceStatusCode>('Pressenti');
	let fsDecisionDate = $state('');
	let fsExpectedPaymentDate = $state('');
	let fsDossierReference = $state('');
	let fsNotes = $state('');

	function applySourceDefaults(code: FundingSourceCode) {
		const desc = describeFundingSource(code);
		if (!desc) return;
		// Only overwrite empty fields — never clobber Marie's manual input.
		if (!fsPayerLabel) {
			if (code === 'EmployeurDirect') {
				fsPayerLabel = clientName || '';
			} else if (desc.defaultPayerLabel) {
				fsPayerLabel = desc.defaultPayerLabel;
			}
		}
		fsPayerType = desc.defaultPayerType;
	}

	function openNewFunding() {
		editingFunding = null;
		fsSource = '';
		fsPayerType = 'apprenant';
		fsPayerLabel = '';
		fsRequestedAmount = '';
		fsGrantedAmount = '';
		fsStatus = 'Pressenti';
		fsDecisionDate = '';
		fsExpectedPaymentDate = '';
		fsDossierReference = '';
		fsNotes = '';
		fundingDialogOpen = true;
	}

	function openEditFunding(fs: FundingSource) {
		editingFunding = fs;
		fsSource = fs.source as FundingSourceCode;
		fsPayerType = fs.payerType as PayerType;
		fsPayerLabel = fs.payerLabel ?? '';
		fsRequestedAmount = fs.requestedAmount != null ? String(Number(fs.requestedAmount)) : '';
		fsGrantedAmount = fs.grantedAmount != null ? String(Number(fs.grantedAmount)) : '';
		fsStatus = fs.status as FundingSourceStatusCode;
		fsDecisionDate = fs.decisionDate ?? '';
		fsExpectedPaymentDate = fs.expectedPaymentDate ?? '';
		fsDossierReference = fs.dossierReference ?? '';
		fsNotes = fs.notes ?? '';
		fundingDialogOpen = true;
	}

	function openDeleteFunding(fs: FundingSource) {
		deletingFunding = fs;
		fundingDeleteDialogOpen = true;
	}

	// --- Invoice dialog (existing, extended with fundingSourceId) ---
	let invoiceDialogOpen = $state(false);
	let editingInvoice = $state<(typeof invoices)[number] | null>(null);
	let deleteDialogOpen = $state(false);
	let deletingInvoice = $state<(typeof invoices)[number] | null>(null);

	let invNumber = $state('');
	let invDate = $state(new Date().toISOString().slice(0, 10));
	let invAmount = $state('');
	let invRecipient = $state('');
	let invRecipientType = $state('Client');
	let invDueDate = $state('');
	let invStatus = $state('Brouillon');
	let invNotes = $state('');
	let invFundingSourceId = $state('');
	let invPdfFile = $state<File | null>(null);

	function openNewInvoice() {
		editingInvoice = null;
		invNumber = '';
		invDate = new Date().toISOString().slice(0, 10);
		invAmount = '';
		invRecipient = clientName;
		invRecipientType = 'Client';
		invDueDate = '';
		invStatus = 'Brouillon';
		invNotes = '';
		invFundingSourceId = '';
		invPdfFile = null;
		invoiceDialogOpen = true;
	}

	function openEditInvoice(inv: (typeof invoices)[number]) {
		editingInvoice = inv;
		invNumber = inv.invoiceNumber;
		invDate = inv.date;
		invAmount = String(Number(inv.amount));
		invRecipient = inv.recipient;
		invRecipientType = inv.recipientType;
		invDueDate = inv.dueDate ?? '';
		invStatus = inv.status;
		invNotes = inv.notes ?? '';
		invFundingSourceId = inv.fundingSourceId ?? '';
		invPdfFile = null;
		invoiceDialogOpen = true;
	}

	function openDeleteInvoice(inv: (typeof invoices)[number]) {
		deletingInvoice = inv;
		deleteDialogOpen = true;
	}

	function fmtCurrency(val: number): string {
		return val.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
	}

	function fmtDate(d: string): string {
		return new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	// --- Synthesis helpers ---
	const STATUT_VARIANT: Record<StatutGlobal, { label: string; classes: string }> = {
		'Entièrement financé': {
			label: 'Entièrement financé',
			classes:
				'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700'
		},
		'Partiellement financé': {
			label: 'Partiellement financé',
			classes:
				'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700'
		},
		'En attente': {
			label: 'En attente',
			classes:
				'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700'
		},
		'Sans financement': {
			label: 'Sans financement',
			classes: 'bg-muted text-muted-foreground border-border'
		}
	};

	const PAYER_CHIP_CLASSES: Record<PayerType, string> = {
		apprenant:
			'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
		entreprise:
			'bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800',
		OF: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800'
	};

	const FS_STATUS_CLASSES: Record<FundingSourceStatusCode, string> = {
		Pressenti: 'bg-muted text-muted-foreground',
		Demandé:
			'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
		Accordé:
			'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
		Versé:
			'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700',
		Refusé:
			'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
		Annulé: 'bg-muted text-muted-foreground line-through'
	};

	const totalFormation = $derived(
		formation?.prixConvenu != null
			? Number(formation.prixConvenu)
			: formation?.prixPublic != null
				? Number(formation.prixPublic)
				: 0
	);
	const isPriceEstimate = $derived(formation?.prixConvenu == null && formation?.prixPublic != null);

	const nonZeroPayerChips = $derived.by<Array<{ payer: PayerType; amount: number }>>(() => {
		const by = summary?.resteACharge.byPayer;
		if (!by) return [];
		return (Object.entries(by) as Array<[PayerType, number]>)
			.filter(([, amount]) => amount > 0)
			.sort(([, a], [, b]) => b - a)
			.map(([payer, amount]) => ({ payer, amount }));
	});

	// --- Invoice status badges (unchanged) ---
	const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
		Brouillon: 'secondary',
		'Envoyée': 'outline',
		'Payée': 'default',
		'En retard': 'destructive'
	};

	const statusColors: Record<string, string> = {
		Brouillon: '',
		'Envoyée': 'border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-400',
		'Payée':
			'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
		'En retard': ''
	};
</script>

<div class="space-y-6">
	<QuestGuideBanner />

	<!-- Section 1: Synthèse financière -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Wallet class="size-4" />
				Synthèse financière
			</Card.Title>
		</Card.Header>
		<Card.Content>
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
				<div class="rounded-lg border p-3 sm:p-4">
					<p class="text-xs text-muted-foreground sm:text-sm">Total formation</p>
					<p class="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">
						{totalFormation > 0 ? fmtCurrency(totalFormation) + ' €' : '—'}
					</p>
					<p class="mt-0.5 text-[11px] text-muted-foreground">
						{isPriceEstimate ? 'Prix public (estimation)' : 'Prix convenu'}
					</p>
				</div>
				<div class="rounded-lg border p-3 sm:p-4">
					<p class="text-xs text-muted-foreground sm:text-sm">Financé</p>
					<p class="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">
						{fmtCurrency(summary?.totalGranted ?? 0)} €
					</p>
					{#if summary && summary.percentCovered > 0}
						<p class="mt-0.5 text-[11px] text-muted-foreground">
							{summary.percentCovered.toFixed(0)} % couvert
						</p>
					{/if}
				</div>
				<div class="rounded-lg border p-3 sm:p-4">
					<p class="text-xs text-muted-foreground sm:text-sm">Reste à charge à recouvrer</p>
					<p
						class="mt-1 text-xl font-semibold tabular-nums sm:text-2xl"
						class:text-muted-foreground={(summary?.resteACharge.total ?? 0) === 0}
					>
						{fmtCurrency(summary?.resteACharge.total ?? 0)} €
					</p>
					{#if nonZeroPayerChips.length > 0}
						<div class="mt-2 flex flex-wrap gap-1">
							{#each nonZeroPayerChips as chip (chip.payer)}
								<span
									class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium {PAYER_CHIP_CLASSES[chip.payer]}"
								>
									{PAYER_TYPE_LABELS[chip.payer]}
									<span class="tabular-nums">· {fmtCurrency(chip.amount)} €</span>
								</span>
							{/each}
						</div>
					{/if}
				</div>
				<div class="rounded-lg border p-3 sm:p-4">
					<p class="text-xs text-muted-foreground sm:text-sm">Statut</p>
					<div class="mt-2">
						{#if summary}
							<Badge variant="outline" class={STATUT_VARIANT[summary.statutGlobal].classes}>
								{STATUT_VARIANT[summary.statutGlobal].label}
							</Badge>
						{:else}
							<span class="text-sm text-muted-foreground">—</span>
						{/if}
					</div>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Section 2: Sources de financement -->
	<Card.Root>
		<Card.Header class="flex-row items-center justify-between space-y-0">
			<Card.Title class="flex items-center gap-2">
				<Banknote class="size-4" />
				Sources de financement
				{#if fundingSources.length > 0}
					<Badge variant="secondary" class="ml-1">{fundingSources.length}</Badge>
				{/if}
			</Card.Title>
			<Button size="sm" onclick={openNewFunding}>
				<Plus class="mr-1 size-4" />
				Ajouter une source
			</Button>
		</Card.Header>
		<Card.Content>
			{#if fundingSources.length === 0}
				<div class="flex flex-col items-center gap-3 py-8 text-center">
					<Banknote class="size-10 text-muted-foreground/40" />
					<div class="space-y-1">
						<p class="text-sm font-medium">Aucune source de financement</p>
						<p class="text-xs text-muted-foreground">
							Ajoutez les financeurs (CPF, OPCO, employeur…) pour suivre votre dossier.
						</p>
					</div>
					<Button size="sm" onclick={openNewFunding}>
						<Plus class="mr-1 size-4" />
						Ajouter une source
					</Button>
				</div>
			{:else}
				<div class="space-y-2">
					{#each fundingSources as fs (fs.id)}
						{@const desc = describeFundingSource(fs.source)}
						<div
							class="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
						>
							<div class="min-w-0 flex-1 space-y-1">
								<div class="flex flex-wrap items-center gap-2">
									<span class="text-sm font-medium">{desc?.short ?? fs.source}</span>
									<span
										class="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium {PAYER_CHIP_CLASSES[fs.payerType as PayerType]}"
									>
										{PAYER_TYPE_LABELS[fs.payerType as PayerType]}{fs.payerLabel ? ` · ${fs.payerLabel}` : ''}
									</span>
									<Badge
										variant="outline"
										class={FS_STATUS_CLASSES[fs.status as FundingSourceStatusCode] ?? ''}
									>
										{FUNDING_STATUS_LABELS[fs.status as FundingSourceStatusCode] ?? fs.status}
									</Badge>
								</div>
								<div
									class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground tabular-nums"
								>
									{#if fs.requestedAmount != null}
										<span>Demandé : {fmtCurrency(Number(fs.requestedAmount))} €</span>
									{/if}
									{#if fs.grantedAmount != null}
										<span>Accordé : {fmtCurrency(Number(fs.grantedAmount))} €</span>
									{/if}
									{#if fs.decisionDate}
										<span>Décision : {fmtDate(fs.decisionDate)}</span>
									{/if}
									{#if fs.expectedPaymentDate}
										<span>Paiement attendu : {fmtDate(fs.expectedPaymentDate)}</span>
									{/if}
									{#if fs.dossierReference}
										<span>Réf : {fs.dossierReference}</span>
									{/if}
								</div>
							</div>
							<div class="flex shrink-0 items-center gap-1 self-end sm:self-center">
								<Button variant="ghost" size="icon-sm" onclick={() => openEditFunding(fs)}>
									<Pencil class="size-4" />
								</Button>
								<Button variant="ghost" size="icon-sm" onclick={() => openDeleteFunding(fs)}>
									<Trash2 class="size-4 text-destructive" />
								</Button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Section 3: Coûts (unchanged) -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Calculator class="size-4" />
				Coûts
			</Card.Title>
		</Card.Header>
		<Card.Content>
			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<span class="text-sm font-medium">Formateur(s)</span>
						<a
							href="../formateurs"
							class="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
						>
							Voir les formateurs
							<ExternalLink class="size-3" />
						</a>
					</div>
					<span class="text-sm font-medium tabular-nums">{fmtCurrency(formateursCost)} €</span>
				</div>

				<div class="flex items-center justify-between">
					<span class="text-sm font-medium">Salle</span>
					<form
						method="POST"
						action="?/updateCostItem"
						use:enhance={() => {
							savingSalle = true;
							return async ({ result, update }) => {
								savingSalle = false;
								if (result.type === 'success') {
									toast.success('Coût salle mis à jour');
									await update();
								} else if (result.type === 'failure') {
									toast.error((result.data as { message?: string })?.message ?? 'Erreur');
								}
							};
						}}
						class="flex items-center gap-2"
					>
						<input type="hidden" name="category" value="salle" />
						<Input
							type="number"
							name="amount"
							step="0.01"
							min="0"
							bind:value={salleInput}
							onblur={(e) => {
								const form = (e.target as HTMLElement).closest('form');
								if (form && salleInput !== salleCost.toString()) form.requestSubmit();
							}}
							class="w-28 text-right tabular-nums"
							disabled={savingSalle}
						/>
						<span class="text-sm text-muted-foreground">€</span>
					</form>
				</div>

				<div class="flex items-center justify-between">
					<span class="text-sm font-medium">Matériel</span>
					<form
						method="POST"
						action="?/updateCostItem"
						use:enhance={() => {
							savingMateriel = true;
							return async ({ result, update }) => {
								savingMateriel = false;
								if (result.type === 'success') {
									toast.success('Coût matériel mis à jour');
									await update();
								} else if (result.type === 'failure') {
									toast.error((result.data as { message?: string })?.message ?? 'Erreur');
								}
							};
						}}
						class="flex items-center gap-2"
					>
						<input type="hidden" name="category" value="materiel" />
						<Input
							type="number"
							name="amount"
							step="0.01"
							min="0"
							bind:value={materielInput}
							onblur={(e) => {
								const form = (e.target as HTMLElement).closest('form');
								if (form && materielInput !== materielCost.toString()) form.requestSubmit();
							}}
							class="w-28 text-right tabular-nums"
							disabled={savingMateriel}
						/>
						<span class="text-sm text-muted-foreground">€</span>
					</form>
				</div>

				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<span class="text-sm font-medium">Déplacement</span>
						<span class="text-xs text-muted-foreground">(auto-calculé)</span>
					</div>
					<span class="text-sm font-medium tabular-nums">{fmtCurrency(deplacementCost)} €</span>
				</div>

				<Separator />

				<div class="flex items-center justify-between">
					<span class="text-sm font-bold">Total des coûts</span>
					<span class="text-sm font-bold tabular-nums">{fmtCurrency(totalCosts)} €</span>
				</div>

				<div class="flex items-center justify-between">
					<span class="text-sm font-bold">Marge</span>
					<div class="flex items-center gap-2">
						{#if margin != null}
							<span
								class="text-lg font-bold tabular-nums"
								class:text-green-600={margin >= 0}
								class:text-red-600={margin < 0}
							>
								{margin >= 0 ? '+' : ''}{fmtCurrency(margin)} €
							</span>
							{#if marginPercent != null}
								<Badge
									variant={margin >= 0 ? 'default' : 'destructive'}
									class={margin >= 0
										? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
										: ''}
								>
									{marginPercent >= 0 ? '+' : ''}{marginPercent.toFixed(1)}%
								</Badge>
							{/if}
						{:else}
							<span class="text-lg font-bold text-muted-foreground">—</span>
						{/if}
					</div>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Section 4: Factures -->
	<Card.Root>
		<Card.Header class="flex-row items-center justify-between space-y-0">
			<Card.Title class="flex items-center gap-2">
				<Receipt class="size-4" />
				Factures
				{#if invoices.length > 0}
					<Badge variant="secondary" class="ml-1">{invoices.length}</Badge>
				{/if}
			</Card.Title>
			<Button size="sm" onclick={openNewInvoice}>
				<Plus class="mr-1 size-4" />
				Ajouter une facture
			</Button>
		</Card.Header>
		<Card.Content>
			{#if invoices.length === 0}
				<div class="flex flex-col items-center gap-2 py-8 text-center">
					<FileText class="size-10 text-muted-foreground/40" />
					<p class="text-sm text-muted-foreground">Aucune facture. Créez votre première facture.</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each invoices as inv (inv.id)}
						{@const linkedFs = inv.fundingSourceId
							? fundingSources.find((fs) => fs.id === inv.fundingSourceId)
							: null}
						<div class="flex items-center justify-between rounded-lg border p-3">
							<div class="min-w-0 flex-1 space-y-1">
								<div class="flex flex-wrap items-center gap-2">
									<span class="font-medium">{inv.invoiceNumber}</span>
									<Badge
										variant={statusVariants[inv.status] ?? 'secondary'}
										class={statusColors[inv.status] ?? ''}
									>
										{inv.status}
									</Badge>
									{#if linkedFs}
										<span
											class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground"
											title={fundingSourceLabel(linkedFs.source)}
										>
											<Banknote class="size-3" />
											{fundingSourceShort(linkedFs.source)}
										</span>
									{/if}
								</div>
								<div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
									<span>{fmtDate(inv.date)}</span>
									<span class="font-medium tabular-nums">{fmtCurrency(Number(inv.amount))} €</span>
									<span>{inv.recipient} ({inv.recipientType})</span>
									{#if inv.dueDate}
										<span>Échéance : {fmtDate(inv.dueDate)}</span>
									{/if}
								</div>
							</div>
							<div class="flex shrink-0 items-center gap-1">
								<Button variant="ghost" size="icon-sm" onclick={() => openEditInvoice(inv)}>
									<Pencil class="size-4" />
								</Button>
								<Button variant="ghost" size="icon-sm" onclick={() => openDeleteInvoice(inv)}>
									<Trash2 class="size-4 text-destructive" />
								</Button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>

<!-- Funding source create/edit dialog -->
<Dialog.Root bind:open={fundingDialogOpen}>
	<Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>
				{editingFunding ? 'Modifier la source de financement' : 'Nouvelle source de financement'}
			</Dialog.Title>
			<Dialog.Description>
				Renseignez le financeur, les montants et l'état d'avancement du dossier.
			</Dialog.Description>
		</Dialog.Header>

		<form
			method="POST"
			action={editingFunding ? '?/updateFundingSource' : '?/createFundingSource'}
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						toast.success(
							editingFunding ? 'Source mise à jour' : 'Source de financement ajoutée'
						);
						fundingDialogOpen = false;
						await update();
					} else if (result.type === 'failure') {
						toast.error((result.data as { message?: string })?.message ?? 'Erreur');
					}
				};
			}}
			class="space-y-4"
		>
			{#if editingFunding}
				<input type="hidden" name="fundingSourceId" value={editingFunding.id} />
			{/if}

			<div class="space-y-1.5">
				<Label for="fs-source">Source <span class="text-destructive">*</span></Label>
				<Select.Root
					type="single"
					name="source"
					bind:value={
						() => fsSource,
						(v: string) => {
							fsSource = v as FundingSourceCode | '';
							if (fsSource) applySourceDefaults(fsSource);
						}
					}
				>
					<Select.Trigger id="fs-source" class="w-full">
						{fsSource ? fundingSourceLabel(fsSource) : 'Sélectionner une source'}
					</Select.Trigger>
					<Select.Content>
						{#each fundingGroups as g (g.group)}
							<Select.Group>
								<Select.GroupHeading>{g.group}</Select.GroupHeading>
								{#each g.options as opt (opt.value)}
									<Select.Item value={opt.value} label={opt.label}>{opt.label}</Select.Item>
								{/each}
							</Select.Group>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-1.5">
					<Label for="fs-payer-type">Type de payeur <span class="text-destructive">*</span></Label>
					<Select.Root type="single" name="payerType" bind:value={fsPayerType as string}>
						<Select.Trigger id="fs-payer-type" class="w-full">
							{PAYER_TYPE_LABELS[fsPayerType]}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="apprenant">Apprenant</Select.Item>
							<Select.Item value="entreprise">Entreprise</Select.Item>
							<Select.Item value="OF">Organisme de formation</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>
				<div class="space-y-1.5">
					<Label for="fs-payer-label">Nom du financeur</Label>
					<Input
						id="fs-payer-label"
						name="payerLabel"
						bind:value={fsPayerLabel}
						placeholder={fsSource === 'EmployeurDirect'
							? clientName || 'Nom de l\'entreprise'
							: 'Ex : Caisse des Dépôts, AKTO, …'}
					/>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-1.5">
					<Label for="fs-requested">Montant demandé (€)</Label>
					<Input
						id="fs-requested"
						type="number"
						name="requestedAmount"
						step="0.01"
						min="0"
						bind:value={fsRequestedAmount}
					/>
				</div>
				<div class="space-y-1.5">
					<Label for="fs-granted">Montant accordé (€)</Label>
					<Input
						id="fs-granted"
						type="number"
						name="grantedAmount"
						step="0.01"
						min="0"
						bind:value={fsGrantedAmount}
					/>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-1.5">
					<Label for="fs-status">Statut <span class="text-destructive">*</span></Label>
					<Select.Root type="single" name="status" bind:value={fsStatus as string}>
						<Select.Trigger id="fs-status" class="w-full">
							{FUNDING_STATUS_LABELS[fsStatus]}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="Pressenti">Pressenti</Select.Item>
							<Select.Item value="Demandé">Demandé</Select.Item>
							<Select.Item value="Accordé">Accordé</Select.Item>
							<Select.Item value="Refusé">Refusé</Select.Item>
							<Select.Item value="Versé">Versé</Select.Item>
							<Select.Item value="Annulé">Annulé</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>
				<div class="space-y-1.5">
					<Label for="fs-dossier">Référence dossier</Label>
					<Input
						id="fs-dossier"
						name="dossierReference"
						bind:value={fsDossierReference}
						placeholder="Ex : DOS-2026-001234"
					/>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-1.5">
					<Label for="fs-decision-date">Date de décision</Label>
					<Input
						id="fs-decision-date"
						type="date"
						name="decisionDate"
						bind:value={fsDecisionDate}
					/>
				</div>
				<div class="space-y-1.5">
					<Label for="fs-expected-date">Paiement attendu</Label>
					<Input
						id="fs-expected-date"
						type="date"
						name="expectedPaymentDate"
						bind:value={fsExpectedPaymentDate}
					/>
				</div>
			</div>

			<div class="space-y-1.5">
				<Label for="fs-notes">Notes</Label>
				<Textarea id="fs-notes" name="notes" bind:value={fsNotes} rows={2} />
			</div>

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (fundingDialogOpen = false)}>
					Annuler
				</Button>
				<Button type="submit" disabled={!fsSource}>
					{editingFunding ? 'Enregistrer' : 'Ajouter'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Funding source delete confirm -->
<AlertDialog.Root bind:open={fundingDeleteDialogOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Supprimer cette source de financement ?</AlertDialog.Title>
			<AlertDialog.Description>
				La source <strong>{deletingFunding ? fundingSourceShort(deletingFunding.source) : ''}</strong>
				sera supprimée. Les factures liées sont conservées (le lien est simplement retiré).
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Annuler</AlertDialog.Cancel>
			<form
				method="POST"
				action="?/deleteFundingSource"
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === 'success') {
							toast.success('Source de financement supprimée');
							fundingDeleteDialogOpen = false;
							await update();
						} else if (result.type === 'failure') {
							toast.error((result.data as { message?: string })?.message ?? 'Erreur');
						}
					};
				}}
			>
				<input
					type="hidden"
					name="fundingSourceId"
					value={deletingFunding?.id ?? ''}
				/>
				<AlertDialog.Action
					type="submit"
					class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
				>
					Supprimer
				</AlertDialog.Action>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<!-- Invoice create/edit dialog -->
<Dialog.Root bind:open={invoiceDialogOpen}>
	<Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>
				{editingInvoice ? 'Modifier la facture' : 'Nouvelle facture'}
			</Dialog.Title>
			<Dialog.Description>
				{editingInvoice
					? 'Modifiez les informations de la facture.'
					: 'Renseignez les informations de la facture.'}
			</Dialog.Description>
		</Dialog.Header>

		<form
			method="POST"
			action={editingInvoice ? '?/updateInvoice' : '?/createInvoice'}
			enctype="multipart/form-data"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						toast.success(editingInvoice ? 'Facture mise à jour' : 'Facture créée');
						invoiceDialogOpen = false;
						await update();
					} else if (result.type === 'failure') {
						toast.error((result.data as { message?: string })?.message ?? 'Erreur');
					}
				};
			}}
			class="space-y-4"
		>
			{#if editingInvoice}
				<input type="hidden" name="invoiceId" value={editingInvoice.id} />
			{/if}

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-1.5">
					<Label for="inv-number">Numéro de facture <span class="text-destructive">*</span></Label>
					<Input id="inv-number" name="invoiceNumber" bind:value={invNumber} required />
				</div>
				<div class="space-y-1.5">
					<Label for="inv-date">Date <span class="text-destructive">*</span></Label>
					<Input id="inv-date" type="date" name="date" bind:value={invDate} required />
				</div>
			</div>

			<div class="space-y-1.5">
				<Label for="inv-amount">Montant (€) <span class="text-destructive">*</span></Label>
				<Input
					id="inv-amount"
					type="number"
					name="amount"
					step="0.01"
					min="0"
					bind:value={invAmount}
					required
				/>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-1.5">
					<Label for="inv-recipient">Destinataire <span class="text-destructive">*</span></Label>
					<Input id="inv-recipient" name="recipient" bind:value={invRecipient} required />
				</div>
				<div class="space-y-1.5">
					<Label for="inv-recipient-type">Type <span class="text-destructive">*</span></Label>
					<Select.Root type="single" bind:value={invRecipientType} name="recipientType">
						<Select.Trigger id="inv-recipient-type" class="w-full">
							{invRecipientType || 'Sélectionner'}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="Client">Client</Select.Item>
							<Select.Item value="OPCO">OPCO</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>
			</div>

			{#if fundingSources.length > 0}
				<div class="space-y-1.5">
					<Label for="inv-funding">Lier à une source de financement</Label>
					<Select.Root type="single" name="fundingSourceId" bind:value={invFundingSourceId}>
						<Select.Trigger id="inv-funding" class="w-full">
							{#if invFundingSourceId}
								{#each fundingSources as fs (fs.id)}
									{#if fs.id === invFundingSourceId}
										{fundingSourceShort(fs.source)}{fs.payerLabel ? ` · ${fs.payerLabel}` : ''}
									{/if}
								{/each}
							{:else}
								Aucune (paiement client direct)
							{/if}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="">Aucune (paiement client direct)</Select.Item>
							{#each fundingSources as fs (fs.id)}
								<Select.Item value={fs.id}>
									{fundingSourceShort(fs.source)}{fs.payerLabel ? ` · ${fs.payerLabel}` : ''}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			{/if}

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-1.5">
					<Label for="inv-due-date">Date d'échéance</Label>
					<Input id="inv-due-date" type="date" name="dueDate" bind:value={invDueDate} />
				</div>
				<div class="space-y-1.5">
					<Label for="inv-status">Statut</Label>
					<Select.Root type="single" bind:value={invStatus} name="status">
						<Select.Trigger id="inv-status" class="w-full">
							{invStatus}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="Brouillon">Brouillon</Select.Item>
							<Select.Item value="Envoyée">Envoyée</Select.Item>
							<Select.Item value="Payée">Payée</Select.Item>
							<Select.Item value="En retard">En retard</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>
			</div>

			<div class="space-y-1.5">
				<Label for="inv-pdf">PDF de la facture</Label>
				<input
					id="inv-pdf"
					type="file"
					name="pdf"
					accept="application/pdf"
					onchange={(e) => {
						const target = e.target as HTMLInputElement;
						invPdfFile = target.files?.[0] ?? null;
					}}
					class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
				/>
				{#if editingInvoice?.documentUrl}
					<p class="text-xs text-muted-foreground">
						Un PDF est déjà associé. L'envoi d'un nouveau fichier le remplacera.
					</p>
				{/if}
			</div>

			<div class="space-y-1.5">
				<Label for="inv-notes">Notes</Label>
				<Textarea id="inv-notes" name="notes" bind:value={invNotes} rows={2} />
			</div>

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (invoiceDialogOpen = false)}>
					Annuler
				</Button>
				<Button type="submit">
					{editingInvoice ? 'Enregistrer' : 'Créer'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Invoice delete confirmation -->
<AlertDialog.Root bind:open={deleteDialogOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Supprimer cette facture ?</AlertDialog.Title>
			<AlertDialog.Description>
				La facture <strong>{deletingInvoice?.invoiceNumber}</strong> sera supprimée définitivement.
				{#if deletingInvoice?.documentUrl}
					Le PDF associé sera également supprimé.
				{/if}
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Annuler</AlertDialog.Cancel>
			<form
				method="POST"
				action="?/deleteInvoice"
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === 'success') {
							toast.success('Facture supprimée');
							deleteDialogOpen = false;
							await update();
						} else if (result.type === 'failure') {
							toast.error((result.data as { message?: string })?.message ?? 'Erreur');
						}
					};
				}}
			>
				<input type="hidden" name="invoiceId" value={deletingInvoice?.id ?? ''} />
				<AlertDialog.Action
					type="submit"
					class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
				>
					Supprimer
				</AlertDialog.Action>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
