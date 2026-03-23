<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Check from '@lucide/svelte/icons/check';
	import Loader2 from '@lucide/svelte/icons/loader-2';

	interface Props {
		completed: boolean;
		viewType: 'seances' | 'programme' | 'finances' | 'apprenants' | 'formateurs';
		formation: {
			seances?: {
				id: string;
				startAt: string;
				endAt: string;
				module?: { name: string } | null;
				formateur?: {
					user?: { firstName: string | null; lastName: string | null } | null;
				} | null;
				emargements?: { signedAt: string | null }[];
			}[];
			modules?: {
				id: string;
				name: string;
				durationHours: string | null;
				objectifs: string | null;
			}[];
			formationFormateurs?: {
				formateur: {
					user?: { firstName: string | null; lastName: string | null } | null;
				};
			}[];
			formationApprenants?: {
				contact: {
					firstName: string | null;
					lastName: string | null;
					email: string | null;
				};
			}[];
			invoices?: { id: string; status: string; dueDate: string | null }[];
		};
		onConfirm: () => Promise<void>;
	}

	let { completed, viewType, formation, onConfirm }: Props = $props();

	let confirming = $state(false);

	const MAX_SEANCES = 5;

	const dateFmt = new Intl.DateTimeFormat('fr-FR', {
		weekday: 'short',
		day: 'numeric',
		month: 'short'
	});

	const timeFmt = new Intl.DateTimeFormat('fr-FR', {
		hour: '2-digit',
		minute: '2-digit'
	});

	const seances = $derived(formation.seances ?? []);
	const modules = $derived(formation.modules ?? []);
	const formateurs = $derived(formation.formationFormateurs ?? []);
	const apprenants = $derived(formation.formationApprenants ?? []);
	const invoices = $derived(formation.invoices ?? []);

	const invoiceSummary = $derived.by(() => {
		let paid = 0;
		let pending = 0;
		let overdue = 0;
		for (const inv of invoices) {
			if (inv.status === 'paid') paid++;
			else if (inv.status === 'overdue') overdue++;
			else pending++;
		}
		return { paid, pending, overdue };
	});

	function fullName(
		user: { firstName: string | null; lastName: string | null } | null | undefined
	): string {
		if (!user) return 'Inconnu';
		return [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Inconnu';
	}

	function emargementRatio(emargements?: { signedAt: string | null }[]): string {
		if (!emargements || emargements.length === 0) return '0/0';
		const signed = emargements.filter((e) => e.signedAt !== null).length;
		return `${signed}/${emargements.length}`;
	}

	async function handleConfirm() {
		confirming = true;
		try {
			await onConfirm();
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
		<div class="max-h-48 space-y-1 overflow-y-auto pr-1">
			{#if viewType === 'seances'}
				<p class="text-xs font-medium text-muted-foreground">
					{seances.length} séance{seances.length !== 1 ? 's' : ''} planifiée{seances.length !== 1 ? 's' : ''}
				</p>
				{#each seances.slice(0, MAX_SEANCES) as seance (seance.id)}
					{@const start = new Date(seance.startAt)}
					{@const end = new Date(seance.endAt)}
					<div class="rounded border border-border px-2 py-1 text-xs">
						<div class="flex items-center justify-between gap-2">
							<span class="font-medium capitalize">{dateFmt.format(start)}</span>
							<span class="text-muted-foreground">
								{timeFmt.format(start)} – {timeFmt.format(end)}
							</span>
						</div>
						<div class="mt-0.5 flex items-center justify-between gap-2 text-muted-foreground">
							<span class="truncate">{seance.module?.name ?? '—'}</span>
							<span class="shrink-0" title="Émargements signés">
								✍ {emargementRatio(seance.emargements)}
							</span>
						</div>
					</div>
				{/each}
				{#if seances.length > MAX_SEANCES}
					<p class="text-xs text-muted-foreground">
						+{seances.length - MAX_SEANCES} autre{seances.length - MAX_SEANCES !== 1 ? 's' : ''}
					</p>
				{/if}

			{:else if viewType === 'programme'}
				{#if modules.length === 0}
					<p class="text-xs text-muted-foreground">Aucun module</p>
				{:else}
					<p class="text-xs font-medium text-muted-foreground">
						{modules.length} module{modules.length !== 1 ? 's' : ''}
					</p>
					{#each modules as mod (mod.id)}
						<div class="rounded border border-border px-2 py-1 text-xs">
							<span class="font-medium">{mod.name}</span>
							{#if mod.durationHours}
								<span class="text-muted-foreground"> · {mod.durationHours}h</span>
							{/if}
						</div>
					{/each}
				{/if}

			{:else if viewType === 'finances'}
				{#if invoices.length === 0}
					<p class="text-xs text-muted-foreground">Aucune facture</p>
				{:else}
					<div class="flex flex-wrap gap-2 text-xs">
						{#if invoiceSummary.paid > 0}
							<span class="rounded-full bg-green-100 px-2 py-0.5 text-green-700 dark:bg-green-900/30 dark:text-green-400">
								{invoiceSummary.paid} payée{invoiceSummary.paid !== 1 ? 's' : ''}
							</span>
						{/if}
						{#if invoiceSummary.pending > 0}
							<span class="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
								{invoiceSummary.pending} en attente
							</span>
						{/if}
						{#if invoiceSummary.overdue > 0}
							<span class="rounded-full bg-red-100 px-2 py-0.5 text-red-700 dark:bg-red-900/30 dark:text-red-400">
								{invoiceSummary.overdue} en retard
							</span>
						{/if}
					</div>
				{/if}

			{:else if viewType === 'apprenants'}
				{#if apprenants.length === 0}
					<p class="text-xs text-muted-foreground">Aucun apprenant inscrit</p>
				{:else}
					<p class="text-xs font-medium text-muted-foreground">
						{apprenants.length} apprenant{apprenants.length !== 1 ? 's' : ''}
					</p>
					<ul class="space-y-0.5 text-xs">
					{#each apprenants as { contact }, i (contact.email ?? i)}
						<li class="truncate">
							{[contact.firstName, contact.lastName].filter(Boolean).join(' ') || contact.email || '—'}
						</li>
					{/each}
					</ul>
				{/if}

			{:else if viewType === 'formateurs'}
				{#if formateurs.length === 0}
					<p class="text-xs text-muted-foreground">Aucun formateur affecté</p>
				{:else}
					<p class="text-xs font-medium text-muted-foreground">
						{formateurs.length} formateur{formateurs.length !== 1 ? 's' : ''}
					</p>
					<ul class="space-y-0.5 text-xs">
					{#each formateurs as { formateur }, i (i)}
						<li class="truncate">{fullName(formateur.user)}</li>
					{/each}
					</ul>
				{/if}
			{/if}
		</div>

		<div class="pt-1">
			<Button variant="outline" size="sm" onclick={handleConfirm} disabled={confirming}>
				{#if confirming}
					<Loader2 class="size-3.5 animate-spin" />
				{:else}
					<Check class="size-3.5" />
				{/if}
				J'ai vérifié
			</Button>
		</div>
	</div>
{/if}
