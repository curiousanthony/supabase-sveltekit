<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import X from '@lucide/svelte/icons/x';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';

	const DOC_TYPE_LABELS: Record<string, string> = {
		devis: 'Devis',
		convention: 'Convention',
		convocation: 'Convocation',
		certificat: 'Certificat de réalisation',
		ordre_mission: "Ordre de mission",
		feuille_emargement: "Feuille d'émargement",
		attestation: 'Attestation'
	};

	const returnTo = $derived(page.url.searchParams.get('returnTo'));
	const isOnDocumentsTab = $derived(page.url.pathname.endsWith('/documents'));

	const visible = $derived(!!returnTo && !isOnDocumentsTab);

	const docTypeLabel = $derived.by(() => {
		if (!returnTo) return '';
		try {
			const decoded = decodeURIComponent(returnTo);
			const url = new URL(decoded, 'http://localhost');
			const resumeType = url.searchParams.get('resumeGenerate') ?? '';
			return DOC_TYPE_LABELS[resumeType] ?? resumeType;
		} catch {
			return '';
		}
	});

	function dismiss() {
		const url = new URL(page.url);
		url.searchParams.delete('returnTo');
		goto(url.toString(), { replaceState: true });
	}
</script>

{#if visible}
	<div
		role="status"
		aria-atomic="false"
		class="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm text-primary shadow-sm"
	>
		<a
			href={returnTo ?? '#'}
			class="flex items-center gap-1 font-medium hover:underline underline-offset-2"
			aria-label="Reprendre la génération du {docTypeLabel}"
		>
			Reprendre la génération{docTypeLabel ? ` du ${docTypeLabel}` : ''}
			<ArrowRight class="size-3.5 shrink-0" aria-hidden="true" />
		</a>
		<button
			type="button"
			class="ml-1 rounded-full p-0.5 hover:bg-primary/20 cursor-pointer"
			aria-label="Fermer le rappel de génération"
			onclick={dismiss}
		>
			<X class="size-3.5" aria-hidden="true" />
		</button>
	</div>
{/if}
