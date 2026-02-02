<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Book2 from '@tabler/icons-svelte/icons/book-2';
	import HeartHandshake from '@tabler/icons-svelte/icons/heart-handshake';
	import ThumbUp from '@tabler/icons-svelte/icons/thumb-up';
	import ChevronRight from '@tabler/icons-svelte/icons/chevron-right';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	let { data } = $props();
	const { user, recentFormations, activeDeals, stats, header } = $derived(data);
	const userName = $derived(user?.user_metadata?.name ?? user?.user_metadata?.full_name ?? '');
	const pageTitle = $derived(header?.pageName ?? 'Accueil');
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

<Sidebar.Inset>
	<div class="flex flex-1 flex-col gap-6">
		<!-- Greeting -->
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">
				Bonjour{userName ? ` ${userName}` : ''}
			</h1>
			<p class="text-muted-foreground">
				Reprenez où vous en étiez et accomplissez les prochaines actions.
			</p>
		</div>

		<!-- Workspace stats (role-based glance) -->
		{#if stats && (stats.formationsCount > 0 || stats.dealsCount > 0 || stats.qualiopiPercent !== undefined)}
			<div
				class="grid grid-cols-2 gap-3 sm:grid-cols-4 *:data-[slot=card]:bg-muted/50 *:data-[slot=card]:border *:data-[slot=card]:border-border"
			>
				<Card.Root class="rounded-lg">
					<Card.Header class="pb-1">
						<Card.Description class="text-xs">Formations</Card.Description>
						<Card.Title class="text-xl tabular-nums">{stats.formationsCount ?? 0}</Card.Title>
					</Card.Header>
					<Card.Footer class="pt-0">
						<a href="/formations" class="text-xs text-muted-foreground hover:underline"
							>Voir tout</a
						>
					</Card.Footer>
				</Card.Root>
				<Card.Root class="rounded-lg">
					<Card.Header class="pb-1">
						<Card.Description class="text-xs">Deals en cours</Card.Description>
						<Card.Title class="text-xl tabular-nums">{stats.dealsCount ?? 0}</Card.Title>
					</Card.Header>
					<Card.Footer class="pt-0">
						<a href="/deals" class="text-xs text-muted-foreground hover:underline"
							>Voir tout</a
						>
					</Card.Footer>
				</Card.Root>
				<Card.Root class="rounded-lg">
					<Card.Header class="pb-1">
						<Card.Description class="text-xs">Qualiopi</Card.Description>
						<Card.Title class="text-xl tabular-nums">{stats.qualiopiPercent ?? 0}%</Card.Title>
					</Card.Header>
					<Card.Footer class="pt-0">
						<a href="/qualiopi" class="text-xs text-muted-foreground hover:underline"
							>Gestion qualité</a
						>
					</Card.Footer>
				</Card.Root>
				{#if stats.qualiopiToComplete != null && stats.qualiopiToComplete > 0}
					<Card.Root class="rounded-lg border-primary/30">
						<Card.Header class="pb-1">
							<Card.Description class="text-xs">À compléter</Card.Description>
							<Card.Title class="text-xl tabular-nums text-primary">
								{stats.qualiopiToComplete}
							</Card.Title>
						</Card.Header>
						<Card.Footer class="pt-0">
							<a href="/qualiopi" class="text-xs font-medium text-primary hover:underline"
								>Compléter</a
							>
						</Card.Footer>
					</Card.Root>
				{/if}
			</div>
		{/if}

		<!-- Continue where you left off -->
		<div class="space-y-4">
			<h2 class="text-lg font-medium">Reprenez où vous en étiez</h2>
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<!-- Recent formations -->
				<Card.Root class="transition-colors hover:bg-muted/50">
					<Card.Header class="flex flex-row items-center justify-between gap-2 pb-2">
						<div class="flex items-center gap-2">
							<Book2 class="size-5 text-muted-foreground" />
							<Card.Title class="text-base">Formations récentes</Card.Title>
						</div>
						<a href="/formations" class="text-muted-foreground hover:text-foreground">
							<ChevronRight class="size-4" />
						</a>
					</Card.Header>
					<Card.Content class="pt-0">
						{#if recentFormations?.length > 0}
							<ul class="space-y-2">
								{#each recentFormations.slice(0, 3) as formation (formation.id)}
									<li>
										<a
											href="/formations/{formation.id}"
											class="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
										>
											<span class="truncate">{formation.name ?? 'Sans nom'}</span>
											<Badge variant="secondary" class="shrink-0 text-xs">
												{formation.statut ?? '—'}
											</Badge>
										</a>
									</li>
								{/each}
							</ul>
						{:else}
							<p class="text-sm text-muted-foreground">Aucune formation récente.</p>
							<Button href="/formations/creer" variant="outline" class="mt-2" size="sm">
								Créer une formation
							</Button>
						{/if}
					</Card.Content>
				</Card.Root>

				<!-- Active deals -->
				<Card.Root class="transition-colors hover:bg-muted/50">
					<Card.Header class="flex flex-row items-center justify-between gap-2 pb-2">
						<div class="flex items-center gap-2">
							<HeartHandshake class="size-5 text-muted-foreground" />
							<Card.Title class="text-base">Deals en cours</Card.Title>
						</div>
						<a href="/deals" class="text-muted-foreground hover:text-foreground">
							<ChevronRight class="size-4" />
						</a>
					</Card.Header>
					<Card.Content class="pt-0">
						{#if activeDeals?.length > 0}
							<ul class="space-y-2">
								{#each activeDeals.slice(0, 3) as deal (deal.id)}
									<li>
										<a
											href="/deals/{deal.id}"
											class="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
										>
											<span class="truncate">{deal.name}</span>
											<Badge variant="outline" class="shrink-0 text-xs">
												{deal.stage}
											</Badge>
										</a>
									</li>
								{/each}
							</ul>
						{:else}
							<p class="text-sm text-muted-foreground">Aucun deal en cours.</p>
							<Button href="/deals/creer" variant="outline" class="mt-2" size="sm">
								Créer un deal
							</Button>
						{/if}
					</Card.Content>
				</Card.Root>

				<!-- Qualiopi to complete -->
				<Card.Root class="transition-colors hover:bg-muted/50">
					<Card.Header class="flex flex-row items-center justify-between gap-2 pb-2">
						<div class="flex items-center gap-2">
							<ThumbUp class="size-5 text-muted-foreground" />
							<Card.Title class="text-base">Gestion qualité</Card.Title>
						</div>
						<a href="/qualiopi" class="text-muted-foreground hover:text-foreground">
							<ChevronRight class="size-4" />
						</a>
					</Card.Header>
					<Card.Content class="pt-0">
						{#if stats?.qualiopiToComplete != null && stats.qualiopiToComplete > 0}
							<p class="text-sm text-muted-foreground">
								{stats.qualiopiToComplete} formation(s) à compléter pour la conformité
								Qualiopi.
							</p>
							<Button href="/qualiopi" class="mt-2" size="sm">
								Compléter les dossiers
							</Button>
						{:else}
							<p class="text-sm text-muted-foreground">
								{stats?.qualiopiPercent ?? 0}% de conformité. Tout est à jour.
							</p>
							<Button href="/qualiopi" variant="outline" class="mt-2" size="sm">
								Voir la qualité
							</Button>
						{/if}
					</Card.Content>
				</Card.Root>
			</div>
		</div>
	</div>
</Sidebar.Inset>
