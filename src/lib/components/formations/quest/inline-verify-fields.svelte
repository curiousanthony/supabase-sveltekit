<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Check from '@lucide/svelte/icons/check';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import Loader2 from '@lucide/svelte/icons/loader-2';

	interface FieldConfig {
		key: string;
		label: string;
		type: 'text' | 'textarea' | 'date' | 'number' | 'select' | 'company-display';
		options?: string[];
	}

	interface Props {
		fields: FieldConfig[];
		formation: Record<string, unknown>;
		completed: boolean;
		onSave: (field: string, value: string) => Promise<void>;
		onConfirmAll: () => Promise<void>;
	}

	let { fields, formation, completed, onSave, onConfirmAll }: Props = $props();

	let savingField = $state<string | null>(null);
	let confirming = $state(false);

	const allFilled = $derived(
		fields.every((f) => {
			if (f.type === 'company-display') return true;
			const val = formation[f.key];
			return val !== null && val !== undefined && String(val).trim() !== '';
		})
	);

	function getDisplayValue(field: FieldConfig): string {
		if (field.type === 'company-display') {
			const f = formation as Record<string, Record<string, unknown> | undefined>;
			return (
				(f.company?.name as string) ?? (f.client?.legalName as string) ?? ''
			);
		}
		const val = formation[field.key];
		if (val === null || val === undefined) return '';
		return String(val);
	}

	function hasValue(field: FieldConfig): boolean {
		return getDisplayValue(field).trim() !== '';
	}

	async function handleBlur(fieldKey: string, value: string) {
		if (value === String(formation[fieldKey] ?? '')) return;
		savingField = fieldKey;
		try {
			await onSave(fieldKey, value);
		} finally {
			savingField = null;
		}
	}

	async function handleConfirmAll() {
		confirming = true;
		try {
			await onConfirmAll();
		} finally {
			confirming = false;
		}
	}
</script>

{#if completed}
	<div class="flex items-center gap-1.5 text-sm text-green-600">
		<Check class="size-3.5" />
		<span>Vérifié</span>
	</div>
{:else}
	<div class="space-y-2">
		{#each fields as field (field.key)}
			{@const value = getDisplayValue(field)}
			{@const filled = hasValue(field)}
			{@const isSaving = savingField === field.key}
			<div class="flex items-start gap-2">
				<div class="mt-1.5 shrink-0">
					{#if isSaving}
						<Loader2 class="size-3.5 animate-spin text-muted-foreground" />
					{:else if filled}
						<Check class="size-3.5 text-green-500" />
					{:else}
						<CircleAlert class="size-3.5 text-amber-400" />
					{/if}
				</div>

				<div class="min-w-0 flex-1">
					{#if field.type === 'company-display'}
						<span class="mb-0.5 block text-xs font-medium text-muted-foreground">
							{field.label}
						</span>
						<p class="text-sm text-foreground">
							{value || '—'}
						</p>
					{:else}
						<label
							for="verify-{field.key}"
							class="mb-0.5 block text-xs font-medium text-muted-foreground"
						>
							{field.label}
						</label>
						{#if field.type === 'textarea'}
							<textarea
								id="verify-{field.key}"
								class="w-full rounded-md border border-input bg-background px-2 py-1 text-sm outline-none transition-colors focus:border-ring focus:ring-1 focus:ring-ring"
								rows="2"
								value={value}
								onblur={(e) => handleBlur(field.key, e.currentTarget.value)}
							></textarea>
						{:else if field.type === 'select'}
							<select
								id="verify-{field.key}"
								class="w-full rounded-md border border-input bg-background px-2 py-1 text-sm outline-none transition-colors focus:border-ring focus:ring-1 focus:ring-ring"
								value={value}
								onchange={(e) => handleBlur(field.key, e.currentTarget.value)}
							>
								<option value="">—</option>
								{#each field.options ?? [] as opt (opt)}
									<option value={opt}>{opt}</option>
								{/each}
							</select>
						{:else}
							<input
								id="verify-{field.key}"
								type={field.type}
								class="w-full rounded-md border border-input bg-background px-2 py-1 text-sm outline-none transition-colors focus:border-ring focus:ring-1 focus:ring-ring"
								value={value}
								onblur={(e) => handleBlur(field.key, e.currentTarget.value)}
							/>
						{/if}
					{/if}
				</div>
			</div>
		{/each}

		{#if allFilled}
			<div class="pt-1">
				<Button variant="outline" size="sm" onclick={handleConfirmAll} disabled={confirming}>
					{#if confirming}
						<Loader2 class="size-3.5 animate-spin" />
					{:else}
						<Check class="size-3.5" />
					{/if}
					Tout est correct
				</Button>
			</div>
		{/if}
	</div>
{/if}
