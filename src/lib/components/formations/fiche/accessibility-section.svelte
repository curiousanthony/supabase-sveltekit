<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { Switch } from '$lib/components/ui/switch';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Accessibility from '@lucide/svelte/icons/accessibility';
	import { cn } from '$lib/utils';

	interface Props {
		formationReferent: string | null;
		formationDispositions: string | null;
		workspaceDefaultReferent: string | null;
		workspaceDefaultDispositions: string | null;
		onSave: (
			fields: { referentHandicap: string | null; dispositionsHandicap: string | null }
		) => void | Promise<void>;
	}

	let {
		formationReferent,
		formationDispositions,
		workspaceDefaultReferent,
		workspaceDefaultDispositions,
		onSave
	}: Props = $props();

	const hasOverride = $derived(!!(formationReferent || formationDispositions));
	const effectiveReferent = $derived(formationReferent ?? workspaceDefaultReferent ?? null);
	const effectiveDispositions = $derived(
		formationDispositions ?? workspaceDefaultDispositions ?? null
	);
	const workspaceHasDefault = $derived(
		!!(workspaceDefaultReferent || workspaceDefaultDispositions)
	);

	let open = $state(false);
	let editing = $state(false);
	let overrideOn = $state(false);
	let draftReferent = $state('');
	let draftDispositions = $state('');
	let saving = $state(false);

	function startEdit() {
		overrideOn = hasOverride;
		draftReferent = formationReferent ?? '';
		draftDispositions = formationDispositions ?? '';
		editing = true;
	}

	function cancel() {
		editing = false;
	}

	async function save() {
		if (saving) return;
		saving = true;
		try {
			if (!overrideOn) {
				await onSave({ referentHandicap: null, dispositionsHandicap: null });
			} else {
				await onSave({
					referentHandicap: draftReferent.trim() || null,
					dispositionsHandicap: draftDispositions.trim() || null
				});
			}
			editing = false;
		} finally {
			saving = false;
		}
	}

	function summaryText(): string {
		if (!effectiveReferent && !effectiveDispositions) {
			return 'Référent handicap non renseigné';
		}
		const referentPart = effectiveReferent ?? 'référent non précisé';
		const dispositionsPart = hasOverride
			? 'dispositions spécifiques'
			: workspaceHasDefault
				? 'dispositions standard'
				: 'dispositions à compléter';
		return `${referentPart} — ${dispositionsPart}`;
	}
</script>

<div class="rounded-lg border bg-muted/20 p-3">
	<button
		type="button"
		class="flex w-full items-center justify-between gap-3 rounded-md text-left transition-colors hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-ring"
		onclick={() => (open = !open)}
		aria-expanded={open}
	>
		<span class="flex items-center gap-2 text-sm">
			<Accessibility class="size-4 text-muted-foreground" />
			<span class="font-medium">Accessibilité</span>
			<span class="text-muted-foreground">— {summaryText()}</span>
			{#if hasOverride}
				<Badge variant="secondary" class="text-[10px]">override formation</Badge>
			{/if}
		</span>
		<ChevronDown class={cn('size-4 transition-transform text-muted-foreground', open && 'rotate-180')} />
	</button>

	{#if open}
		<div class="mt-4 space-y-4 px-1">
			{#if !workspaceHasDefault && !hasOverride}
				<div class="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
					Aucun référent handicap renseigné — exigence de l'<strong>indicateur 26</strong> du
					référentiel Qualiopi.
					<a
						href="/parametres/workspace"
						class="ml-1 font-medium underline hover:no-underline"
					>
						Renseigner dans Paramètres → Espace
					</a>
				</div>
			{/if}

			<div class="grid grid-cols-1 gap-3 text-sm">
				<div class="flex flex-col gap-1">
					<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						Référent handicap effectif
					</span>
					<span class="text-foreground">
						{effectiveReferent ?? '—'}
					</span>
					{#if !hasOverride && workspaceDefaultReferent}
						<span class="text-xs text-muted-foreground">
							Hérité des paramètres de l'espace —
							<a href="/parametres/workspace" class="text-primary hover:underline">modifier</a>
						</span>
					{/if}
				</div>

				{#if effectiveDispositions}
					<div class="flex flex-col gap-1">
						<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Dispositions effectives
						</span>
						<span class="whitespace-pre-wrap text-foreground">{effectiveDispositions}</span>
					</div>
				{/if}
			</div>

			{#if !editing}
				<div class="flex justify-end">
					<Button type="button" variant="outline" size="sm" onclick={startEdit}>
						{hasOverride ? 'Modifier les dispositions spécifiques' : 'Définir des dispositions spécifiques'}
					</Button>
				</div>
			{:else}
				<div class="rounded-md border bg-background p-3 space-y-3">
					<div class="flex items-center justify-between gap-3">
						<label
							for="acc-override-toggle"
							class="text-sm font-medium cursor-pointer"
						>
							Cette formation a des dispositions spécifiques
						</label>
						<Switch id="acc-override-toggle" bind:checked={overrideOn} />
					</div>
					<p class="text-xs text-muted-foreground">
						Si désactivé, la formation utilise les valeurs définies dans les paramètres de l'espace.
					</p>

					{#if overrideOn}
						<div class="space-y-2">
							<label for="acc-referent" class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Référent handicap (cette formation)
							</label>
							<input
								id="acc-referent"
								type="text"
								bind:value={draftReferent}
								placeholder={workspaceDefaultReferent ?? 'Nom — email — téléphone'}
								class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
							/>
						</div>
						<div class="space-y-2">
							<label for="acc-dispositions" class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Dispositions spécifiques
							</label>
							<textarea
								id="acc-dispositions"
								bind:value={draftDispositions}
								rows="3"
								placeholder={workspaceDefaultDispositions ?? "Décrire les modalités d'accueil et d'accompagnement spécifiques à cette formation…"}
								class="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
								style="field-sizing: content;"
							></textarea>
						</div>
					{/if}

					<div class="flex justify-end gap-2">
						<Button type="button" variant="outline" size="sm" onclick={cancel} disabled={saving}>
							Annuler
						</Button>
						<Button type="button" size="sm" onclick={save} disabled={saving}>
							{saving ? 'Enregistrement…' : 'Enregistrer'}
						</Button>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
