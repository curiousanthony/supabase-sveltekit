<script lang="ts">
	import type { PageProps } from './$types';
	import { DragDropProvider } from '@dnd-kit-svelte/svelte';
	import { useSortable, isSortable } from '@dnd-kit-svelte/svelte/sortable';
	import { invalidateAll } from '$app/navigation';
	import * as Card from '$lib/components/ui/card';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import DealCardContextMenu from '$lib/components/crm/DealCardContextMenu.svelte';
	import { cn } from '$lib/utils';
	import {
		DEAL_STAGES,
		STAGE_COLORS,
		STAGE_PROBABILITIES,
		formatCurrency,
		userDisplayName,
		type DealStage
	} from '$lib/crm/deal-schema';
	import Euro from '@lucide/svelte/icons/euro';
	import User2 from '@lucide/svelte/icons/user-round';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import Plus from '@lucide/svelte/icons/plus';
	import Coins from '@lucide/svelte/icons/coins';

	const PLACEHOLDER_PREFIX = '__placeholder_';

	let { data }: PageProps = $props();
	let { deals: rawDeals, workspaceId, members } = $derived(data);

	type Deal = (typeof rawDeals)[number];

	let dealsByStage = $state<Record<string, { id: string }[]>>({});

	$effect(() => {
		const grouped: Record<string, { id: string }[]> = {};
		for (const stage of DEAL_STAGES) {
			const stageDeals = (rawDeals ?? [])
				.filter((d) => d.stage === stage)
				.map((d) => ({ id: d.id }));
			grouped[stage] = [...stageDeals, { id: `${PLACEHOLDER_PREFIX}${stage}` }];
		}
		dealsByStage = grouped;
	});

	function isPlaceholder(id: string): boolean {
		return id.startsWith(PLACEHOLDER_PREFIX);
	}

	function dealCount(stage: string): number {
		return (dealsByStage[stage] ?? []).filter((i) => !isPlaceholder(i.id)).length;
	}

	const dealsMap = $derived(
		new Map((rawDeals ?? []).map((d) => [d.id, d]))
	);

	function getDeal(id: string): Deal | undefined {
		return dealsMap.get(id);
	}

	function stageTotal(stage: string): number {
		const items = dealsByStage[stage] ?? [];
		return items.reduce((sum, item) => {
			const deal = getDeal(item.id);
			const amt = Number(deal?.dealAmount ?? deal?.value ?? 0);
			return sum + (Number.isNaN(amt) ? 0 : amt);
		}, 0);
	}

	function stageWeightedTotal(stage: string): number {
		const prob = STAGE_PROBABILITIES[stage as DealStage] ?? 0;
		return (stageTotal(stage) * prob) / 100;
	}

	function contactLabel(deal: Deal): string {
		const c = deal.contact;
		if (!c) return '';
		return [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email || '';
	}

	function companyFromDeal(deal: Deal): string {
		if (deal.company?.name) return deal.company.name;
		const cc = deal.contact?.contactCompanies;
		if (cc && cc.length > 0 && cc[0].company) return cc[0].company.name;
		return '';
	}

	function contactAndCompany(deal: Deal): string {
		const contact = contactLabel(deal);
		const company = companyFromDeal(deal);
		if (contact && company) return `${contact}  ·  ${company}`;
		return contact || company;
	}

	async function persistStageChange(dealId: string, stage: string) {
		const fd = new FormData();
		fd.set('dealId', dealId);
		fd.set('stage', stage);
		await fetch('?/updateStage', {
			method: 'POST',
			body: fd,
			headers: { 'x-sveltekit-action': 'true' }
		});
		await invalidateAll();
	}

	async function handleDragEnd(event: any) {
		if (event.canceled) return;
		const { source } = event.operation;
		if (!isSortable(source)) return;

		const dealId = source.id as string;
		if (isPlaceholder(dealId)) return;

		const deal = getDeal(dealId);
		const newStage = (source as any).sortable?.group as string | undefined;

		if (deal && newStage && deal.stage !== newStage) {
			const movedEl = (source as any).sortable?.element as HTMLElement | undefined;
			if (movedEl) movedEl.remove();

			const oldStage = deal.stage;
			const updated = { ...dealsByStage };
			updated[oldStage] = updated[oldStage].filter((i) => i.id !== dealId);
			const targetItems = [...(updated[newStage] ?? [])];
			const phIdx = targetItems.findIndex((i) => isPlaceholder(i.id));
			if (phIdx >= 0) {
				targetItems.splice(phIdx, 0, { id: dealId });
			} else {
				targetItems.push({ id: dealId });
			}
			updated[newStage] = targetItems;
			dealsByStage = updated;

			persistStageChange(dealId, newStage);
		}
	}
</script>

<svelte:head>
	<title>Deals</title>
</svelte:head>

{#if !workspaceId}
	<div class="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
		<p class="text-sm">Aucun espace de travail assigné.</p>
	</div>
{:else}
	<div class="flex min-h-0 flex-1 flex-col gap-4">
		{#if (rawDeals ?? []).length === 0}
			<div class="flex flex-1 items-center justify-center">
				<div class="rounded-lg border border-dashed p-12 text-center">
					<p class="text-lg font-medium text-muted-foreground">Aucun deal pour le moment</p>
					<p class="mt-1 text-sm text-muted-foreground">Créez votre premier deal pour démarrer votre pipeline commercial.</p>
					<a
						href="/deals/creer"
						class="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
					>
						<Plus class="size-4" />
						Nouveau deal
					</a>
				</div>
			</div>
		{:else}
			<DragDropProvider onDragEnd={handleDragEnd}>
				<div class="flex min-h-0 flex-1 gap-3 overflow-x-auto pb-2">
					{#each DEAL_STAGES as stage}
					{@const colors = STAGE_COLORS[stage]}
					{@const items = dealsByStage[stage] ?? []}
					{@const total = stageTotal(stage)}
					{@const weighted = stageWeightedTotal(stage)}
					<div class="flex h-full min-w-[290px] max-w-[320px] flex-1 flex-col rounded-lg border bg-muted/30">
						<div class={cn('flex shrink-0 flex-col gap-1 border-b px-3 py-2.5', colors.border)}>
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<span class={cn('inline-block size-2 rounded-full', colors.bg, colors.border, 'border')}></span>
									<h2 class="text-sm font-semibold">{stage}</h2>
								</div>
								<Badge variant="secondary" class="text-xs tabular-nums">
									{dealCount(stage)}
								</Badge>
							</div>
							{#if total > 0}
								<div class="flex items-center gap-2 text-xs text-muted-foreground">
									<span>{formatCurrency(total)}</span>
									<span class="opacity-50">·</span>
									<span title="Montant pondéré ({STAGE_PROBABILITIES[stage]}%)">{formatCurrency(weighted)} pondéré</span>
								</div>
							{/if}
						</div>

						<div class="flex min-h-[60px] flex-1 flex-col gap-1.5 overflow-y-auto p-2">
							{#each items as item, index (item.id)}
								{@const sortable = useSortable({ id: item.id, index: () => index, group: stage })}
							{#if isPlaceholder(item.id)}
								<div {@attach sortable.ref} class="min-h-[2px]"></div>
							{:else}
								{@const deal = getDeal(item.id)}
							{#if deal}
								<div {@attach sortable.ref} class={cn(sortable.isDragging.current && 'opacity-50')}>
									<DealCardContextMenu {deal} {members}>
										<a href="/deals/{deal.id}" class="block">
											<Card.Root
												class={cn(
													'py-0! gap-0! cursor-pointer border transition-all hover:shadow-sm hover:ring-2 hover:ring-primary/20 active:cursor-grabbing',
													stage === 'Gagné' && 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30',
													stage === 'Perdu' && 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/30'
												)}
											>
											<div class="p-2.5 space-y-1.5">
												<div class="flex items-start gap-1.5">
													{#if deal.idInWorkspace}
														<span class="mt-0.5 text-[10px] font-mono text-muted-foreground shrink-0">DL-{deal.idInWorkspace}</span>
													{/if}
													<p class="text-sm font-medium leading-tight line-clamp-2">{deal.name}</p>
												</div>

												{#if contactAndCompany(deal)}
													<div class="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
														<User2 class="size-3 shrink-0" />
														<span class="truncate">{contactAndCompany(deal)}</span>
													</div>
												{/if}

												{#if deal.programme}
													<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
														<BookOpen class="size-3 shrink-0" />
														<span class="truncate">{deal.programme.titre}</span>
													</div>
												{/if}

												<div class="flex items-center justify-between">
													<div class="flex items-center gap-1 text-sm font-medium tabular-nums">
														<Euro class="size-3.5" />
														{formatCurrency(deal.dealAmount ?? deal.value)}
													</div>
													{#if deal.desiredStartDate}
														<div class="flex items-center gap-1 text-xs text-muted-foreground">
															<CalendarDays class="size-3" />
															{new Date(deal.desiredStartDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
														</div>
													{/if}
												</div>

												<div class="flex items-center justify-between">
													<div class="flex flex-wrap gap-1">
														{#if deal.intraInter}
															<Badge variant="outline" class="text-[10px] px-1.5 py-0">
																{deal.intraInter}
															</Badge>
														{/if}
														{#each (deal.modalities ?? []).slice(0, 2) as mod}
															<Badge variant="outline" class="text-[10px] px-1.5 py-0">
																{mod}
															</Badge>
														{/each}
														{#if deal.fundingStatus}
															<Badge variant="secondary" class="text-[10px] px-1.5 py-0">
																<Coins class="size-2.5 mr-0.5" />
																{deal.fundingStatus}
															</Badge>
														{/if}
													</div>
													{#if deal.commercial || deal.owner}
														{@const person = deal.commercial ?? deal.owner}
														<span
															class="inline-flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium shrink-0"
															title={userDisplayName(person)}
														>
															{(person?.firstName?.[0] ?? '').toUpperCase()}{(person?.lastName?.[0] ?? '').toUpperCase()}
														</span>
													{/if}
												</div>
											</div>
											</Card.Root>
										</a>
									</DealCardContextMenu>
								</div>
								{/if}
							{/if}
							{/each}
						</div>
						</div>
					{/each}
				</div>
			</DragDropProvider>
		{/if}
	</div>
{/if}
