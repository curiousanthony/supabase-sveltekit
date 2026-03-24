<script lang="ts">
	import type { PageProps } from './$types';
	import { deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { untrack } from 'svelte';
	import { PHASE_LABELS, type QuestPhase, getQuestProgress, getQuestTemplate } from '$lib/formation-quests';
	import { categorizeByDisplayState } from '$lib/formation-quest-state';
	import { playMicroSound, playMediumSound, playMacroSound } from '$lib/sounds';
	import LevelUpToast from '$lib/components/formations/level-up-toast.svelte';
	import PhaseCard from '$lib/components/formations/suivi/phase-card.svelte';
	import QuestRow from '$lib/components/formations/suivi/quest-row.svelte';

	let { data }: PageProps = $props();

	const formation = $derived(data?.formation);
	const actions = $derived(formation?.actions ?? []);
	const formationId = $derived(formation?.id ?? '');

	const categorized = $derived(
		categorizeByDisplayState(actions as any, {
			type: formation?.type,
			typeFinancement: formation?.typeFinancement,
			dateDebut: formation?.dateDebut,
			dateFin: formation?.dateFin
		})
	);

	const progress = $derived(getQuestProgress(actions));

	const phases: QuestPhase[] = ['conception', 'deploiement', 'evaluation'];
	const PHASE_SUBTITLES: Record<QuestPhase, string> = {
		conception: 'Préparation du dossier',
		deploiement: 'Pendant la formation',
		evaluation: 'Suivi post-formation'
	};

	let showAllEvalSteps = $state(false);
	let levelUpPhase = $state<string | null>(null);
	let levelUpMessage = $state<string | null>(null);
	let showLevelUp = $state(false);

	const completedKeys = $derived(
		new Set(actions.filter((a) => a.status === 'Terminé').map((a) => a.questKey))
	);
	const allComplete = $derived(
		actions.length > 0 && actions.every((a) => a.status === 'Terminé')
	);
	const phaseCompletion = $derived(
		Object.fromEntries(
			phases.map((p) => {
				const phaseActions = actions.filter((a) => a.phase === p);
				return [p, phaseActions.length > 0 && phaseActions.every((a) => a.status === 'Terminé')];
			})
		) as Record<string, boolean>
	);

	let prevCompletedKeys = $state<Set<string | null>>(new Set());
	let prevPhaseCompletion = $state<Record<string, boolean>>({});
	let prevAllComplete = $state(false);

	$effect(() => {
		const currentKeys = completedKeys;
		const prevKeys = untrack(() => prevCompletedKeys);
		const isInitialRun = prevKeys.size === 0 && currentKeys.size > 0;

		if (!isInitialRun) {
			for (const key of currentKeys) {
				if (!prevKeys.has(key)) {
					playMicroSound();
					break;
				}
			}
		}

		prevCompletedKeys = new Set(currentKeys);
	});

	$effect(() => {
		const current = phaseCompletion;
		const prev = untrack(() => prevPhaseCompletion);
		const isInitialRun = Object.keys(prev).length === 0;

		for (const phase of phases) {
			if (current[phase] && !prev[phase] && !isInitialRun) {
				levelUpPhase = PHASE_LABELS[phase];
				levelUpMessage = null;
				showLevelUp = true;
				playMediumSound();
			}
		}

		prevPhaseCompletion = { ...current };
	});

	$effect(() => {
		const currentAll = allComplete;
		const wasAll = untrack(() => prevAllComplete);

		if (currentAll && !wasAll && actions.length > 0) {
			levelUpPhase = null;
			levelUpMessage = 'Dossier complet · Cette formation est prête pour l\'audit.';
			showLevelUp = true;
			playMacroSound();
		}

		prevAllComplete = currentAll;
	});

	function getPhaseDateRange(phase: QuestPhase): string {
		if (phase === 'conception') {
			const debut = formation?.dateDebut;
			return debut ? `Avant le ${new Date(debut).toLocaleDateString('fr-FR')}` : '';
		}
		if (phase === 'deploiement') {
			const debut = formation?.dateDebut;
			const fin = formation?.dateFin;
			if (debut && fin) {
				return `${new Date(debut).toLocaleDateString('fr-FR')} – ${new Date(fin).toLocaleDateString('fr-FR')}`;
			}
			return debut ? `À partir du ${new Date(debut).toLocaleDateString('fr-FR')}` : '';
		}
		const fin = formation?.dateFin;
		return fin ? `Après le ${new Date(fin).toLocaleDateString('fr-FR')}` : '';
	}

	function getPhaseCountdownText(phase: QuestPhase): string | null {
		const now = new Date();
		if (phase === 'conception' && formation?.dateDebut) {
			const days = Math.ceil((new Date(formation.dateDebut).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
			if (days > 0) return `J-${days} avant le début`;
			if (days === 0) return "C'est aujourd'hui !";
		}
		if (phase === 'deploiement' && formation?.dateFin) {
			const days = Math.ceil((new Date(formation.dateFin).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
			if (days > 0) return `${days} jours restants`;
			if (days === 0) return 'Dernier jour';
		}
		return null;
	}

	function getTargetTab(questKey: string | null): string | null {
		if (!questKey) return null;
		const tabMap: Record<string, string> = {
			verification_infos: 'fiche',
			analyse_besoins: 'apprenants',
			programme_modules: 'programme',
			affectation_formateur: 'formateurs',
			convocations: 'apprenants',
			preparation_logistique: 'fiche',
			emargement: 'seances',
			documents_formateur: 'formateurs',
			facturation: 'finances'
		};
		return tabMap[questKey] ?? 'suivi';
	}

	async function callAction(actionName: string, body: FormData): Promise<boolean> {
		try {
			const response = await fetch(`?/${actionName}`, { method: 'POST', body });
			if (!response.ok) {
				toast.error(`Erreur serveur (${response.status})`);
				return false;
			}
			const result = deserialize(await response.text());
			if (result.type === 'success') {
				await invalidateAll();
				return true;
			} else if (result.type === 'failure') {
				toast.error((result.data as { message?: string })?.message ?? 'Erreur');
				return false;
			} else if (result.type === 'error') {
				toast.error(result.error?.message ?? 'Erreur inattendue');
				return false;
			}
			return false;
		} catch (err) {
			console.error('callAction error:', err);
			toast.error(err instanceof Error ? err.message : 'Erreur réseau');
			return false;
		}
	}

	async function handleOverrideSoftLock(actionId: string) {
		const formData = new FormData();
		formData.append('actionId', actionId);
		await callAction('overrideSoftLock', formData);
	}

	async function handleReminder(actionId: string) {
		const formData = new FormData();
		formData.append('actionId', actionId);
		const ok = await callAction('recordReminder', formData);
		if (ok) toast.success('Relance enregistrée');
	}
</script>

<div class="mx-auto flex max-w-5xl flex-col gap-6">
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		{#each phases as phase (phase)}
			{@const p = progress.phases[phase]}
			{@const isActive = p.total > 0 && p.completed < p.total && p.completed > 0}
			{@const isDone = p.total > 0 && p.completed === p.total}
			<PhaseCard
				{phase}
				label={PHASE_LABELS[phase]}
				subtitle={PHASE_SUBTITLES[phase]}
				dateRange={getPhaseDateRange(phase)}
				completed={p.completed}
				total={p.total}
				{isActive}
				{isDone}
				countdownText={getPhaseCountdownText(phase)}
				tooltipText={`${p.completed} sur ${p.total} étapes terminées pour la phase ${PHASE_LABELS[phase]}`}
			/>
		{/each}
	</div>

	{#if categorized.actionable.length > 0}
		<section>
			<h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
				En cours / À faire
			</h2>
			<div class="flex flex-col gap-2">
				{#each categorized.actionable as quest (quest.action.id)}
					<QuestRow
						questKey={quest.action.questKey}
						title={quest.template.title}
						displayState={quest.displayState}
						phaseName={PHASE_LABELS[quest.template.phase]}
						dueDate={quest.dueDate}
						completedAt={quest.action.completedAt}
						waitStartedAt={quest.action.waitStartedAt}
						lastRemindedAt={quest.action.lastRemindedAt}
						unmetDeps={quest.unmetDeps}
						targetTab={getTargetTab(quest.action.questKey)}
						{formationId}
					/>
				{/each}
			</div>
		</section>
	{/if}

	{#if categorized.waiting.length > 0}
		<section>
			<h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
				En attente
			</h2>
			<div class="flex flex-col gap-2">
				{#each categorized.waiting as quest (quest.action.id)}
					<QuestRow
						questKey={quest.action.questKey}
						title={quest.template.title}
						displayState={quest.displayState}
						phaseName={PHASE_LABELS[quest.template.phase]}
						dueDate={quest.dueDate}
						completedAt={quest.action.completedAt}
						waitStartedAt={quest.action.waitStartedAt}
						lastRemindedAt={quest.action.lastRemindedAt}
						unmetDeps={quest.unmetDeps}
						targetTab={getTargetTab(quest.action.questKey)}
						{formationId}
						onRemind={() => handleReminder(quest.action.id)}
					/>
				{/each}
			</div>
		</section>
	{/if}

	{#if categorized.locked.length > 0}
		{@const evalLocked = categorized.locked.filter(
			(q) => q.action.phase === 'evaluation' && q.displayState === 'hard_locked'
		)}
		{@const nonEvalLocked = categorized.locked.filter(
			(q) => !(q.action.phase === 'evaluation' && q.displayState === 'hard_locked')
		)}
		<section>
			<h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
				À venir
			</h2>
			<div class="flex flex-col gap-2">
				{#each nonEvalLocked as quest (quest.action.id)}
					<QuestRow
						questKey={quest.action.questKey}
						title={quest.template.title}
						displayState={quest.displayState}
						phaseName={PHASE_LABELS[quest.template.phase]}
						dueDate={quest.dueDate}
						completedAt={quest.action.completedAt}
						waitStartedAt={quest.action.waitStartedAt}
						lastRemindedAt={quest.action.lastRemindedAt}
						unmetDeps={quest.unmetDeps}
						targetTab={getTargetTab(quest.action.questKey)}
						{formationId}
						onOverrideSoftLock={quest.displayState === 'soft_locked'
							? () => handleOverrideSoftLock(quest.action.id)
							: undefined}
					/>
				{/each}

				{#if evalLocked.length > 3}
					<button
						type="button"
						class="w-full cursor-pointer rounded-lg border border-dashed border-muted-foreground/20 px-4 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/50"
						onclick={() => (showAllEvalSteps = !showAllEvalSteps)}
					>
						{#if showAllEvalSteps}
							Masquer les étapes d'évaluation
						{:else}
							+ {evalLocked.length} étapes d'évaluation (après la formation)
						{/if}
					</button>
					{#if showAllEvalSteps}
						{#each evalLocked as quest (quest.action.id)}
							<QuestRow
								questKey={quest.action.questKey}
								title={quest.template.title}
								displayState={quest.displayState}
								phaseName={PHASE_LABELS[quest.template.phase]}
								dueDate={quest.dueDate}
								completedAt={quest.action.completedAt}
								waitStartedAt={quest.action.waitStartedAt}
								lastRemindedAt={quest.action.lastRemindedAt}
								unmetDeps={quest.unmetDeps}
								targetTab={getTargetTab(quest.action.questKey)}
								{formationId}
							/>
						{/each}
					{/if}
				{:else}
					{#each evalLocked as quest (quest.action.id)}
						<QuestRow
							questKey={quest.action.questKey}
							title={quest.template.title}
							displayState={quest.displayState}
							phaseName={PHASE_LABELS[quest.template.phase]}
							dueDate={quest.dueDate}
							completedAt={quest.action.completedAt}
							waitStartedAt={quest.action.waitStartedAt}
							lastRemindedAt={quest.action.lastRemindedAt}
							unmetDeps={quest.unmetDeps}
							targetTab={getTargetTab(quest.action.questKey)}
							{formationId}
						/>
					{/each}
				{/if}
			</div>
		</section>
	{/if}

	{#if categorized.completed.length > 0}
		<section>
			<h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
				Historique
			</h2>
			<div class="flex flex-col gap-2">
				{#each categorized.completed as quest (quest.action.id)}
					<QuestRow
						questKey={quest.action.questKey}
						title={quest.template.title}
						displayState={quest.displayState}
						phaseName={PHASE_LABELS[quest.template.phase]}
						dueDate={quest.dueDate}
						completedAt={quest.action.completedAt}
						waitStartedAt={quest.action.waitStartedAt}
						lastRemindedAt={quest.action.lastRemindedAt}
						unmetDeps={quest.unmetDeps}
						targetTab={getTargetTab(quest.action.questKey)}
						{formationId}
					/>
				{/each}
			</div>
		</section>
	{/if}
</div>

<LevelUpToast
	phaseName={levelUpPhase ?? ''}
	message={levelUpMessage}
	show={showLevelUp}
	onClose={() => (showLevelUp = false)}
/>
