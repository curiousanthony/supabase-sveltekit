<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Pencil from '@lucide/svelte/icons/pencil';

	interface Props {
		field: 'prerequis' | 'publicVise';
		label: string;
		placeholder: string;
		current: string | null;
		onSave: (value: string) => void | Promise<void>;
	}

	let { field, label, placeholder, current, onSave }: Props = $props();

	let isEditing = $state(false);
	let draft = $state('');
	let textarea = $state<HTMLTextAreaElement | null>(null);

	function startEdit() {
		draft = current ?? '';
		isEditing = true;
		queueMicrotask(() => textarea?.focus());
	}

	function cancel() {
		draft = '';
		isEditing = false;
	}

	async function save() {
		const next = draft.trim();
		const prev = (current ?? '').trim();
		if (next === prev) {
			isEditing = false;
			return;
		}
		await onSave(next);
		isEditing = false;
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			cancel();
		} else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
			e.preventDefault();
			void save();
		}
	}
</script>

<div
	class="flex flex-col gap-2"
	data-preflight-target={field}
	id="preflight-{field}"
>
	<div class="flex items-center justify-between gap-2">
		<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
			{label}
		</span>
		{#if !isEditing}
			<Button
				type="button"
				variant="ghost"
				size="sm"
				class="h-7 gap-1 px-2 text-xs"
				onclick={startEdit}
			>
				<Pencil class="size-3" />
				{current ? 'Modifier' : 'Renseigner'}
			</Button>
		{/if}
	</div>

	{#if isEditing}
		<textarea
			bind:this={textarea}
			bind:value={draft}
			onkeydown={onKeydown}
			rows={4}
			{placeholder}
			class="min-h-[6rem] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
			style="field-sizing: content;"
		></textarea>
		<div class="flex items-center justify-end gap-2">
			<Button type="button" variant="outline" size="sm" onclick={cancel}>Annuler</Button>
			<Button type="button" size="sm" onclick={save}>Enregistrer</Button>
		</div>
		<p class="text-[11px] text-muted-foreground">
			Astuce : <kbd class="rounded border px-1">⌘ Entrée</kbd> pour enregistrer ·
			<kbd class="rounded border px-1">Échap</kbd> pour annuler
		</p>
	{:else if current && current.trim().length > 0}
		<button
			type="button"
			class="cursor-text whitespace-pre-wrap rounded-md border border-transparent bg-muted/30 px-3 py-2 text-left text-sm transition-colors hover:border-input hover:bg-muted/50"
			onclick={startEdit}
		>
			{current}
		</button>
	{:else}
		<button
			type="button"
			class="cursor-text rounded-md border border-dashed border-input/60 bg-background px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/30"
			onclick={startEdit}
		>
			{placeholder}
		</button>
	{/if}
</div>
