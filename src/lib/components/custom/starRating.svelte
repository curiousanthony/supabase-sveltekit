<script lang="ts">
	import { IconStarFilled, IconStar } from '@tabler/icons-svelte';

	let { ratingValue, size }: { ratingValue: number; size: number } = $props();

	// Clamp to [0, 5] and round to an integer so Array(n) never throws RangeError
	const validatedRating = $derived(Math.round(Math.min(5, Math.max(0, ratingValue || 0))));

	// 2. Derived Arrays: Calculated using $derived()
	// Array for filled stars: length is equal to 'validatedRating'
	const filledStars = $derived(Array(validatedRating).fill(0));

	// Array for empty stars: length is equal to '5 - validatedRating'
	const emptyStars = $derived(Array(5 - validatedRating).fill(0));
</script>

<div class="flex items-center">
	{#each filledStars as _, i}
		<IconStarFilled {size} class="text-yellow-400" />
	{/each}

	{#each emptyStars as _, i}
		<IconStar {size} class="text-gray-300" />
	{/each}
</div>

<!-- <p>{ratingValue} / 5</p> -->
