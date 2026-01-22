<script lang="ts">
	import * as CardCheckbox from '$lib/components/ui/card-checkbox';
	import UsersIcon from '@lucide/svelte/icons/users';
	import MonitorIcon from '@lucide/svelte/icons/monitor';
	import LayoutIcon from '@lucide/svelte/icons/layout';

	let multipleValues = $state(['presentiel']);
	let singleValue = $state(['presentiel']);
</script>

<div class="container mx-auto py-10">
	<h1 class="mb-6 text-2xl font-bold">CardCheckbox Modes</h1>

	<div class="grid gap-10">
		<section>
			<h2 class="mb-2 text-xl font-semibold">Multiple Selection (Default)</h2>
			<p class="mb-4 text-sm text-muted-foreground">Selected: {JSON.stringify(multipleValues)}</p>

			<CardCheckbox.Group
				bind:value={multipleValues}
				class="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2"
			>
				<CardCheckbox.Root
					value="presentiel"
					title="Présentiel"
					subtitle="Locaux de l'organisme ou chez le client."
					icon={UsersIcon}
				/>
				<CardCheckbox.Root
					value="distanciel"
					title="Distanciel"
					subtitle="E-learning synchrone ou asynchrone."
					icon={MonitorIcon}
				/>
			</CardCheckbox.Group>
		</section>

		<hr />

		<section>
			<h2 class="mb-2 text-xl font-semibold">Unique Selection (Hides Indicator)</h2>
			<p class="mb-4 text-sm text-muted-foreground">
				In this mode (<code>multiple={'{false}'}</code>), the checkbox indicator is hidden for a
				cleaner UI. Selected: {JSON.stringify(singleValue)}
			</p>

			<CardCheckbox.Group
				bind:value={singleValue}
				multiple={false}
				class="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2"
			>
				<CardCheckbox.Root
					value="presentiel"
					title="Présentiel"
					subtitle="Locaux de l'organisme ou chez le client."
					icon={UsersIcon}
				/>
				<CardCheckbox.Root
					value="distanciel"
					title="Distanciel"
					subtitle="E-learning synchrone ou asynchrone."
					icon={MonitorIcon}
				/>
			</CardCheckbox.Group>
		</section>
	</div>
</div>
