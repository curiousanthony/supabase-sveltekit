<script lang="ts">
	import type { PageProps } from './$types';
	import * as Card from '$lib/components/ui/card/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Wallet from '@lucide/svelte/icons/wallet';

	let { data }: PageProps = $props();

	const formation = $derived(data?.formation);
	const tjm = $derived(formation?.tjmFormateur != null ? Number(formation.tjmFormateur) : null);
	const montant = $derived(formation?.montantAccorde != null ? Number(formation.montantAccorde) : null);
	const duree = $derived(formation?.duree ?? 0);
	const totalFormateurCost = $derived(tjm != null && duree != null ? tjm * (duree / 7) : null);
	const margin = $derived(montant != null && totalFormateurCost != null ? montant - totalFormateurCost : null);
</script>

<div class="space-y-4">
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Wallet class="size-4" />
				Résumé financier
			</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<div class="rounded-lg border p-4">
					<p class="text-sm text-muted-foreground">Montant accordé</p>
					<p class="mt-1 text-2xl font-semibold tabular-nums">
						{montant != null ? montant.toLocaleString('fr-FR') + ' €' : '—'}
					</p>
					{#if formation?.financementAccorde}
						<Badge variant="default" class="mt-1 text-xs">Accordé</Badge>
					{:else}
						<Badge variant="secondary" class="mt-1 text-xs">En attente</Badge>
					{/if}
				</div>
				<div class="rounded-lg border p-4">
					<p class="text-sm text-muted-foreground">TJM Formateur</p>
					<p class="mt-1 text-2xl font-semibold tabular-nums">
						{tjm != null ? tjm.toLocaleString('fr-FR') + ' €' : '—'}
					</p>
					{#if totalFormateurCost != null}
						<p class="mt-1 text-xs text-muted-foreground">
							Coût total : {totalFormateurCost.toLocaleString('fr-FR')} €
						</p>
					{/if}
				</div>
				<div class="rounded-lg border p-4">
					<p class="text-sm text-muted-foreground">Marge</p>
					<p
						class="mt-1 text-2xl font-semibold tabular-nums"
						class:text-green-600={margin != null && margin > 0}
						class:text-red-600={margin != null && margin < 0}
					>
						{margin != null ? margin.toLocaleString('fr-FR') + ' €' : '—'}
					</p>
				</div>
			</div>

			{#if formation?.typeFinancement}
				<div class="flex items-center gap-2 text-sm">
					<span class="text-muted-foreground">Type de financement :</span>
					<Badge variant="outline">{formation.typeFinancement}</Badge>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
