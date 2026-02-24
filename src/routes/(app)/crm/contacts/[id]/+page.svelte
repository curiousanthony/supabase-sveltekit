<script lang="ts">
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
	const name = $derived([data.contact?.firstName, data.contact?.lastName].filter(Boolean).join(' ') || 'Contact');
</script>

<svelte:head>
	<title>{name}</title>
</svelte:head>

<div class="space-y-4">
	<h1 class="text-2xl font-bold">{name}</h1>
	{#if data.contact?.email}
		<p><a href="mailto:{data.contact.email}" class="text-primary hover:underline">{data.contact.email}</a></p>
	{/if}
	{#if data.contact?.poste}
		<p class="text-muted-foreground">Poste : {data.contact.poste}</p>
	{/if}
	{#if data.contact?.contactCompanies?.length}
		<p class="text-muted-foreground">
			Entreprise(s) : {data.contact.contactCompanies.map((cc) => cc.company?.name).filter(Boolean).join(', ')}
		</p>
	{/if}
</div>
