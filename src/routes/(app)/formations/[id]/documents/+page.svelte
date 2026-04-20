<script lang="ts">
	import type { PageProps } from './$types';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { enhance } from '$app/forms';
	import { deserialize } from '$app/forms';
	import { invalidateAll, replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import { getDocumentPrompts, getDocumentTypeForQuest, type QuestActionInput, type DocumentInput } from '$lib/document-prompts';
	import { PHASE_LABELS, type QuestPhase } from '$lib/formation-quests';
	import Files from '@lucide/svelte/icons/files';
	import FileSignature from '@lucide/svelte/icons/file-signature';
	import Mail from '@lucide/svelte/icons/mail';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import Award from '@lucide/svelte/icons/award';
	import BadgeCheck from '@lucide/svelte/icons/badge-check';
	import Receipt from '@lucide/svelte/icons/receipt';
	import Briefcase from '@lucide/svelte/icons/briefcase';
	import FileIcon from '@lucide/svelte/icons/file';
	import Plus from '@lucide/svelte/icons/plus';
	import Eye from '@lucide/svelte/icons/eye';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import Send from '@lucide/svelte/icons/send';
	import MailCheck from '@lucide/svelte/icons/mail-check';
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Layers from '@lucide/svelte/icons/layers';
	import History from '@lucide/svelte/icons/history';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import RefreshCcw from '@lucide/svelte/icons/refresh-ccw';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import Lock from '@lucide/svelte/icons/lock';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import { goto } from '$app/navigation';
	import { onMount, type Component } from 'svelte';
	import { evaluatePreflight, type PreflightResult } from '$lib/preflight/document-preflight';
	import type { ComplianceWarning } from '$lib/compliance-warnings';

	let { data }: PageProps = $props();

	const DOC_TYPE_CONFIG: Record<string, { label: string; icon: Component }> = {
		convention: { label: 'Convention', icon: FileSignature },
		convocation: { label: 'Convocation', icon: Mail },
		feuille_emargement: { label: "Feuille d'émargement", icon: ClipboardList },
		certificat: { label: 'Certificat de réalisation', icon: Award },
		attestation: { label: 'Attestation', icon: BadgeCheck },
		devis: { label: 'Devis', icon: Receipt },
		ordre_mission: { label: 'Ordre de mission', icon: Briefcase },
		autre: { label: 'Autre', icon: FileIcon }
	};

	const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
		genere: {
			label: 'À envoyer',
			class: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-400'
		},
		envoye: {
			label: 'En attente',
			class: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-400'
		},
		signatures_en_cours: {
			label: 'En attente',
			class: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-400'
		},
		accepte: {
			label: 'Terminé',
			class: 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-400'
		},
		signe: {
			label: 'Terminé',
			class: 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-400'
		},
		archive: {
			label: 'Terminé',
			class: 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-400'
		},
		refuse: {
			label: 'Action requise',
			class: 'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-400'
		},
		expire: {
			label: 'Action requise',
			class: 'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-400'
		},
		annule: {
			label: 'Action requise',
			class: 'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-400'
		},
		remplace: {
			label: 'Remplacé',
			class: 'border-muted-foreground/30 text-muted-foreground'
		}
	};

	const GENERATABLE_TYPES = [
		'convention',
		'convocation',
		'certificat',
		'devis',
		'ordre_mission',
		'feuille_emargement'
	] as const;

	const NEEDS_CONTACT = new Set(['convocation', 'certificat']);
	const NEEDS_FORMATEUR = new Set(['ordre_mission']);
	const NEEDS_SEANCE = new Set(['feuille_emargement']);

	const DOC_TYPE_PHASE: Record<string, QuestPhase | null> = {
		devis: 'conception',
		convention: 'conception',
		convocation: 'conception',
		ordre_mission: 'conception',
		feuille_emargement: 'deploiement',
		certificat: 'evaluation',
		attestation: 'evaluation',
		autre: null
	};

	const STATUS_URGENCY: Record<string, number> = {
		refuse: 0, expire: 0, annule: 0,
		genere: 1,
		envoye: 2, signatures_en_cours: 2,
		accepte: 3, signe: 3, archive: 3,
		remplace: 4
	};

	const ERROR_STATUSES = new Set(['refuse', 'expire', 'annule']);

	const GROUPED_TYPE_LABELS: Record<string, { plural: string; sentLabel: string }> = {
		convocation: { plural: 'Convocations', sentLabel: 'envoyées' },
		certificat: { plural: 'Certificats de réalisation', sentLabel: 'envoyés' }
	};

	let typeFilter = $state<string>('all');
	let statusFilter = $state<string>('all');
	let previewOpen = $state(false);
	let previewUrl = $state('');
	let previewLoading = $state(false);
	let generateOpen = $state(false);
	let generateType = $state('');
	let generateContactId = $state('');
	let generateFormateurId = $state('');
	let generateSeanceId = $state('');
	let generating = $state(false);
	let deleteDialogOpen = $state(false);
	let documentToDelete = $state<{ id: string; title: string } | null>(null);
	let deleting = $state(false);
	let markingSentId = $state<string | null>(null);
	let transitioningDocId = $state<string | null>(null);
	let showReplaced = $state(false);
	let expandedDocId = $state<string | null>(null);
	let groupByPhase = $state(false);
	let groupExpandOverrides = $state(new Map<string, boolean>());

	const formation = $derived(data.formation);
	const documents = $derived(data.documents ?? []);
	const emails = $derived(data.emails ?? []);
	const apprenants = $derived(formation?.formationApprenants ?? []);
	const formateurs = $derived(formation?.formationFormateurs ?? []);
	const seancesList = $derived(formation?.seances ?? []);

	const formationUpdatedAt = $derived(formation?.updatedAt ?? null);

	// ── Preflight derived state ───────────────────────────────────────────────
	const preflightFormation = $derived({
		id: formation?.id ?? '',
		clientId: formation?.clientId ?? null,
		companyId: formation?.companyId ?? null,
		clientType: formation?.client?.type ?? null,
		typeFinancement: formation?.typeFinancement ?? null,
		dateDebut: formation?.dateDebut ?? null,
		dateFin: formation?.dateFin ?? null
	});
	const preflightWorkspace = $derived({ id: '', nda: data.workspaceNda ?? null });
	const now = $derived(new Date().toISOString());
	const hasAcceptedDevis = $derived(documents.some((d) => d.type === 'devis' && d.status === 'accepte'));
	const hasSignedConvention = $derived(
		documents.some((d) => d.type === 'convention' && (d.status === 'signe' || d.status === 'archive'))
	);
	const hasSignedEmargements = $derived(
		!seancesList.some((s) => {
			if (!s.endAt || s.endAt > now) return false;
			return (s.emargements ?? []).some((e) => !e.signedAt);
		})
	);
	const hasLearnerWithEmail = $derived(apprenants.some((a) => a.contact?.email));

	let warningsAcknowledged = $state(false);

	const preflightResult = $derived<PreflightResult | null>(
		generateType
			? evaluatePreflight(preflightFormation, preflightWorkspace, {
					documentType: generateType,
					contactId: generateContactId || undefined,
					seanceId: generateSeanceId || undefined,
					hasAcceptedDevis,
					hasLearnerWithEmail,
					hasSignedConvention,
					hasSignedEmargements
				})
			: null
	);

	const canGenerate = $derived(
		preflightResult !== null &&
			preflightResult.blockingCount === 0 &&
			(preflightResult.warningCount === 0 || warningsAcknowledged) &&
			(NEEDS_CONTACT.has(generateType) ? !!generateContactId : true) &&
			(NEEDS_FORMATEUR.has(generateType) ? !!generateFormateurId : true) &&
			(NEEDS_SEANCE.has(generateType) ? !!generateSeanceId : true)
	);

	function isDocStale(doc: (typeof documents)[number]): boolean {
		if (!formationUpdatedAt || !doc.generatedAt) return false;
		return new Date(formationUpdatedAt) > new Date(doc.generatedAt);
	}

	let regeneratingDocId = $state<string | null>(null);
	let regeneratingAll = $state(false);

	// ── Resume generation from URL param (Task 4) ─────────────────────────────
	onMount(() => {
		requestAnimationFrame(() => {
			const resumeType = page.url.searchParams.get('resumeGenerate');
			if (resumeType) {
				openGenerate(resumeType);
				// Clean up URL param without triggering navigation
				const url = new URL(page.url);
				url.searchParams.delete('resumeGenerate');
				replaceState(url.toString(), {});
			}
		});
	});

	async function regenerateDocument(documentId: string) {
		regeneratingDocId = documentId;
		const body = new FormData();
		body.set('documentId', documentId);

		try {
			const response = await fetch('?/regenerateDocument', { method: 'POST', body });
			const result = deserialize(await response.text());
			if (result.type === 'success') {
				toast.success('Document régénéré');
				await invalidateAll();
			} else if (result.type === 'failure') {
				toast.error((result.data as { message?: string })?.message ?? 'Erreur de régénération');
			} else if (result.type === 'error') {
				toast.error(result.error?.message ?? 'Erreur serveur');
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Erreur de régénération');
		} finally {
			regeneratingDocId = null;
		}
	}

	async function regenerateAllStale() {
		regeneratingAll = true;
		const body = new FormData();
		try {
			const response = await fetch('?/regenerateAll', { method: 'POST', body });
			const result = deserialize(await response.text());
			if (result.type === 'success') {
				const d = result.data as { regeneratedCount: number; skippedCount: number };
				toast.success(`${d.regeneratedCount} document(s) régénéré(s)`);
				if (d.skippedCount > 0) {
					toast.info(`${d.skippedCount} document(s) signé(s) ignoré(s)`);
				}
				await invalidateAll();
			} else if (result.type === 'failure') {
				toast.error((result.data as { message?: string })?.message ?? 'Erreur');
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Erreur de régénération');
		} finally {
			regeneratingAll = false;
		}
	}

	let commsExpanded = $state(false);

	const questParam = $derived(page.url.searchParams.get('quest'));

	const questActions = $derived.by(() => {
		const raw = data.formation?.actions ?? [];
		return raw.map((a: Record<string, unknown>) => ({
			questKey: (a.questKey as string) ?? null,
			status: (a.status as QuestActionInput['status']) ?? 'Pas commencé'
		}));
	});

	const documentInputs = $derived(
		documents.map((d) => ({ type: d.type, effectiveStatus: d.effectiveStatus }))
	);

	const documentPrompts = $derived(getDocumentPrompts(questActions, documentInputs));

	const highlightedDocType = $derived(getDocumentTypeForQuest(questParam));

	const complianceWarnings: ComplianceWarning[] = $derived(data.complianceWarnings ?? []);

	let mounted = $state(false);
	onMount(() => { mounted = true; });

	$effect(() => {
		if (!questParam || !mounted) return;

		const promptEl = highlightedDocType
			? document.getElementById(`doc-prompt-${highlightedDocType}`)
			: null;

		const target = promptEl ?? (highlightedDocType
			? document.querySelector(`[data-doc-type="${highlightedDocType}"]`)
			: null);

		if (target) {
			target.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}

		requestAnimationFrame(() => {
			const url = new URL(page.url);
			url.searchParams.delete('quest');
			replaceState(url, {});
		});
	});

	const EMAIL_STATUS_CONFIG: Record<string, { label: string; class: string }> = {
		sent: { label: 'Envoyé', class: 'border-green-300 bg-green-50 text-green-700' },
		logged: { label: 'Enregistré', class: 'border-blue-300 bg-blue-50 text-blue-700' },
		failed: { label: 'Échec', class: 'border-red-300 bg-red-50 text-red-700' },
		pending: { label: 'En attente', class: 'border-amber-300 bg-amber-50 text-amber-700' }
	};

	const visibleDocuments = $derived(
		showReplaced ? documents : documents.filter((d) => d.effectiveStatus !== 'remplace')
	);

	const replacedCount = $derived(documents.filter((d) => d.effectiveStatus === 'remplace').length);

	const filteredDocuments = $derived.by(() => {
		let result = visibleDocuments;
		if (typeFilter !== 'all') {
			result = result.filter((d) => d.type === typeFilter);
		}
		if (statusFilter !== 'all') {
			result = result.filter((d) => d.effectiveStatus === statusFilter);
		}
		return [...result].sort((a, b) => {
			const ua = STATUS_URGENCY[a.effectiveStatus] ?? 4;
			const ub = STATUS_URGENCY[b.effectiveStatus] ?? 4;
			if (ua !== ub) return ua - ub;
			const ta = a.generatedAt ? new Date(a.generatedAt).getTime() : 0;
			const tb = b.generatedAt ? new Date(b.generatedAt).getTime() : 0;
			return tb - ta;
		});
	});

	const staleDocuments = $derived(
		filteredDocuments.filter((d) => isDocStale(d) && d.effectiveStatus !== 'remplace')
	);
	const staleRegenerableDocuments = $derived(
		staleDocuments.filter((d) => d.effectiveStatus !== 'signe')
	);

	const statusCounts = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const doc of visibleDocuments) {
			counts[doc.effectiveStatus] = (counts[doc.effectiveStatus] ?? 0) + 1;
		}
		return counts;
	});

	const displayItems = $derived.by(() => {
		const sorted = filteredDocuments;
		const groupMap = new Map<string, (typeof sorted)[number][]>();

		for (const doc of sorted) {
			if (NEEDS_CONTACT.has(doc.type)) {
				const arr = groupMap.get(doc.type);
				if (arr) arr.push(doc);
				else groupMap.set(doc.type, [doc]);
			}
		}

		const items: (
			| { kind: 'doc'; doc: (typeof sorted)[number] }
			| { kind: 'group'; type: string; total: number; sentCount: number; children: (typeof sorted)[number][]; hasError: boolean }
		)[] = [];
		const placed = new Set<string>();

		for (const doc of sorted) {
			const groupDocs = groupMap.get(doc.type);
			if (groupDocs && groupDocs.length >= 2) {
				if (!placed.has(doc.type)) {
					items.push({
						kind: 'group',
						type: doc.type,
						total: groupDocs.length,
						sentCount: groupDocs.filter((d) => d.effectiveStatus !== 'genere').length,
						children: groupDocs,
						hasError: groupDocs.some((d) => ERROR_STATUSES.has(d.effectiveStatus))
					});
					placed.add(doc.type);
				}
			} else {
				items.push({ kind: 'doc', doc });
			}
		}

		return items;
	});

	const phaseGroups = $derived.by(() => {
		if (!groupByPhase) return [];
		const order = ['conception', 'deploiement', 'evaluation', 'other'] as const;
		const labels: Record<string, string> = { ...PHASE_LABELS, other: 'Autre' };
		const buckets = new Map<string, (typeof displayItems)[number][]>();

		for (const item of displayItems) {
			const docType = item.kind === 'doc' ? item.doc.type : item.type;
			const phase = DOC_TYPE_PHASE[docType] ?? 'other';
			if (!buckets.has(phase)) buckets.set(phase, []);
			buckets.get(phase)!.push(item);
		}

		return order
			.filter((p) => buckets.has(p))
			.map((p) => {
				const items = buckets.get(p)!;
				let docCount = 0;
				for (const it of items) {
					docCount += it.kind === 'doc' ? 1 : it.children.length;
				}
				return { phase: p, label: labels[p], items, docCount };
			});
	});

	function isGroupExpanded(type: string, hasError: boolean): boolean {
		if (groupExpandOverrides.has(type)) return groupExpandOverrides.get(type)!;
		return hasError;
	}

	function toggleGroup(type: string, hasError: boolean) {
		const current = isGroupExpanded(type, hasError);
		groupExpandOverrides.set(type, !current);
	}

	function formatDate(dateStr: string | null | undefined) {
		if (!dateStr) return '';
		return new Date(dateStr).toLocaleDateString('fr-FR', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function personName(doc: (typeof documents)[number]) {
		if (doc.relatedContact) {
			return [doc.relatedContact.firstName, doc.relatedContact.lastName].filter(Boolean).join(' ');
		}
		if (doc.relatedFormateur?.user) {
			const u = doc.relatedFormateur.user;
			return [u.firstName, u.lastName].filter(Boolean).join(' ');
		}
		return null;
	}

	function openGenerate(type: string) {
		generateType = type;
		generateContactId = '';
		generateFormateurId = '';
		generateSeanceId = '';
		warningsAcknowledged = false;
		generateOpen = true;
	}

	async function submitGenerate(type?: string) {
		generating = true;
		const docType = type ?? generateType;
		const body = new FormData();
		body.set('type', docType);
		if (generateContactId) body.set('contactId', generateContactId);
		if (generateFormateurId) body.set('formateurId', generateFormateurId);
		if (generateSeanceId) body.set('seanceId', generateSeanceId);

		// Pass acknowledged warning IDs for audit log
		if (preflightResult && preflightResult.warningCount > 0 && warningsAcknowledged) {
			const warnIds = preflightResult.items
				.filter((i) => i.severity === 'warn')
				.map((i) => i.id)
				.join(',');
			body.set('warningsAcknowledged', warnIds);
		}

		try {
			const response = await fetch('?/generateDocument', { method: 'POST', body });
			const result = deserialize(await response.text());
			if (result.type === 'success') {
				toast.success('Document généré');
				generateOpen = false;
				await invalidateAll();
			} else if (result.type === 'failure') {
				toast.error((result.data as { message?: string })?.message ?? 'Erreur de génération');
			} else if (result.type === 'error') {
				toast.error(result.error?.message ?? 'Erreur serveur lors de la génération');
			} else {
				toast.error('Réponse inattendue du serveur');
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Erreur de génération');
		} finally {
			generating = false;
		}
	}

	async function openPreview(documentId: string) {
		previewLoading = true;
		previewOpen = true;
		const body = new FormData();
		body.set('documentId', documentId);

		try {
			const response = await fetch('?/getSignedUrl', { method: 'POST', body });
			const result = deserialize(await response.text());
			if (result.type === 'success' && (result.data as { url?: string })?.url) {
				previewUrl = (result.data as { url: string }).url;
			} else {
				toast.error('Impossible de charger le document');
				previewOpen = false;
			}
		} catch {
			toast.error('Impossible de charger le document');
			previewOpen = false;
		} finally {
			previewLoading = false;
		}
	}

	async function transitionDevis(documentId: string, action: 'acceptDevis' | 'refuseDevis') {
		transitioningDocId = documentId;
		const body = new FormData();
		body.set('documentId', documentId);

		const label = action === 'acceptDevis' ? 'accepté' : 'refusé';
		try {
			const response = await fetch(`?/${action}`, { method: 'POST', body });
			const result = deserialize(await response.text());
			if (result.type === 'success') {
				toast.success(`Devis ${label}`);
				await invalidateAll();
			} else if (result.type === 'failure') {
				toast.error((result.data as { message?: string })?.message ?? 'Erreur');
			} else if (result.type === 'error') {
				toast.error(result.error?.message ?? 'Erreur serveur');
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Erreur');
		} finally {
			transitioningDocId = null;
		}
	}

	async function markAsSent(documentId: string) {
		markingSentId = documentId;
		const body = new FormData();
		body.set('documentId', documentId);

		try {
			const response = await fetch('?/markAsSent', { method: 'POST', body });
			const result = deserialize(await response.text());
			if (result.type === 'success') {
				toast.success('Document marqué comme envoyé');
				await invalidateAll();
			} else if (result.type === 'failure') {
				toast.error((result.data as { message?: string })?.message ?? 'Erreur');
			} else if (result.type === 'error') {
				toast.error(result.error?.message ?? 'Erreur serveur');
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Erreur');
		} finally {
			markingSentId = null;
		}
	}

	function confirmDelete(doc: { id: string; title: string }) {
		documentToDelete = doc;
		deleteDialogOpen = true;
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h2 class="flex items-center gap-2 text-lg font-semibold">
			<Files class="size-5" />
			Documents
			{#if visibleDocuments.length > 0}
				<Badge variant="secondary" class="text-xs">{visibleDocuments.length}</Badge>
			{/if}
		</h2>

		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Button {...props} variant="outline" size="sm" class="cursor-pointer">
						<Plus class="mr-1.5 size-4" />
						Générer un document
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end">
				{#each GENERATABLE_TYPES as type (type)}
					{@const config = DOC_TYPE_CONFIG[type]}
					<DropdownMenu.Item class="cursor-pointer gap-2" onclick={() => openGenerate(type)}>
						<config.icon class="size-4" />
						{config.label}
					</DropdownMenu.Item>
				{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>

	<!-- Filters -->
	<div class="flex flex-wrap items-center gap-3">
		<Select.Root type="single" bind:value={typeFilter}>
			<Select.Trigger class="h-8 w-[180px] text-xs cursor-pointer">
				{typeFilter === 'all' ? 'Tous les types' : DOC_TYPE_CONFIG[typeFilter]?.label ?? typeFilter}
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="all" label="Tous les types">Tous les types</Select.Item>
				{#each Object.entries(DOC_TYPE_CONFIG) as [key, config] (key)}
					<Select.Item value={key} label={config.label}>{config.label}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>

		<div class="flex flex-wrap gap-1.5">
			<button
				type="button"
				class="cursor-pointer"
				onclick={() => (statusFilter = 'all')}
			>
			<Badge
				variant={statusFilter === 'all' ? 'secondary' : 'outline'}
				class="cursor-pointer transition-colors {statusFilter === 'all' ? 'font-semibold' : ''}"
			>
				Tous
			</Badge>
			</button>
			{#each Object.entries(STATUS_CONFIG) as [key, config] (key)}
				{#if statusCounts[key]}
					<button
						type="button"
						class="cursor-pointer"
						onclick={() => (statusFilter = statusFilter === key ? 'all' : key)}
					>
						<Badge
							variant="outline"
							class="cursor-pointer transition-colors {statusFilter === key ? config.class : ''}"
						>
							{config.label}
							<span class="ml-1 text-[10px] opacity-60">{statusCounts[key]}</span>
						</Badge>
					</button>
				{/if}
			{/each}
		</div>

		<button
			type="button"
			class="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
			aria-pressed={groupByPhase}
			onclick={() => (groupByPhase = !groupByPhase)}
		>
			<Layers class="size-3" aria-hidden="true" />
			{groupByPhase ? 'Liste plate' : 'Grouper par phase'}
		</button>

		{#if replacedCount > 0}
			<button
				type="button"
				class="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
				onclick={() => {
					showReplaced = !showReplaced;
					if (!showReplaced && statusFilter === 'remplace') statusFilter = 'all';
				}}
			>
				<EyeOff class="size-3" />
				{showReplaced ? 'Masquer' : 'Afficher'} remplacés ({replacedCount})
			</button>
		{/if}
	</div>

	<!-- Compliance warnings -->
	{#if complianceWarnings.length > 0}
		<div
			role="alert"
			class="flex items-start gap-3 rounded-lg border-l-4 border-l-red-500 bg-red-50/50 px-4 py-3 dark:bg-red-950/20"
		>
			<AlertTriangle class="mt-0.5 size-4 shrink-0 text-red-500" aria-hidden="true" />
			<div class="min-w-0 flex-1">
				{#if complianceWarnings.length === 1}
					<p class="text-sm font-medium text-red-900 dark:text-red-100">
						{complianceWarnings[0].message}
					</p>
				{:else}
					<p class="text-sm font-medium text-red-900 dark:text-red-100">
						{complianceWarnings.length} problèmes de conformité
					</p>
					<ul class="mt-1 space-y-0.5">
						{#each complianceWarnings as warning (warning.documentType)}
							<li class="text-sm text-red-800 dark:text-red-200">• {warning.message}</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Contextual generation prompts -->
	{#if documentPrompts.size > 0}
		<div class="flex flex-col gap-2">
			{#each [...documentPrompts.values()] as prompt (prompt.documentType)}
				{@const typeConfig = DOC_TYPE_CONFIG[prompt.documentType] ?? DOC_TYPE_CONFIG['autre']}
				{@const isHighlighted = highlightedDocType === prompt.documentType}
				<div
					id="doc-prompt-{prompt.documentType}"
					role="region"
					aria-label={prompt.message}
					class="flex items-center gap-4 rounded-lg border px-4 py-3 transition-all {isHighlighted
						? 'border-amber-400 bg-amber-50 shadow-sm dark:border-amber-600 dark:bg-amber-950/40'
						: 'border-amber-200 bg-amber-50/50 dark:border-amber-800/40 dark:bg-amber-950/20'}"
				>
					<div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
						<Sparkles class="size-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
					</div>
					<p class="min-w-0 flex-1 text-sm font-medium text-amber-900 dark:text-amber-100">
						{prompt.message}
					</p>
					{#if prompt.canGenerate}
					<Button
						variant="secondary"
						size="sm"
						class="shrink-0 cursor-pointer"
						onclick={() => openGenerate(prompt.documentType)}
					>
						Générer
						<ArrowRight class="ml-1 size-3.5" aria-hidden="true" />
					</Button>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<!-- Global stale banner -->
	{#if staleDocuments.length >= 2}
		<div class="flex items-center gap-3 rounded-lg border border-muted bg-muted/30 px-4 py-3">
			<RefreshCcw class="size-4 shrink-0 text-muted-foreground" />
			<p class="flex-1 text-sm text-muted-foreground">
				{staleDocuments.length} documents ont des données modifiées depuis la dernière mise à jour
			</p>
			{#if staleRegenerableDocuments.length > 0}
				<Button variant="outline" size="sm" class="shrink-0 cursor-pointer" onclick={regenerateAllStale} disabled={regeneratingAll}>
					{#if regeneratingAll}
						<Loader2 class="mr-1.5 size-3 animate-spin" />
						Régénération...
					{:else}
						<RefreshCcw class="mr-1.5 size-3" />
						Tout régénérer ({staleRegenerableDocuments.length})
					{/if}
				</Button>
			{/if}
		</div>
	{/if}

	{#snippet docCard(doc: (typeof filteredDocuments)[number])}
		{@const typeConfig = DOC_TYPE_CONFIG[doc.type] ?? DOC_TYPE_CONFIG['autre']}
		{@const statusConfig = STATUS_CONFIG[doc.effectiveStatus] ?? STATUS_CONFIG['genere']}
		{@const related = personName(doc)}
		{@const isExpanded = expandedDocId === doc.id}
		{@const phase = DOC_TYPE_PHASE[doc.type]}
		<Card.Root data-doc-type={doc.type}>
			<Card.Content class="py-4">
				<div class="flex items-center gap-4">
					<button
						type="button"
						class="flex min-w-0 flex-1 cursor-pointer items-center gap-4 text-left"
						aria-expanded={isExpanded}
						aria-label="{isExpanded ? 'Réduire' : 'Détails'} — {doc.title || typeConfig.label}"
						onclick={() => (expandedDocId = isExpanded ? null : doc.id)}
					>
						<div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted transition-colors hover:bg-muted/80">
							<typeConfig.icon class="size-5 text-muted-foreground" />
						</div>
						<div class="min-w-0 flex-1">
							<div class="flex flex-wrap items-center gap-2">
								<p class="truncate text-sm font-medium">{doc.title || typeConfig.label}</p>
								<Badge variant="outline" class="shrink-0 text-[10px] {statusConfig.class}">
									{statusConfig.label}
								</Badge>
							{#if phase && groupByPhase}
								<Badge variant="outline" class="shrink-0 text-[10px] text-muted-foreground">
									{PHASE_LABELS[phase]}
								</Badge>
							{/if}
							</div>
							<div class="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
								{#if related}
									<span>{related}</span>
								{/if}
								{#if doc.generatedAt}
									<span>{formatDate(doc.generatedAt)}</span>
								{/if}
							</div>
						</div>
					</button>

					<div class="flex shrink-0 items-center gap-1">
						{#if doc.type === 'devis' && doc.effectiveStatus === 'envoye'}
							<Button
								variant="ghost"
								size="icon"
								class="size-8 cursor-pointer text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
								disabled={transitioningDocId === doc.id}
								onclick={() => transitionDevis(doc.id, 'acceptDevis')}
								aria-label="Accepter le devis"
								title="Accepter le devis"
							>
								{#if transitioningDocId === doc.id}
									<Loader2 class="size-4 animate-spin" />
								{:else}
									<Check class="size-4" />
								{/if}
							</Button>
							<Button
								variant="ghost"
								size="icon"
								class="size-8 cursor-pointer text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
								disabled={transitioningDocId === doc.id}
								onclick={() => transitionDevis(doc.id, 'refuseDevis')}
								aria-label="Refuser le devis"
								title="Refuser le devis"
							>
								<X class="size-4" />
							</Button>
						{/if}
						{#if doc.effectiveStatus === 'genere'}
							<Button
								variant="ghost"
								size="icon"
								class="size-8 cursor-pointer text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
								disabled={markingSentId === doc.id}
								onclick={() => markAsSent(doc.id)}
								aria-label="Marquer comme envoyé"
								title="Marquer comme envoyé"
							>
								{#if markingSentId === doc.id}
									<Loader2 class="size-4 animate-spin" />
								{:else}
									<MailCheck class="size-4" />
								{/if}
							</Button>
						{/if}
						{#if doc.storagePath}
							<Button
								variant="ghost"
								size="icon"
								class="size-8 cursor-pointer"
								onclick={() => openPreview(doc.id)}
								aria-label="Voir le PDF"
							>
								<Eye class="size-4" />
							</Button>
						{/if}
						<Button
							variant="ghost"
							size="icon"
							class="size-8 cursor-pointer text-destructive hover:text-destructive"
							onclick={() => confirmDelete({ id: doc.id, title: doc.title || typeConfig.label })}
							aria-label="Supprimer"
						>
							<Trash2 class="size-4" />
						</Button>
					</div>
				</div>

			{#if isDocStale(doc) && doc.effectiveStatus !== 'remplace' && staleDocuments.length < 2}
				<div class="mt-2 flex items-center gap-2 rounded-md border border-muted bg-muted/30 px-3 py-1.5">
					<RefreshCcw class="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
					<span class="flex-1 text-xs font-medium text-muted-foreground">
						Les données ont changé depuis la génération
					</span>
						{#if doc.effectiveStatus === 'signe'}
							<span class="text-[11px] text-muted-foreground">
								Créez un avenant pour mettre à jour ce document signé
							</span>
						{:else}
						<Button
							variant="secondary"
							size="sm"
							class="h-7 shrink-0 cursor-pointer gap-1 text-xs"
							disabled={regeneratingDocId === doc.id}
							onclick={() => regenerateDocument(doc.id)}
						>
								{#if regeneratingDocId === doc.id}
									<Loader2 class="size-3 animate-spin" />
									Régénération...
								{:else}
									<RefreshCcw class="size-3" />
									Régénérer
								{/if}
							</Button>
						{/if}
					</div>
				{/if}

				{#if isExpanded}
					<div class="mt-3 border-t pt-3">
						<div class="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
							<History class="size-3.5" />
							Historique du cycle de vie
						</div>
						<div class="mt-2 space-y-1.5 text-xs text-muted-foreground">
							{#if doc.generatedAt}
								<div class="flex items-baseline gap-2">
									<span class="w-28 shrink-0 text-right font-medium">Généré</span>
									<span>{formatDate(doc.generatedAt)}</span>
								</div>
							{/if}
							{#if doc.sentAt}
								<div class="flex items-baseline gap-2">
									<span class="w-28 shrink-0 text-right font-medium">Envoyé</span>
									<span>{formatDate(doc.sentAt)}{doc.sentTo?.length ? ` → ${doc.sentTo.join(', ')}` : ''}</span>
								</div>
							{/if}
							{#if doc.acceptedAt}
								<div class="flex items-baseline gap-2">
									<span class="w-28 shrink-0 text-right font-medium">Accepté</span>
									<span>{formatDate(doc.acceptedAt)}</span>
								</div>
							{/if}
							{#if doc.refusedAt}
								<div class="flex items-baseline gap-2">
									<span class="w-28 shrink-0 text-right font-medium">Refusé</span>
									<span>{formatDate(doc.refusedAt)}</span>
								</div>
							{/if}
							{#if doc.signedAt}
								<div class="flex items-baseline gap-2">
									<span class="w-28 shrink-0 text-right font-medium">Signé</span>
									<span>{formatDate(doc.signedAt)}</span>
								</div>
							{/if}
							{#if doc.expiresAt}
								<div class="flex items-baseline gap-2">
									<span class="w-28 shrink-0 text-right font-medium">Expire</span>
									<span>{formatDate(doc.expiresAt)}</span>
								</div>
							{/if}
							{#if doc.archivedAt}
								<div class="flex items-baseline gap-2">
									<span class="w-28 shrink-0 text-right font-medium">Archivé</span>
									<span>{formatDate(doc.archivedAt)}</span>
								</div>
							{/if}
							{#if doc.statusChangedAt}
								<div class="flex items-baseline gap-2">
									<span class="w-28 shrink-0 text-right font-medium">Dernière MAJ</span>
									<span>{formatDate(doc.statusChangedAt)}</span>
								</div>
							{/if}
							{#if !doc.generatedAt && !doc.sentAt && !doc.signedAt && !doc.acceptedAt && !doc.refusedAt && !doc.expiresAt && !doc.archivedAt && !doc.statusChangedAt}
								<p class="italic">Aucun événement enregistré.</p>
							{/if}
						</div>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	{/snippet}

	{#snippet renderItems(items: (typeof displayItems))}
		{#each items as item (item.kind === 'doc' ? item.doc.id : 'group-' + item.type)}
			{#if item.kind === 'group'}
				{@const typeConfig = DOC_TYPE_CONFIG[item.type] ?? DOC_TYPE_CONFIG['autre']}
				{@const groupLabels = GROUPED_TYPE_LABELS[item.type]}
				{@const expanded = isGroupExpanded(item.type, item.hasError)}
				<Card.Root class={item.hasError ? 'border-red-200 dark:border-red-900' : ''}>
					<Card.Content class="py-3">
						<button
							type="button"
							class="flex w-full cursor-pointer items-center gap-3 text-left"
							aria-expanded={expanded}
							aria-label="{groupLabels?.plural ?? typeConfig.label}, {item.sentCount} sur {item.total} {groupLabels?.sentLabel ?? 'traités'}"
							onclick={() => toggleGroup(item.type, item.hasError)}
						>
							{#if expanded}
								<ChevronDown class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
							{:else}
								<ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
							{/if}
							<div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
								<typeConfig.icon class="size-4 text-muted-foreground" />
							</div>
							<span class="flex-1 text-sm font-medium">
								{groupLabels?.plural ?? typeConfig.label}
								<span class="ml-1 text-muted-foreground">({item.sentCount}/{item.total} {groupLabels?.sentLabel ?? 'traités'})</span>
							</span>
							{#if item.hasError}
								<Badge variant="outline" class="shrink-0 text-[10px] border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-400">
									Action requise
								</Badge>
							{/if}
						</button>
					</Card.Content>
				</Card.Root>
				{#if expanded}
					<div class="ml-4 space-y-2 border-l-2 border-muted pl-4">
						{#each item.children as doc (doc.id)}
							{@render docCard(doc)}
						{/each}
					</div>
				{/if}
			{:else}
				{@render docCard(item.doc)}
			{/if}
		{/each}
	{/snippet}

	<!-- Document list -->
	{#if filteredDocuments.length === 0}
		<Card.Root>
			<Card.Content class="py-12 text-center">
				<Files class="mx-auto mb-3 size-12 text-muted-foreground/30" />
				<p class="text-muted-foreground">
					{documents.length === 0 ? 'Aucun document généré.' : 'Aucun document ne correspond aux filtres.'}
				</p>
				{#if documents.length === 0}
					<p class="mt-1 text-sm text-muted-foreground">
						Utilisez le bouton « Générer un document » pour créer votre premier document.
					</p>
				{/if}
			</Card.Content>
		</Card.Root>
	{:else if groupByPhase && phaseGroups.length > 0}
		<div class="space-y-6">
			{#each phaseGroups as pg (pg.phase)}
				<div>
					<h3 class="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
						{pg.label}
						<Badge variant="secondary" class="text-xs">{pg.docCount}</Badge>
					</h3>
					<div class="space-y-2">
						{@render renderItems(pg.items)}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="space-y-2">
			{@render renderItems(displayItems)}
		</div>
	{/if}

	<!-- Communications section -->
	{#if emails.length > 0}
		<div class="mt-8">
			<button
				type="button"
				class="flex w-full items-center gap-2 text-left"
				onclick={() => (commsExpanded = !commsExpanded)}
			>
				{#if commsExpanded}
					<ChevronDown class="size-4 text-muted-foreground" />
				{:else}
					<ChevronRight class="size-4 text-muted-foreground" />
				{/if}
				<Send class="size-4 text-muted-foreground" />
				<h3 class="text-sm font-semibold">Communications</h3>
				<Badge variant="secondary" class="text-xs">{emails.length}</Badge>
			</button>

			{#if commsExpanded}
				<div class="mt-3 space-y-2">
					{#each emails as email (email.id)}
						{@const statusCfg = EMAIL_STATUS_CONFIG[email.status] ?? EMAIL_STATUS_CONFIG['pending']}
						<Card.Root>
							<Card.Content class="flex items-center gap-4 py-3">
								<div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
									<Mail class="size-4 text-muted-foreground" />
								</div>

								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2">
										<p class="truncate text-sm font-medium">{email.subject}</p>
										<Badge variant="outline" class={statusCfg.class + ' text-xs'}>
											{statusCfg.label}
										</Badge>
									</div>
									<div class="flex items-center gap-3 text-xs text-muted-foreground">
										<span>→ {email.recipientName ?? email.recipientEmail}</span>
										{#if email.recipientType}
											<span class="capitalize">({email.recipientType})</span>
										{/if}
										{#if email.sentAt}
											<span>{new Date(email.sentAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
										{:else}
											<span>{new Date(email.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
										{/if}
									</div>
								</div>
							</Card.Content>
						</Card.Root>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- PDF Preview Dialog -->
<Dialog.Root bind:open={previewOpen} onOpenChange={(open) => { if (!open) previewUrl = ''; }}>
	<Dialog.Content class="max-h-[90vh] sm:max-w-4xl">
		<Dialog.Header>
			<Dialog.Title>Aperçu du document</Dialog.Title>
			<Dialog.Description class="sr-only">Prévisualisation PDF</Dialog.Description>
		</Dialog.Header>
		{#if previewLoading}
			<div class="flex h-96 items-center justify-center">
				<Loader2 class="size-8 animate-spin text-muted-foreground" />
			</div>
		{:else if previewUrl}
			<iframe src={previewUrl} class="h-[70vh] w-full rounded border" title="Aperçu PDF"></iframe>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<!-- Generate Document Dialog — with preflight checklist -->
<Dialog.Root bind:open={generateOpen} onOpenChange={(open) => { if (!open) warningsAcknowledged = false; }}>
	<Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>
				Générer : {DOC_TYPE_CONFIG[generateType]?.label ?? generateType}
			</Dialog.Title>
			{#if preflightResult}
				{@const total = preflightResult.items.length}
				{@const blocking = preflightResult.blockingCount}
				<Dialog.Description id="preflight-summary" aria-live="polite">
					{#if blocking > 0}
						Génération impossible : {blocking} blocage{blocking > 1 ? 's' : ''}.
					{:else if total > 0}
						{total - blocking} point{total - blocking > 1 ? 's' : ''} à vérifier.
					{:else}
						Prêt à générer.
					{/if}
				</Dialog.Description>
			{/if}
		</Dialog.Header>

		<div class="space-y-4 py-2">
			<!-- Selectors (contact / formateur / séance) -->
			{#if NEEDS_CONTACT.has(generateType)}
				<Select.Root type="single" bind:value={generateContactId}>
					<Select.Trigger class="w-full cursor-pointer">
						{#if generateContactId}
							{@const found = apprenants.find((a) => a.contact?.id === generateContactId)}
							{found ? [found.contact.firstName, found.contact.lastName].filter(Boolean).join(' ') : 'Sélectionner'}
						{:else}
							<span class="text-muted-foreground">Sélectionner un apprenant</span>
						{/if}
					</Select.Trigger>
					<Select.Content>
						{#each apprenants as fa (fa.contact?.id)}
							{@const c = fa.contact}
							{@const name = [c?.firstName, c?.lastName].filter(Boolean).join(' ') || 'Sans nom'}
							<Select.Item value={c?.id ?? ''} label={name}>{name}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			{:else if NEEDS_FORMATEUR.has(generateType)}
				<Select.Root type="single" bind:value={generateFormateurId}>
					<Select.Trigger class="w-full cursor-pointer">
						{#if generateFormateurId}
							{@const found = formateurs.find((f) => f.formateur?.id === generateFormateurId)}
							{found ? [found.formateur.user?.firstName, found.formateur.user?.lastName].filter(Boolean).join(' ') : 'Sélectionner'}
						{:else}
							<span class="text-muted-foreground">Sélectionner un formateur</span>
						{/if}
					</Select.Trigger>
					<Select.Content>
						{#each formateurs as ff (ff.formateur?.id)}
							{@const u = ff.formateur?.user}
							{@const name = [u?.firstName, u?.lastName].filter(Boolean).join(' ') || 'Formateur'}
							<Select.Item value={ff.formateur?.id ?? ''} label={name}>{name}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			{:else if NEEDS_SEANCE.has(generateType)}
				<Select.Root type="single" bind:value={generateSeanceId}>
					<Select.Trigger class="w-full cursor-pointer">
						{#if generateSeanceId}
							{@const found = seancesList.find((s) => s.id === generateSeanceId)}
							{found ? `${new Date(found.startAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })} — ${found.module?.name ?? 'Séance'}` : 'Sélectionner'}
						{:else}
							<span class="text-muted-foreground">Sélectionner une séance</span>
						{/if}
					</Select.Trigger>
					<Select.Content>
						{#each seancesList as s (s.id)}
							{@const label = `${new Date(s.startAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })} — ${s.module?.name ?? 'Séance'}`}
							<Select.Item value={s.id} {label}>{label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			{/if}

			<!-- Preflight checklist -->
			{#if preflightResult && preflightResult.items.length > 0}
				<div class="rounded-md border divide-y">
					{#each preflightResult.items as item (item.id)}
						<div class="flex items-start gap-3 px-3 py-2.5 text-sm">
							{#if item.severity === 'block'}
								<CircleAlert class="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
							{:else if item.severity === 'warn'}
								<AlertTriangle class="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden="true" />
							{:else}
								<Lock class="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
							{/if}
							<div class="flex-1 min-w-0">
								<p class={item.severity === 'block' ? 'text-destructive' : item.severity === 'warn' ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'}>
									{item.messageFr}
								</p>
								{#if item.hrefPath}
									<button
										type="button"
										class="mt-1 inline-flex items-center gap-1 text-xs text-primary underline-offset-2 hover:underline cursor-pointer"
										aria-label={item.fixLabelFr}
										onclick={() => {
											const returnUrl = `/formations/${formation?.id}/documents?resumeGenerate=${generateType}`;
											const href = item.hrefPath.includes('?')
												? `${item.hrefPath}&returnTo=${encodeURIComponent(returnUrl)}`
												: `${item.hrefPath}?returnTo=${encodeURIComponent(returnUrl)}`;
											generateOpen = false;
											goto(href);
										}}
									>
										{item.fixLabelFr}
										<ExternalLink class="size-3" aria-hidden="true" />
									</button>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{:else if preflightResult}
				<div class="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
					<CircleCheck class="size-4 shrink-0" aria-hidden="true" />
					Prêt à générer.
				</div>
			{/if}

			<!-- Warning acknowledgment checkbox -->
			{#if preflightResult && preflightResult.blockingCount === 0 && preflightResult.warningCount > 0}
				<label class="flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm hover:bg-muted/50">
					<input
						type="checkbox"
						bind:checked={warningsAcknowledged}
						class="mt-0.5 cursor-pointer"
					/>
					<span>J'ai pris connaissance des avertissements et souhaite générer le document.</span>
				</label>
			{/if}
		</div>

		<Dialog.Footer>
			<Button
				variant="outline"
				class="cursor-pointer"
				onclick={() => (generateOpen = false)}
			>
				Annuler
			</Button>
			<Button
				class="cursor-pointer"
				disabled={generating || !canGenerate}
				aria-describedby={preflightResult ? 'preflight-summary' : undefined}
				onclick={() => submitGenerate()}
			>
				{#if generating}
					<Loader2 class="mr-1.5 size-4 animate-spin" />
					Génération...
				{:else}
					Générer
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Confirmation Dialog -->
<Dialog.Root bind:open={deleteDialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Supprimer le document</Dialog.Title>
			<Dialog.Description>
				Êtes-vous sûr de vouloir supprimer « {documentToDelete?.title ?? ''} » ? Cette action est irréversible.
			</Dialog.Description>
		</Dialog.Header>

		{#if documentToDelete}
			<form
				method="POST"
				action="?/deleteDocument"
				use:enhance={() => {
					deleting = true;
					return async ({ result, update }) => {
						deleting = false;
						if (result.type === 'success') {
							toast.success('Document supprimé');
							deleteDialogOpen = false;
							documentToDelete = null;
							await update();
						} else if (result.type === 'failure') {
							toast.error((result.data as { message?: string })?.message ?? 'Erreur');
						}
					};
				}}
			>
				<input type="hidden" name="documentId" value={documentToDelete.id} />
				<Dialog.Footer>
					<Button
						variant="outline"
						type="button"
						class="cursor-pointer"
						onclick={() => { deleteDialogOpen = false; documentToDelete = null; }}
					>
						Annuler
					</Button>
					<Button type="submit" variant="destructive" class="cursor-pointer" disabled={deleting}>
						{deleting ? 'Suppression...' : 'Supprimer'}
					</Button>
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>
