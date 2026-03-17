<script lang="ts">
	import type { PageProps } from './$types';
	import { DragDropProvider } from '@dnd-kit-svelte/svelte';
	import { useSortable, isSortable } from '@dnd-kit-svelte/svelte/sortable';
	import { move } from '@dnd-kit/helpers';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import * as Card from '$lib/components/ui/card';
	import Badge from '$lib/components/ui/badge/badge.svelte';
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
	import Building2 from '@lucide/svelte/icons/building-2';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import Plus from '@lucide/svelte/icons/plus';

	let { data }: PageProps = $props();
	let { deals: rawDeals, stages, workspaceId } = $derived(data);

	type Deal = (typeof rawDeals)[number];

	let dealsByStage = $state<Record<string, { id: string }[]>>({});

	$effect(() => {
		const grouped: Record<string, { id: string }[]> = {};
		for (const stage of DEAL_STAGES) {
			grouped[stage] = (rawDeals ?? [])
				.filter((d) => d.stage === stage)
				.map((d) => ({ id: d.id }));
		}
		dealsByStage = grouped;
	});

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

	let pendingStageUpdate: { dealId: string; stage: string } | null = $state(null);

	async function handleDragEnd(event: any) {
		if (event.canceled) return;
		const { source } = event.operation;
		if (!isSortable(source)) return;

		const newGroup = (source as any).group as string;
		const dealId = source.id as string;
		const deal = getDeal(dealId);

		if (deal && deal.stage !== newGroup) {
			dealsByStage = move(dealsByStage, event);
			pendingStageUpdate = { dealId, stage: newGroup };
		} else {
			dealsByStage = move(dealsByStage, event);
		}
	}

	$effect(() => {
		if (pendingStageUpdate) {
			const form = document.getElementById('stage-update-form') as HTMLFormElement;
			if (form) form.requestSubmit();
		}
	});
</script>

<svelte:head>
	<title>Deals</title>
</svelte:head>

{#if pendingStageUpdate}
	<form
		id="stage-update-form"
		method="POST"
		action="?/updateStage"
		class="hidden"
		use:enhance={() => {
			return async ({ update }) => {
				pendingStageUpdate = null;
				await update();
				await invalidateAll();
			};
		}}
	>
		<input type="hidden" name="dealId" value={pendingStageUpdate.dealId} />
		<input type="hidden" name="stage" value={pendingStageUpdate.stage} />
	</form>
{/if}

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
										{items.length}
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
									{@const deal = getDeal(item.id)}
									{@const sortable = useSortable({ id: item.id, index: () => index, group: stage })}
									{#if deal}
										<a
											href="/deals/{deal.id}"
											class="block"
											{@attach sortable.ref}
										>
											<Card.Root
												class={cn(
													'cursor-pointer border transition-all hover:shadow-sm hover:ring-2 hover:ring-primary/20 active:cursor-grabbing',
													sortable.isDragging.current && 'opacity-50 shadow-lg ring-2 ring-primary/20',
													stage === 'Gagné' && 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30',
													stage === 'Perdu' && 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/30'
												)}
											>
											<div class="p-3 space-y-2">
												<div class="flex items-center gap-2">
													{#if deal.idInWorkspace}
														<span class="text-[10px] font-mono text-muted-foreground shrink-0">DL-{deal.idInWorkspace}</span>
													{/if}
													<p class="text-sm font-medium leading-tight line-clamp-2">{deal.name}</p>
												</div>

													{#if contactLabel(deal) || companyFromDeal(deal)}
														<div class="flex flex-col gap-0.5">
															{#if contactLabel(deal)}
																<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
																	<User2 class="size-3 shrink-0" />
																	<span class="truncate">{contactLabel(deal)}</span>
																</div>
															{/if}
															{#if companyFromDeal(deal)}
																<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
																	<Building2 class="size-3 shrink-0" />
																	<span class="truncate">{companyFromDeal(deal)}</span>
																</div>
															{/if}
														</div>
													{/if}

													{#if deal.programme}
														<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
															<BookOpen class="size-3 shrink-0" />
															<span class="truncate">{deal.programme.titre}</span>
														</div>
													{/if}

													<div class="flex items-center justify-between pt-1">
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

													<div class="flex items-center justify-between pt-0.5">
														{#if deal.intraInter || deal.modalities?.length}
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
															</div>
														{:else}
															<div></div>
														{/if}
														{#if deal.commercial || deal.owner}
															{@const person = deal.commercial ?? deal.owner}
															<span
																class="inline-flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium"
																title={userDisplayName(person)}
															>
																{(person?.firstName?.[0] ?? '').toUpperCase()}{(person?.lastName?.[0] ?? '').toUpperCase()}
															</span>
														{/if}
													</div>
												</div>
											</Card.Root>
										</a>
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
