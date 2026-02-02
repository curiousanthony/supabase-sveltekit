<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { sitemap } from '$lib/settings/config';
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

	// Determine if it's a 404 or other error
	const is404 = $derived(page.status === 404);
	const is500 = $derived(page.status >= 500);

	// Extract the section from the URL path
	const pathSection = $derived(() => {
		const path = page.url.pathname;
		const segments = path.split('/').filter(Boolean);
		return segments[0] || '';
	});

	// Context-aware messages based on where the user was trying to go
	interface ContextMessage {
		title: string;
		subtitle: string;
		suggestion: string;
		icon: typeof BookOpen;
		href: string;
	}

	const contextMessages: Record<string, ContextMessage> = {
		formations: {
			title: 'Formation introuvable',
			subtitle: "Cette formation semble avoir pris une pause café... prolongée.",
			suggestion: 'Parcourir toutes les formations',
			icon: BookOpen,
			href: '/formations'
		},
		deals: {
			title: 'Deal introuvable',
			subtitle: "Ce deal a peut-être trouvé preneur ailleurs... ou s'est égaré en chemin.",
			suggestion: 'Voir tous les deals',
			icon: Handshake,
			href: '/deals'
		},
		contacts: {
			title: 'Contact introuvable',
			subtitle: "Ce contact a changé d'adresse sans laisser de message.",
			suggestion: 'Consulter le répertoire',
			icon: Users,
			href: '/contacts'
		},
		calendrier: {
			title: 'Événement introuvable',
			subtitle: 'Cette date semble avoir disparu du calendrier.',
			suggestion: 'Retour au calendrier',
			icon: Calendar,
			href: '/calendrier'
		},
		qualiopi: {
			title: 'Page qualité introuvable',
			subtitle: 'Ce critère Qualiopi reste à documenter.',
			suggestion: 'Gestion qualité',
			icon: FileText,
			href: '/qualiopi'
		}
	};

	// Get context-specific or default message
	const contextMessage = $derived(() => {
		const section = pathSection();
		if (section && contextMessages[section]) {
			return contextMessages[section];
		}
		return null;
	});

	// Generic 404 messages (rotate for variety)
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

	// Get a consistent message based on URL (so it doesn't change on re-render)
	const genericMessageIndex = $derived(() => {
		const hash = page.url.pathname.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
		return hash % generic404Messages.length;
	});

	const genericMessage = $derived(() => generic404Messages[genericMessageIndex()]);

	// Error message for non-404 errors
	const errorMessage = $derived(() => {
		if (is404) {
			return contextMessage()?.subtitle || genericMessage().subtitle;
		}
		if (is500) {
			return "Notre serveur a besoin d'une petite pause. Réessayez dans un instant.";
		}
		return page.error?.message || "Une erreur inattendue s'est produite.";
	});

	// Error title
	const errorTitle = $derived(() => {
		if (is404) {
			return contextMessage()?.title || genericMessage().title;
		}
		if (is500) {
			return 'Erreur technique';
		}
		return 'Erreur';
	});

	// Quick navigation items (most used features)
	const quickNav = [
		{ title: 'Tableau de bord', href: '/', icon: Home },
		{ title: 'Formations', href: '/formations', icon: BookOpen },
		{ title: 'Contacts', href: '/contacts', icon: Users },
		{ title: 'Deals', href: '/deals', icon: Handshake }
	];

	// Command palette trigger
	function openCommandPalette() {
		// Trigger the global command palette (Cmd+K / Ctrl+K)
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
	<title>{page.status} - {errorTitle()} | Mentore Manager</title>
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
				<span
					class="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium tabular-nums text-primary"
				>
					Erreur {page.status}
				</span>
			</div>
			<Empty.Title class="text-2xl md:text-3xl">
				{errorTitle()}
			</Empty.Title>
			<Empty.Description class="text-base">
				{errorMessage()}
			</Empty.Description>
		</Empty.Header>

		<!-- Content -->
		<Empty.Content class="max-w-md">
			<!-- Context-specific suggestion -->
			{#if is404 && contextMessage()}
				{@const ctx = contextMessage()}
				{#if ctx}
					<Button href={ctx.href} size="lg" class="w-full">
						<ctx.icon class="size-4" />
						{ctx.suggestion}
					</Button>
				{/if}
			{:else}
				<Button href="/" size="lg" class="w-full">
					<Home class="size-4" />
					Retour à l'accueil
				</Button>
			{/if}

			<!-- Secondary actions row -->
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
					{#each quickNav as item (item.href)}
						<Button
							href={item.href}
							variant="ghost"
							class="h-auto flex-col gap-1 py-3 text-muted-foreground hover:text-foreground"
						>
							<item.icon class="size-5" />
							<span class="text-xs">{item.title}</span>
						</Button>
					{/each}
				</div>
			</div>

			<!-- Debug info (subtle) -->
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
