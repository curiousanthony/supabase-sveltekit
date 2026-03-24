<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Upload from '@lucide/svelte/icons/upload';
	import FileIcon from '@lucide/svelte/icons/file';
	import Download from '@lucide/svelte/icons/download';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Loader2 from '@lucide/svelte/icons/loader-2';

	interface FileValue {
		id: string;
		fileName: string;
		fileType: string;
		fileSize: number;
		storagePath: string;
	}

	let {
		accept = null,
		maxSizeMb = 10,
		value = null,
		onUpload,
		onDelete,
		onDownload,
		disabled = false
	}: {
		accept?: string[] | null;
		maxSizeMb?: number;
		value?: FileValue | null;
		onUpload?: (file: File) => Promise<void>;
		onDelete?: () => Promise<void>;
		onDownload?: () => Promise<void>;
		disabled?: boolean;
	} = $props();

	let uploading = $state(false);
	let error = $state<string | null>(null);
	let dragOver = $state(false);
	let fileInput: HTMLInputElement;

	const acceptString = $derived(accept ? accept.join(',') : undefined);

	const acceptLabel = $derived.by(() => {
		if (!accept) return null;
		const labels = accept.map((mime) => {
			const ext = mime.split('/')[1];
			return ext ? `.${ext}` : mime;
		});
		return labels.join(', ');
	});

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} o`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
	}

	function validateFile(file: File): string | null {
		if (accept && !accept.some((mime) => file.type === mime || file.type.startsWith(mime.replace('*', '')))) {
			return `Type de fichier non accepté. Types acceptés : ${acceptLabel}`;
		}
		if (file.size > maxSizeMb * 1024 * 1024) {
			return `Le fichier dépasse la taille maximale de ${maxSizeMb} Mo`;
		}
		return null;
	}

	async function handleFile(file: File) {
		error = null;
		const validationError = validateFile(file);
		if (validationError) {
			error = validationError;
			return;
		}
		if (!onUpload) return;
		uploading = true;
		try {
			await onUpload(file);
		} catch (e) {
			error = e instanceof Error ? e.message : "Erreur lors de l'envoi du fichier";
		} finally {
			uploading = false;
		}
	}

	function ondrop(e: DragEvent) {
		e.preventDefault();
		dragOver = false;
		if (disabled || uploading || value) return;
		const file = e.dataTransfer?.files[0];
		if (file) handleFile(file);
	}

	function ondragover(e: DragEvent) {
		e.preventDefault();
		if (disabled || uploading || value) return;
		dragOver = true;
	}

	function ondragleave() {
		dragOver = false;
	}

	function onchange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) handleFile(file);
		input.value = '';
	}

	async function handleDelete() {
		if (!onDelete) return;
		try {
			await onDelete();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Erreur lors de la suppression';
		}
	}
</script>

<div class="w-full">
	{#if value}
		<div class="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
			<div class="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
				<FileIcon class="size-5" />
			</div>
			<div class="min-w-0 flex-1">
				{#if onDownload}
					<button type="button" class="truncate text-sm font-medium text-primary hover:underline" onclick={onDownload}>
						{value.fileName}
					</button>
				{:else}
					<p class="truncate text-sm font-medium">{value.fileName}</p>
				{/if}
				<p class="text-xs text-muted-foreground">{formatFileSize(value.fileSize)}</p>
			</div>
			{#if onDownload}
				<Button variant="ghost" size="icon-sm" onclick={onDownload}>
					<Download class="size-4 text-muted-foreground" />
				</Button>
			{/if}
			{#if onDelete && !disabled}
				<Button variant="ghost" size="icon-sm" onclick={handleDelete}>
					<Trash2 class="size-4 text-destructive" />
				</Button>
			{/if}
		</div>
	{:else}
		<button
			type="button"
			class="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors
				{dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'}
				{disabled || uploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}"
			onclick={() => !disabled && !uploading && fileInput.click()}
			{ondrop}
			{ondragover}
			{ondragleave}
			{disabled}
		>
			{#if uploading}
				<Loader2 class="size-8 animate-spin text-muted-foreground" />
				<p class="text-sm text-muted-foreground">Envoi en cours…</p>
			{:else}
				<Upload class="size-8 text-muted-foreground" />
				<div>
					<p class="text-sm font-medium">Glissez un fichier ici ou cliquez pour parcourir</p>
					<p class="mt-1 text-xs text-muted-foreground">
						{#if accept}
							{acceptLabel} &middot;
						{/if}
						{maxSizeMb} Mo max
					</p>
				</div>
			{/if}
		</button>
	{/if}

	{#if error}
		<p class="mt-2 text-sm text-destructive">{error}</p>
	{/if}

	<input
		bind:this={fileInput}
		type="file"
		accept={acceptString}
		class="hidden"
		{onchange}
		tabindex={-1}
	/>
</div>
