<script lang="ts">
	import type { PageProps } from './$types';
	import BackButton from '$lib/components/custom/backButton.svelte';
	import { page } from '$app/state';

	let { data }: PageProps = $props();
	let { header, users } = $derived(data);

	$inspect(users);
</script>

<svelte:head>
	<title>{header.pageName}</title>
</svelte:head>

<BackButton />

{#each users as user}
	<p>
		{user.firstName}
		{user.lastName}, Email: {user.email}, ID: {user.id}, Created at: {new Date(
			user.createdAt
		).toLocaleString('fr-FR')}
	</p>
{/each}
