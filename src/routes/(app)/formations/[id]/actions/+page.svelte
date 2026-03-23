<script lang="ts">
	import type { PageProps } from './$types';
	import { deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { untrack } from 'svelte';
	import { PHASE_LABELS, type QuestPhase } from '$lib/formation-quests';
	import { playMicroSound, playMediumSound, playMacroSound } from '$lib/sounds';
	import LevelUpToast from '$lib/components/formations/level-up-toast.svelte';
	import QuestBoard from '$lib/components/formations/quest/quest-board.svelte';

	let { data }: PageProps = $props();

	const formation = $derived(data?.formation);
	const actions = $derived(formation?.actions ?? []);

	let levelUpPhase = $state<string | null>(null);
	let showLevelUp = $state(false);

	const phases: QuestPhase[] = ['conception', 'deploiement', 'evaluation'];

	const phaseCompletion = $derived(
		Object.fromEntries(
			phases.map((p) => {
				const phaseActions = actions.filter((a) => a.phase === p);
				return [p, phaseActions.length > 0 && phaseActions.every((a) => a.status === 'Terminé')];
			})
		) as Record<string, boolean>
	);

	let prevPhaseCompletion = $state<Record<string, boolean>>({});

	$effect(() => {
		const current = phaseCompletion;
		const prev = untrack(() => prevPhaseCompletion);
		const isInitialRun = Object.keys(prev).length === 0;

		for (const phase of phases) {
			if (current[phase] && !prev[phase] && !isInitialRun) {
				levelUpPhase = PHASE_LABELS[phase];
				showLevelUp = true;
				playMacroSound();
			}
		}

		prevPhaseCompletion = { ...current };
	});

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

	async function handleSubActionToggle(subActionId: string, completed: boolean) {
		playMicroSound();
		const formData = new FormData();
		formData.append('subActionId', subActionId);
		formData.append('completed', String(completed));
		await callAction('toggleSubAction', formData);
	}

	async function handleStatusChange(actionId: string, newStatus: string) {
		if (newStatus === 'Terminé') {
			playMediumSound();
		}
		const formData = new FormData();
		formData.append('actionId', actionId);
		formData.append('newStatus', newStatus);
		await callAction('updateQuestStatus', formData);
		if (newStatus === 'Terminé') {
			toast.success('Action terminée');
		} else if (
			newStatus === 'En cours' &&
			actions.find((a) => a.id === actionId)?.status === 'Terminé'
		) {
			toast.info('Action rouverte');
		}
	}

	async function handleDismissGuidance(actionId: string) {
		const formData = new FormData();
		formData.append('actionId', actionId);
		await callAction('dismissGuidance', formData);
	}
</script>

<div class="mx-auto max-w-3xl">
	<QuestBoard
		{actions}
		formation={formation as unknown as Record<string, unknown>}
		onSubActionToggle={handleSubActionToggle}
		onStatusChange={handleStatusChange}
		onDismissGuidance={handleDismissGuidance}
		{callAction}
	/>
</div>

<LevelUpToast
	phaseName={levelUpPhase ?? ''}
	show={showLevelUp}
	onClose={() => (showLevelUp = false)}
/>
