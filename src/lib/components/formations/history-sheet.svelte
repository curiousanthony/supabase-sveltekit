<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import Pencil from '@lucide/svelte/icons/pencil';
	import CheckCircle from '@lucide/svelte/icons/check-circle';
	import Trophy from '@lucide/svelte/icons/trophy';
	import Calendar from '@lucide/svelte/icons/calendar';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import UserMinus from '@lucide/svelte/icons/user-minus';
	import FileUp from '@lucide/svelte/icons/file-up';
	import Receipt from '@lucide/svelte/icons/receipt';
	import MessageSquare from '@lucide/svelte/icons/message-square';
	import Wallet from '@lucide/svelte/icons/wallet';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import FileSignature from '@lucide/svelte/icons/file-signature';
	import ArrowRightCircle from '@lucide/svelte/icons/arrow-right-circle';
	import Check from '@lucide/svelte/icons/check';
	import Trash from '@lucide/svelte/icons/trash';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import type { Component } from 'svelte';

	interface AuditEntry {
		id: string;
		actionType: string;
		entityType: string | null;
		entityId: string | null;
		fieldName: string | null;
		oldValue: string | null;
		newValue: string | null;
		createdAt: string;
		user: {
			id: string;
			firstName: string | null;
			lastName: string | null;
			avatarUrl: string | null;
		} | null;
	}

	let {
		open = $bindable(false),
		entries = []
	}: {
		open: boolean;
		entries: AuditEntry[];
	} = $props();

	const ICON_MAP: Record<string, Component> = {
		field_update: Pencil,
		quest_completed: CheckCircle,
		sub_action_toggled: Check,
		phase_completed: Trophy,
		status_changed: ArrowRightCircle,
		session_created: Calendar,
		session_updated: Calendar,
		session_deleted: Trash,
		learner_added: UserPlus,
		learner_removed: UserMinus,
		apprenant_added: UserPlus,
		apprenant_removed: UserMinus,
		contact_created_and_apprenant_added: UserPlus,
		formateur_added: UserPlus,
		formateur_removed: UserMinus,
		formateur_costs_updated: Wallet,
		formateur_assigned_to_session: Calendar,
		formateur_removed_from_session: Calendar,
		document_uploaded: FileUp,
		invoice_create: Receipt,
		invoice_created: Receipt,
		invoice_update: Receipt,
		invoice_updated: Receipt,
		invoice_delete: Receipt,
		comment_added: MessageSquare,
		cost_updated: Wallet,
		cost_item_update: Wallet,
		module_created: BookOpen,
		module_added: BookOpen,
		module_updated: BookOpen,
		module_deleted: BookOpen,
		modules_reordered: BookOpen,
		programme_synced_to_source: BookOpen,
		programme_created_from_formation: BookOpen,
		programme_detached: BookOpen,
		emargement_signed: FileSignature,
		emargement_participants_updated: FileSignature
	};

	const FIELD_LABELS: Record<string, string> = {
		name: 'le nom',
		description: 'la description',
		statut: 'le statut',
		dateDebut: 'la date de début',
		dateFin: 'la date de fin',
		duree: 'la durée',
		modalite: 'la modalité',
		type: 'le type',
		typeFinancement: 'le type de financement',
		location: 'le lieu',
		codeRncp: 'le code RNCP',
		montantAccorde: 'le montant accordé',
		financementAccorde: "l'accord de financement",
		tjmFormateur: 'le TJM formateur'
	};

	function describeEntry(e: AuditEntry): string {
		const fieldLabel = e.fieldName ? (FIELD_LABELS[e.fieldName] ?? e.fieldName) : '';

		switch (e.actionType) {
			case 'field_update': {
				const from = tryParseValue(e.oldValue);
				const to = tryParseValue(e.newValue);
				if (from && to) return `a modifié ${fieldLabel} de « ${from} » à « ${to} »`;
				if (to) return `a défini ${fieldLabel} à « ${to} »`;
				return `a modifié ${fieldLabel}`;
			}
			case 'quest_completed':
				return `a terminé la quête ${tryParseValue(e.newValue) ?? ''}`.trim();
			case 'sub_action_toggled': {
				const done = e.newValue === 'true' || e.newValue === '"true"';
				return done
					? `a coché la sous-action ${tryParseValue(e.fieldName) ?? ''}`
					: `a décoché la sous-action ${tryParseValue(e.fieldName) ?? ''}`;
			}
			case 'phase_completed':
				return `a terminé la phase ${tryParseValue(e.newValue) ?? ''}`.trim();
			case 'status_changed': {
				const to = tryParseValue(e.newValue);
				return to ? `a changé le statut à « ${to} »` : 'a changé le statut';
			}
			case 'session_created':
				return `a créé une séance${formatDateSuffix(e.newValue)}`;
			case 'session_updated':
				return `a modifié une séance${fieldLabel ? ` (${fieldLabel})` : ''}`;
			case 'session_deleted':
				return 'a supprimé une séance';
			case 'learner_added':
			case 'apprenant_added':
				return `a ajouté ${tryParseValue(e.newValue) ?? 'un apprenant'} aux apprenants`;
			case 'contact_created_and_apprenant_added':
				return `a créé le contact et ajouté ${tryParseValue(e.newValue) ?? 'un apprenant'} aux apprenants`;
			case 'learner_removed':
			case 'apprenant_removed':
				return `a retiré ${tryParseValue(e.oldValue) ?? 'un apprenant'} des apprenants`;
			case 'formateur_added':
				return `a ajouté ${tryParseValue(e.newValue) ?? 'un formateur'} aux formateurs`;
			case 'formateur_removed':
				return `a retiré ${tryParseValue(e.oldValue) ?? 'un formateur'} des formateurs`;
			case 'formateur_costs_updated':
				return `a mis à jour les coûts formateur${fieldLabel ? ` (${fieldLabel})` : ''}`;
			case 'formateur_assigned_to_session':
				return `a assigné un formateur à une séance`;
			case 'formateur_removed_from_session':
				return `a retiré un formateur d'une séance`;
			case 'document_uploaded':
				return `a téléversé ${tryParseValue(e.newValue) ?? 'un document'}`;
			case 'invoice_create':
			case 'invoice_created':
				return `a créé une facture${e.newValue ? ` (${tryParseValue(e.newValue)})` : ''}`;
			case 'invoice_update':
			case 'invoice_updated':
				return `a modifié une facture${fieldLabel ? ` (${fieldLabel})` : ''}`;
			case 'invoice_delete':
				return 'a supprimé une facture';
			case 'comment_added':
				return 'a ajouté un commentaire';
			case 'cost_updated':
			case 'cost_item_update':
				return `a mis à jour un coût${fieldLabel ? ` (${fieldLabel})` : ''}`;
			case 'module_created':
			case 'module_added':
				return `a ajouté le module ${tryParseValue(e.newValue) ?? ''}`.trim();
			case 'module_updated':
				return `a modifié le module ${tryParseValue(e.newValue) ?? ''}`.trim();
			case 'module_deleted':
				return `a supprimé le module ${tryParseValue(e.oldValue) ?? ''}`.trim();
			case 'modules_reordered':
				return 'a réorganisé les modules';
			case 'programme_synced_to_source':
				return 'a synchronisé le programme depuis la source';
			case 'programme_created_from_formation':
				return 'a créé un programme depuis la formation';
			case 'programme_detached':
				return 'a détaché le programme source';
			case 'emargement_signed':
				return `a signé l'émargement${e.newValue ? ` (${tryParseValue(e.newValue)})` : ''}`;
			case 'emargement_participants_updated':
				return "a mis à jour les participants de l'émargement";
			default:
				return e.actionType.replace(/_/g, ' ');
		}
	}

	function tryParseValue(v: string | null | undefined): string | null {
		if (v == null) return null;
		try {
			const parsed = JSON.parse(v);
			if (typeof parsed === 'string') return parsed;
			if (typeof parsed === 'number' || typeof parsed === 'boolean') return String(parsed);
			return v;
		} catch {
			return v;
		}
	}

	function formatDateSuffix(v: string | null | undefined): string {
		const parsed = tryParseValue(v);
		if (!parsed) return '';
		const d = new Date(parsed);
		if (isNaN(d.getTime())) return '';
		return ` le ${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
	}

	function relativeTime(iso: string): string {
		const now = Date.now();
		const then = new Date(iso).getTime();
		const diffMs = now - then;
		const diffMin = Math.floor(diffMs / 60_000);
		if (diffMin < 1) return "à l'instant";
		if (diffMin < 60) return `il y a ${diffMin}min`;
		const diffH = Math.floor(diffMin / 60);
		if (diffH < 24) return `il y a ${diffH}h`;
		const diffD = Math.floor(diffH / 24);
		if (diffD === 1) return 'hier';
		if (diffD < 7) return `il y a ${diffD}j`;
		return new Date(iso).toLocaleDateString('fr-FR', {
			day: 'numeric',
			month: 'short'
		});
	}

	function dateGroupLabel(iso: string): string {
		const d = new Date(iso);
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const entryDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
		const diffDays = Math.floor((today.getTime() - entryDay.getTime()) / 86_400_000);
		if (diffDays === 0) return "Aujourd'hui";
		if (diffDays === 1) return 'Hier';
		return d.toLocaleDateString('fr-FR', {
			weekday: 'long',
			day: 'numeric',
			month: 'long'
		});
	}

	function getUserName(user: AuditEntry['user']): string {
		if (!user) return 'Système';
		return [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Utilisateur';
	}

	function getUserInitials(user: AuditEntry['user']): string {
		if (!user) return 'S';
		const f = user.firstName?.[0] ?? '';
		const l = user.lastName?.[0] ?? '';
		return (f + l).toUpperCase() || 'U';
	}

	interface GroupedEntries {
		label: string;
		entries: AuditEntry[];
	}

	const grouped: GroupedEntries[] = $derived.by(() => {
		const groups: GroupedEntries[] = [];
		let currentLabel = '';
		for (const entry of entries) {
			const label = dateGroupLabel(entry.createdAt);
			if (label !== currentLabel) {
				currentLabel = label;
				groups.push({ label, entries: [entry] });
			} else {
				groups[groups.length - 1].entries.push(entry);
			}
		}
		return groups;
	});
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="sm:max-w-md">
		<Sheet.Header>
			<Sheet.Title class="flex items-center gap-2">
				<ClockIcon class="size-4" />
				Historique
			</Sheet.Title>
			<Sheet.Description>
				Dernières modifications de cette formation
			</Sheet.Description>
		</Sheet.Header>

		<div class="-mx-6 flex-1 overflow-y-auto px-6">
			{#if entries.length === 0}
				<div class="flex flex-col items-center justify-center gap-3 py-16 text-center">
					<div class="rounded-full bg-muted p-3">
						<ClockIcon class="size-6 text-muted-foreground" />
					</div>
					<div>
						<p class="text-sm font-medium">Aucun historique pour le moment</p>
						<p class="text-sm text-muted-foreground">
							Les modifications seront enregistrées ici.
						</p>
					</div>
				</div>
			{:else}
				<div class="space-y-6 pb-6">
					{#each grouped as group}
						<div>
							<p class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								{group.label}
							</p>
							<div class="relative space-y-0">
								<div class="absolute left-[15px] top-2 bottom-2 w-px bg-border"></div>
								{#each group.entries as entry (entry.id)}
									{@const IconCmp = ICON_MAP[entry.actionType] ?? Pencil}
									<div class="relative flex gap-3 py-2">
										<div class="relative z-10 flex size-[30px] shrink-0 items-center justify-center rounded-full border bg-background">
											<IconCmp class="size-3.5 text-muted-foreground" />
										</div>
										<div class="min-w-0 flex-1 pt-0.5">
											<div class="flex items-start gap-2">
												<Avatar.Root class="size-5 shrink-0">
													{#if entry.user?.avatarUrl}
														<Avatar.Image
															src={entry.user.avatarUrl}
															alt={getUserName(entry.user)}
														/>
													{/if}
													<Avatar.Fallback class="text-[10px]">
														{getUserInitials(entry.user)}
													</Avatar.Fallback>
												</Avatar.Root>
												<div class="min-w-0 flex-1">
													<p class="text-sm leading-snug">
														<span class="font-medium">{getUserName(entry.user)}</span>
														{' '}{describeEntry(entry)}
													</p>
													<p class="mt-0.5 text-xs text-muted-foreground">
														{relativeTime(entry.createdAt)}
													</p>
												</div>
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</Sheet.Content>
</Sheet.Root>
