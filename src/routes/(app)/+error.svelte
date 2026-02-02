<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import LostDocument from '$lib/components/ui/custom/illustrations/lost-document.svelte';
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
		RefreshCw
	} from '@lucide/svelte';

	// Determine error type
	const is404 = $derived(page.status === 404);
	const is500 = $derived(page.status >= 500);

	// Extract the section from the URL path
	const pathSection = $derived.by(() => {
		const path = page.url.pathname;
		const segments = path.split('/').filter(Boolean);
		return segments[0] || '';
	});

	// Context-aware messages based on where the user was trying to go
	const contextMessages: Record<string, { title: string; subtitle: string; suggestion: string; href: string }> = {
		formations: {
			title: 'Formation introuvable',
			subtitle: "Cette formation semble avoir pris une pause café... prolongée.",
			suggestion: 'Parcourir toutes les formations',
			href: '/formations'
		},
		deals: {
			title: 'Deal introuvable',
			subtitle: "Ce deal a peut-être trouvé preneur ailleurs... ou s'est égaré en chemin.",
			suggestion: 'Voir tous les deals',
			href: '/deals'
		},
		contacts: {
			title: 'Contact introuvable',
			subtitle: "Ce contact a changé d'adresse sans laisser de message.",
			suggestion: 'Consulter le répertoire',
			href: '/contacts'
		},
		calendrier: {
			title: 'Événement introuvable',
			subtitle: 'Cette date semble avoir disparu du calendrier.',
			suggestion: 'Retour au calendrier',
			href: '/calendrier'
		},
		qualiopi: {
			title: 'Page qualité introuvable',
			subtitle: 'Ce critère Qualiopi reste à documenter.',
			suggestion: 'Gestion qualité',
			href: '/qualiopi'
		}
	};

	// Get context-specific message
	const contextMessage = $derived(pathSection && contextMessages[pathSection] ? contextMessages[pathSection] : null);

	// Generic 404 messages
	const generic404Messages = [
		{
			title: 'Page introuvable',
			subtitle: "Cette page a séché le cours... Elle n'est plus disponible."
		},
		{
			title: 'Page introuvable',
			subtitle: 'Cette page a oublié de pointer sur la feuille de présence.'
		},
		{
			title: 'Page introuvable',
			subtitle: 'Le formateur de cette page est en retard... très en retard.'
		}
	];

	// Get a consistent message based on URL hash
	const genericMessageIndex = $derived.by(() => {
		const hash = page.url.pathname.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
		return hash % generic404Messages.length;
	});

	const genericMessage = $derived(generic404Messages[genericMessageIndex]);

	// Final displayed message
	const errorMessage = $derived.by(() => {
		if (is404) {
			return contextMessage?.subtitle ?? genericMessage.subtitle;
		}
		if (is500) {
			return "Notre serveur a besoin d'une petite pause. Réessayez dans un instant.";
		}
		return page.error?.message ?? "Une erreur inattendue s'est produite.";
	});

	// Final displayed title
	const errorTitle = $derived.by(() => {
		if (is404) {
			return contextMessage?.title ?? genericMessage.title;
		}
		if (is500) {
			return 'Erreur technique';
		}
		return 'Erreur';
	});

	// Command palette trigger
	function openCommandPalette() {
		const event = new KeyboardEvent('keydown', {
			key: 'k',
			metaKey: true,
			ctrlKey: true,
			bubbles: true
		});
		document.dispatchEvent(event);
	}
</script>

<svelte:head>
	<title>{page.status} - {errorTitle} | Mentore Manager</title>
</svelte:head>

<div class="flex flex-1 flex-col items-center justify-center p-4 md:p-8">
	<Empty.Root class="max-w-2xl border-0 bg-transparent">
		<!-- Illustration -->
		<Empty.Media class="mb-4">
			<LostDocument class="h-40 w-40 md:h-48 md:w-48" />
		</Empty.Media>

		<!-- Header -->
		<Empty.Header class="max-w-lg">
			<div class="mb-2 flex items-center justify-center gap-2">
				<span class="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium tabular-nums text-primary">
					Erreur {page.status}
				</span>
			</div>
			<Empty.Title class="text-2xl md:text-3xl">
				{errorTitle}
			</Empty.Title>
			<Empty.Description class="text-base">
				{errorMessage}
			</Empty.Description>
		</Empty.Header>

		<!-- Content -->
		<Empty.Content class="max-w-md">
			<!-- Context-specific or default primary action -->
			{#if is404 && contextMessage}
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
				<Button variant="outline" onclick={openCommandPalette}>
					<Search class="size-4" />
					Rechercher
				</Button>
				{#if is500}
					<Button variant="outline" onclick={() => location.reload()}>
						<RefreshCw class="size-4" />
						Réessayer
					</Button>
				{/if}
			</div>

			<Separator class="my-2" />

			<!-- Quick navigation -->
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

			<!-- Path info -->
			<div class="mt-4 w-full rounded-lg bg-muted/50 p-3">
				<p class="text-center text-xs text-muted-foreground">
					<HelpCircle class="mr-1 inline-block size-3" />
					Chemin demandé :
					<code class="ml-1 rounded bg-background px-1.5 py-0.5 font-mono">
						{page.url.pathname}
					</code>
				</p>
			</div>
		</Empty.Content>
	</Empty.Root>
</div>
