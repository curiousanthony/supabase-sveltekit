<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let { pageName } = $derived(data);
</script>

<svelte:head>
	<title>{pageName}</title>
</svelte:head>

<Button href="/contacts/formateurs">Formateurs</Button>
<p>Clients</p>
<p>Apprenants</p>
