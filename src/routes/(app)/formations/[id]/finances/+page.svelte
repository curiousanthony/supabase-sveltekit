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
	import Plus from '@lucide/svelte/icons/plus';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import FileText from '@lucide/svelte/icons/file-text';
	import QuestGuideBanner from '$lib/components/formations/quest-guide-banner.svelte';

	let { data }: PageProps = $props();

	const formation = $derived(data?.formation);
	const invoices = $derived(data?.invoices ?? []);
	const costItems = $derived(data?.costItems ?? []);

	const montant = $derived(
		formation?.montantAccorde != null ? Number(formation.montantAccorde) : null
	);
	const clientName = $derived(
		formation?.company?.name ?? formation?.client?.legalName ?? ''
	);

	// --- Cost calculations ---
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
	const margin = $derived(montant != null ? montant - totalCosts : null);
	const marginPercent = $derived(
		montant != null && montant > 0 ? ((montant - totalCosts) / montant) * 100 : null
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

	// --- Invoice dialog ---
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

	const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
		Brouillon: 'secondary',
		'Envoyée': 'outline',
		'Payée': 'default',
		'En retard': 'destructive'
	};

	const statusColors: Record<string, string> = {
		Brouillon: '',
		'Envoyée': 'border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-400',
		'Payée': 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
		'En retard': ''
	};
</script>

<div class="space-y-6">
	<QuestGuideBanner />
	<!-- Section 1: Revenus -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Wallet class="size-4" />
				Revenus
			</Card.Title>
		</Card.Header>
		<Card.Content>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<div class="rounded-lg border p-4">
					<p class="text-sm text-muted-foreground">Montant accordé</p>
					<p class="mt-1 text-2xl font-semibold tabular-nums">
						{montant != null ? fmtCurrency(montant) + ' €' : '—'}
					</p>
				</div>
				<div class="rounded-lg border p-4">
					<p class="text-sm text-muted-foreground">Type de financement</p>
					<div class="mt-2">
						{#if formation?.typeFinancement}
							<Badge variant="outline">{formation.typeFinancement}</Badge>
						{:else}
							<span class="text-sm text-muted-foreground">Non défini</span>
						{/if}
					</div>
				</div>
				<div class="rounded-lg border p-4">
					<p class="text-sm text-muted-foreground">Financement</p>
					<div class="mt-2">
						{#if formation?.financementAccorde}
							<Badge class="bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700">Accordé</Badge>
						{:else}
							<Badge variant="secondary">En attente</Badge>
						{/if}
					</div>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Section 2: Coûts -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Calculator class="size-4" />
				Coûts
			</Card.Title>
		</Card.Header>
		<Card.Content>
			<div class="space-y-3">
				<!-- Formateurs -->
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

				<!-- Salle -->
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

				<!-- Matériel -->
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

				<!-- Déplacement -->
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<span class="text-sm font-medium">Déplacement</span>
						<span class="text-xs text-muted-foreground">(auto-calculé)</span>
					</div>
					<span class="text-sm font-medium tabular-nums">{fmtCurrency(deplacementCost)} €</span>
				</div>

				<Separator />

				<!-- Total -->
				<div class="flex items-center justify-between">
					<span class="text-sm font-bold">Total des coûts</span>
					<span class="text-sm font-bold tabular-nums">{fmtCurrency(totalCosts)} €</span>
				</div>

				<!-- Marge -->
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
									class={margin >= 0 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : ''}
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

	<!-- Section 3: Factures -->
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
					<p class="text-sm text-muted-foreground">
						Aucune facture. Créez votre première facture.
					</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each invoices as inv (inv.id)}
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
					<p class="text-xs text-muted-foreground">Un PDF est déjà associé. L'envoi d'un nouveau fichier le remplacera.</p>
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

<!-- Delete confirmation -->
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
