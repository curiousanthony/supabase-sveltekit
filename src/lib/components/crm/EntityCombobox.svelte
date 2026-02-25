<script lang="ts">
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import Plus from '@lucide/svelte/icons/plus';

	type Item = { id: string; label: string };

	let {
		items = [],
		linkedIds = [],
		placeholder = 'Rechercher...',
		onLink,
		loading = false
	}: {
		items: Item[];
		linkedIds: string[];
		placeholder?: string;
		onLink: (id: string) => void;
		loading?: boolean;
	} = $props();

	let open = $state(false);
	let search = $state('');

	const available = $derived(
		items.filter((item) => !linkedIds.includes(item.id))
	);

	const filtered = $derived(
		search.trim()
			? available.filter((item) =>
					item.label.toLowerCase().includes(search.toLowerCase())
				)
			: available
	);

	function handleSelect(id: string) {
		onLink(id);
		open = false;
		search = '';
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<button
				{...props}
				class="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
				aria-label={placeholder}
				disabled={loading || available.length === 0}
			>
				<Plus class="size-3.5" />
			</button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-64 p-0" align="end">
		<Command.Root shouldFilter={false}>
			<Command.Input
				{placeholder}
				bind:value={search}
			/>
			<Command.List>
				<Command.Empty>Aucun résultat.</Command.Empty>
				{#each filtered as item (item.id)}
					<Command.Item
						value={item.id}
						onSelect={() => handleSelect(item.id)}
					>
						{item.label}
					</Command.Item>
				{/each}
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
