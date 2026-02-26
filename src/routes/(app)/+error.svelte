<script lang="ts">
	import { page } from '$app/state';
	const status = $derived(page.status);
	const isServerError = $derived(status >= 500);
	const isNotFound = $derived(status === 404);
</script>

<div class="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
	{#if isServerError}
		<h1 class="text-2xl font-semibold">Une erreur est survenue</h1>
		<p class="text-muted-foreground max-w-sm">
			Le serveur a rencontré un problème. Veuillez vous reconnecter ou réessayer plus tard.
		</p>
	{:else if isNotFound}
		<h1 class="text-2xl font-semibold">Page introuvable</h1>
		<p class="text-muted-foreground max-w-sm">
			La page demandée n'existe pas ou a été déplacée.
		</p>
	{:else}
		<h1 class="text-2xl font-semibold">{status}: {page.error?.message ?? 'Erreur'}</h1>
		<p class="text-muted-foreground max-w-sm">
			Une erreur s'est produite. Vous pouvez revenir à l'accueil ou vous reconnecter.
		</p>
	{/if}
	<div class="flex flex-wrap justify-center gap-3 pt-2">
		<a href="/auth/login" class="text-primary underline underline-offset-4 hover:no-underline">Se reconnecter</a>
		<a href="/" class="text-primary underline underline-offset-4 hover:no-underline">Accueil</a>
	</div>
</div>
