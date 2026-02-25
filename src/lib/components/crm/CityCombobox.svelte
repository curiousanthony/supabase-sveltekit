<script lang="ts">
	import { onDestroy } from 'svelte';
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import * as Select from '$lib/components/ui/select';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Check from '@lucide/svelte/icons/check';

	let currentController: AbortController | null = null;

	const FRENCH_REGIONS = [
		'Auvergne-Rhône-Alpes',
		'Bourgogne-Franche-Comté',
		'Bretagne',
		'Centre-Val de Loire',
		'Corse',
		'Grand Est',
		'Hauts-de-France',
		'Île-de-France',
		'Normandie',
		'Nouvelle-Aquitaine',
		'Occitanie',
		'Pays de la Loire',
		"Provence-Alpes-Côte d'Azur",
		'Guadeloupe',
		'Martinique',
		'Guyane',
		'La Réunion',
		'Mayotte'
	];

	let {
		city = '',
		region = '',
		onSelect
	}: {
		city?: string;
		region?: string;
		onSelect: (city: string, region: string) => void;
	} = $props();

	let open = $state(false);
	let search = $state('');
	let suggestions = $state<{ code: string; nom: string; region: { nom: string } }[]>([]);
	let loading = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	function onSearchInput(value: string) {
		search = value;
		if (debounceTimer) clearTimeout(debounceTimer);
		if (!value.trim()) {
			suggestions = [];
			return;
		}
		debounceTimer = setTimeout(() => fetchCities(value), 300);
	}

	async function fetchCities(q: string) {
		currentController?.abort();
		currentController = new AbortController();
		const controller = currentController;
		loading = true;
		try {
			const res = await fetch(
				`https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(q)}&fields=code,nom,region&boost=population&limit=10`,
				{ signal: controller.signal }
			);
			if (res.ok) {
				suggestions = await res.json();
			} else {
				suggestions = [];
			}
		} catch (e) {
			if (e instanceof DOMException && e.name === 'AbortError') return;
			suggestions = [];
		} finally {
			if (!controller.signal.aborted) loading = false;
		}
	}

	onDestroy(() => {
		if (debounceTimer) {
			clearTimeout(debounceTimer);
			debounceTimer = null;
		}
		currentController?.abort();
		currentController = null;
	});

	function handleSelect(cityName: string, regionName: string) {
		onSelect(cityName, regionName);
		search = '';
		suggestions = [];
		open = false;
	}

	function handleRegionSelect(regionName: string) {
		onSelect(city, regionName);
	}
</script>

<div class="grid grid-cols-2 gap-3">
	<!-- City field with geo search -->
	<div class="flex flex-col gap-0.5">
		<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ville</span>
		<Popover.Root bind:open>
			<Popover.Trigger>
				{#snippet child({ props })}
					<button
						{...props}
						type="button"
						class="flex h-8 w-full items-center gap-1.5 rounded-md border-transparent bg-transparent px-2 text-left text-sm shadow-none hover:border-input hover:bg-muted/50 focus:outline-none focus:border-input focus:bg-muted/50 transition-colors"
					>
						<MapPin class="size-3 text-muted-foreground shrink-0" />
						{#if city}
							<span class="truncate">{city}</span>
						{:else}
							<span class="text-muted-foreground">Ville...</span>
						{/if}
					</button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-72 p-0" align="start">
				<Command.Root shouldFilter={false}>
					<Command.Input
						placeholder="Rechercher une ville..."
						value={search}
						oninput={(e: Event) => onSearchInput((e.target as HTMLInputElement).value)}
					/>
					<Command.List>
						{#if loading}
							<div class="py-3 text-center text-sm text-muted-foreground">Chargement...</div>
						{:else if search && suggestions.length === 0}
							<Command.Empty>Aucune ville trouvée.</Command.Empty>
						{:else if !search && city}
							<Command.Item value="clear" onSelect={() => handleSelect('', '')}>
								<span class="text-muted-foreground">Effacer la ville</span>
							</Command.Item>
						{/if}
						{#each suggestions as suggestion (suggestion.code)}
							<Command.Item
								value={suggestion.code}
								onSelect={() => handleSelect(suggestion.nom, suggestion.region?.nom ?? '')}
							>
								<Check class={`mr-2 size-4 ${city === suggestion.nom ? 'opacity-100' : 'opacity-0'}`} />
								<span>{suggestion.nom}</span>
								{#if suggestion.region?.nom}
									<span class="ml-auto text-xs text-muted-foreground">{suggestion.region.nom}</span>
								{/if}
							</Command.Item>
						{/each}
					</Command.List>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>
	</div>

	<!-- Region field: auto-filled when city is set, otherwise a select -->
	<div class="flex flex-col gap-0.5">
		<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Région</span>
		{#if city && region}
			<div class="flex h-8 items-center gap-1.5 px-2 text-sm text-muted-foreground">
				<span class="truncate">{region}</span>
			</div>
		{:else}
			<Select.Root
				type="single"
				value={region}
				onValueChange={(v) => handleRegionSelect(v)}
			>
				<Select.Trigger class="h-8 border-transparent bg-transparent px-2 text-sm shadow-none hover:border-input hover:bg-muted/50 focus:border-input data-[state=open]:border-input data-[state=open]:bg-muted/50 transition-colors">
					{#if region}{region}{:else}<span class="text-muted-foreground">Région...</span>{/if}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="">—</Select.Item>
					{#each FRENCH_REGIONS as r (r)}
						<Select.Item value={r}>{r}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		{/if}
	</div>
</div>
