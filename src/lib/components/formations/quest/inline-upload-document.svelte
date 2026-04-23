<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Upload from '@lucide/svelte/icons/upload';
	import FileIcon from '@lucide/svelte/icons/file';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Check from '@lucide/svelte/icons/check';
	import Loader2 from '@lucide/svelte/icons/loader-2';

	interface Props {
		completed: boolean;
		acceptedFileTypes?: string[] | null;
		label?: string;
		subActionId: string;
		existingDocument?: { id: string; fileName: string; fileSize: number } | null;
		onUpload: (subActionId: string, file: File) => Promise<void>;
		onDelete?: (documentId: string) => Promise<void>;
	}

	let {
		completed,
		acceptedFileTypes = null,
		label = 'Déposer un fichier',
		subActionId,
		existingDocument = null,
		onUpload,
		onDelete
	}: Props = $props();

	let uploading = $state(false);
	let deleting = $state(false);
	let fileInput = $state<HTMLInputElement | null>(null);

	let acceptString = $derived(acceptedFileTypes?.join(',') ?? undefined);

	let formattedTypes = $derived(
		acceptedFileTypes
			?.map((t) => t.replace('.', '').toUpperCase())
			.join(', ')
	);

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} o`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
	}

	async function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		uploading = true;
		try {
			await onUpload(subActionId, file);
		} finally {
			uploading = false;
			input.value = '';
		}
	}

	async function handleDelete() {
		if (!existingDocument || !onDelete) return;
		deleting = true;
		try {
			await onDelete(existingDocument.id);
		} finally {
			deleting = false;
		}
	}
</script>

{#if completed}
	<div class="flex items-center gap-2 text-sm text-green-600">
		<Check class="size-4" />
		<FileIcon class="size-3.5" />
		<span class="truncate max-w-48">{existingDocument?.fileName ?? 'Déposé'}</span>
	</div>
{:else if existingDocument}
	<div class="flex items-center gap-2 text-sm">
		<FileIcon class="size-4 text-muted-foreground shrink-0" />
		<span class="truncate max-w-48 font-medium">{existingDocument.fileName}</span>
		<span class="text-muted-foreground text-xs shrink-0">
			{formatFileSize(existingDocument.fileSize)}
		</span>
		{#if onDelete}
			<Button
				variant="ghost"
				size="icon-sm"
				class="size-7 text-destructive hover:text-destructive"
				onclick={handleDelete}
				disabled={deleting}
			>
				{#if deleting}
					<Loader2 class="size-3.5 animate-spin" />
				{:else}
					<Trash2 class="size-3.5" />
				{/if}
			</Button>
		{/if}
	</div>
{:else}
	<div class="flex flex-col gap-1">
		<input
			bind:this={fileInput}
			type="file"
			accept={acceptString}
			onchange={handleFileChange}
			class="hidden"
		/>
		<Button
			variant="outline"
			size="sm"
			onclick={() => fileInput?.click()}
			disabled={uploading}
		>
			{#if uploading}
				<Loader2 class="size-3.5 mr-1.5 animate-spin" />
				Envoi…
			{:else}
				<Upload class="size-3.5 mr-1.5" />
				{label}
			{/if}
		</Button>
		{#if formattedTypes}
			<span class="text-xs text-muted-foreground">{formattedTypes}</span>
		{/if}
	</div>
{/if}
