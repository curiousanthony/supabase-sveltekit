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
	<p>{user.firstName} {user.lastName}, Rôle : {user.role}, Email : {user.email}, ID : {user.id}</p>
{/each}
