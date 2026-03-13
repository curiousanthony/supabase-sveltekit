<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import * as Button from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Copy from '@lucide/svelte/icons/copy';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';

	const ALLOWED_URL_SCHEMES = ['http:', 'https:', 'mailto:'] as const;
	type SafeUrl =
		| { safe: true; href: string; display: string }
		| { safe: false; display: string };

	function parseAndValidateUrl(url: string | null): SafeUrl | null {
		if (!url || typeof url !== 'string') return null;
		const trimmed = url.trim();
		if (!trimmed) return null;
		try {
			const parsed = new URL(trimmed);
			const scheme = parsed.protocol;
			if (!(ALLOWED_URL_SCHEMES as readonly string[]).includes(scheme)) {
				return {
					safe: false,
					display: 'unsafe: ' + (trimmed.length > 50 ? trimmed.slice(0, 50) + '…' : trimmed)
				};
			}
			const display =
				scheme === 'mailto:'
					? (parsed.pathname || parsed.href)
					: (parsed.hostname || parsed.href);
			return { safe: true, href: parsed.href, display };
		} catch {
			return { safe: false, display: 'invalid URL' };
		}
	}

	interface Props {
		id: string;
		urlTest: string | null;
		onDeleteClick: (id: string) => void;
		onDeleteComplete?: () => void;
	}

	let { id, urlTest, onDeleteClick, onDeleteComplete }: Props = $props();

	const urlInfo = $derived(parseAndValidateUrl(urlTest));
</script>

<form
	id="delete-questionnaire-{id}"
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
		<DropdownMenu.Item onclick={() => goto(resolve(`/bibliotheque/questionnaires/${id}`))}>
			<Pencil class="mr-2 size-4" />
			Modifier
		</DropdownMenu.Item>
		{#if urlInfo?.safe}
			<DropdownMenu.Item onclick={() => window.open(urlInfo.href, '_blank', 'noopener,noreferrer')}>
				<ExternalLink class="mr-2 size-4" />
				Ouvrir le lien
			</DropdownMenu.Item>
		{:else if urlInfo}
			<DropdownMenu.Item disabled>
				<ExternalLink class="mr-2 size-4" />
				Ouvrir le lien
				<span class="ml-1 text-muted-foreground">(non sécurisé)</span>
			</DropdownMenu.Item>
		{/if}
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
