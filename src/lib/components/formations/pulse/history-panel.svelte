<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import MailIcon from '@lucide/svelte/icons/mail';
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';
	import PencilIcon from '@lucide/svelte/icons/pencil';

	interface AuditEntry {
		id: string;
		actionType: string;
		entityType: string | null;
		fieldName?: string | null;
		oldValue?: string | null;
		newValue?: string | null;
		createdAt: string;
		user?: {
			firstName?: string | null;
			lastName?: string | null;
			avatarUrl?: string | null;
		} | null;
	}

	interface Props {
		open: boolean;
		formationName: string;
		entries: AuditEntry[];
	}

	let { open = $bindable(false), formationName, entries = [] }: Props = $props();

	type FilterKey = 'all' | 'actions' | 'documents' | 'communications' | 'people';

	let activeFilter: FilterKey = $state('all');

	const filters: { key: FilterKey; label: string }[] = [
		{ key: 'all', label: 'Tout' },
		{ key: 'actions', label: 'Actions' },
		{ key: 'documents', label: 'Documents' },
		{ key: 'communications', label: 'Communications' },
		{ key: 'people', label: 'Personnes' }
	];

	interface EnhancedEntry {
		id: string;
		time: string;
		description: string;
		linkLabel?: string;
		linkIcon?: string;
		userName: string;
		userInitials: string;
		userAvatarUrl?: string | null;
		oldValue?: string | null;
		newValue?: string | null;
		createdAt: string;
		category: 'document' | 'communication' | 'person' | 'action';
	}

	const FIELD_LABELS: Record<string, string> = {
		name: 'Nom',
		description: 'Description',
		statut: 'Statut',
		dateDebut: 'Date de début',
		dateFin: 'Date de fin',
		duree: 'Durée',
		modalite: 'Modalité',
		type: 'Type',
		typeFinancement: 'Type de financement',
		location: 'Lieu'
	};

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

	function describeEntry(e: AuditEntry): string {
		const fieldLabel = e.fieldName ? (FIELD_LABELS[e.fieldName] ?? e.fieldName) : '';
		switch (e.actionType) {
			case 'field_update': {
				if (fieldLabel) return `Champ modifié : ${fieldLabel}`;
				return 'Formation mise à jour';
			}
			case 'status_changed':
				return `Statut changé${e.newValue ? ` → ${tryParseValue(e.newValue)}` : ''}`;
			case 'session_created':
				return 'Séance créée';
			case 'session_updated':
				return `Séance modifiée${fieldLabel ? ` (${fieldLabel})` : ''}`;
			case 'session_deleted':
				return 'Séance supprimée';
			case 'learner_added':
			case 'apprenant_added':
				return `${tryParseValue(e.newValue) ?? 'Apprenant'} ajouté aux apprenants`;
			case 'learner_removed':
			case 'apprenant_removed':
				return `${tryParseValue(e.oldValue) ?? 'Apprenant'} retiré des apprenants`;
			case 'formateur_added':
				return `${tryParseValue(e.newValue) ?? 'Formateur'} ajouté comme formateur`;
			case 'formateur_removed':
				return `${tryParseValue(e.oldValue) ?? 'Formateur'} retiré des formateurs`;
			case 'document_uploaded':
				return `Document téléversé : ${tryParseValue(e.newValue) ?? 'fichier'}`;
			case 'comment_added':
				return 'Commentaire ajouté';
			case 'invoice_created':
			case 'invoice_create':
				return 'Facture créée';
			default:
				return e.actionType.replace(/_/g, ' ');
		}
	}

	function categorizeEntry(actionType: string): EnhancedEntry['category'] {
		if (['document_uploaded', 'invoice_created', 'invoice_create'].includes(actionType))
			return 'document';
		if (['comment_added'].includes(actionType)) return 'communication';
		if (
			[
				'learner_added',
				'apprenant_added',
				'learner_removed',
				'apprenant_removed',
				'formateur_added',
				'formateur_removed'
			].includes(actionType)
		)
			return 'person';
		return 'action';
	}

	function formatTime(iso: string): string {
		const d = new Date(iso);
		return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
	}

	function getUserName(
		user: AuditEntry['user']
	): string {
		if (!user) return 'Système';
		return [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Utilisateur';
	}

	function getUserInitials(
		user: AuditEntry['user']
	): string {
		if (!user) return 'S';
		const f = user.firstName?.[0] ?? '';
		const l = user.lastName?.[0] ?? '';
		return (f + l).toUpperCase() || 'U';
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

	const now = new Date();
	const todayAt = (h: number, m: number) => {
		const d = new Date(now);
		d.setHours(h, m, 0, 0);
		return d.toISOString();
	};
	const yesterdayAt = (h: number, m: number) => {
		const d = new Date(now);
		d.setDate(d.getDate() - 1);
		d.setHours(h, m, 0, 0);
		return d.toISOString();
	};

	const mockEntries: EnhancedEntry[] = [
		{
			id: 'mock-1',
			time: formatTime(todayAt(14, 32)),
			description: 'Convention signée par Marie Durand (Client SAS)',
			linkLabel: 'Voir le document signé',
			linkIcon: '📄',
			userName: 'Marie Durand',
			userInitials: 'MD',
			createdAt: todayAt(14, 32),
			category: 'document'
		},
		{
			id: 'mock-2',
			time: formatTime(todayAt(11, 15)),
			description: 'Convocation envoyée à 4 apprenants',
			linkLabel: "Voir l'email",
			linkIcon: '✉️',
			userName: 'Système',
			userInitials: 'S',
			createdAt: todayAt(11, 15),
			category: 'communication'
		},
		{
			id: 'mock-3',
			time: formatTime(yesterdayAt(16, 45)),
			description: 'Jean Dupont ajouté comme formateur',
			linkLabel: 'Voir le profil',
			linkIcon: '👤',
			userName: 'Admin',
			userInitials: 'A',
			createdAt: yesterdayAt(16, 45),
			category: 'person'
		}
	];

	const realEntries: EnhancedEntry[] = $derived(
		entries.map((e) => ({
			id: e.id,
			time: formatTime(e.createdAt),
			description: describeEntry(e),
			userName: getUserName(e.user),
			userInitials: getUserInitials(e.user),
			userAvatarUrl: e.user?.avatarUrl,
			oldValue: e.oldValue ? tryParseValue(e.oldValue) : null,
			newValue: e.newValue ? tryParseValue(e.newValue) : null,
			createdAt: e.createdAt,
			category: categorizeEntry(e.actionType)
		}))
	);

	const allEntries: EnhancedEntry[] = $derived(
		[...mockEntries, ...realEntries].sort(
			(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		)
	);

	const filteredEntries: EnhancedEntry[] = $derived(
		activeFilter === 'all'
			? allEntries
			: allEntries.filter((e) => {
					switch (activeFilter) {
						case 'documents':
							return e.category === 'document';
						case 'communications':
							return e.category === 'communication';
						case 'people':
							return e.category === 'person';
						case 'actions':
							return e.category === 'action';
						default:
							return true;
					}
				})
	);

	interface GroupedDay {
		label: string;
		entries: EnhancedEntry[];
	}

	const grouped: GroupedDay[] = $derived.by(() => {
		const groups: GroupedDay[] = [];
		let currentLabel = '';
		for (const entry of filteredEntries) {
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

	const categoryIcon: Record<EnhancedEntry['category'], typeof ClockIcon> = {
		document: FileTextIcon,
		communication: MailIcon,
		person: UserPlusIcon,
		action: PencilIcon
	};
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-[400px] sm:w-[440px] sm:max-w-[440px]">
		<Sheet.Header>
			<Sheet.Title class="flex items-center gap-2">
				<ClockIcon class="size-4" />
				Historique
			</Sheet.Title>
			<Sheet.Description class="sr-only">
				Historique d'activité pour {formationName}
			</Sheet.Description>
		</Sheet.Header>

		<div class="flex flex-wrap gap-1.5 px-4 pb-2">
			{#each filters as filter (filter.key)}
				<button
					type="button"
					class="rounded-full px-3 py-1 text-xs font-medium transition-colors {activeFilter ===
					filter.key
						? 'bg-primary text-primary-foreground'
						: 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'}"
					onclick={() => (activeFilter = filter.key)}
				>
					{filter.label}
				</button>
			{/each}
		</div>

		<div class="-mx-6 flex-1 overflow-y-auto px-6">
			{#if filteredEntries.length === 0}
				<div class="flex flex-col items-center justify-center gap-3 py-16 text-center">
					<div class="rounded-full bg-muted p-3">
						<ClockIcon class="size-6 text-muted-foreground" />
					</div>
					<p class="text-sm text-muted-foreground">Aucune activité à afficher</p>
				</div>
			{:else}
				<div class="space-y-5 pb-6">
					{#each grouped as group (group.label)}
						<div>
							<p
								class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
							>
								{group.label}
							</p>

							<div class="relative">
								<div class="absolute bottom-0 left-[15px] top-0 w-px bg-border"></div>

								{#each group.entries as entry (entry.id)}
									{@const Icon = categoryIcon[entry.category]}
									<div class="relative flex gap-3 py-2.5">
										<div
											class="relative z-10 flex size-[30px] shrink-0 items-center justify-center rounded-full border bg-background"
										>
											<Icon class="size-3.5 text-muted-foreground" />
										</div>

										<div class="min-w-0 flex-1 pt-0.5">
											<div class="flex items-start justify-between gap-2">
												<p class="text-sm leading-snug">{entry.description}</p>
												<span
													class="shrink-0 text-xs tabular-nums text-muted-foreground"
												>
													{entry.time}
												</span>
											</div>

											{#if entry.oldValue && entry.newValue}
												<div
													class="mt-1.5 rounded-md border bg-muted/40 px-2.5 py-1.5 text-xs"
												>
													<span class="text-muted-foreground line-through"
														>{entry.oldValue}</span
													>
													<span class="mx-1.5 text-muted-foreground">→</span>
													<span class="font-medium">{entry.newValue}</span>
												</div>
											{/if}

											{#if entry.linkLabel}
												<button
													type="button"
													class="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
												>
													<span>{entry.linkIcon}</span>
													{entry.linkLabel}
												</button>
											{/if}

											<div class="mt-1.5 flex items-center gap-1.5">
												<Avatar.Root class="size-4">
													{#if entry.userAvatarUrl}
														<Avatar.Image
															src={entry.userAvatarUrl}
															alt={entry.userName}
														/>
													{/if}
													<Avatar.Fallback class="text-[8px]">
														{entry.userInitials}
													</Avatar.Fallback>
												</Avatar.Root>
												<span class="text-xs text-muted-foreground">
													{entry.userName}
												</span>
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
