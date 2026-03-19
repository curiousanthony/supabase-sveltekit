<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import Wallet from '@lucide/svelte/icons/wallet';
	import TrendingUp from '@lucide/svelte/icons/trending-up';
	import Receipt from '@lucide/svelte/icons/receipt';
	import Plus from '@lucide/svelte/icons/plus';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Users from '@lucide/svelte/icons/users';

	let { data }: PageProps = $props();

	const formation = $derived(data?.formation);
	const formationId = $derived(data?.formation?.id ?? '');
	const ficheHref = $derived(`/formations/${formationId}/fiche`);
	const formateursHref = $derived(`/formations/${formationId}/formateurs`);

	const montantAccordeNum = $derived.by(() => {
		const m = formation?.montantAccorde;
		if (m == null || m === '') return null;
		const n = Number(m);
		return Number.isFinite(n) ? n : null;
	});

	function formatEur(value: number | null): string {
		if (value == null || Number.isNaN(value)) return '—';
		return new Intl.NumberFormat('fr-FR', {
			style: 'currency',
			currency: 'EUR'
		}).format(value);
	}

	function parseNum(v: string | null | undefined): number | null {
		if (v == null || v === '') return null;
		const n = Number(String(v).replace(',', '.'));
		return Number.isFinite(n) ? n : null;
	}

	const formateurCosts = $derived(data?.formateurCosts ?? []);

	const formateursTjmTotal = $derived.by(() => {
		let sum = 0;
		let anyComplete = false;
		for (const row of formateurCosts) {
			const tjm = parseNum(row.tjm ?? undefined);
			const days = parseNum(row.numberOfDays ?? undefined);
			if (tjm != null && days != null) {
				anyComplete = true;
				sum += tjm * days;
			}
		}
		return anyComplete ? sum : null;
	});

	const deplacementTotal = $derived.by(() => {
		let sum = 0;
		let any = false;
		for (const row of formateurCosts) {
			const d = parseNum(row.deplacementCost ?? undefined);
			const h = parseNum(row.hebergementCost ?? undefined);
			if (d != null) {
				any = true;
				sum += d;
			}
			if (h != null) {
				any = true;
				sum += h;
			}
		}
		return any ? sum : null;
	});

	let salleDraft = $state('');
	let materielDraft = $state('');

	$effect(() => {
		const costItems = data.costItems;
		const salle = costItems.find((c) => c.category === 'salle');
		salleDraft = salle?.amount != null && salle.amount !== '' ? String(salle.amount) : '';
		const mat = costItems.find((c) => c.category === 'materiel');
		materielDraft = mat?.amount != null && mat.amount !== '' ? String(mat.amount) : '';
	});

	const salleNum = $derived(parseNum(salleDraft) ?? 0);
	const materielNum = $derived(parseNum(materielDraft) ?? 0);

	const subtotalCouts = $derived.by(() => {
		const ft = formateursTjmTotal ?? 0;
		const dep = deplacementTotal ?? 0;
		return ft + salleNum + materielNum + dep;
	});

	const marge = $derived(
		montantAccordeNum != null ? montantAccordeNum - subtotalCouts : null
	);

	const margePct = $derived.by(() => {
		if (montantAccordeNum == null || montantAccordeNum === 0) return null;
		if (marge == null) return null;
		return (marge / montantAccordeNum) * 100;
	});

	let invoiceDialogOpen = $state(false);
	let editingInvoiceId = $state<string | null>(null);
	let deleteDialogOpen = $state(false);
	let pendingDeleteInvoiceId = $state<string | null>(null);

	let invoiceForm = $state({
		invoiceNumber: '',
		date: '',
		amount: '',
		recipient: '',
		recipientType: 'client' as 'client' | 'opco',
		dueDate: '',
		status: 'Brouillon',
		notes: ''
	});

	const todayStr = new Date().toISOString().slice(0, 10);

	function openCreateInvoice() {
		editingInvoiceId = null;
		invoiceForm.invoiceNumber = '';
		invoiceForm.date = todayStr;
		invoiceForm.amount = '';
		invoiceForm.recipient = '';
		invoiceForm.recipientType = 'client';
		invoiceForm.dueDate = '';
		invoiceForm.status = 'Brouillon';
		invoiceForm.notes = '';
		invoiceDialogOpen = true;
	}

	function openEditInvoice(inv: (typeof data.invoices)[number]) {
		editingInvoiceId = inv.id;
		invoiceForm.invoiceNumber = inv.invoiceNumber ?? '';
		invoiceForm.date = inv.date ?? '';
		invoiceForm.amount = inv.amount != null ? String(inv.amount) : '';
		invoiceForm.recipient = inv.recipient ?? '';
		const rt = inv.recipientType === 'opco' ? 'opco' : 'client';
		invoiceForm.recipientType = rt;
		invoiceForm.dueDate = inv.dueDate ?? '';
		invoiceForm.status = inv.status ?? 'Brouillon';
		invoiceForm.notes = inv.notes ?? '';
		invoiceDialogOpen = true;
	}

	function openDeleteInvoice(id: string) {
		pendingDeleteInvoiceId = id;
		deleteDialogOpen = true;
	}

	function confirmDeleteInvoice() {
		if (!pendingDeleteInvoiceId) return;
		const el = document.getElementById(`delete-invoice-${pendingDeleteInvoiceId}`);
		if (el instanceof HTMLFormElement) el.requestSubmit();
		deleteDialogOpen = false;
		pendingDeleteInvoiceId = null;
	}

	function statusBadgeClass(status: string): string {
		switch (status) {
			case 'Brouillon':
				return 'border-transparent bg-muted text-muted-foreground';
			case 'Envoyée':
				return 'border-transparent bg-blue-600 text-white hover:bg-blue-600/90';
			case 'Payée':
				return 'border-transparent bg-green-600 text-white hover:bg-green-600/90';
			case 'En retard':
				return 'border-transparent bg-red-600 text-white hover:bg-red-600/90';
			default:
				return '';
		}
	}

	const invoices = $derived(data?.invoices ?? []);
</script>

<div class="space-y-6">
	<!-- Section 1: Revenus -->
	<Card.Root>
		<Card.Header class="flex flex-row flex-wrap items-start justify-between gap-2">
			<Card.Title class="flex items-center gap-2">
				<TrendingUp class="size-5" />
				Revenus
			</Card.Title>
			<Button variant="ghost" size="sm" class="h-8 gap-1 text-muted-foreground" href={ficheHref}>
				Modifier
				<ExternalLink class="size-3.5" />
			</Button>
		</Card.Header>
		<Card.Content class="grid gap-4 sm:grid-cols-3">
			<div class="rounded-lg border p-4">
				<p class="text-sm text-muted-foreground">Montant accordé</p>
				<p class="mt-1 text-2xl font-semibold tabular-nums">{formatEur(montantAccordeNum)}</p>
			</div>
			<div class="rounded-lg border p-4">
				<p class="text-sm text-muted-foreground">Type de financement</p>
				<p class="mt-1 text-lg font-medium">
					{formation?.typeFinancement ?? '—'}
				</p>
			</div>
			<div class="rounded-lg border p-4">
				<p class="text-sm text-muted-foreground">Financement accordé</p>
				<div class="mt-2">
					{#if formation?.financementAccorde}
						<Badge>Accordé</Badge>
					{:else}
						<Badge variant="secondary">Non accordé</Badge>
					{/if}
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Section 2: Coûts -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Wallet class="size-5" />
				Coûts
			</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div class="divide-y rounded-lg border">
				<div class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p class="font-medium">Formateur(s)</p>
						<p class="text-sm text-muted-foreground">TJM × nombre de jours (par formateur)</p>
					</div>
					<div class="flex flex-wrap items-center gap-3">
						<p class="text-lg font-semibold tabular-nums">
							{formateursTjmTotal != null ? formatEur(formateursTjmTotal) : '—'}
						</p>
						<Button variant="outline" size="sm" class="gap-1" href={formateursHref}>
							<Users class="size-4" />
							Voir les formateurs
						</Button>
					</div>
				</div>

				<div class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p class="font-medium">Salle</p>
						<p class="text-sm text-muted-foreground">Montant saisi manuellement</p>
					</div>
					<form
						method="POST"
						action="?/updateCostItem"
						use:enhance={() => {
							return async ({ update }) => {
								await update();
							};
						}}
						class="flex max-w-xs items-end gap-2"
					>
						<input type="hidden" name="category" value="salle" />
						<div class="grid w-full gap-1.5">
							<Label for="cost-salle" class="sr-only">Montant salle</Label>
							<Input
								id="cost-salle"
								type="number"
								step="0.01"
								min="0"
								name="amount"
								bind:value={salleDraft}
								class="tabular-nums"
							/>
						</div>
						<Button type="submit" size="sm" variant="secondary">Enregistrer</Button>
					</form>
				</div>

				<div class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p class="font-medium">Matériel</p>
						<p class="text-sm text-muted-foreground">Montant saisi manuellement</p>
					</div>
					<form
						method="POST"
						action="?/updateCostItem"
						use:enhance={() => {
							return async ({ update }) => {
								await update();
							};
						}}
						class="flex max-w-xs items-end gap-2"
					>
						<input type="hidden" name="category" value="materiel" />
						<div class="grid w-full gap-1.5">
							<Label for="cost-mat" class="sr-only">Montant matériel</Label>
							<Input
								id="cost-mat"
								type="number"
								step="0.01"
								min="0"
								name="amount"
								bind:value={materielDraft}
								class="tabular-nums"
							/>
						</div>
						<Button type="submit" size="sm" variant="secondary">Enregistrer</Button>
					</form>
				</div>

				<div class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p class="font-medium">Déplacement</p>
						<p class="text-sm text-muted-foreground">Frais de déplacement et hébergement (formateurs)</p>
					</div>
					<p class="text-lg font-semibold tabular-nums">
						{deplacementTotal != null ? formatEur(deplacementTotal) : '—'}
					</p>
				</div>
			</div>

			<div class="flex items-center justify-between border-t pt-4 text-sm">
				<span class="text-muted-foreground">Sous-total coûts</span>
				<span class="font-semibold tabular-nums">{formatEur(subtotalCouts)}</span>
			</div>

			<div
				class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed p-4"
			>
				<span class="font-medium">Marge</span>
				<div class="text-right">
					<p
						class="text-xl font-bold tabular-nums"
						class:text-green-600={marge != null && marge >= 0}
						class:text-red-600={marge != null && marge < 0}
					>
						{marge != null ? formatEur(marge) : '—'}
					</p>
					{#if margePct != null}
						<p
							class="text-sm tabular-nums"
							class:text-green-600={marge != null && marge >= 0}
							class:text-red-600={marge != null && marge < 0}
						>
							{margePct.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %
						</p>
					{/if}
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Section 3: Factures -->
	<Card.Root>
		<Card.Header class="flex flex-row flex-wrap items-center justify-between gap-2">
			<Card.Title class="flex items-center gap-2">
				<Receipt class="size-5" />
				Factures
				{#if invoices.length > 0}
					<Badge variant="secondary">{invoices.length}</Badge>
				{/if}
			</Card.Title>
			<Button size="sm" class="gap-1" onclick={openCreateInvoice}>
				<Plus class="size-4" />
				Ajouter une facture
			</Button>
		</Card.Header>
		<Card.Content>
			{#if invoices.length === 0}
				<div
					class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-12"
				>
					<Receipt class="size-10 text-muted-foreground" />
					<p class="text-sm text-muted-foreground">Aucune facture enregistrée</p>
					<Button size="sm" variant="outline" onclick={openCreateInvoice}>
						<Plus class="size-4" />
						Ajouter une facture
					</Button>
				</div>
			{:else}
				<div class="rounded-md border">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>N°</Table.Head>
								<Table.Head>Date</Table.Head>
								<Table.Head class="text-right">Montant</Table.Head>
								<Table.Head>Destinataire</Table.Head>
								<Table.Head>Statut</Table.Head>
								<Table.Head class="w-[100px] text-right">Actions</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each invoices as inv (inv.id)}
								<Table.Row>
									<Table.Cell class="font-medium">{inv.invoiceNumber}</Table.Cell>
									<Table.Cell class="tabular-nums text-muted-foreground">{inv.date}</Table.Cell>
									<Table.Cell class="text-right font-medium tabular-nums">
										{formatEur(inv.amount != null ? Number(inv.amount) : null)}
									</Table.Cell>
									<Table.Cell>{inv.recipient}</Table.Cell>
									<Table.Cell>
										<Badge class={statusBadgeClass(inv.status)}>{inv.status}</Badge>
									</Table.Cell>
									<Table.Cell class="text-right">
										<div class="flex justify-end gap-1">
											<Button
												type="button"
												variant="ghost"
												size="icon"
												class="size-8"
												onclick={() => openEditInvoice(inv)}
											>
												<Pencil class="size-4" />
												<span class="sr-only">Modifier</span>
											</Button>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												class="size-8 text-destructive hover:text-destructive"
												onclick={() => openDeleteInvoice(inv.id)}
											>
												<Trash2 class="size-4" />
												<span class="sr-only">Supprimer</span>
											</Button>
										</div>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
					{#each invoices as inv (inv.id)}
						<form
							id="delete-invoice-{inv.id}"
							method="POST"
							action="?/deleteInvoice"
							class="hidden"
							use:enhance={() => {
								return async ({ update }) => {
									await update();
									deleteDialogOpen = false;
									pendingDeleteInvoiceId = null;
								};
							}}
						>
							<input type="hidden" name="invoiceId" value={inv.id} />
						</form>
					{/each}
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>

<Dialog.Root bind:open={invoiceDialogOpen}>
	<Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>{editingInvoiceId ? 'Modifier la facture' : 'Nouvelle facture'}</Dialog.Title>
			<Dialog.Description>
				Renseignez les informations de facturation. Les montants sont en euros.
			</Dialog.Description>
		</Dialog.Header>

		{#if editingInvoiceId}
			<form
				method="POST"
				action="?/updateInvoice"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						invoiceDialogOpen = false;
					};
				}}
				class="space-y-4"
			>
				<input type="hidden" name="invoiceId" value={editingInvoiceId} />
				<div class="grid gap-2">
					<Label for="inv-num">Numéro de facture</Label>
					<Input
						id="inv-num"
						name="invoiceNumber"
						required
						bind:value={invoiceForm.invoiceNumber}
					/>
				</div>
				<div class="grid gap-2 sm:grid-cols-2">
					<div class="grid gap-2">
						<Label for="inv-date">Date</Label>
						<Input id="inv-date" type="date" name="date" required bind:value={invoiceForm.date} />
					</div>
					<div class="grid gap-2">
						<Label for="inv-amt">Montant (€)</Label>
						<Input
							id="inv-amt"
							type="number"
							step="0.01"
							min="0"
							name="amount"
							required
							bind:value={invoiceForm.amount}
						/>
					</div>
				</div>
				<div class="grid gap-2">
					<Label for="inv-rec">Destinataire</Label>
					<Input id="inv-rec" name="recipient" required bind:value={invoiceForm.recipient} />
				</div>
				<div class="grid gap-2">
					<Label for="inv-rt">Type de destinataire</Label>
					<select
						id="inv-rt"
						name="recipientType"
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						bind:value={invoiceForm.recipientType}
					>
						<option value="client">Client</option>
						<option value="opco">OPCO</option>
					</select>
				</div>
				<div class="grid gap-2 sm:grid-cols-2">
					<div class="grid gap-2">
						<Label for="inv-due">Échéance</Label>
						<Input id="inv-due" type="date" name="dueDate" bind:value={invoiceForm.dueDate} />
					</div>
					<div class="grid gap-2">
						<Label for="inv-st">Statut</Label>
						<select
							id="inv-st"
							name="status"
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							bind:value={invoiceForm.status}
						>
							<option value="Brouillon">Brouillon</option>
							<option value="Envoyée">Envoyée</option>
							<option value="Payée">Payée</option>
							<option value="En retard">En retard</option>
						</select>
					</div>
				</div>
				<div class="grid gap-2">
					<Label for="inv-notes">Notes</Label>
					<Textarea id="inv-notes" name="notes" rows={3} bind:value={invoiceForm.notes} />
				</div>
				<Dialog.Footer class="gap-2 sm:justify-end">
					<Button type="button" variant="outline" onclick={() => (invoiceDialogOpen = false)}>
						Annuler
					</Button>
					<Button type="submit">Enregistrer</Button>
				</Dialog.Footer>
			</form>
		{:else}
			<form
				method="POST"
				action="?/createInvoice"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						invoiceDialogOpen = false;
					};
				}}
				class="space-y-4"
			>
				<div class="grid gap-2">
					<Label for="c-inv-num">Numéro de facture</Label>
					<Input
						id="c-inv-num"
						name="invoiceNumber"
						required
						bind:value={invoiceForm.invoiceNumber}
					/>
				</div>
				<div class="grid gap-2 sm:grid-cols-2">
					<div class="grid gap-2">
						<Label for="c-inv-date">Date</Label>
						<Input id="c-inv-date" type="date" name="date" required bind:value={invoiceForm.date} />
					</div>
					<div class="grid gap-2">
						<Label for="c-inv-amt">Montant (€)</Label>
						<Input
							id="c-inv-amt"
							type="number"
							step="0.01"
							min="0"
							name="amount"
							required
							bind:value={invoiceForm.amount}
						/>
					</div>
				</div>
				<div class="grid gap-2">
					<Label for="c-inv-rec">Destinataire</Label>
					<Input id="c-inv-rec" name="recipient" required bind:value={invoiceForm.recipient} />
				</div>
				<div class="grid gap-2">
					<Label for="c-inv-rt">Type de destinataire</Label>
					<select
						id="c-inv-rt"
						name="recipientType"
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						bind:value={invoiceForm.recipientType}
					>
						<option value="client">Client</option>
						<option value="opco">OPCO</option>
					</select>
				</div>
				<div class="grid gap-2 sm:grid-cols-2">
					<div class="grid gap-2">
						<Label for="c-inv-due">Échéance</Label>
						<Input id="c-inv-due" type="date" name="dueDate" bind:value={invoiceForm.dueDate} />
					</div>
					<div class="grid gap-2">
						<Label for="c-inv-st">Statut</Label>
						<select
							id="c-inv-st"
							name="status"
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							bind:value={invoiceForm.status}
						>
							<option value="Brouillon">Brouillon</option>
							<option value="Envoyée">Envoyée</option>
							<option value="Payée">Payée</option>
							<option value="En retard">En retard</option>
						</select>
					</div>
				</div>
				<div class="grid gap-2">
					<Label for="c-inv-notes">Notes</Label>
					<Textarea id="c-inv-notes" name="notes" rows={3} bind:value={invoiceForm.notes} />
				</div>
				<Dialog.Footer class="gap-2 sm:justify-end">
					<Button type="button" variant="outline" onclick={() => (invoiceDialogOpen = false)}>
						Annuler
					</Button>
					<Button type="submit">Créer</Button>
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<AlertDialog.Root bind:open={deleteDialogOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Supprimer cette facture ?</AlertDialog.Title>
			<AlertDialog.Description>
				Cette action est irréversible. La facture sera définitivement supprimée.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel
				onclick={() => {
					pendingDeleteInvoiceId = null;
				}}>Annuler</AlertDialog.Cancel
			>
			<AlertDialog.Action
				class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
				onclick={confirmDeleteInvoice}
			>
				Supprimer
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
