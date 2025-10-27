<script lang="ts">
	import type { PageProps } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import ChevronLeft from '@tabler/icons-svelte/icons/chevron-left';

	let { data }: PageProps = $props();
</script>

<Button variant="secondary" size="lg" class="w-fit text-sm" onclick={() => history.back()}>
	<ChevronLeft />
	Retour
</Button>

<!-- Page de la formation : {data.formation.name} -->
Page de la formation (devra avoir data.formation.name ou id)
