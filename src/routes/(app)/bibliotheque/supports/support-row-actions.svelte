<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Button from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';

	interface Props {
		id: string;
	}

	let { id }: Props = $props();
</script>

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
		<form method="POST" action="?/delete" use:enhance>
			<input type="hidden" name="id" value={id} />
			<DropdownMenu.Item
				class="text-destructive"
				onSelect={(e) => e.preventDefault()}
			>
				<button type="submit" class="flex w-full items-center">
					<Trash2 class="mr-2 size-4" />
					Supprimer
				</button>
			</DropdownMenu.Item>
		</form>
	</DropdownMenu.Content>
</DropdownMenu.Root>
