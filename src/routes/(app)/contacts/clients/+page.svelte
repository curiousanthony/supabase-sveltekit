<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let pageName = $derived(data.pageName ?? 'Clients');
</script>

<svelte:head>
	<title>{pageName}</title>
</svelte:head>

<h1 class="text-2xl font-bold">{pageName}</h1>
<p class="text-muted-foreground">Gestion des clients. Contenu à venir.</p>
