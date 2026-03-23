<script lang="ts">
	interface PhaseProgress {
		completed: number;
		total: number;
	}

	interface Props {
		phases: {
			conception: PhaseProgress;
			deploiement: PhaseProgress;
			evaluation: PhaseProgress;
		};
		overallCompleted: number;
		overallTotal: number;
	}

	let { phases, overallCompleted, overallTotal }: Props = $props();

	let grandTotal = $derived(phases.conception.total + phases.deploiement.total + phases.evaluation.total);

	let conceptionPct = $derived(grandTotal > 0 ? Math.max((phases.conception.total / grandTotal) * 100, 4) : 33);
	let deploiementPct = $derived(grandTotal > 0 ? Math.max((phases.deploiement.total / grandTotal) * 100, 4) : 33);
	let evaluationPct = $derived(grandTotal > 0 ? Math.max((phases.evaluation.total / grandTotal) * 100, 4) : 34);

	let conceptionFill = $derived(phases.conception.total > 0 ? (phases.conception.completed / phases.conception.total) * 100 : 0);
	let deploiementFill = $derived(phases.deploiement.total > 0 ? (phases.deploiement.completed / phases.deploiement.total) * 100 : 0);
	let evaluationFill = $derived(phases.evaluation.total > 0 ? (phases.evaluation.completed / phases.evaluation.total) * 100 : 0);
</script>

<div class="py-1">
	<div class="flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full">
		<div
			class="relative overflow-hidden rounded-l-full bg-gray-200 dark:bg-gray-700"
			style="width: {conceptionPct}%"
		>
			<div
				class="absolute inset-y-0 left-0 bg-primary transition-all duration-300"
				style="width: {conceptionFill}%"
			></div>
		</div>

		<div
			class="relative overflow-hidden bg-gray-200 dark:bg-gray-700"
			style="width: {deploiementPct}%"
		>
			<div
				class="absolute inset-y-0 left-0 bg-purple-500 transition-all duration-300"
				style="width: {deploiementFill}%"
			></div>
		</div>

		<div
			class="relative overflow-hidden rounded-r-full bg-gray-200 dark:bg-gray-700"
			style="width: {evaluationPct}%"
		>
			<div
				class="absolute inset-y-0 left-0 bg-emerald-500 transition-all duration-300"
				style="width: {evaluationFill}%"
			></div>
		</div>
	</div>

	<div class="mt-1 flex text-[10px] leading-tight text-muted-foreground">
		<span style="width: {conceptionPct}%">Conception</span>
		<span style="width: {deploiementPct}%">Déploiement</span>
		<span style="width: {evaluationPct}%">Évaluation</span>
	</div>

	<p class="mt-0.5 text-xs text-muted-foreground">
		{overallCompleted}/{overallTotal} étapes complétées
	</p>
</div>
