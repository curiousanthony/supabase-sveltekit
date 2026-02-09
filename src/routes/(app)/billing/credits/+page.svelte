<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let pageName = $derived(data.pageName ?? 'Crédits');
</script>

<svelte:head>
	<title>{pageName}</title>
</svelte:head>

<h1 class="text-2xl font-bold">{pageName}</h1>
<p class="text-muted-foreground">
	Solde de crédits, utilisation récente et achat de crédits. Contenu à venir.
</p>

<div class="mt-4 rounded-lg border bg-card p-4">
	<p class="font-medium">Solde actuel (exemple)</p>
	<p class="text-2xl font-bold text-primary">1350 crédits</p>
</div>
