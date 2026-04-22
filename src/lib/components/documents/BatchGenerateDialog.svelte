<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Progress } from '$lib/components/ui/progress';
	import CheckIcon from '@lucide/svelte/icons/check';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import AlertTriangleIcon from '@lucide/svelte/icons/alert-triangle';
	import MinusCircleIcon from '@lucide/svelte/icons/minus-circle';
	import { deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	type LearnerRow = {
		contactId: string;
		learnerName: string;
		state: 'pending' | 'generating' | 'done' | 'skipped' | 'failed';
		failure?: { reasonFr: string; fixHref?: string };
	};

	type Props = {
		open: boolean;
		formationId: string;
		documentType: 'convocation' | 'certificat';
		learners: { contactId: string; firstName: string; lastName: string; email: string | null }[];
		warnings: { id: string; messageFr: string }[];
		onClose: () => void;
	};

	let {
		open = $bindable(),
		formationId,
		documentType,
		learners,
		warnings,
		onClose
	}: Props = $props();

	let phase = $state<'confirm' | 'generating' | 'result'>('confirm');
	let acknowledged = $state(false);
	let abortController: AbortController | null = $state(null);
	let rows = $state<LearnerRow[]>([]);
	let totals = $state({ done: 0, skipped: 0, failed: 0 });
	let cancelConfirmOpen = $state(false);

	const docTypeLabel = $derived(documentType === 'convocation' ? 'convocations' : 'certificats');
	const canSubmit = $derived(warnings.length === 0 || acknowledged);
	const progressPct = $derived(
		rows.length === 0
			? 0
			: Math.round(
					(rows.filter((r) => r.state !== 'pending' && r.state !== 'generating').length /
						rows.length) *
						100
				)
	);

	function initRows() {
		rows = learners.map((l) => ({
			contactId: l.contactId,
			learnerName: [l.firstName, l.lastName].filter(Boolean).join(' ') || 'Apprenant',
			state: 'pending'
		}));
	}

	async function submit() {
		initRows();
		phase = 'generating';
		abortController = new AbortController();

		// Cosmetic "sweep": animate rows from pending → generating while server processes.
		// Real states are applied when the server action returns.
		// Respect prefers-reduced-motion: skip the sweep entirely.
		const reduceMotion =
			typeof window !== 'undefined' &&
			window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
		let sweep: ReturnType<typeof setInterval> | null = null;
		if (reduceMotion) {
			for (let i = 0; i < rows.length; i++) rows[i].state = 'generating';
		} else {
			let sweepIdx = 0;
			sweep = setInterval(() => {
				if (sweepIdx >= rows.length) {
					if (sweep) clearInterval(sweep);
					return;
				}
				rows[sweepIdx].state = 'generating';
				sweepIdx++;
			}, 600);
		}

		try {
			const body = new FormData();
			body.set('type', documentType);
			body.set('warningsAcknowledged', warnings.map((w) => w.id).join(','));

			const response = await fetch(
				`/formations/${formationId}/documents?/generateForAll`,
				{
					method: 'POST',
					body,
					signal: abortController.signal
				}
			);
			if (sweep) clearInterval(sweep);

			const result = deserialize(await response.text());
			if (result.type === 'success') {
				const data = result.data as {
					results: Array<{
						contactId: string;
						learnerName: string;
						status: 'done' | 'skipped' | 'failed';
						reason?: string;
						documentId?: string;
					}>;
					totals: { done: number; skipped: number; failed: number };
				};
				totals = data.totals;
				rows = data.results.map((r) => ({
					contactId: r.contactId,
					learnerName: r.learnerName,
					state: r.status === 'done' ? 'done' : r.status === 'skipped' ? 'skipped' : 'failed',
					failure:
						r.status === 'failed'
							? {
									reasonFr: reasonToFr(r.reason),
									fixHref:
										r.reason === 'email_manquant'
											? `/formations/${formationId}/apprenants?preflightFocus=email&focusContactId=${r.contactId}&returnTo=${encodeURIComponent(`/formations/${formationId}/documents?resumeBatch=${documentType}`)}`
											: undefined
								}
							: undefined
				}));
				phase = 'result';
				await invalidateAll();
			} else if (result.type === 'failure') {
				toast.error((result.data as { message?: string })?.message ?? 'Erreur');
				phase = 'confirm';
			}
		} catch (err: unknown) {
			if (sweep) clearInterval(sweep);
			if (err instanceof DOMException && err.name === 'AbortError') {
				toast.info('Génération annulée — les documents déjà créés ont été conservés');
			} else {
				toast.error(err instanceof Error ? err.message : 'Erreur de génération');
			}
			phase = 'result';
			await invalidateAll();
		} finally {
			abortController = null;
		}
	}

	function reasonToFr(reason?: string): string {
		switch (reason) {
			case 'email_manquant':
				return 'e-mail manquant';
			case 'audit_log_failed':
				return 'enregistrement audit échoué — réessayez';
			case 'client_manquant':
				return 'client non renseigné';
			default:
				return reason ?? 'donnée manquante';
		}
	}

	function cancel() {
		if (phase === 'generating' && abortController) {
			// Use AlertDialog (in-app, accessible) instead of native window.confirm.
			cancelConfirmOpen = true;
		} else {
			open = false;
			phase = 'confirm';
			acknowledged = false;
			onClose();
		}
	}

	function confirmCancel() {
		abortController?.abort();
		cancelConfirmOpen = false;
	}

	function handleOpenChange(o: boolean) {
		if (!o) {
			if (phase !== 'generating') {
				phase = 'confirm';
				acknowledged = false;
				onClose();
			}
		}
	}
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Content class="sm:max-w-lg">
		{#if phase === 'confirm'}
			<Dialog.Header>
				<Dialog.Title>Générer {learners.length} {docTypeLabel} ?</Dialog.Title>
			</Dialog.Header>
			<p class="text-muted-foreground text-sm">Cela peut prendre jusqu'à 30 secondes.</p>
			{#if warnings.length > 0}
				<div
					class="rounded-md border border-amber-300 bg-amber-50 p-3 dark:bg-amber-950/30"
				>
					<p class="mb-2 text-sm font-medium">Avant de continuer</p>
					<ul class="mb-2 ml-4 list-disc space-y-1 text-sm">
						{#each warnings as w (w.id)}
							<li>{w.messageFr}</li>
						{/each}
					</ul>
					<label class="flex items-center gap-2 text-sm">
						<Checkbox bind:checked={acknowledged} />
						Je comprends et je souhaite continuer
					</label>
				</div>
			{/if}
			<Dialog.Footer>
				<Button variant="outline" onclick={cancel}>Annuler</Button>
				<Button disabled={!canSubmit} onclick={submit}>Lancer la génération</Button>
			</Dialog.Footer>
		{:else if phase === 'generating'}
			<Dialog.Header>
				<Dialog.Title>Génération en cours…</Dialog.Title>
			</Dialog.Header>
			<Progress value={progressPct} />
			<p class="text-muted-foreground text-sm" aria-live="polite">
				{rows.filter((r) => r.state === 'done' || r.state === 'skipped').length} / {rows.length} apprenants
				prêts
			</p>
			<ul class="max-h-64 space-y-1 overflow-y-auto">
				{#each rows as row (row.contactId)}
					<li class="flex items-center gap-2 text-sm">
						{#if row.state === 'done'}
							<CheckIcon class="size-4 text-green-600" aria-hidden="true" />
						{:else if row.state === 'generating'}
							<Loader2Icon
								class="motion-safe:animate-spin size-4 text-blue-600"
								aria-hidden="true"
							/>
						{:else if row.state === 'skipped'}
							<MinusCircleIcon class="text-muted-foreground size-4" aria-hidden="true" />
						{:else if row.state === 'failed'}
							<AlertTriangleIcon class="size-4 text-red-600" aria-hidden="true" />
						{:else}
							<ClockIcon class="text-muted-foreground size-4" aria-hidden="true" />
						{/if}
						<span class="flex-1">{row.learnerName}</span>
						<span class="text-muted-foreground text-xs">
							{#if row.state === 'done'}
								généré
							{:else if row.state === 'generating'}
								génération…
							{:else if row.state === 'skipped'}
								déjà envoyée
							{:else if row.state === 'failed'}
								à compléter
							{:else}
								en attente
							{/if}
						</span>
					</li>
				{/each}
			</ul>
			<Dialog.Footer>
				<Button variant="outline" onclick={cancel}>Annuler</Button>
			</Dialog.Footer>
		{:else}
			<Dialog.Header>
				<Dialog.Title>Résultat</Dialog.Title>
			</Dialog.Header>
			<div class="space-y-1 text-sm" aria-live="polite">
				{#if totals.done === 0 && totals.skipped === 0 && totals.failed > 0}
					<p class="text-red-600">⚠ Aucune {docTypeLabel.slice(0, -1)} générée — {totals.failed} à compléter</p>
				{:else}
					{#if totals.done > 0}
						<p>✓ {totals.done} {docTypeLabel} générées</p>
					{/if}
					{#if totals.skipped > 0}
						<p class="text-muted-foreground">⊘ {totals.skipped} déjà envoyée(s) — ignorée(s)</p>
					{/if}
					{#if totals.failed > 0}
						<p class="text-red-600">⚠ {totals.failed} à compléter</p>
					{/if}
				{/if}
			</div>
			{#if rows.some((r) => r.state === 'failed')}
				<ul class="max-h-64 space-y-2 overflow-y-auto rounded-md border p-2">
					{#each rows.filter((r) => r.state === 'failed') as row (row.contactId)}
						<li class="flex items-center gap-2 text-sm">
							<AlertTriangleIcon class="size-4 shrink-0 text-red-600" aria-hidden="true" />
							<span class="flex-1">{row.learnerName} — {row.failure?.reasonFr}</span>
							{#if row.failure?.fixHref}
								<Button
									href={row.failure.fixHref}
									variant="link"
									size="sm"
									class="h-auto p-0"
								>
									Compléter →
								</Button>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
			<Dialog.Footer>
				<Button
					variant="outline"
					onclick={() => {
						open = false;
						phase = 'confirm';
						acknowledged = false;
						onClose();
					}}
				>
					Fermer
				</Button>
				{#if totals.failed > 0}
					<Button onclick={submit}>
						Réessayer pour les {totals.failed} restants
					</Button>
				{/if}
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<AlertDialog.Root bind:open={cancelConfirmOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Annuler la génération ?</AlertDialog.Title>
			<AlertDialog.Description>
				Les documents déjà créés seront conservés. Les apprenants restants ne seront pas traités.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Continuer la génération</AlertDialog.Cancel>
			<AlertDialog.Action onclick={confirmCancel}>Oui, annuler</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
