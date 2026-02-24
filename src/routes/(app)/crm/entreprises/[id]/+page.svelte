<script lang="ts">
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.company?.name ?? 'Entreprise'}</title>
</svelte:head>

<div class="space-y-4">
	<h1 class="text-2xl font-bold">{data.company?.name}</h1>
	{#if data.company?.industry}
		<p class="text-muted-foreground">Industrie : {data.company.industry}</p>
	{/if}
	{#if data.company?.city}
		<p class="text-muted-foreground">Ville : {data.company.city}</p>
	{/if}
</div>
