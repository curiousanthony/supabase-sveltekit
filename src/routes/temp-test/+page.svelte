<script lang="ts">
	import { CardCheckbox, CardCheckboxGroup } from '$lib/components/ui/card-checkbox';
	import { Tent, Sun, Moon } from '@lucide/svelte';

	let individualChecked = $state(false);
	let groupValues = $state(['item1']);
</script>

<div class="mx-auto max-w-2xl space-y-8 p-8">
	<h1 class="text-2xl font-bold">CardCheckbox Test Page</h1>

	<section class="space-y-4">
		<h2 class="text-lg font-semibold">Individual Checkboxes (Layout Alignment)</h2>
		<div class="grid gap-4">
			<CardCheckbox
				title="With Icon"
				subtitle="Check indicator should be right-aligned"
				icon={Tent}
				checked={individualChecked}
			/>

			<CardCheckbox
				title="Without Icon"
				subtitle="Check indicator should STILL be right-aligned (ml-auto)"
				checked={individualChecked}
			/>
		</div>
	</section>

	<section class="space-y-4">
		<h2 class="text-lg font-semibold">Group Checkboxes (Context Verification)</h2>
		<p class="text-sm text-muted-foreground">Selected values: {groupValues.join(', ')}</p>
		<CardCheckboxGroup bind:value={groupValues}>
			<CardCheckbox value="item1" title="Item 1" subtitle="Option within a group" icon={Sun} />
			<CardCheckbox value="item2" title="Item 2" subtitle="Another option without icon" />
			<CardCheckbox value="item3" title="Item 3" subtitle="Third option with icon" icon={Moon} />
		</CardCheckboxGroup>
	</section>
</div>
