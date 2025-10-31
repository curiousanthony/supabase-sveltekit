<script lang="ts">
	import BackButton from '$lib/components/custom/backButton.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let { header } = $derived(data);
</script>

<BackButton />

<p>Test</p>

<Button href="/playground/crud">CRUD</Button>
