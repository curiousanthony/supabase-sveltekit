<script lang="ts">
	import type { PageProps } from './$types';
	import * as Card from '$lib/components/ui/card/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Progress from '$lib/components/ui/progress/index.js';
	import { cn } from '$lib/utils';
	import { enhance } from '$app/forms';
	import Check from '@lucide/svelte/icons/check';
	import Circle from '@lucide/svelte/icons/circle';
	import Clock from '@lucide/svelte/icons/clock';
	import Lock from '@lucide/svelte/icons/lock';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ListChecks from '@lucide/svelte/icons/list-checks';

	let { data }: PageProps = $props();

	const formation = $derived(data?.formation);
	const actions = $derived(formation?.actions ?? []);
	const completedCount = $derived(actions.filter((a) => a.status === 'Terminé').length);
	const totalCount = $derived(actions.length);
	const progressPercent = $derived(totalCount > 0 ? (completedCount / totalCount) * 100 : 0);

	const ETAPE_COLORS: Record<string, string> = {
		'Récapitulatif': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
		'Convention et programme': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
		'Audit des besoins': 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
		'Convocations': 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
		'Test de positionnement': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
		'Certificat de réalisation': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
		'Questionnaires de satisfaction': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
		'Émargement': 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
		'Ordre de mission': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
		'Formateur': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
		'Facturation': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
		'Récap final': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
	};

	function getStatusIcon(status: string) {
		switch (status) {
			case 'Terminé': return Check;
			case 'En cours': return Clock;
			default: return Circle;
		}
	}

	function isBlocked(action: { blockedByActionId: string | null }) {
		if (!action.blockedByActionId) return false;
		const blocker = actions.find((a) => a.id === action.blockedByActionId);
		return blocker && blocker.status !== 'Terminé';
	}
</script>

<div class="space-y-6">
	<!-- Progress header -->
	<Card.Root>
		<Card.Content class="pt-6">
			<div class="flex items-center justify-between mb-3">
				<div class="flex items-center gap-2">
					<ListChecks class="size-5 text-primary" />
					<h2 class="text-lg font-semibold">Suivi des actions</h2>
				</div>
				<span class="text-sm text-muted-foreground tabular-nums">
					{completedCount}/{totalCount} complétée{completedCount > 1 ? 's' : ''}
				</span>
			</div>
			<Progress.Root
				value={progressPercent}
				class="h-2 w-full rounded-full"
			/>
			{#if totalCount === 0}
				<p class="mt-3 text-sm text-muted-foreground">
					Aucune action n'a été créée pour cette formation. Les actions seront automatiquement générées lors de la création d'une formation.
				</p>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Actions list -->
	{#if actions.length > 0}
		<div class="space-y-2">
			{#each actions as action, i}
				{@const blocked = isBlocked(action)}
				{@const StatusIcon = getStatusIcon(action.status)}
				<div
					class={cn(
						'flex items-start gap-3 rounded-lg border px-4 py-3 transition-colors',
						action.status === 'Terminé' && 'bg-muted/30 border-muted',
						action.status === 'En cours' && 'bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800',
						action.status === 'Pas commencé' && !blocked && 'bg-card border-border hover:border-primary/30',
						blocked && 'bg-muted/10 border-dashed border-muted-foreground/20 opacity-60'
					)}
				>
					<div class="mt-0.5 shrink-0">
						{#if blocked}
							<Lock class="size-4 text-muted-foreground/50" />
						{:else if action.status === 'Terminé'}
							<div class="flex items-center justify-center size-5 rounded-full bg-primary/10">
								<Check class="size-3.5 text-primary" />
							</div>
						{:else if action.status === 'En cours'}
							<div class="flex items-center justify-center size-5 rounded-full bg-blue-500/10">
								<Clock class="size-3.5 text-blue-500" />
							</div>
						{:else}
							<div class="size-5 rounded-full border-2 border-muted-foreground/30"></div>
						{/if}
					</div>
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2 flex-wrap">
							<span
								class={cn(
									'font-medium',
									action.status === 'Terminé' && 'line-through text-muted-foreground'
								)}
							>
								{action.title}
							</span>
							{#if action.etape}
								<span class={cn('text-xs px-2 py-0.5 rounded-full', ETAPE_COLORS[action.etape] ?? 'bg-muted text-muted-foreground')}>
									{action.etape}
								</span>
							{/if}
						</div>
						{#if action.description}
							<p class="text-sm text-muted-foreground mt-0.5">{action.description}</p>
						{/if}
						{#if action.dueDate}
							<p class="text-xs text-muted-foreground mt-1">
								Échéance : {new Date(action.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
							</p>
						{/if}
						{#if action.completedAt}
							<p class="text-xs text-muted-foreground mt-1">
								Complétée le {new Date(action.completedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
							</p>
						{/if}
					</div>
					<div class="shrink-0">
						{#if action.status === 'Pas commencé' && !blocked}
							<form method="POST" action="?/updateAction" use:enhance>
								<input type="hidden" name="actionId" value={action.id} />
								<input type="hidden" name="newStatus" value="En cours" />
								<Button variant="outline" size="sm" class="cursor-pointer text-xs">
									Commencer
								</Button>
							</form>
						{:else if action.status === 'En cours'}
							<form method="POST" action="?/updateAction" use:enhance>
								<input type="hidden" name="actionId" value={action.id} />
								<input type="hidden" name="newStatus" value="Terminé" />
								<Button variant="default" size="sm" class="cursor-pointer text-xs">
									Terminer
								</Button>
							</form>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
