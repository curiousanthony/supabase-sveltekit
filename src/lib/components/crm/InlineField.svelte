<script lang="ts">
	import { cn } from '$lib/utils';
	import { tick } from 'svelte';
	import { deserialize, applyAction } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import * as Select from '$lib/components/ui/select';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';
	import ExternalLink from '@lucide/svelte/icons/external-link';

	function normalizeUrl(url: string): string {
		if (!url) return url;
		return /^https?:\/\//i.test(url) ? url : `https://${url}`;
	}

	/** Safe href for URL type: only http(s), reject javascript:, data:, vbscript:, etc. */
	function getSafeNormalizedUrl(val: string | null): string | null {
		if (!val) return null;
		const trimmed = val.trim();
		if (!trimmed) return null;
		if (/^https?:\/\//i.test(trimmed)) return trimmed;
		// Reject any other scheme (javascript:, data:, vbscript:, etc.)
		if (/^[a-z0-9+.-]+:/i.test(trimmed)) return null;
		return `https://${trimmed}`;
	}

	type FieldType = 'text' | 'email' | 'tel' | 'url' | 'textarea' | 'select';

	type SelectOption = { value: string; label: string };

	let {
		label,
		value = $bindable(''),
		field,
		type = 'text' as FieldType,
		options = [] as SelectOption[],
		action = '?/updateField',
		placeholder = '—',
		class: className = '',
		validate,
		onSaved
	}: {
		label: string;
		value?: string;
		field: string;
		type?: FieldType;
		options?: SelectOption[];
		action?: string;
		placeholder?: string;
		class?: string;
		/** If provided, called before submit. Return error message to block save and show toast. */
		validate?: (value: string) => string | null;
		onSaved?: (newValue: string) => void;
	} = $props();

	let isEditing = $state(false);
	let isSaving = $state(false);
	let editValue = $state('');
	let inputEl = $state<HTMLInputElement | HTMLTextAreaElement | null>(null);
	let originalValue = $state('');

	async function startEdit() {
		if (isEditing || isSaving) return;
		originalValue = value ?? '';
		editValue = value ?? '';
		isEditing = true;
		await tick();
		inputEl?.focus();
		if (inputEl instanceof HTMLInputElement) inputEl.select();
	}

	async function save() {
		if (!isEditing) return;
		let newValue = editValue.trim();
		if (type === 'url' && newValue) newValue = normalizeUrl(newValue);
		if (newValue === (value ?? '').trim()) {
			cancel();
			return;
		}
		if (validate) {
			const err = validate(newValue);
			if (err) {
				toast.error(err);
				return;
			}
		}
		isEditing = false;
		isSaving = true;
		const prevValue = value;
		value = newValue;

		try {
			const formData = new FormData();
			formData.append('field', field);
			formData.append('value', newValue);
			const response = await fetch(action, { method: 'POST', body: formData });
			const result = deserialize(await response.text());
			if (result.type === 'failure') {
				value = prevValue;
				toast.error((result.data as { message?: string })?.message ?? 'Erreur lors de la sauvegarde');
			} else {
				onSaved?.(newValue);
				if (result.type === 'success') {
					await applyAction(result);
				}
			}
		} catch {
			value = prevValue;
			toast.error('Erreur réseau');
		} finally {
			isSaving = false;
		}
	}

	async function saveSelect(newValue: string) {
		if (newValue === (value ?? '')) return;
		isSaving = true;
		const prevValue = value;
		value = newValue;
		editValue = newValue;

		try {
			const formData = new FormData();
			formData.append('field', field);
			formData.append('value', newValue);
			const response = await fetch(action, { method: 'POST', body: formData });
			const result = deserialize(await response.text());
			if (result.type === 'failure') {
				value = prevValue;
				toast.error((result.data as { message?: string })?.message ?? 'Erreur lors de la sauvegarde');
			} else {
				onSaved?.(newValue);
				if (result.type === 'success') {
					await applyAction(result);
				}
			}
		} catch {
			value = prevValue;
			toast.error('Erreur réseau');
		} finally {
			isSaving = false;
			isEditing = false;
		}
	}

	function cancel() {
		isEditing = false;
		editValue = originalValue;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && type !== 'textarea') {
			e.preventDefault();
			save();
		}
		if (e.key === 'Escape') {
			cancel();
		}
	}

	const displayValue = $derived(value?.trim() || null);
	const safeNormalizedUrl = $derived(
		type === 'url' && displayValue ? getSafeNormalizedUrl(displayValue) : null
	);
	const optionLabel = $derived(
		type === 'select' ? (options.find((o) => o.value === value)?.label ?? value ?? null) : null
	);
	const labelId = $derived(`inline-field-${String(field).replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-_:.]/g, '')}`);
</script>

<div class={cn('group/field flex flex-col gap-0.5', className)}>
	<span id={labelId} class="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>

	{#if type === 'select'}
		<!-- Select: inline toggle without edit mode -->
		<div class="relative flex items-center gap-1.5 min-h-8">
			{#if isSaving}
				<span class="text-sm text-muted-foreground animate-pulse">Enregistrement...</span>
			{:else}
				<Select.Root
					type="single"
					value={value ?? ''}
					onValueChange={(v) => saveSelect(v)}
				>
					<Select.Trigger
						aria-labelledby={labelId}
						aria-label={label}
						class="h-8 min-w-[120px] border-transparent bg-transparent px-2 text-sm shadow-none hover:border-input hover:bg-muted/50 focus:border-input data-[state=open]:border-input data-[state=open]:bg-muted/50 transition-colors"
					>
						{#if optionLabel}
							{optionLabel}
						{:else}
							<span class="text-muted-foreground">{placeholder}</span>
						{/if}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="">—</Select.Item>
						{#each options as opt (opt.value)}
							<Select.Item value={opt.value}>{opt.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			{/if}
		</div>
	{:else if isEditing}
		<div class="flex items-start gap-1">
			{#if type === 'textarea'}
				<textarea
					bind:this={inputEl}
					bind:value={editValue}
					onkeydown={handleKeydown}
					onblur={save}
					rows="3"
					class="flex-1 min-w-0 rounded-md border border-ring bg-background px-2 py-1.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
				></textarea>
		{:else}
			<input
				bind:this={inputEl}
				type={type === 'url' ? 'text' : type}
				bind:value={editValue}
				onkeydown={handleKeydown}
				onblur={save}
				placeholder={type === 'url' ? 'https://... ou google.com' : undefined}
				class="flex-1 min-w-0 rounded-md border border-ring bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
			/>
		{/if}
			<button
				type="button"
				onclick={save}
				class="mt-0.5 flex size-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
				aria-label="Enregistrer"
			>
				<Check class="size-3.5" />
			</button>
			<button
				type="button"
				onmousedown={(e) => e.preventDefault()}
				onclick={cancel}
				class="mt-0.5 flex size-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
				aria-label="Annuler"
			>
				<X class="size-3.5" />
			</button>
		</div>
	{:else}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class={cn(
				'group/value flex min-h-8 cursor-text items-start gap-1.5 rounded-md px-2 py-1 -mx-2 transition-colors',
				isSaving ? 'opacity-50' : 'hover:bg-muted/60'
			)}
			onclick={startEdit}
			onkeydown={(e) => e.key === 'Enter' && startEdit()}
			role="button"
			tabindex="0"
			aria-label="Modifier {label}"
		>
			{#if type === 'textarea'}
				<span
					class={cn(
						'flex-1 text-sm whitespace-pre-wrap leading-relaxed',
						displayValue ? 'text-foreground' : 'text-muted-foreground'
					)}
				>
					{displayValue ?? placeholder}
				</span>
			{:else if type === 'url' && displayValue}
				{#if safeNormalizedUrl}
					<a
						href={safeNormalizedUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="flex-1 truncate text-sm text-primary hover:underline"
						onclick={(e) => e.stopPropagation()}
					>
						{displayValue.replace(/^https?:\/\//, '')}
					</a>
					<ExternalLink
						class="size-3 shrink-0 mt-0.5 text-muted-foreground opacity-0 group-hover/value:opacity-60 transition-opacity"
					/>
				{:else}
					<span class="flex-1 truncate text-sm text-foreground">
						{displayValue.replace(/^https?:\/\//, '')}
					</span>
				{/if}
			{:else}
				<span
					class={cn(
						'flex-1 truncate text-sm',
						displayValue ? 'text-foreground' : 'text-muted-foreground'
					)}
				>
					{displayValue ?? placeholder}
				</span>
			{/if}
			{#if !isSaving}
				<Pencil
					class="size-3 shrink-0 mt-0.5 text-muted-foreground opacity-0 group-hover/value:opacity-60 transition-opacity"
				/>
			{/if}
		</div>
	{/if}
</div>
