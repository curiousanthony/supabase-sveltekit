<script lang="ts">
	import type { PageProps } from './$types';

	// import { Button } from '$lib/components/ui/button/index.js';
	// import { Label } from '$lib/components/ui/label/index.js';
	// import { Input } from '$lib/components/ui/input/index.js';
	// import * as Card from '$lib/components/ui/card/index.js';
	// import Badge from '$lib/components/ui/badge/badge.svelte';
	// import Progress from '$lib/components/ui/progress/progress.svelte';
	// import Hourglass from '@tabler/icons-svelte/icons/hourglass';
	// import HourglassFilled from '@tabler/icons-svelte/icons/hourglass-filled';
	// import HourglassEmpty from '@tabler/icons-svelte/icons/hourglass-empty';
	// import UserFilled from '@tabler/icons-svelte/icons/user-filled';
	// import MapPinFilled from '@tabler/icons-svelte/icons/map-pin-filled';
	// import { IconCardsFilled, IconHourglassFilled, IconManFilled } from '@tabler/icons-svelte';
	// import CardsFilled from '@tabler/icons-svelte/icons/cards-filled';
	import FormationCard from '$lib/components/custom/formationCard.svelte';
	// import BackButton from '$lib/components/custom/backButton.svelte';

	let { data }: PageProps = $props();
	let { formations, pageName } = $derived(data);

	function filterFormationsByStatus(status: string) {
		return formations.filter((formation) => formation.statut === status);
	}
</script>

<svelte:head>
	<title>{pageName}</title>
</svelte:head>

<!-- <BackButton /> -->

<h1 class="text-2xl font-bold">Liste des formations</h1>

<!-- Make a Kanban board with the formations status "En attente", "En cours", "Terminée" -->

<div class="grid grid-cols-1 gap-4 md:grid-cols-1 lg:grid-cols-3">
	{#each ['En attente', 'En cours', 'Terminée'] as status}
		<div class="flex flex-col gap-2 rounded-lg bg-accent p-4">
			<h2 class="text-lg font-semibold">{status}</h2>
			{#each filterFormationsByStatus(status) as formation}
				<FormationCard {formation} />
			{/each}
		</div>
	{/each}
</div>

<!-- <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
	{#each formations as formation}
		<FormationCard {formation} />
	{/each}
</div> -->
