<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import * as Button from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Copy from '@lucide/svelte/icons/copy';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';

	interface Props {
		id: string;
		onDeleteClick: (id: string) => void;
		onDeleteComplete?: () => void;
	}

	let { id, onDeleteClick, onDeleteComplete }: Props = $props();
</script>

<form
	id="delete-module-{id}"
	method="POST"
	action="?/delete"
	use:enhance={() =>
		async ({ update }) => {
			await update();
			onDeleteComplete?.();
		}
	}
	class="hidden"
	aria-hidden="true"
>
	<input type="hidden" name="id" value={id} />
</form>
<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button.Root
				{...props}
				variant="ghost"
				size="icon"
				class="relative size-8 p-0"
			>
				<span class="sr-only">Ouvrir le menu</span>
				<MoreHorizontal class="size-4" />
			</Button.Root>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end">
		<DropdownMenu.Item onclick={() => goto(resolve(`/bibliotheque/modules/${id}`))}>
			<Pencil class="mr-2 size-4" />
			Modifier
		</DropdownMenu.Item>
		<form method="POST" action="?/duplicate" use:enhance>
			<input type="hidden" name="id" value={id} />
			<DropdownMenu.Item onSelect={(e) => e.preventDefault()}>
				<button type="submit" class="flex w-full cursor-pointer items-center">
					<Copy class="mr-2 size-4" />
					Dupliquer
				</button>
			</DropdownMenu.Item>
		</form>
		<DropdownMenu.Separator />
		<DropdownMenu.Item variant="destructive" onclick={() => onDeleteClick(id)}>
			<Trash2 class="mr-2 size-4" />
			Supprimer
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
