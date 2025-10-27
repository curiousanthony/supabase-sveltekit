<script lang="ts">
	import type { PageProps } from './$types';

	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Progress from '$lib/components/ui/progress/progress.svelte';
	import Hourglass from '@tabler/icons-svelte/icons/hourglass';
	import HourglassFilled from '@tabler/icons-svelte/icons/hourglass-filled';
	import HourglassEmpty from '@tabler/icons-svelte/icons/hourglass-empty';
	import UserFilled from '@tabler/icons-svelte/icons/user-filled';
	import MapPinFilled from '@tabler/icons-svelte/icons/map-pin-filled';
	import { IconCardsFilled, IconHourglassFilled, IconManFilled } from '@tabler/icons-svelte';
	import CardsFilled from '@tabler/icons-svelte/icons/cards-filled';
	import FormationCard from '$lib/components/custom/formationCard.svelte';

	let { data }: PageProps = $props();
	let { formations, pageName } = $derived(data);

	function filterFormationsByStatus(status: string) {
		return formations.filter((formation) => formation.statut === status);
	}
</script>

<svelte:head>
	<title>{pageName}</title>
</svelte:head>

<h1>Liste des formations</h1>

<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
	{#each formations as formation}
		<FormationCard {formation} />
	{/each}
</div>
