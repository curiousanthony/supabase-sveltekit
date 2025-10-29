<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import ChevronLeft from '@tabler/icons-svelte/icons/chevron-left';
</script>

<Button variant="secondary" size="lg" class="w-fit text-sm" onclick={() => history.back()}>
	<ChevronLeft />
	Retour
</Button>
