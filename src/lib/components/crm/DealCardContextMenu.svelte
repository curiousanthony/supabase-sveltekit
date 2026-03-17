<script lang="ts">
	import type { Snippet } from 'svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll, goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { toast } from 'svelte-sonner';
	import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import {
		DEAL_STAGES,
		STAGE_COLORS,
		LOSS_REASONS,
		userDisplayName,
		type DealStage
	} from '$lib/crm/deal-schema';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Copy from '@lucide/svelte/icons/copy';
	import CopyPlus from '@lucide/svelte/icons/copy-plus';
	import Trophy from '@lucide/svelte/icons/trophy';
	import XCircle from '@lucide/svelte/icons/circle-x';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import UserRoundPlus from '@lucide/svelte/icons/user-round-plus';
	import Layers from '@lucide/svelte/icons/layers';

	type DealData = {
		id: string;
		name: string;
		stage: string | null;
		commercialId: string | null;
		[key: string]: unknown;
	};

	type Member = {
		id: string;
		firstName: string | null;
		lastName: string | null;
		email: string | null;
	};

	let {
		deal,
		members,
		children
	}: {
		deal: DealData;
		members: Member[];
		children: Snippet;
	} = $props();

	let openLossDialog = $state(false);
	let openDeleteDialog = $state(false);
	let openAssignDialog = $state(false);
	let lossReason = $state('');
	let lossReasonDetail = $state('');
	let assignSearch = $state('');

	const filteredMembers = $derived(
		members.filter((m) => {
			const q = assignSearch.toLowerCase();
			return (
				(m.firstName?.toLowerCase().includes(q) ?? false) ||
				(m.lastName?.toLowerCase().includes(q) ?? false) ||
				(m.email?.toLowerCase().includes(q) ?? false)
			);
		})
	);

	const showAssignOption = $derived(members.length > 1);

	function handleCopyLink() {
		const url = `${$page.url.origin}/deals/${deal.id}`;
		navigator.clipboard.writeText(url);
		toast.success('Lien copié');
	}

	function handleOpenNewTab() {
		window.open(`/deals/${deal.id}`, '_blank');
	}

	async function handleAssign(memberId: string) {
		const formData = new FormData();
		formData.set('dealId', deal.id);
		formData.set('commercialId', memberId);
		const response = await fetch('?/assignCommercial', { method: 'POST', body: formData });
		if (response.ok) {
			toast.success('Commercial assigné');
			openAssignDialog = false;
			assignSearch = '';
			await invalidateAll();
		} else {
			toast.error("Erreur lors de l'assignation");
		}
	}

	function resetLossDialog() {
		lossReason = '';
		lossReasonDetail = '';
	}
</script>

<ContextMenu.Root>
	<ContextMenu.Trigger>
		{@render children()}
	</ContextMenu.Trigger>
	<ContextMenu.Content class="w-56">
		<ContextMenu.Item
			onclick={() => goto(`/deals/${deal.id}`)}
		>
			<ExternalLink class="size-4" />
			Ouvrir
		</ContextMenu.Item>
		<ContextMenu.Item onclick={handleOpenNewTab}>
			<ExternalLink class="size-4" />
			Ouvrir dans un nouvel onglet
		</ContextMenu.Item>

		<ContextMenu.Separator />

		<ContextMenu.Sub>
			<ContextMenu.SubTrigger>
				<Layers class="size-4" />
				Changer d'étape
			</ContextMenu.SubTrigger>
			<ContextMenu.SubContent class="w-48">
				{#each DEAL_STAGES as stage}
					{@const colors = STAGE_COLORS[stage]}
					{@const isCurrent = deal.stage === stage}
					<ContextMenu.Item
						disabled={isCurrent}
						class={isCurrent ? 'font-semibold' : ''}
						onclick={async () => {
							if (stage === 'Perdu') {
								openLossDialog = true;
								return;
							}
							const formData = new FormData();
							formData.set('dealId', deal.id);
							formData.set('stage', stage);
							const response = await fetch('?/updateStage', { method: 'POST', body: formData });
							if (response.ok) {
								toast.success(`Étape mise à jour : ${stage}`);
								await invalidateAll();
							} else {
								toast.error("Erreur lors du changement d'étape");
							}
						}}
					>
						<span class={`inline-block size-2 rounded-full ${colors.bg} ${colors.border} border`}></span>
						{stage}
						{#if isCurrent}
							<span class="text-muted-foreground ml-auto text-xs">actuel</span>
						{/if}
					</ContextMenu.Item>
				{/each}
			</ContextMenu.SubContent>
		</ContextMenu.Sub>

		{#if showAssignOption}
			<ContextMenu.Item onclick={() => (openAssignDialog = true)}>
				<UserRoundPlus class="size-4" />
				Assigner un commercial
			</ContextMenu.Item>
		{/if}

		<ContextMenu.Separator />

		<ContextMenu.Item onclick={handleCopyLink}>
			<Copy class="size-4" />
			Copier le lien
		</ContextMenu.Item>
		<ContextMenu.Item
			onclick={async () => {
				const formData = new FormData();
				formData.set('dealId', deal.id);
				const response = await fetch('?/duplicateDeal', { method: 'POST', body: formData });
				if (response.redirected) {
					toast.success('Deal dupliqué');
					await goto(response.url);
				} else if (!response.ok) {
					toast.error('Erreur lors de la duplication');
				}
			}}
		>
			<CopyPlus class="size-4" />
			Dupliquer
		</ContextMenu.Item>

		<ContextMenu.Separator />

		{#if deal.stage !== 'Gagné'}
			<ContextMenu.Item
				onclick={async () => {
					const formData = new FormData();
					formData.set('dealId', deal.id);
					formData.set('stage', 'Gagné');
					const response = await fetch('?/updateStage', { method: 'POST', body: formData });
					if (response.ok) {
						toast.success('Deal marqué comme Gagné');
						await invalidateAll();
					} else {
						toast.error('Erreur');
					}
				}}
			>
				<Trophy class="size-4" />
				Marquer comme Gagné
			</ContextMenu.Item>
		{/if}
		{#if deal.stage !== 'Perdu'}
			<ContextMenu.Item onclick={() => { resetLossDialog(); openLossDialog = true; }}>
				<XCircle class="size-4" />
				Marquer comme Perdu
			</ContextMenu.Item>
		{/if}

		<ContextMenu.Separator />

		<ContextMenu.Item
			variant="destructive"
			onclick={() => (openDeleteDialog = true)}
		>
			<Trash2 class="size-4" />
			Supprimer
		</ContextMenu.Item>
	</ContextMenu.Content>
</ContextMenu.Root>

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
						resetLossDialog();
						toast.success('Deal marqué comme Perdu');
						await invalidateAll();
					}
					await update();
				};
			}}
		>
			<input type="hidden" name="dealId" value={deal.id} />
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
				<Label for="lossDetail-{deal.id}">Détails (optionnel)</Label>
				<textarea
					id="lossDetail-{deal.id}"
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

<!-- Delete confirmation dialog -->
<AlertDialog.Root bind:open={openDeleteDialog}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Supprimer ce deal ?</AlertDialog.Title>
			<AlertDialog.Description>
				Le deal « {deal.name} » sera supprimé définitivement. Cette action est irréversible.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Annuler</AlertDialog.Cancel>
			<form
				method="POST"
				action="?/deleteDeal"
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === 'success') {
							openDeleteDialog = false;
							toast.success('Deal supprimé');
							await invalidateAll();
						}
						await update();
					};
				}}
			>
				<input type="hidden" name="dealId" value={deal.id} />
				<Button type="submit" variant="destructive">Supprimer définitivement</Button>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<!-- Assign commercial dialog -->
<Dialog.Root bind:open={openAssignDialog} onOpenChange={(open) => { if (!open) assignSearch = ''; }}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Assigner un commercial</Dialog.Title>
			<Dialog.Description>Choisissez un membre de l'équipe pour « {deal.name} ».</Dialog.Description>
		</Dialog.Header>
		<Command.Root shouldFilter={false} class="rounded-lg border">
			<Command.Input placeholder="Rechercher un membre..." bind:value={assignSearch} />
			<Command.List>
				<Command.Empty>Aucun membre trouvé.</Command.Empty>
				{#each filteredMembers as m (m.id)}
					<Command.Item
						value={m.id}
						onSelect={() => handleAssign(m.id)}
						class={deal.commercialId === m.id ? 'font-semibold' : ''}
					>
						<span class="inline-flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
							{(m.firstName?.[0] ?? '').toUpperCase()}{(m.lastName?.[0] ?? '').toUpperCase()}
						</span>
						{userDisplayName(m)}
						{#if deal.commercialId === m.id}
							<span class="text-muted-foreground ml-auto text-xs">actuel</span>
						{/if}
					</Command.Item>
				{/each}
			</Command.List>
		</Command.Root>
	</Dialog.Content>
</Dialog.Root>
