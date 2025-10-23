<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let { pageName } = $derived(data);
</script>

<svelte:head>
	<title>{pageName}</title>
</svelte:head>
