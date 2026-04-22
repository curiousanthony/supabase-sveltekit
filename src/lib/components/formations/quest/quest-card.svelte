<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { cn } from '$lib/utils';
	import { PHASE_LABELS, type QuestTemplate, type InlineConfig } from '$lib/formation-quests';
	import InlineConfirm from './inline-confirm.svelte';
	import InlineWaitExternal from './inline-wait-external.svelte';
	import InlineExternalLink from './inline-external-link.svelte';
	import InlineVerifyFields from './inline-verify-fields.svelte';
	import InlineUploadDocument from './inline-upload-document.svelte';
	import InlineGenerateDocument from './inline-generate-document.svelte';
	import InlineSendEmail from './inline-send-email.svelte';
	import InlineSelectPeople from './inline-select-people.svelte';
	import InlineView from './inline-view.svelte';
	import Check from '@lucide/svelte/icons/check';
	import Circle from '@lucide/svelte/icons/circle';
	import CircleDot from '@lucide/svelte/icons/circle-dot';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Info from '@lucide/svelte/icons/info';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import Calendar from '@lucide/svelte/icons/calendar';
	import { slide } from 'svelte/transition';
	import { invalidateAll } from '$app/navigation';

	interface SubAction {
		id: string;
		title: string;
		completed: boolean;
		orderIndex: number;
		inlineType?: string | null;
		document?: { id: string; fileName: string; fileSize: number } | null;
	}

	interface Action {
		id: string;
		questKey: string | null;
		status: string;
		phase: string | null;
		title: string;
		dueDate: string | null;
		completedAt: string | null;
		updatedAt?: string | null;
		guidanceDismissed: boolean;
		subActions: SubAction[];
	}

	interface Props {
		action: Action;
		template: QuestTemplate | null;
		urgencyScore: number;
		dueDate: string | null;
		formation: Record<string, unknown>;
		expanded: boolean;
		onToggleExpand: () => void;
		onSubActionToggle: (subActionId: string, completed: boolean) => void;
		onStatusChange: (actionId: string, newStatus: string) => void;
		callAction: (actionName: string, data: FormData) => Promise<boolean>;
	}

	let {
		action,
		template,
		urgencyScore,
		dueDate,
		formation,
		expanded,
		onToggleExpand,
		onSubActionToggle,
		onStatusChange,
		callAction
	}: Props = $props();

	const completedCount = $derived(action.subActions.filter((s) => s.completed).length);
	const totalCount = $derived(action.subActions.length);
	const isComplete = $derived(action.status === 'Terminé');
	const activeSubActionIndex = $derived(action.subActions.findIndex((s) => !s.completed));
	const progressPercent = $derived(totalCount > 0 ? (completedCount / totalCount) * 100 : 0);

	const phaseColors: Record<string, string> = {
		conception: 'bg-blue-50 text-blue-700 border-blue-200',
		deploiement: 'bg-amber-50 text-amber-700 border-amber-200',
		evaluation: 'bg-green-50 text-green-700 border-green-200'
	};

	const urgencyBorderColors: Record<string, string> = {
		overdue: 'border-l-red-500 bg-red-50/30',
		soon: 'border-l-amber-400',
		normal: 'border-l-blue-400',
		completed: 'border-l-green-400'
	};

	const urgencyLevel = $derived.by(() => {
		if (isComplete) return 'completed';
		if (!dueDate) return 'normal';
		const d = new Date(dueDate);
		const now = new Date();
		const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
		if (diff < 0) return 'overdue';
		if (diff <= 7) return 'soon';
		return 'normal';
	});

	function formatDueDate(date: string) {
		return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
	}

	function getInlineType(subAction: SubAction): string | null {
		if (!template) return subAction.inlineType ?? null;
		const templateSub = template.subActions[subAction.orderIndex];
		return templateSub?.inlineType ?? subAction.inlineType ?? null;
	}

	function getInlineConfig(subAction: SubAction): InlineConfig | null {
		if (!template) return null;
		const templateSub = template.subActions[subAction.orderIndex];
		return templateSub?.inlineConfig ?? null;
	}

	function getSubActionDescription(subAction: SubAction): string | undefined {
		if (!template) return undefined;
		return template.subActions[subAction.orderIndex]?.description;
	}

	function getRecipients(recipientType: string): { email: string; name: string }[] {
		const f = formation as Record<string, unknown>;
		if (recipientType === 'apprenant') {
			const apprenants = (f.formationApprenants ?? []) as {
				contact: { firstName?: string | null; lastName?: string | null; email?: string | null };
			}[];
			return apprenants
				.filter((a) => a.contact?.email)
				.map((a) => ({
					email: a.contact.email!,
					name: [a.contact.firstName, a.contact.lastName].filter(Boolean).join(' ') || a.contact.email!
				}));
		}
		if (recipientType === 'formateur') {
			const formateurs = (f.formationFormateurs ?? []) as {
				formateur: { user?: { email?: string | null; firstName?: string | null; lastName?: string | null } | null };
			}[];
			return formateurs
				.filter((ff) => ff.formateur?.user?.email)
				.map((ff) => ({
					email: ff.formateur.user!.email!,
					name:
						[ff.formateur.user!.firstName, ff.formateur.user!.lastName]
							.filter(Boolean)
							.join(' ') || ff.formateur.user!.email!
				}));
		}
		if (recipientType === 'client') {
			const client = f.client as { email?: string | null; legalName?: string | null } | null;
			const company = f.company as { email?: string | null; name?: string | null } | null;
			const email = client?.email ?? company?.email;
			if (!email) return [];
			return [{ email, name: company?.name ?? client?.legalName ?? email }];
		}
		return [];
	}

	function getAvailablePeople(
		peopleType: 'formateur' | 'apprenant'
	): { id: string; name: string; email?: string }[] {
		const f = formation as Record<string, unknown>;
		if (peopleType === 'formateur') {
			const formateurs = (f.formationFormateurs ?? []) as {
				formateur: {
					id: string;
					user?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null;
				};
			}[];
			return formateurs.map((ff) => ({
				id: ff.formateur.id,
				name:
					[ff.formateur.user?.firstName, ff.formateur.user?.lastName].filter(Boolean).join(' ') ||
					ff.formateur.user?.email ||
					'Formateur',
				email: ff.formateur.user?.email ?? undefined
			}));
		}
		const apprenants = (f.formationApprenants ?? []) as {
			contact: {
				id: string;
				firstName?: string | null;
				lastName?: string | null;
				email?: string | null;
			};
		}[];
		return apprenants.map((a) => ({
			id: a.contact.id,
			name: [a.contact.firstName, a.contact.lastName].filter(Boolean).join(' ') || a.contact.email || 'Apprenant',
			email: a.contact.email ?? undefined
		}));
	}

	async function handleFieldSave(field: string, value: string) {
		const fd = new FormData();
		fd.append('field', field);
		fd.append('value', value);
		await callAction('updateFormationField', fd);
		await invalidateAll();
	}

	async function handleUpload(subActionId: string, file: File) {
		const fd = new FormData();
		fd.append('subActionId', subActionId);
		fd.append('file', file);
		await callAction('uploadDocument', fd);
		await invalidateAll();
	}

	async function handleDeleteDocument(documentId: string) {
		const fd = new FormData();
		fd.append('documentId', documentId);
		await callAction('deleteDocument', fd);
		await invalidateAll();
	}

	async function handleGenerateDocument(documentType: string, subActionId: string) {
		const fd = new FormData();
		fd.append('documentType', documentType);
		fd.append('subActionId', subActionId);
		fd.append('formationId', String((formation as Record<string, unknown>).id ?? ''));
		await callAction('generateQuestDocument', fd);
		await invalidateAll();
	}

	async function handleSendEmail(
		emailType: string,
		recipientType: string,
		recipientEmail: string,
		recipientName: string,
		subActionId: string
	) {
		const fd = new FormData();
		fd.append('emailType', emailType);
		fd.append('recipientType', recipientType);
		fd.append('recipientEmail', recipientEmail);
		fd.append('recipientName', recipientName);
		fd.append('subActionId', subActionId);
		await callAction('sendQuestEmail', fd);
		await invalidateAll();
	}

	async function handleSelectPerson(personId: string, subActionId: string) {
		const fd = new FormData();
		fd.append('formateurId', personId);
		fd.append('subActionId', subActionId);
		await callAction('assignFormateur', fd);
		await invalidateAll();
	}

	async function handleFieldConfirmAll(subActionId: string) {
		const fd = new FormData();
		fd.append('subActionId', subActionId);
		fd.append('completed', 'true');
		await callAction('toggleSubAction', fd);
		await invalidateAll();
	}

	async function handleViewConfirm(subActionId: string) {
		const fd = new FormData();
		fd.append('subActionId', subActionId);
		fd.append('completed', 'true');
		await callAction('toggleSubAction', fd);
		await invalidateAll();
	}
</script>

<div
	class={cn(
		'rounded-lg border border-l-4 bg-card shadow-sm transition-shadow hover:shadow-md',
		urgencyBorderColors[urgencyLevel],
		isComplete && 'opacity-60'
	)}
>
	<button
		type="button"
		class="flex w-full items-center justify-between gap-3 p-4 text-left"
		onclick={onToggleExpand}
	>
		<div class="flex min-w-0 flex-1 items-center gap-3">
			{#if action.phase}
				<span
					class={cn(
						'shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
						phaseColors[action.phase]
					)}
				>
					{PHASE_LABELS[action.phase as keyof typeof PHASE_LABELS] ?? action.phase}
				</span>
			{/if}
			<span class="truncate font-semibold text-foreground">{action.title}</span>
		</div>
		<div class="flex shrink-0 items-center gap-3">
			<div class="flex items-center gap-1.5">
				<div class="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
					<div
						class={cn(
							'h-full rounded-full transition-all',
							isComplete ? 'bg-green-500' : 'bg-blue-500'
						)}
						style="width: {progressPercent}%"
					></div>
				</div>
				<span class="text-xs text-muted-foreground">{completedCount}/{totalCount}</span>
			</div>
			{#if dueDate}
				<span
					class={cn(
						'flex items-center gap-1 text-xs',
						urgencyLevel === 'overdue'
							? 'font-medium text-red-600'
							: urgencyLevel === 'soon'
								? 'text-amber-600'
								: 'text-muted-foreground'
					)}
				>
					<Calendar class="size-3" />
					{formatDueDate(dueDate)}
				</span>
			{/if}
			{#if expanded}
				<ChevronDown class="size-4 text-muted-foreground" />
			{:else}
				<ChevronRight class="size-4 text-muted-foreground" />
			{/if}
		</div>
	</button>

	{#if expanded}
		<div class="border-t px-4 pb-4 pt-3" transition:slide={{ duration: 200 }}>
			<ul class="space-y-1">
				{#each action.subActions as subAction, i (subAction.id)}
					{@const isActive = i === activeSubActionIndex}
					{@const isFuture =
						!subAction.completed && i > activeSubActionIndex && activeSubActionIndex !== -1}
					{@const desc = getSubActionDescription(subAction)}
					<li
						class={cn(
							'flex items-start gap-2 rounded-md px-2 py-2 transition-colors',
							isActive && 'bg-accent/50 p-3',
							isFuture && 'text-muted-foreground/60'
						)}
					>
						{#if subAction.completed}
							<Check class="mt-0.5 size-4 shrink-0 text-green-600" />
						{:else if isActive}
							<CircleDot class="mt-0.5 size-4 shrink-0 text-blue-600" />
						{:else}
							<Circle class="mt-0.5 size-4 shrink-0 text-muted-foreground/40" />
						{/if}

						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-1.5">
								<span
									class={cn(
										'text-sm',
										subAction.completed && 'text-muted-foreground line-through'
									)}
								>
									{subAction.title}
								</span>
								{#if desc && !subAction.completed}
									<Tooltip.Root>
										<Tooltip.Trigger>
											<Info class="size-3.5 shrink-0 text-muted-foreground/50 hover:text-muted-foreground" />
										</Tooltip.Trigger>
										<Tooltip.Content>
											<p class="max-w-xs text-xs">{desc}</p>
										</Tooltip.Content>
									</Tooltip.Root>
								{/if}
							</div>

							{#if isActive}
								{@const inlineType = getInlineType(subAction)}
								{@const config = getInlineConfig(subAction)}
								{#if inlineType}
									<div class="mt-2">
										{#if inlineType === 'confirm-task'}
											<InlineConfirm
												completed={subAction.completed}
												onToggle={() =>
													onSubActionToggle(subAction.id, !subAction.completed)}
											/>
										{:else if inlineType === 'wait-external'}
											{@const reminderType =
												config && 'reminderEmailType' in config
													? String(config.reminderEmailType)
													: null}
											{@const waitRecipients = getRecipients('client')}
											<InlineWaitExternal
												completed={subAction.completed}
												waitingFor={config && 'waitingFor' in config
													? String(config.waitingFor)
													: 'Tiers'}
												onToggle={() =>
													onSubActionToggle(subAction.id, !subAction.completed)}
												onRemind={reminderType && waitRecipients.length > 0
													? async () => {
															const r = waitRecipients[0];
															await handleSendEmail(
																reminderType,
																'client',
																r.email,
																r.name,
																subAction.id
															);
														}
													: undefined}
											/>
										{:else if inlineType === 'external-link'}
											<InlineExternalLink
												completed={subAction.completed}
												url={config && 'url' in config
													? String(config.url)
													: null}
												label={config && 'label' in config
													? String(config.label)
													: 'Ouvrir'}
												onToggle={() =>
													onSubActionToggle(subAction.id, !subAction.completed)}
											/>
										{:else if inlineType === 'verify-fields'}
											<InlineVerifyFields
												fields={config && 'fields' in config
													? (config.fields as { key: string; label: string; type: 'text' | 'textarea' | 'date' | 'number' | 'select' | 'company-display'; options?: string[] }[])
													: []}
												{formation}
												completed={subAction.completed}
												onSave={handleFieldSave}
												onConfirmAll={() => handleFieldConfirmAll(subAction.id)}
											/>
										{:else if inlineType === 'upload-document'}
											<InlineUploadDocument
												completed={subAction.completed}
												acceptedFileTypes={config && 'acceptedFileTypes' in config
													? (config.acceptedFileTypes as string[])
													: null}
												label={config && 'label' in config
													? String(config.label)
													: undefined}
												subActionId={subAction.id}
												existingDocument={subAction.document ?? null}
												onUpload={handleUpload}
												onDelete={handleDeleteDocument}
											/>
										{:else if inlineType === 'generate-document'}
											<InlineGenerateDocument
												completed={subAction.completed}
												documentType={config && 'documentType' in config
													? String(config.documentType)
													: 'convention'}
												formationId={String(
													(formation as Record<string, unknown>).id ?? ''
												)}
												subActionId={subAction.id}
												onGenerate={handleGenerateDocument}
											/>
										{:else if inlineType === 'send-email'}
											{@const emailType =
												config && 'emailType' in config
													? String(config.emailType)
													: 'generic'}
											{@const recipientType =
												config && 'recipientType' in config
													? String(config.recipientType)
													: 'client'}
											<InlineSendEmail
												completed={subAction.completed}
												{emailType}
												{recipientType}
												subActionId={subAction.id}
												recipients={getRecipients(recipientType)}
												onSend={handleSendEmail}
											/>
										{:else if inlineType === 'select-people'}
											{@const peopleType =
												config && 'peopleType' in config
													? (config.peopleType as 'formateur' | 'apprenant')
													: 'formateur'}
											<InlineSelectPeople
												completed={subAction.completed}
												{peopleType}
												people={getAvailablePeople(peopleType)}
												onSelect={(personId) =>
													handleSelectPerson(personId, subAction.id)}
											/>
										{:else if inlineType === 'inline-view'}
											<InlineView
												completed={subAction.completed}
												viewType={config && 'viewType' in config
													? (config.viewType as
															| 'seances'
															| 'programme'
															| 'finances'
															| 'apprenants'
															| 'formateurs')
													: 'programme'}
												{formation}
												onConfirm={() => handleViewConfirm(subAction.id)}
											/>
										{/if}
									</div>
								{/if}
							{/if}
						</div>
					</li>
				{/each}
			</ul>

			{#if isComplete}
				<div class="mt-3 flex justify-end">
					<Button
						variant="ghost"
						size="sm"
						onclick={() => onStatusChange(action.id, 'En cours')}
					>
						<RotateCcw class="size-3.5" />
						Rouvrir
					</Button>
				</div>
			{/if}
		</div>
	{/if}
</div>
