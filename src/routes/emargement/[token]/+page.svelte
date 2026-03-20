<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import SignaturePad from '$lib/components/custom/signature-pad.svelte';
	import Check from '@lucide/svelte/icons/check';
	import AlertCircle from '@lucide/svelte/icons/alert-circle';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Calendar from '@lucide/svelte/icons/calendar';
	import User from '@lucide/svelte/icons/user';

	let { data, form }: PageProps = $props();

	let signatureDataUrl = $state<string | null>(null);
	let signed = $state(!!data.emargement.signedAt);
	let submitting = $state(false);
	let errorMessage = $state<string | null>(null);

	$effect(() => {
		if (form?.success) signed = true;
		if (form?.message && !form?.success) errorMessage = form.message;
	});

	function formatDateFr(dateStr: string): string {
		if (!dateStr) return '';
		const d = new Date(dateStr);
		return d.toLocaleDateString('fr-FR', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	function formatTimeFr(dateStr: string): string {
		if (!dateStr) return '';
		const d = new Date(dateStr);
		return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
	}

	const sessionDateFormatted = $derived(formatDateFr(data.emargement.sessionDate));
	const sessionTimeRange = $derived(
		`${formatTimeFr(data.emargement.sessionDate)} – ${formatTimeFr(data.emargement.sessionEndAt)}`
	);
</script>

<svelte:head>
	<title>Émargement — {data.emargement.formationName}</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="flex min-h-dvh items-center justify-center bg-gray-50 px-4 py-8 dark:bg-gray-950">
	<div class="w-full max-w-[600px]">
		<p class="mb-6 text-center text-sm font-medium tracking-wide text-muted-foreground uppercase">
			Émargement
		</p>

		<div class="rounded-xl border border-border bg-white shadow-sm dark:bg-gray-900">
			<div class="border-b border-border px-6 py-5">
				<h1 class="text-xl font-semibold text-foreground">
					{data.emargement.formationName}
				</h1>
				<div class="mt-3 flex flex-col gap-1.5 text-sm text-muted-foreground">
					<div class="flex items-center gap-2">
						<Calendar class="size-4 shrink-0" />
						<span class="first-letter:capitalize">{sessionDateFormatted}</span>
					</div>
					<div class="flex items-center gap-2">
						<Calendar class="size-4 shrink-0 opacity-0" />
						<span>{sessionTimeRange}</span>
					</div>
					{#if data.emargement.sessionLocation}
						<div class="flex items-center gap-2">
							<MapPin class="size-4 shrink-0" />
							<span>{data.emargement.sessionLocation}</span>
						</div>
					{/if}
				</div>
			</div>

			<div class="px-6 py-5">
				<div class="mb-4 flex items-center gap-2 text-sm">
					<User class="size-4 text-muted-foreground" />
					<span class="font-medium">{data.emargement.learnerName}</span>
				</div>

				{#if signed}
					<div
						class="flex flex-col items-center gap-4 rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-950/30"
					>
						<div
							class="flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900"
						>
							<Check class="size-6 text-green-600 dark:text-green-400" />
						</div>
						<div class="text-center">
							<p class="font-semibold text-green-800 dark:text-green-300">
								Votre émargement a été enregistré
							</p>
							<p class="mt-1 text-sm text-green-600 dark:text-green-400">
								Merci, vous pouvez fermer cette page.
							</p>
						</div>
						{#if data.emargement.signatureImageUrl}
							<img
								src={data.emargement.signatureImageUrl}
								alt="Votre signature"
								class="mt-2 h-[120px] w-auto rounded border border-green-200 bg-white object-contain p-2 dark:border-green-800"
							/>
						{/if}
					</div>
				{:else}
					{#if errorMessage}
						<div
							class="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
						>
							<AlertCircle class="size-4 shrink-0" />
							<span>{errorMessage}</span>
						</div>
					{/if}

					<p class="mb-3 text-sm text-muted-foreground">
						Veuillez signer ci-dessous pour confirmer votre présence.
					</p>

					<form
						method="POST"
						action="?/sign"
						use:enhance={() => {
							submitting = true;
							errorMessage = null;
							return async ({ update }) => {
								submitting = false;
								await update();
							};
						}}
					>
						<input type="hidden" name="signature" value={signatureDataUrl ?? ''} />

						<SignaturePad
							disabled={submitting}
							onSign={(dataUrl) => {
								signatureDataUrl = dataUrl;
							}}
						/>

						{#if signatureDataUrl}
							<div class="mt-4">
								<button
									type="submit"
									disabled={submitting}
									class="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
								>
									{#if submitting}
										Envoi en cours…
									{:else}
										Confirmer ma signature
									{/if}
								</button>
							</div>
						{/if}
					</form>
				{/if}
			</div>
		</div>

		<p class="mt-4 text-center text-xs text-muted-foreground">
			Mentore Manager — Émargement sécurisé
		</p>
	</div>
</div>
