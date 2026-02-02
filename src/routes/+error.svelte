<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { appInfo } from '$lib/settings/config';
	import { AlertCircle, Home, LogIn, ArrowLeft } from '@lucide/svelte';

	// Determine if it's a 404 or other error
	const is404 = $derived(page.status === 404);

	// Get a user-friendly error message
	const errorMessage = $derived(() => {
		if (is404) {
			return "La page que vous recherchez n'existe pas ou a été déplacée.";
		}
		return page.error?.message || "Une erreur inattendue s'est produite.";
	});

	// Get the error title
	const errorTitle = $derived(() => {
		if (is404) {
			return 'Page introuvable';
		}
		if (page.status >= 500) {
			return 'Erreur serveur';
		}
		return 'Erreur';
	});
</script>

<svelte:head>
	<title>{page.status} - {errorTitle()} | {appInfo.name}</title>
</svelte:head>

<div class="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
	<div class="flex w-full max-w-md flex-col items-center gap-6">
		<!-- Logo -->
		<a href="/" class="flex flex-col items-center">
			<img src={appInfo.logo} alt={appInfo.name} class="h-8" />
			<span class="text-xl font-bold text-primary">Manager</span>
		</a>

		<!-- Error Card -->
		<Card.Root class="w-full">
			<Card.Header class="items-center text-center">
				<div
					class="mb-2 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"
				>
					<AlertCircle class="size-6" />
				</div>
				<Card.Title class="text-2xl tabular-nums">
					<span class="text-muted-foreground">{page.status}</span>
					<span class="mx-2 text-muted-foreground/50">·</span>
					{errorTitle()}
				</Card.Title>
				<Card.Description class="text-balance">
					{errorMessage()}
				</Card.Description>
			</Card.Header>

			<Card.Content class="flex flex-col gap-3">
				<!-- Primary actions -->
				<div class="flex flex-col gap-2 sm:flex-row">
					<Button href="/" class="flex-1">
						<Home class="size-4" />
						Accueil
					</Button>
					<Button href="/auth/login" variant="secondary" class="flex-1">
						<LogIn class="size-4" />
						Se connecter
					</Button>
				</div>

				<!-- Go back button -->
				<Button
					variant="ghost"
					class="w-full text-muted-foreground"
					onclick={() => history.back()}
				>
					<ArrowLeft class="size-4" />
					Retour à la page précédente
				</Button>
			</Card.Content>

			<Card.Footer class="justify-center">
				<p class="text-center text-xs text-muted-foreground">
					Vous avez essayé d'accéder à :
					<code class="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
						{page.url.pathname}
					</code>
				</p>
			</Card.Footer>
		</Card.Root>
	</div>
</div>
