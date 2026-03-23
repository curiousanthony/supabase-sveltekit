<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import FileText from '@lucide/svelte/icons/file-text';
	import FileCheck from '@lucide/svelte/icons/file-check';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import AlertCircle from '@lucide/svelte/icons/alert-circle';

	const DOCUMENT_TYPE_LABELS: Record<string, string> = {
		convention: 'Convention',
		convocation: 'Convocation',
		certificat: 'Certificat de réalisation',
		devis: 'Devis',
		ordre_mission: 'Ordre de mission',
		attestation: 'Attestation',
		feuille_emargement: "Feuille d'émargement"
	};

	interface Props {
		completed: boolean;
		documentType: string;
		formationId: string;
		subActionId: string;
		onGenerate: (documentType: string, subActionId: string) => Promise<void>;
	}

	let { completed, documentType, formationId, subActionId, onGenerate }: Props = $props();

	let loading = $state(false);
	let error = $state<string | null>(null);

	let label = $derived(DOCUMENT_TYPE_LABELS[documentType] ?? documentType);

	async function handleGenerate() {
		loading = true;
		error = null;
		try {
			await onGenerate(documentType, subActionId);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Erreur lors de la génération';
		} finally {
			loading = false;
		}
	}
</script>

{#if completed}
	<div class="flex items-center gap-2 text-sm text-green-600">
		<FileCheck class="size-4" />
		<span>Généré</span>
	</div>
{:else if loading}
	<div class="flex items-center gap-2 text-sm text-muted-foreground">
		<Loader2 class="size-4 animate-spin" />
		<span>Génération en cours...</span>
	</div>
{:else if error}
	<div class="flex flex-col gap-1.5">
		<div class="flex items-center gap-1.5 text-sm text-destructive">
			<AlertCircle class="size-4" />
			<span>{error}</span>
		</div>
		<Button variant="outline" size="sm" onclick={handleGenerate}>
			Réessayer
		</Button>
	</div>
{:else}
	<Button variant="outline" size="sm" onclick={handleGenerate}>
		<FileText class="size-3.5 mr-1.5" />
		Générer {label}
	</Button>
{/if}
