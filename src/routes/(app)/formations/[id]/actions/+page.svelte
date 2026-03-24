<script lang="ts">
	import type { PageProps } from './$types';
	import { page } from '$app/stores';
	import { deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { untrack } from 'svelte';
	import { slide } from 'svelte/transition';
	import { cn } from '$lib/utils';
	import {
		PHASE_LABELS,
		getQuestTemplate,
		getBlockingInfo,
		type QuestPhase
	} from '$lib/formation-quests';
	import { playMicroSound, playMediumSound, playMacroSound } from '$lib/sounds';
	import LevelUpToast from '$lib/components/formations/level-up-toast.svelte';
	import FileUpload from '$lib/components/custom/file-upload.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import Check from '@lucide/svelte/icons/check';
	import Circle from '@lucide/svelte/icons/circle';
	import Lock from '@lucide/svelte/icons/lock';
	import Clock from '@lucide/svelte/icons/clock';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Info from '@lucide/svelte/icons/info';
	import Upload from '@lucide/svelte/icons/upload';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import MessageSquare from '@lucide/svelte/icons/message-square';
	import Send from '@lucide/svelte/icons/send';

	let { data }: PageProps = $props();

	const formation = $derived(data?.formation);
	const actions = $derived(formation?.actions ?? []);

	let selectedQuestId = $state<string | null>(null);
	let collapsedPhases = $state<Record<string, boolean>>({});
	let levelUpPhase = $state<string | null>(null);
	let showLevelUp = $state(false);

	type ActionType = (typeof actions)[number];

	const phases: QuestPhase[] = ['conception', 'deploiement', 'evaluation'];

	const groupedByPhase = $derived(
		phases.map((phase) => ({
			phase,
			label: PHASE_LABELS[phase],
			actions: actions.filter((a) => a.phase === phase)
		}))
	);

	const phaseProgress = $derived(
		Object.fromEntries(
			groupedByPhase.map((g) => [
				g.phase,
				{
					completed: g.actions.filter((a) => a.status === 'Terminé').length,
					total: g.actions.length,
					allDone: g.actions.length > 0 && g.actions.every((a) => a.status === 'Terminé')
				}
			])
		) as Record<string, { completed: number; total: number; allDone: boolean }>
	);

	const selectedQuest = $derived(
		selectedQuestId ? actions.find((a) => a.id === selectedQuestId) ?? null : null
	);

	const selectedQuestTemplate = $derived(
		selectedQuest?.questKey ? getQuestTemplate(selectedQuest.questKey) : null
	);

	const selectedQuestBlocking = $derived(
		selectedQuest ? getBlockingInfo(selectedQuest, actions) : { blocked: false, blockerNames: [] }
	);

	const allSubActionsDone = $derived(
		selectedQuest?.subActions?.length
			? selectedQuest.subActions.every((s) => s.completed)
			: true
	);

	const subActionsLocked = $derived(
		selectedQuest?.status === 'Pas commencé' || selectedQuest?.status === 'Terminé'
	);

	const nextActionableQuest = $derived.by(() => {
		if (!selectedQuest || selectedQuest.status !== 'Terminé') return null;
		return actions.find(
			(a) => a.id !== selectedQuest.id && a.status !== 'Terminé' && !getBlockingInfo(a, actions).blocked
		) ?? null;
	});

	let prevPhaseCompletion = $state<Record<string, boolean>>({});

	$effect(() => {
		const currentCompletion = Object.fromEntries(
			phases.map((p) => [p, phaseProgress[p]?.allDone ?? false])
		);

		const prev = untrack(() => prevPhaseCompletion);
		const isInitialRun = Object.keys(prev).length === 0;

		for (const phase of phases) {
			if (currentCompletion[phase] && !prev[phase]) {
				collapsedPhases = { ...collapsedPhases, [phase]: true };

				if (!isInitialRun) {
					levelUpPhase = PHASE_LABELS[phase];
					showLevelUp = true;
					playMacroSound();
				}
			}
		}

		prevPhaseCompletion = currentCompletion;
	});

	$effect(() => {
		if (selectedQuestId) return;

		const questParam = $page.url.searchParams.get('quest');
		if (questParam) {
			const match = actions.find((a) => a.questKey === questParam);
			if (match && !getBlockingInfo(match, actions).blocked) {
				selectedQuestId = match.id;
				return;
			}
		}

		const firstActionable = actions.find(
			(a) => a.status !== 'Terminé' && !getBlockingInfo(a, actions).blocked
		);
		if (firstActionable) {
			selectedQuestId = firstActionable.id;
		}
	});

	function getQuestBlockingInfo(action: ActionType) {
		return getBlockingInfo(action, actions);
	}

	function selectQuest(action: ActionType) {
		const { blocked } = getQuestBlockingInfo(action);
		if (blocked) return;
		selectedQuestId = action.id;
	}

	function togglePhase(phase: string) {
		collapsedPhases = { ...collapsedPhases, [phase]: !collapsedPhases[phase] };
	}

	async function callAction(actionName: string, body: FormData) {
		try {
			const response = await fetch(`?/${actionName}`, { method: 'POST', body });
			if (!response.ok) {
				toast.error(`Erreur serveur (${response.status})`);
				return;
			}
			const result = deserialize(await response.text());
			if (result.type === 'success') {
				await invalidateAll();
			} else if (result.type === 'failure') {
				toast.error((result.data as { message?: string })?.message ?? 'Erreur');
			} else if (result.type === 'error') {
				toast.error(result.error?.message ?? 'Erreur inattendue');
			} else if (result.type === 'redirect') {
				toast.error('Redirection inattendue');
			}
		} catch (err) {
			console.error('callAction error:', err);
			toast.error(err instanceof Error ? err.message : 'Erreur réseau');
		}
	}

	async function handleToggleSubAction(subActionId: string, completed: boolean) {
		playMicroSound();
		const formData = new FormData();
		formData.append('subActionId', subActionId);
		formData.append('completed', String(completed));
		await callAction('toggleSubAction', formData);
	}

	async function handleCompleteQuest(actionId: string) {
		playMediumSound();
		const formData = new FormData();
		formData.append('actionId', actionId);
		formData.append('newStatus', 'Terminé');
		await callAction('updateQuestStatus', formData);
		toast.success('Action terminée');
	}

	async function handleStartQuest(actionId: string) {
		const formData = new FormData();
		formData.append('actionId', actionId);
		formData.append('newStatus', 'En cours');
		await callAction('updateQuestStatus', formData);
	}

	async function handleReopenQuest(actionId: string) {
		const formData = new FormData();
		formData.append('actionId', actionId);
		formData.append('newStatus', 'En cours');
		await callAction('updateQuestStatus', formData);
		toast.info('Action rouverte');
	}

	function formatDate(dateStr: string | null | undefined): string {
		if (!dateStr) return '';
		return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
	}

	function isOverdue(dueDate: string | null | undefined): boolean {
		if (!dueDate) return false;
		return dueDate < new Date().toISOString().slice(0, 10);
	}

	function resolveCtaTarget(target: string | null | undefined): string {
		if (!target) return '#';
		return target.replace('[id]', formation?.id ?? '');
	}

	let commentText = $state('');
	let commentSubmitting = $state(false);

	function subNeedsUpload(sub: ActionType['subActions'][number]) {
		return sub.documentRequired || (sub.acceptedFileTypes && sub.acceptedFileTypes.length > 0);
	}

	function subIsLockedByDocument(sub: ActionType['subActions'][number]) {
		return sub.documentRequired && !sub.document && !sub.completed;
	}

	async function handleUploadDocument(subActionId: string, file: File) {
		const formData = new FormData();
		formData.append('subActionId', subActionId);
		formData.append('file', file);
		await callAction('uploadDocument', formData);
	}

	async function handleDeleteDocument(documentId: string) {
		const formData = new FormData();
		formData.append('documentId', documentId);
		await callAction('deleteDocument', formData);
	}

	async function handleDownloadDocument(documentId: string) {
		const formData = new FormData();
		formData.append('documentId', documentId);
		try {
			const response = await fetch('?/downloadDocument', { method: 'POST', body: formData });
			const result = deserialize(await response.text());
			if (result.type === 'success' && result.data?.url) {
				window.open(result.data.url as string, '_blank');
			} else {
				toast.error('Impossible de télécharger le document');
			}
		} catch {
			toast.error('Erreur réseau');
		}
	}

	async function handleAddComment() {
		if (!selectedQuest || !commentText.trim()) return;
		commentSubmitting = true;
		const formData = new FormData();
		formData.append('actionId', selectedQuest.id);
		formData.append('content', commentText.trim());
		await callAction('addComment', formData);
		commentText = '';
		commentSubmitting = false;
	}

	function formatRelativeTime(dateStr: string): string {
		const now = Date.now();
		const then = new Date(dateStr).getTime();
		const diff = now - then;
		const minutes = Math.floor(diff / 60000);
		if (minutes < 1) return "à l'instant";
		if (minutes < 60) return `il y a ${minutes}min`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `il y a ${hours}h`;
		const days = Math.floor(hours / 24);
		if (days < 7) return `il y a ${days}j`;
		return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
	}

	const PHASE_COLORS: Record<string, string> = {
		conception: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
		deploiement: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
		evaluation: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
	};
</script>

<LevelUpToast phaseName={levelUpPhase ?? ''} show={showLevelUp} onClose={() => (showLevelUp = false)} />

<div class="flex min-h-0 flex-1 gap-0 md:gap-4">
	<!-- Left panel: Quest list -->
	<div
		class={cn(
			'flex w-full flex-col overflow-y-auto border-r md:w-80 md:shrink-0',
			selectedQuestId ? 'hidden md:flex' : 'flex'
		)}
	>
		{#each groupedByPhase as group}
			{@const progress = phaseProgress[group.phase]}
			{@const isCollapsed = collapsedPhases[group.phase] ?? false}
			<div class="border-b last:border-b-0">
				<button
					type="button"
					onclick={() => togglePhase(group.phase)}
					class={cn(
						'flex w-full cursor-pointer items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-muted/50',
						progress?.allDone && 'bg-muted/30'
					)}
				>
					<div class="flex items-center gap-2">
						{#if isCollapsed}
							<ChevronRight class="size-4 text-muted-foreground" />
						{:else}
							<ChevronDown class="size-4 text-muted-foreground" />
						{/if}
						<span class="text-sm font-semibold">{group.label}</span>
						{#if progress?.allDone}
							<Check class="size-3.5 text-primary" />
						{/if}
					</div>
					<span class="text-xs tabular-nums text-muted-foreground">
						{progress?.completed ?? 0}/{progress?.total ?? 0}
					</span>
				</button>

				{#if !isCollapsed}
					<div transition:slide={{ duration: 200 }} class="flex flex-col gap-0.5 px-1.5 pb-1.5">
						{#each group.actions as action}
							{@const blockInfo = getQuestBlockingInfo(action)}
							{@const isActive = selectedQuestId === action.id}
							{#if blockInfo.blocked}
							<Tooltip.Root>
								<Tooltip.Trigger>
									{#snippet child({ props })}
									<button
										{...props}
										type="button"
										disabled
										class="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left cursor-not-allowed opacity-50"
									>
										<div class="shrink-0">
											<Lock class="size-4 text-muted-foreground/50" />
										</div>
										<div class="min-w-0 flex-1">
											<span class="block truncate text-sm">{action.title}</span>
										</div>
									</button>
									{/snippet}
								</Tooltip.Trigger>
									<Tooltip.Content>
										<p class="text-xs">Bloqué par : {blockInfo.blockerNames.join(', ')}</p>
									</Tooltip.Content>
								</Tooltip.Root>
							{:else}
							<button
								type="button"
								onclick={() => selectQuest(action)}
								class={cn(
									'flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors',
									isActive && 'bg-primary/10 ring-1 ring-primary/30',
									!isActive && 'hover:bg-muted/50'
								)}
								>
									<div class="shrink-0">
										{#if action.status === 'Terminé'}
											<div class="flex size-5 items-center justify-center rounded-full bg-primary/10">
												<Check class="size-3 text-primary" />
											</div>
										{:else if action.status === 'En cours'}
											<div class="flex size-5 items-center justify-center rounded-full bg-blue-500/10">
												<Clock class="size-3 text-blue-500" />
											</div>
										{:else}
											<div class="size-5 rounded-full border-2 border-muted-foreground/30"></div>
										{/if}
									</div>

									<div class="min-w-0 flex-1">
										<span
											class={cn(
												'block truncate text-sm',
												action.status === 'Terminé' && 'text-muted-foreground line-through'
											)}
										>
											{action.title}
										</span>
									</div>

									<div class="flex shrink-0 items-center gap-1">
										{#if action.dueDate && action.status !== 'Terminé'}
											<span
												class={cn(
													'text-[10px] tabular-nums',
													isOverdue(action.dueDate)
														? 'text-destructive'
														: 'text-muted-foreground'
												)}
											>
												{formatDate(action.dueDate)}
											</span>
										{/if}
										{#if action.assignee}
											{#if action.assignee.avatarUrl}
												<img
													src={action.assignee.avatarUrl}
													alt=""
													class="size-5 rounded-full"
												/>
											{:else}
												<div class="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
													{(action.assignee.firstName?.[0] ?? '') + (action.assignee.lastName?.[0] ?? '')}
												</div>
											{/if}
										{/if}
									</div>
								</button>
							{/if}
						{/each}
					</div>
				{/if}
			</div>
		{/each}

		{#if actions.length === 0}
			<div class="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
				Aucune action n'a été créée pour cette formation.
			</div>
		{/if}
	</div>

	<!-- Right panel: Quest workspace -->
	<div
		class={cn(
			'flex flex-1 flex-col overflow-y-auto',
			!selectedQuestId ? 'hidden md:flex' : 'flex'
		)}
	>
		{#if selectedQuest}
			<!-- Mobile back button -->
			<button
				type="button"
				onclick={() => (selectedQuestId = null)}
				class="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground md:hidden"
			>
				<ChevronRight class="size-4 rotate-180" />
				Retour
			</button>

			<div class="flex flex-col gap-5 p-4 md:p-6">
				<!-- Title + phase badge + guidance info -->
				<div class="flex flex-col gap-2">
					<div class="flex items-start justify-between gap-3">
						<div class="flex items-center gap-2">
							<h2 class="text-lg font-semibold leading-tight">{selectedQuest.title}</h2>
							{#if selectedQuestTemplate?.guidance}
							<Tooltip.Root>
								<Tooltip.Trigger>
									{#snippet child({ props })}
									<button {...props} type="button" class="shrink-0 rounded-full p-0.5 text-muted-foreground/60 transition-colors hover:text-muted-foreground" aria-label="Guide Qualiopi">
										<Info class="size-4" />
									</button>
									{/snippet}
								</Tooltip.Trigger>
									<Tooltip.Content class="max-w-xs">
										<p class="text-xs">{selectedQuestTemplate.guidance}</p>
									</Tooltip.Content>
								</Tooltip.Root>
							{/if}
						</div>
						{#if selectedQuest.phase}
							<span
								class={cn(
									'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
									PHASE_COLORS[selectedQuest.phase] ?? 'bg-muted text-muted-foreground'
								)}
							>
								{PHASE_LABELS[selectedQuest.phase as QuestPhase] ?? selectedQuest.phase}
							</span>
						{/if}
					</div>
					{#if selectedQuest.description}
						<p class="text-sm text-muted-foreground">{selectedQuest.description}</p>
					{/if}
				</div>

				<!-- Meta: assignee & due date -->
				<div class="flex flex-wrap items-center gap-4 text-sm">
					{#if selectedQuest.assignee}
						<Tooltip.Root>
							<Tooltip.Trigger>
								{#if selectedQuest.assignee.avatarUrl}
									<img
										src={selectedQuest.assignee.avatarUrl}
										alt={[selectedQuest.assignee.firstName, selectedQuest.assignee.lastName].filter(Boolean).join(' ')}
										class="size-6 rounded-full"
									/>
								{:else}
									<div class="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
										{(selectedQuest.assignee.firstName?.[0] ?? '') + (selectedQuest.assignee.lastName?.[0] ?? '')}
									</div>
								{/if}
							</Tooltip.Trigger>
							<Tooltip.Content>
								<p class="text-xs">{[selectedQuest.assignee.firstName, selectedQuest.assignee.lastName].filter(Boolean).join(' ') || 'Assigné'}</p>
							</Tooltip.Content>
						</Tooltip.Root>
					{/if}
					{#if selectedQuest.dueDate}
						<div
							class={cn(
								'flex items-center gap-1.5',
								isOverdue(selectedQuest.dueDate) && selectedQuest.status !== 'Terminé'
									? 'text-destructive'
									: 'text-muted-foreground'
							)}
						>
							<Calendar class="size-3.5" />
							<span>{formatDate(selectedQuest.dueDate)}</span>
						</div>
					{/if}
					{#if selectedQuest.completedAt}
						<div class="flex items-center gap-1.5 text-muted-foreground">
							<Check class="size-3.5" />
							<span>
								Complétée le {new Date(selectedQuest.completedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
							</span>
						</div>
					{/if}
				</div>

			<!-- Sub-actions checklist -->
			{#if selectedQuest.subActions && selectedQuest.subActions.length > 0}
				<div class="flex flex-col gap-1">
					<span class="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
						Sous-tâches ({selectedQuest.subActions.filter((s) => s.completed).length}/{selectedQuest.subActions.length})
					</span>
					{#if selectedQuest.status === 'Pas commencé'}
						<p class="mb-1 text-xs text-muted-foreground italic">
							Cliquez sur « Commencer » pour débloquer les sous-tâches
						</p>
					{/if}
				{#each selectedQuest.subActions as sub}
					{@const docLocked = subIsLockedByDocument(sub)}
					<div class="rounded-md transition-colors {!subActionsLocked ? 'hover:bg-muted/50' : ''}">
						<div
							class={cn(
								'flex items-center gap-3 px-3 py-2.5',
								sub.completed && 'opacity-60',
								subActionsLocked && !sub.completed && 'opacity-50'
							)}
						>
							<input
								type="checkbox"
								id="sub-{sub.id}"
								checked={sub.completed}
								onchange={() => handleToggleSubAction(sub.id, !sub.completed)}
								disabled={subActionsLocked || docLocked}
								class={cn(
									'size-4 shrink-0 rounded border-muted-foreground/30 accent-primary',
									subActionsLocked || docLocked ? 'cursor-not-allowed' : 'cursor-pointer'
								)}
							/>
							<label
								for={subActionsLocked || docLocked ? undefined : `sub-${sub.id}`}
								class={cn(
									'min-w-0 flex-1',
									!subActionsLocked && !docLocked && 'cursor-pointer'
								)}
							>
								<span
									class={cn(
										'text-sm',
										sub.completed && 'text-muted-foreground line-through'
									)}
								>
									{sub.title}
								</span>
								{#if sub.description}
									<p class="mt-0.5 text-xs text-muted-foreground">{sub.description}</p>
								{/if}
								{#if docLocked}
									<p class="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
										Déposez le document pour valider cette sous-tâche
									</p>
								{/if}
							</label>
							{#if !sub.completed && !subActionsLocked}
								{#if sub.ctaType === 'navigate' && sub.ctaTarget}
									<Button
										size="sm"
										variant="outline"
										href={resolveCtaTarget(sub.ctaTarget)}
										class="shrink-0 gap-1.5 text-xs"
									>
										{sub.ctaLabel ?? 'Ouvrir'}
										<ArrowRight class="size-3" />
									</Button>
								{:else if sub.ctaType === 'external'}
									<Button
										size="sm"
										variant="outline"
										class="shrink-0 gap-1.5 text-xs"
										onclick={() => toast.info('Lien externe bientôt disponible')}
									>
										<ExternalLink class="size-3" />
										{sub.ctaLabel ?? 'Ouvrir'}
									</Button>
								{/if}
							{/if}
						</div>
						{#if subNeedsUpload(sub) && !subActionsLocked}
							<div class="px-3 pb-2.5 pl-10">
								<FileUpload
									accept={sub.acceptedFileTypes ?? null}
									value={sub.document ?? null}
									onUpload={(file) => handleUploadDocument(sub.id, file)}
									onDelete={sub.document ? () => handleDeleteDocument(sub.document!.id) : undefined}
									onDownload={sub.document ? () => handleDownloadDocument(sub.document!.id) : undefined}
									disabled={selectedQuest?.status === 'Terminé'}
								/>
							</div>
						{/if}
					</div>
				{/each}
					</div>
				{/if}

		<!-- Comments / Notes -->
		{#if selectedQuest}
			{@const comments = selectedQuest.comments ?? []}
			<div class="flex flex-col gap-3">
				<div class="flex items-center gap-2">
					<MessageSquare class="size-4 text-muted-foreground" />
					<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						Notes ({comments.length})
					</span>
				</div>

				{#if comments.length > 0}
					<div class="flex flex-col gap-2">
						{#each comments as comment}
							<div class="flex gap-2.5 rounded-md bg-muted/40 px-3 py-2.5">
								{#if comment.user?.avatarUrl}
									<img
										src={comment.user.avatarUrl}
										alt=""
										class="mt-0.5 size-6 shrink-0 rounded-full"
									/>
								{:else}
									<div class="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
										{(comment.user?.firstName?.[0] ?? '') + (comment.user?.lastName?.[0] ?? '')}
									</div>
								{/if}
								<div class="min-w-0 flex-1">
									<div class="flex items-baseline gap-2">
										<span class="text-sm font-medium">
											{[comment.user?.firstName, comment.user?.lastName].filter(Boolean).join(' ') || 'Utilisateur'}
										</span>
										<span class="text-[11px] text-muted-foreground">
											{formatRelativeTime(comment.createdAt)}
										</span>
									</div>
									<p class="mt-0.5 text-sm text-foreground/90 whitespace-pre-wrap">{comment.content}</p>
								</div>
							</div>
						{/each}
					</div>
				{/if}

				<div class="flex gap-2">
					<input
						type="text"
						bind:value={commentText}
						placeholder="Ajouter une note…"
						class="flex-1 rounded-md border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
						onkeydown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
						disabled={commentSubmitting}
					/>
					<Button
						size="sm"
						variant="outline"
						onclick={handleAddComment}
						disabled={commentSubmitting || !commentText.trim()}
						class="shrink-0 gap-1.5"
					>
						<Send class="size-3.5" />
					</Button>
				</div>
			</div>
		{/if}

		<!-- Action buttons -->
		{#if selectedQuest.status === 'Pas commencé' && !selectedQuestBlocking.blocked}
				<Button
					variant="outline"
					onclick={() => handleStartQuest(selectedQuest!.id)}
					class="w-fit gap-2"
				>
					<Clock class="size-4" />
					Commencer
				</Button>
			{:else if selectedQuest.status === 'En cours'}
				<div class="flex flex-col gap-2">
					<Button
						variant="default"
						disabled={!allSubActionsDone}
						onclick={() => handleCompleteQuest(selectedQuest!.id)}
						class="w-fit gap-2"
					>
						<Check class="size-4" />
						Marquer comme terminé
					</Button>
					{#if !allSubActionsDone}
						<p class="text-xs text-muted-foreground">
							Complétez toutes les sous-tâches pour terminer cette action
							({selectedQuest.subActions?.filter((s) => s.completed).length ?? 0}/{selectedQuest.subActions?.length ?? 0})
						</p>
					{/if}
				</div>
			{:else if selectedQuest.status === 'Terminé'}
				<div class="flex flex-wrap items-center gap-2">
					{#if nextActionableQuest}
						<Button
							variant="default"
							onclick={() => { selectedQuestId = nextActionableQuest!.id; }}
							class="w-fit gap-2"
						>
							Action suivante
							<ArrowRight class="size-4" />
						</Button>
					{/if}
					<Button
						variant="outline"
						onclick={() => handleReopenQuest(selectedQuest!.id)}
						class="w-fit gap-2"
					>
						<RotateCcw class="size-4" />
						Rouvrir
					</Button>
				</div>
			{/if}
			</div>
		{:else}
			<div class="flex flex-1 items-center justify-center p-6">
				<div class="text-center">
					<div class="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
						<Circle class="size-5 text-muted-foreground" />
					</div>
					<p class="text-sm text-muted-foreground">
						Sélectionnez une action pour voir ses détails
					</p>
				</div>
			</div>
		{/if}
	</div>
</div>
