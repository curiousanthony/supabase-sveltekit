<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import ChevronLeft from '@tabler/icons-svelte/icons/chevron-left';
	import { goto } from '$app/navigation';

	type Props = {
		href?: string;
		label?: string;
	};

	let { href, label = 'Retour' }: Props = $props();

	function handleClick() {
		if (href) {
			goto(href);
			return;
		}
		history.back();
	}
</script>

<Button variant="ghost" size="sm" class="w-fit text-sm" onclick={handleClick}>
	<ChevronLeft class="mr-1" />
	<span class="hidden sm:inline">{label}</span>
</Button>
