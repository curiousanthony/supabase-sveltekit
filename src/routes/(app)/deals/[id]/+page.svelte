<script lang="ts">
	import type { PageProps } from './$types';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Select from '$lib/components/ui/select';
	import * as Dialog from '$lib/components/ui/dialog';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Building from '@tabler/icons-svelte/icons/building';
	import CurrencyEuro from '@tabler/icons-svelte/icons/currency-euro';
	import User from '@tabler/icons-svelte/icons/user';
	import { cn } from '$lib/utils';

	let { data }: PageProps = $props();
	let { deal, header } = $derived(data);

	let openCloseDialog = $state(false);
	let stageSelection = $state('Lead');
	$effect(() => {
		if (deal?.stage) stageSelection = deal.stage;
	});
	const STAGES = ['Lead', 'Qualification', 'Proposition', 'Négociation', 'Gagné', 'Perdu'] as const;

	function formatValue(value: string | null, currency: string) {
		if (value == null) return '—';
		const n = Number(value);
		if (Number.isNaN(n)) return '—';
		return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(n);
	}

	function ownerLabel(owner: { firstName?: string | null; lastName?: string | null; email?: string | null } | null) {
		if (!owner) return '—';
		const name = [owner.firstName, owner.lastName].filter(Boolean).join(' ');
		return name || owner.email || '—';
	}
</script>

<svelte:head>
	<title>{header?.pageName ?? deal?.name ?? 'Deal'}</title>
</svelte:head>

{#if deal}
	<div class="flex flex-col gap-6">
		<div class="flex flex-wrap items-center gap-3">
			<Badge
				variant="outline"
				class={cn(
					deal.stage === 'Gagné' && 'border-green-500/50 text-green-700 dark:text-green-400',
					deal.stage === 'Perdu' && 'border-muted text-muted-foreground'
				)}
			>
				{deal.stage}
			</Badge>
			{#if deal.formation}
				<Badge variant="secondary">Formation créée</Badge>
			{/if}
		</div>

		<Tabs.Root value="apercu" class="w-full">
			<Tabs.List class="mb-4">
				<Tabs.Trigger value="apercu">Aperçu</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="apercu" class="space-y-6">
				<Card.Root>
					<Card.Header>
						<Card.Title>{deal.name}</Card.Title>
						<Card.Description>{deal.description ?? '—'}</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-4">
						<div class="flex items-center gap-2 text-sm">
							<Building class="size-4 text-muted-foreground" />
							<span>{deal.client?.legalName ?? '—'}</span>
						</div>
						<div class="flex items-center gap-2 text-sm">
							<CurrencyEuro class="size-4 text-muted-foreground" />
							{formatValue(deal.value, deal.currency)}
						</div>
						<div class="flex items-center gap-2 text-sm">
							<User class="size-4 text-muted-foreground" />
							{ownerLabel(deal.owner)}
						</div>
						{#if deal.formation}
							<div class="pt-2">
								<Button href="/formations/{deal.formation.id}" variant="default">
									Voir la formation
								</Button>
							</div>
						{/if}
					</Card.Content>
				</Card.Root>

				{#if deal.stage !== 'Gagné' && deal.stage !== 'Perdu'}
					<Card.Root>
						<Card.Header>
							<Card.Title>Actions</Card.Title>
							<Card.Description>Modifier l'étape ou clôturer le deal et créer une formation.</Card.Description>
						</Card.Header>
						<Card.Content class="space-y-4">
							<form
								method="POST"
								action="?/updateStage"
								use:enhance={() => {
									return async ({ result, update }) => {
										await update();
										if (result.type === 'success') invalidateAll();
									};
								}}
								class="flex flex-wrap items-end gap-3"
							>
								<input type="hidden" name="stage" value={stageSelection} />
								<div class="space-y-2">
									<label for="stage-select" class="text-sm font-medium">Étape</label>
									<Select.Root type="single" bind:value={stageSelection}>
										<Select.Trigger id="stage-select" class="w-[180px]">
											<span class="truncate">{stageSelection}</span>
										</Select.Trigger>
										<Select.Content>
											{#each STAGES as s}
												<Select.Item value={s} label={s}>{s}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								</div>
								<Button type="submit">Mettre à jour</Button>
							</form>

							{#if !deal.formation}
								<div class="pt-2 border-t">
									<Dialog.Root bind:open={openCloseDialog}>
										<Dialog.Trigger>
											<Button variant="default">
												Clôturer (gagné) et créer une formation
											</Button>
										</Dialog.Trigger>
										<Dialog.Content>
											<Dialog.Header>
												<Dialog.Title>Créer une formation à partir du deal ?</Dialog.Title>
												<Dialog.Description>
													Une formation sera créée avec le nom, le client et les informations du deal. Vous pourrez la compléter (modules, Qualiopi, etc.) sur la page formation.
												</Dialog.Description>
											</Dialog.Header>
											<Dialog.Footer class="flex gap-2">
												<Dialog.Close>
													<Button variant="outline">Annuler</Button>
												</Dialog.Close>
												<form method="POST" action="?/closeAndCreateFormation" use:enhance>
													<Button type="submit" onclick={() => (openCloseDialog = false)}>
														Créer la formation
													</Button>
												</form>
											</Dialog.Footer>
										</Dialog.Content>
									</Dialog.Root>
								</div>
							{/if}
						</Card.Content>
					</Card.Root>
				{/if}
			</Tabs.Content>
		</Tabs.Root>
	</div>
{/if}
