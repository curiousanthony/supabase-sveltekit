<script lang="ts">
	import type { PageProps } from './$types';
	import * as Card from '$lib/components/ui/card';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { cn } from '$lib/utils';
	import CurrencyEuro from '@tabler/icons-svelte/icons/currency-euro';
	import User from '@tabler/icons-svelte/icons/user';
	import Building from '@tabler/icons-svelte/icons/building';

	let { data }: PageProps = $props();
	let { deals, stages, workspaceId } = $derived(data);

	function getDealsByStage(stage: string) {
		return (deals ?? []).filter((d) => d.stage === stage);
	}

	function formatValue(value: string | null, currency: string) {
		if (value == null) return '—';
		const n = Number(value);
		if (Number.isNaN(n)) return '—';
		return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(n);
	}

	function ownerLabel(
		owner: { firstName?: string | null; lastName?: string | null; email?: string | null } | null
	) {
		if (!owner) return '—';
		const name = [owner.firstName, owner.lastName].filter(Boolean).join(' ');
		return name || owner.email || '—';
	}
</script>

<svelte:head>
	<title>Deals</title>
</svelte:head>

{#if !workspaceId}
	<div class="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
		<p class="text-sm">Aucun espace de travail assigné.</p>
		<p class="mt-1 text-xs">Contactez votre administrateur pour être rattaché à un espace.</p>
	</div>
{:else}
	<h1 class="text-2xl font-bold">Pipeline Deals</h1>

	{#if (deals ?? []).length === 0}
		<div class="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
			<p class="text-sm">Aucun deal pour le moment.</p>
			<a href="/deals/creer" class="mt-2 inline-block text-sm font-medium text-primary hover:underline">
				Créer un deal
			</a>
		</div>
	{:else}
		<div class="flex gap-4 overflow-x-auto pb-4">
			{#each stages as stage}
				<div class="flex min-w-[280px] min-h-[200px] flex-col gap-2 rounded-lg bg-muted/40 p-4">
					<div
						class={cn(
							'flex items-center justify-between',
							stage === 'Gagné' && 'border-b-2 border-green-500/30',
							stage === 'Perdu' && 'border-b-2 border-red-500/30'
						)}
					>
						<h2 class="font-semibold">{stage}</h2>
						<Badge variant="secondary" class="text-xs">
							{getDealsByStage(stage).length}
						</Badge>
					</div>
					<div class="flex flex-1 flex-col gap-2">
						{#each getDealsByStage(stage) as deal (deal.id)}
							<a href="/deals/{deal.id}" class="block">
								<Card.Root
									class={cn(
										'hover:border-primary w-full transition-colors',
										deal.stage === 'Gagné' && 'border-green-500/30 bg-green-500/5',
										deal.stage === 'Perdu' && 'border-red-500/30 bg-red-500/5'
									)}
								>
									<Card.Header class="pb-2">
										<Card.Title class="text-base">{deal.name}</Card.Title>
										<Card.Description class="flex items-center gap-1 text-xs">
											<Building size={12} />
											{deal.client?.legalName ?? '—'}
										</Card.Description>
									</Card.Header>
									<Card.Content class="space-y-1 pb-2 pt-0 text-sm">
										<div class="flex items-center gap-1">
											<CurrencyEuro size={14} />
											<span>{formatValue(deal.value, deal.currency)}</span>
										</div>
										<div class="flex items-center gap-1 text-muted-foreground">
											<User size={14} />
											<span>{ownerLabel(deal.owner)}</span>
										</div>
									</Card.Content>
								</Card.Root>
							</a>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
{/if}
