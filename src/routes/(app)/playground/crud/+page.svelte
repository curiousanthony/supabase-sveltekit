<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let { pageName, users } = $derived(data);

	$inspect(users);
</script>

<svelte:head>
	<title>{pageName}</title>
</svelte:head>

{#each users as user}
	<p>
		{user.firstName}
		{user.lastName}, Email: {user.email}, ID: {user.id}, Created at: {new Date(
			user.createdAt
		).toLocaleString('fr-FR')}
	</p>
{/each}
