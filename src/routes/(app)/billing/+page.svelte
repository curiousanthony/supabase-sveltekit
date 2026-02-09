<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let { pageName } = $derived(data);
</script>

<svelte:head>
	<title>{pageName}</title>
</svelte:head>

<h1 class="text-2xl font-bold">{pageName}</h1>
<p class="text-muted-foreground">
	Vue d'ensemble de l'abonnement de l'espace. Les administrateurs pourront consulter l'abonnement en cours et passer au plan supérieur.
</p>
