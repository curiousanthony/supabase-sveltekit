<script lang="ts">
	import type { PageProps } from './$types';
	import * as Card from '$lib/components/ui/card/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import BackButton from '../../../../lib/components/custom/backButton.svelte';

	let { data }: PageProps = $props();
	let { formation } = $derived(data);
</script>

<BackButton />

<!-- Page de la formation : {data.formation.name} -->
<!-- Page de la formation (devra avoir data.formation.name ou id) -->

<!-- Create the page to see all info related to the current "formation" -->
<Card.Root>
	<Card.Header>
		<Card.Title>{formation?.name}</Card.Title>
		<Badge class="" variant="secondary">{formation?.thematique?.name}</Badge>
		<Card.Description>{formation?.description}</Card.Description>
		<Card.Action class="text-muted-foreground">#{formation?.idInWorkspace}</Card.Action>
	</Card.Header>
	<Card.Content>
		<p>Durée : {formation?.duree} heures</p>
		<p>Modalité : {formation?.modalite}</p>
		<p>Thématique : {formation?.thematique?.name}</p>
		<p>Statut : {formation?.statut}</p>
		{#if formation?.modules?.length > 0}
			Liste de modules from "formation.modules"
			<ul>
				{#each formation?.modules as module}
					<li>{module.name}</li>
				{/each}
			</ul>
		{/if}
	</Card.Content>
	<!-- <Card.Footer>
		<p>Card Footer</p>
	</Card.Footer> -->
</Card.Root>
