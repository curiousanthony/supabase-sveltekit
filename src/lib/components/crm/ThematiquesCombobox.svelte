<script lang="ts">
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import { Label } from '$lib/components/ui/label';
	import Check from '@lucide/svelte/icons/check';
	import Plus from '@lucide/svelte/icons/plus';
	import X from '@lucide/svelte/icons/x';

	let {
		thematiques = [],
		sousthematiques = [],
		selectedThematiqueIds = $bindable<string[]>([]),
		selectedSousthematiqueIds = $bindable<string[]>([])
	}: {
		thematiques?: { id: string; name: string }[];
		sousthematiques?: { id: string; name: string; parentTopicId: string }[];
		selectedThematiqueIds?: string[];
		selectedSousthematiqueIds?: string[];
	} = $props();

	let thematiquePopoverOpen = $state(false);
	let sousthematiquePopoverOpen = $state(false);
	let thematiqueSearch = $state('');
	let sousthematiqueSearch = $state('');

	const availableSousthematiques = $derived(
		sousthematiques.filter((st) => selectedThematiqueIds.includes(st.parentTopicId))
	);

	const filteredThematiques = $derived(
		thematiques.filter((t) =>
			thematiqueSearch.trim()
				? t.name.toLowerCase().includes(thematiqueSearch.trim().toLowerCase())
				: true
		)
	);

	const filteredSousthematiques = $derived(
		availableSousthematiques.filter((st) =>
			sousthematiqueSearch.trim()
				? st.name.toLowerCase().includes(sousthematiqueSearch.trim().toLowerCase())
				: true
		)
	);

	function toggleThematique(id: string) {
		if (selectedThematiqueIds.includes(id)) {
			selectedThematiqueIds = selectedThematiqueIds.filter((tid) => tid !== id);
			const removedChildIds = sousthematiques
				.filter((st) => st.parentTopicId === id)
				.map((st) => st.id);
			selectedSousthematiqueIds = selectedSousthematiqueIds.filter(
				(sid) => !removedChildIds.includes(sid)
			);
		} else {
			selectedThematiqueIds = [...selectedThematiqueIds, id];
		}
	}

	function removeThematique(id: string) {
		selectedThematiqueIds = selectedThematiqueIds.filter((tid) => tid !== id);
		const removedChildIds = sousthematiques
			.filter((st) => st.parentTopicId === id)
			.map((st) => st.id);
		selectedSousthematiqueIds = selectedSousthematiqueIds.filter(
			(sid) => !removedChildIds.includes(sid)
		);
	}

	function toggleSousthematique(id: string) {
		if (selectedSousthematiqueIds.includes(id)) {
			selectedSousthematiqueIds = selectedSousthematiqueIds.filter((sid) => sid !== id);
		} else {
			selectedSousthematiqueIds = [...selectedSousthematiqueIds, id];
		}
	}

	function removeSousthematique(id: string) {
		selectedSousthematiqueIds = selectedSousthematiqueIds.filter((sid) => sid !== id);
	}
</script>

<div class="flex flex-col gap-3">
	<!-- Section 1: Thématiques -->
	<div class="flex flex-col gap-1.5">
		<Label>Thématiques</Label>
		<div class="flex flex-wrap items-center gap-1.5 mt-0.5">
			{#each selectedThematiqueIds as id (id)}
				{@const thematique = thematiques.find((t) => t.id === id)}
				{#if thematique}
					<span
						class="inline-flex items-center gap-1 rounded-full border bg-muted px-2 py-0.5 text-xs font-medium"
					>
						{thematique.name}
						<button
							type="button"
							onclick={() => removeThematique(id)}
							class="ml-0.5 rounded-full text-muted-foreground hover:text-foreground focus:outline-none"
							aria-label="Retirer {thematique.name}"
						>
							<X class="size-3" />
						</button>
					</span>
				{/if}
			{/each}

			{#if selectedThematiqueIds.length === 0}
				<span class="text-xs text-muted-foreground italic">Aucune thématique sélectionnée</span>
			{/if}

			<Popover.Root bind:open={thematiquePopoverOpen}>
				<Popover.Trigger>
					{#snippet child({ props })}
						<button
							{...props}
							type="button"
							class="inline-flex items-center gap-1 rounded-full border border-dashed px-2 py-0.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none"
						>
							<Plus class="size-3" />
							Ajouter une thématique...
						</button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content class="w-64 p-0" align="start">
					<Command.Root shouldFilter={false}>
						<Command.Input
							placeholder="Rechercher..."
							value={thematiqueSearch}
							oninput={(e: Event) => (thematiqueSearch = (e.target as HTMLInputElement).value)}
						/>
						<Command.List>
							{#if filteredThematiques.length === 0}
								<Command.Empty>Aucune thématique trouvée.</Command.Empty>
							{/if}
							{#each filteredThematiques as thematique (thematique.id)}
								<Command.Item
									value={thematique.id}
									onSelect={() => toggleThematique(thematique.id)}
								>
									<Check
										class="mr-2 size-4 {selectedThematiqueIds.includes(thematique.id)
											? 'opacity-100'
											: 'opacity-0'}"
									/>
									{thematique.name}
								</Command.Item>
							{/each}
						</Command.List>
					</Command.Root>
				</Popover.Content>
			</Popover.Root>
		</div>
	</div>

	<!-- Section 2: Sous-thématiques (only when at least one thématique is selected) -->
	{#if selectedThematiqueIds.length > 0}
		<div class="flex flex-col gap-1.5">
			<Label>Sous-thématiques</Label>

			{#if availableSousthematiques.length === 0}
				<p class="text-xs text-muted-foreground italic mt-0.5">
					Aucune sous-thématique disponible pour les thématiques sélectionnées.
				</p>
			{:else}
				<div class="flex flex-wrap items-center gap-1.5 mt-0.5">
					{#each selectedSousthematiqueIds as id (id)}
						{@const sousthematique = sousthematiques.find((st) => st.id === id)}
						{#if sousthematique}
							<span
								class="inline-flex items-center gap-1 rounded-full border bg-muted px-2 py-0.5 text-xs font-medium"
							>
								{sousthematique.name}
								<button
									type="button"
									onclick={() => removeSousthematique(id)}
									class="ml-0.5 rounded-full text-muted-foreground hover:text-foreground focus:outline-none"
									aria-label="Retirer {sousthematique.name}"
								>
									<X class="size-3" />
								</button>
							</span>
						{/if}
					{/each}

					<Popover.Root bind:open={sousthematiquePopoverOpen}>
						<Popover.Trigger>
							{#snippet child({ props })}
								<button
									{...props}
									type="button"
									class="inline-flex items-center gap-1 rounded-full border border-dashed px-2 py-0.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none"
								>
									<Plus class="size-3" />
									Ajouter une sous-thématique...
								</button>
							{/snippet}
						</Popover.Trigger>
						<Popover.Content class="w-72 p-0" align="start">
							<Command.Root shouldFilter={false}>
								<Command.Input
									placeholder="Rechercher..."
									value={sousthematiqueSearch}
									oninput={(e: Event) =>
										(sousthematiqueSearch = (e.target as HTMLInputElement).value)}
								/>
								<Command.List>
									{#if filteredSousthematiques.length === 0}
										<Command.Empty>Aucune sous-thématique trouvée.</Command.Empty>
									{/if}
									{#each filteredSousthematiques as sousthematique (sousthematique.id)}
										<Command.Item
											value={sousthematique.id}
											onSelect={() => toggleSousthematique(sousthematique.id)}
										>
											<Check
												class="mr-2 size-4 {selectedSousthematiqueIds.includes(sousthematique.id)
													? 'opacity-100'
													: 'opacity-0'}"
											/>
											{sousthematique.name}
										</Command.Item>
									{/each}
								</Command.List>
							</Command.Root>
						</Popover.Content>
					</Popover.Root>
				</div>
			{/if}
		</div>
	{/if}
</div>
