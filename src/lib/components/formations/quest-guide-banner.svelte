<script lang="ts">
	import { page } from '$app/state';
	import { replaceState, invalidateAll } from '$app/navigation';
	import { deserialize } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { getQuestTemplate } from '$lib/formation-quests';
	import X from '@lucide/svelte/icons/x';
	import Check from '@lucide/svelte/icons/check';

	const questKey = $derived(page.url.searchParams.get('quest'));
	const template = $derived(questKey ? getQuestTemplate(questKey) : undefined);

	const formation = $derived((page.data as any)?.formation);
	const formationId = $derived(formation?.id ?? '');
	const matchingAction = $derived(
		questKey
			? (formation?.actions ?? []).find(
					(a: any) => a.questKey === questKey && a.status !== 'Terminé'
				)
			: undefined
	);

	let dismissed = $state(false);
	let completing = $state(false);
	let visible = $derived(!!template && !dismissed);

	function dismiss() {
		dismissed = true;
		const url = new URL(page.url);
		url.searchParams.delete('quest');
		replaceState(url, {});
	}

	$effect(() => {
		if (questKey) {
			dismissed = false;
		}
	});

	async function markComplete() {
		if (!matchingAction || completing) return;
		completing = true;
		try {
			const formData = new FormData();
			formData.append('actionId', matchingAction.id);
			formData.append('newStatus', 'Terminé');
			formData.append('forceComplete', 'true');
			const response = await fetch(
				`/formations/${formationId}/suivi?/updateQuestStatus`,
				{ method: 'POST', body: formData }
			);
			const result = deserialize(await response.text());
			if (result.type === 'success') {
				toast.success('Étape complétée');
				dismiss();
				await invalidateAll();
			} else if (result.type === 'failure') {
				toast.error(
					(result.data as { message?: string })?.message ?? 'Erreur'
				);
			}
		} catch {
			toast.error('Erreur réseau');
		} finally {
			completing = false;
		}
	}
</script>

{#if visible && template}
	<div
		class="animate-in fade-in slide-in-from-top-2 mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950/30"
	>
		<div class="min-w-0 flex-1">
			<p class="text-sm font-medium text-amber-900 dark:text-amber-200">
				{template.title}
			</p>
			<p class="mt-0.5 text-sm text-amber-800/80 dark:text-amber-300/80">
				{template.guidance}
			</p>
		</div>
		{#if matchingAction}
			<button
				type="button"
				disabled={completing}
				class="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
				onclick={markComplete}
			>
				<Check class="size-3.5" />
				{completing ? 'En cours…' : 'Marquer comme fait'}
			</button>
		{/if}
		<button
			type="button"
			class="shrink-0 rounded-md p-1 text-amber-600 transition-colors hover:bg-amber-100 hover:text-amber-900 dark:text-amber-400 dark:hover:bg-amber-900"
			onclick={dismiss}
		>
			<X class="size-4" />
		</button>
	</div>
{/if}
