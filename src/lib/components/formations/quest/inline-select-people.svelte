<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import UserCheck from '@lucide/svelte/icons/user-check';
	import Users from '@lucide/svelte/icons/users';

	interface Props {
		completed: boolean;
		peopleType: 'formateur' | 'apprenant';
		people: { id: string; name: string; email?: string }[];
		currentSelection?: string | null;
		onSelect: (personId: string) => Promise<void>;
	}

	let { completed, peopleType, people, currentSelection = null, onSelect }: Props = $props();

	let saving = $state(false);

	const selectedPerson = $derived(people.find((p) => p.id === currentSelection));

	const emptyLabel = $derived(
		peopleType === 'formateur' ? 'Aucun formateur disponible' : 'Aucun apprenant disponible'
	);

	function formatOption(person: { name: string; email?: string }): string {
		return person.email ? `${person.name} (${person.email})` : person.name;
	}

	async function handleChange(e: Event) {
		const value = (e.currentTarget as HTMLSelectElement).value;
		if (!value) return;
		saving = true;
		try {
			await onSelect(value);
		} finally {
			saving = false;
		}
	}
</script>

{#if completed}
	<div class="flex items-center gap-1.5 text-sm text-green-600">
		<UserCheck class="size-3.5" />
		<span>Sélectionné{#if selectedPerson}&ensp;—&ensp;{selectedPerson.name}{/if}</span>
	</div>
{:else if people.length === 0}
	<div class="flex items-center gap-1.5 text-sm text-muted-foreground">
		<Users class="size-3.5" />
		<span>{emptyLabel}</span>
	</div>
{:else}
	<div class="flex items-center gap-2">
		{#if saving}
			<Loader2 class="size-3.5 shrink-0 animate-spin text-muted-foreground" />
		{:else if currentSelection}
			<Check class="size-3.5 shrink-0 text-green-500" />
		{:else}
			<Users class="size-3.5 shrink-0 text-muted-foreground" />
		{/if}

		<select
			class="min-w-0 flex-1 rounded-md border px-2 py-1 text-sm outline-none transition-colors
				{currentSelection
				? 'border-green-300 bg-green-50 text-green-800 focus:border-green-500 focus:ring-1 focus:ring-green-500'
				: 'border-input bg-background text-foreground focus:border-ring focus:ring-1 focus:ring-ring'}"
			value={currentSelection ?? ''}
			onchange={handleChange}
			disabled={saving}
		>
			<option value="" disabled>Choisir...</option>
			{#each people as person (person.id)}
				<option value={person.id}>{formatOption(person)}</option>
			{/each}
		</select>
	</div>
{/if}
