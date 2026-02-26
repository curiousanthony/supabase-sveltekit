<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { appInfo } from '$lib/settings/config';
	import LostDocument from '$lib/components/ui/custom/illustrations/lost-document.svelte';
	import ServerNap from '$lib/components/ui/custom/illustrations/server-nap.svelte';
	import { Home, LogIn, ArrowLeft, RefreshCw } from '@lucide/svelte';

	const status = $derived(page.status);
	const is404 = $derived(status === 404);
	const is500 = $derived(status >= 500);

	const errorTitle = $derived.by(() => {
		if (is404) return 'Page introuvable';
		if (is500) return 'Erreur technique';
		if (status === 401 || status === 403) return 'Accès refusé';
		return 'Une erreur est survenue';
	});

	const errorMessage = $derived.by(() => {
		if (is404) return "Cette page n'existe pas ou a été déplacée. Vérifiez l'URL ou revenez à l'accueil.";
		if (is500) return "Notre serveur fait une courte pause. Réessayez dans un instant — il revient vite.";
		if (status === 401) return "Vous devez être connecté pour accéder à cette page.";
		if (status === 403) return "Vous n'avez pas les droits nécessaires pour accéder à cette page.";
		return page.error?.message ?? "Une erreur inattendue s'est produite. Vous pouvez essayer de vous reconnecter.";
	});

	const reconnectUrl = $derived(`/auth/login?redirectTo=${encodeURIComponent(page.url.pathname)}`);
</script>

<svelte:head>
	<title>{status} · {errorTitle} | {appInfo.name}</title>
</svelte:head>

<div class="flex min-h-svh flex-col items-center justify-center bg-muted/30 p-6 md:p-10">
	<div class="flex w-full max-w-md flex-col items-center gap-6">
		<!-- Logo -->
		<a href="/" class="flex flex-col items-center gap-1 transition-opacity hover:opacity-80">
			<img src={appInfo.logo} alt={appInfo.name} class="h-8" />
			<span class="text-sm font-semibold text-muted-foreground">{appInfo.name}</span>
		</a>

		<!-- Illustration -->
		{#if is500}
			<ServerNap class="h-36 w-36" />
		{:else}
			<LostDocument class="h-36 w-36" />
		{/if}

		<!-- Error Card -->
		<Card.Root class="w-full">
			<Card.Header class="items-center pb-3 text-center">
				<span
					class="mb-2 rounded-full px-3 py-1 text-sm font-semibold tabular-nums
					{is500
						? 'bg-destructive/10 text-destructive'
						: 'bg-primary/10 text-primary'}"
				>
					Erreur {status}
				</span>
				<Card.Title class="text-xl">{errorTitle}</Card.Title>
				<Card.Description class="text-balance text-sm">{errorMessage}</Card.Description>
			</Card.Header>

			<Card.Content class="flex flex-col gap-2 pt-0">
				{#if is500}
					<Button onclick={() => location.reload()} class="w-full">
						<RefreshCw class="size-4" />
						Réessayer
					</Button>
					<Button href={reconnectUrl} variant="secondary" class="w-full">
						<LogIn class="size-4" />
						Se reconnecter
					</Button>
				{:else}
					<Button href="/" class="w-full">
						<Home class="size-4" />
						Accueil
					</Button>
					<Button href={reconnectUrl} variant="secondary" class="w-full">
						<LogIn class="size-4" />
						Se connecter
					</Button>
				{/if}

				<Button variant="ghost" class="w-full text-muted-foreground" onclick={() => history.back()}>
					<ArrowLeft class="size-4" />
					Page précédente
				</Button>
			</Card.Content>

			<Card.Footer class="justify-center pt-0">
				<p class="text-center text-xs text-muted-foreground">
					Chemin demandé :
					<code class="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
						{page.url.pathname}
					</code>
				</p>
			</Card.Footer>
		</Card.Root>
	</div>
</div>
