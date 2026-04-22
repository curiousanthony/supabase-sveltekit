<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import X from '@lucide/svelte/icons/x';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import { Button } from '$lib/components/ui/button';

	const DOC_TYPE_LABELS: Record<string, string> = {
		devis: 'Devis',
		convention: 'Convention',
		convocation: 'Convocation',
		certificat: 'Certificat de réalisation',
		ordre_mission: "Ordre de mission",
		feuille_emargement: "Feuille d'émargement",
		attestation: 'Attestation'
	};

	// F1: Sanitize returnTo — accept same-origin paths only, reject open-redirect and JS-scheme attacks
	const returnTo = $derived.by(() => {
		const raw = page.url.searchParams.get('returnTo');
		if (!raw) return null;
		if (!raw.startsWith('/') || raw.startsWith('//')) return null;
		try {
			const u = new URL(raw, page.url.origin);
			if (u.origin !== page.url.origin) return null;
			return u.pathname + u.search + u.hash;
		} catch {
			return null;
		}
	});

	const visible = $derived(!!returnTo);

	// F3: Extract docTypeLabel from sanitized returnTo — never echo raw param if key is unknown
	const docTypeLabel = $derived.by(() => {
		if (!returnTo) return null;
		try {
			const u = new URL(returnTo, page.url.origin);
			const resumeType = u.searchParams.get('resumeGenerate') ?? '';
			if (!(resumeType in DOC_TYPE_LABELS)) return null;
			return DOC_TYPE_LABELS[resumeType];
		} catch {
			return null;
		}
	});

	function dismiss() {
		const url = new URL(page.url);
		url.searchParams.delete('returnTo');
		// F6: Skip unnecessary loader re-fetch on dismiss
		goto(url.toString(), { replaceState: true, noScroll: true, keepFocus: true });
	}
</script>

{#if visible}
	<div
		role="status"
		aria-atomic="false"
		class="flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm text-primary shadow-sm"
	>
		<Button
			href={returnTo}
			variant="link"
			size="sm"
			class="h-auto p-0 font-medium text-primary"
			aria-label={docTypeLabel ? `Reprendre la génération du ${docTypeLabel}` : 'Reprendre la génération du document'}
		>
			Reprendre la génération{docTypeLabel ? ` du ${docTypeLabel}` : ' du document'}
			<ArrowRight class="size-3.5 shrink-0" aria-hidden="true" />
		</Button>
		<Button
			variant="ghost"
			size="icon-sm"
			onclick={dismiss}
			aria-label="Fermer le rappel de génération"
			class="size-6 rounded-full p-0.5 text-primary hover:bg-primary/20"
		>
			<X class="size-3.5" aria-hidden="true" />
		</Button>
	</div>
{/if}
