<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import LostDocument from '$lib/components/ui/custom/illustrations/lost-document.svelte';
	import ServerNap from '$lib/components/ui/custom/illustrations/server-nap.svelte';
	import {
		Home,
		ArrowLeft,
		Search,
		BookOpen,
		Users,
		Calendar,
		Handshake,
		FileText,
		HelpCircle,
		RefreshCw,
		LogIn
	} from '@lucide/svelte';

	const status = $derived(page.status);
	const is404 = $derived(status === 404);
	const is500 = $derived(status >= 500);
	const isAuthError = $derived(status === 401 || status === 403);

	const pathSection = $derived.by(() => {
		const segments = page.url.pathname.split('/').filter(Boolean);
		return segments[0] ?? '';
	});

	const reconnectUrl = $derived(`/auth/login?redirectTo=${encodeURIComponent(page.url.pathname)}`);

	// Context-aware 404 messages keyed by URL section
	const contextMessages: Record<string, { title: string; subtitle: string; suggestion: string; href: string }> = {
		formations: {
			title: 'Formation introuvable',
			subtitle: "Cette formation a pris une retraite anticipée… sans prévenir.",
			suggestion: 'Voir toutes les formations',
			href: '/formations'
		},
		deals: {
			title: 'Deal introuvable',
			subtitle: "Ce deal a peut-être trouvé preneur ailleurs. Ou il s'est juste égaré.",
			suggestion: 'Voir tous les deals',
			href: '/deals'
		},
		contacts: {
			title: 'Contact introuvable',
			subtitle: "Ce contact a changé d'adresse sans laisser de message. Classique.",
			suggestion: 'Consulter le répertoire',
			href: '/contacts'
		},
		calendrier: {
			title: 'Événement introuvable',
			subtitle: "Cette date a disparu du calendrier. Le formateur est en retard… très en retard.",
			suggestion: 'Retour au calendrier',
			href: '/calendrier'
		},
		qualiopi: {
			title: 'Page qualité introuvable',
			subtitle: "Ce critère Qualiopi reste mystérieusement non documenté.",
			suggestion: 'Gestion qualité',
			href: '/qualiopi'
		}
	};

	const contextMessage = $derived(
		pathSection && contextMessages[pathSection] ? contextMessages[pathSection] : null
	);

	// Pick a consistent random 404 message from the URL path chars
	const generic404Messages = [
		{
			title: 'Page introuvable',
			subtitle: "Cette page a séché le cours. Elle n'est plus disponible."
		},
		{
			title: 'Page introuvable',
			subtitle: "Cette page a oublié de pointer sur la feuille de présence."
		},
		{
			title: 'Page introuvable',
			subtitle: "Le formateur de cette page est en retard… très en retard."
		}
	];

	const genericMessage = $derived.by(() => {
		const idx =
			page.url.pathname.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) %
			generic404Messages.length;
		return generic404Messages[idx];
	});

	const errorTitle = $derived.by(() => {
		if (is404) return contextMessage?.title ?? genericMessage.title;
		if (is500) return "Petit incident technique";
		if (isAuthError) return "Accès refusé";
		return 'Erreur';
	});

	const errorSubtitle = $derived.by(() => {
		if (is404) return contextMessage?.subtitle ?? genericMessage.subtitle;
		if (is500) return "Notre serveur fait une pause café. Réessayez dans un instant — ça devrait revenir rapidement.";
		if (isAuthError) return "Vous n'avez pas les droits pour accéder à cette page. Reconnectez-vous si nécessaire.";
		return page.error?.message ?? "Une erreur inattendue s'est produite.";
	});
</script>

<svelte:head>
	<title>{status} · {errorTitle} | Mentore Manager</title>
</svelte:head>

<div class="flex flex-1 flex-col items-center justify-center p-4 md:p-8">
	<Empty.Root class="max-w-2xl border-0 bg-transparent shadow-none">
		<!-- Illustration -->
		<Empty.Media class="mb-2">
			{#if is500}
				<ServerNap class="h-44 w-44 md:h-52 md:w-52" />
			{:else}
				<LostDocument class="h-44 w-44 md:h-52 md:w-52" />
			{/if}
		</Empty.Media>

		<!-- Header -->
		<Empty.Header class="max-w-lg">
			<div class="mb-3 flex items-center justify-center gap-2">
				<span
					class="rounded-full px-3 py-1 text-sm font-semibold tabular-nums
					{is500
						? 'bg-destructive/10 text-destructive'
						: isAuthError
							? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
							: 'bg-primary/10 text-primary'}"
				>
					Erreur {status}
				</span>
			</div>
			<Empty.Title class="text-2xl md:text-3xl">{errorTitle}</Empty.Title>
			<Empty.Description class="text-balance text-base">{errorSubtitle}</Empty.Description>
		</Empty.Header>

		<!-- Actions -->
		<Empty.Content class="max-w-md gap-3">
			<!-- Primary action -->
			{#if is500 || isAuthError}
				<div class="flex w-full flex-col gap-2 sm:flex-row">
					<Button href={reconnectUrl} size="lg" class="flex-1">
						<LogIn class="size-4" />
						Se reconnecter
					</Button>
					{#if is500}
						<Button variant="outline" size="lg" class="flex-1" onclick={() => location.reload()}>
							<RefreshCw class="size-4" />
							Réessayer
						</Button>
					{/if}
				</div>
			{:else if is404 && contextMessage}
				<Button href={contextMessage.href} size="lg" class="w-full">
					{#if pathSection === 'formations'}
						<BookOpen class="size-4" />
					{:else if pathSection === 'deals'}
						<Handshake class="size-4" />
					{:else if pathSection === 'contacts'}
						<Users class="size-4" />
					{:else if pathSection === 'calendrier'}
						<Calendar class="size-4" />
					{:else if pathSection === 'qualiopi'}
						<FileText class="size-4" />
					{/if}
					{contextMessage.suggestion}
				</Button>
			{:else}
				<Button href="/" size="lg" class="w-full">
					<Home class="size-4" />
					Retour à l'accueil
				</Button>
			{/if}

			<!-- Secondary actions -->
			<div class="flex w-full flex-wrap items-center justify-center gap-2">
				<Button variant="outline" onclick={() => history.back()}>
					<ArrowLeft class="size-4" />
					Page précédente
				</Button>
				{#if !is500}
					<Button variant="outline" href="/">
						<Home class="size-4" />
						Accueil
					</Button>
				{/if}
			</div>

			<Separator class="my-1" />

			<!-- Quick nav grid -->
			<div class="w-full">
				<p class="mb-3 text-center text-sm text-muted-foreground">Accès rapide</p>
				<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
					<Button
						href="/"
						variant="ghost"
						class="h-auto flex-col gap-1 py-3 text-muted-foreground hover:text-foreground"
					>
						<Home class="size-5" />
						<span class="text-xs">Tableau de bord</span>
					</Button>
					<Button
						href="/formations"
						variant="ghost"
						class="h-auto flex-col gap-1 py-3 text-muted-foreground hover:text-foreground"
					>
						<BookOpen class="size-5" />
						<span class="text-xs">Formations</span>
					</Button>
					<Button
						href="/contacts"
						variant="ghost"
						class="h-auto flex-col gap-1 py-3 text-muted-foreground hover:text-foreground"
					>
						<Users class="size-5" />
						<span class="text-xs">Contacts</span>
					</Button>
					<Button
						href="/deals"
						variant="ghost"
						class="h-auto flex-col gap-1 py-3 text-muted-foreground hover:text-foreground"
					>
						<Handshake class="size-5" />
						<span class="text-xs">Deals</span>
					</Button>
				</div>
			</div>

			<!-- Requested path info -->
			<div class="mt-2 w-full rounded-lg bg-muted/50 p-3">
				<p class="text-center text-xs text-muted-foreground">
					<HelpCircle class="mr-1 inline-block size-3" />
					Chemin demandé :
					<code class="ml-1 rounded bg-background px-1.5 py-0.5 font-mono text-xs">
						{page.url.pathname}
					</code>
				</p>
			</div>
		</Empty.Content>
	</Empty.Root>
</div>
