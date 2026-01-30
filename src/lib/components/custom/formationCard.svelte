<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Clock from '@tabler/icons-svelte/icons/clock';
	import MapPin from '@tabler/icons-svelte/icons/map-pin';
	import Users from '@tabler/icons-svelte/icons/users';
	import Book2 from '@tabler/icons-svelte/icons/book-2';
	import { cn } from '$lib/utils';

	interface Props {
		formation: {
			id: string;
			name: string | null;
			statut: 'En attente' | 'En cours' | 'Terminée';
			duree: number | null;
			modalite: 'Distanciel' | 'Présentiel' | 'Hybride' | 'E-Learning' | null;
			idInWorkspace: number | null;
			typeFinancement?: string | null;
			thematique?: { name: string } | null;
			client?: { legalName: string | null } | null;
			modules?: { id: string }[];
		};
		/** 'card' = full card (Kanban/Grid), 'compact' = single row for list view */
		variant?: 'card' | 'compact';
	}

	let { formation, variant = 'card' }: Props = $props();

	const moduleCount = $derived(formation.modules?.length ?? 0);
	const clientName = $derived(formation.client?.legalName ?? '—');
	const themeName = $derived(formation.thematique?.name ?? '—');
	const statutVariant = $derived(
		formation.statut === 'Terminée'
			? 'default'
			: formation.statut === 'En cours'
				? 'secondary'
				: 'outline'
	);
	const statutBorderClass = $derived(
		formation.statut === 'Terminée'
			? 'border-l-green-500'
			: formation.statut === 'En cours'
				? 'border-l-amber-500'
				: 'border-l-muted-foreground/40'
	);
</script>

<a
	href="/formations/{formation.id}"
	class={cn(
		'block transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg',
		variant === 'compact' && 'hover:bg-muted/50'
	)}
>
	{#if variant === 'compact'}
		<div
			class={cn(
				'flex items-center gap-4 rounded-lg border bg-card px-4 py-3 hover:border-primary/50 border-l-4',
				statutBorderClass
			)}
		>
			<div class="min-w-0 flex-1">
				<div class="flex items-center gap-2 flex-wrap">
					<span class="font-semibold truncate">{formation.name ?? 'Sans nom'}</span>
					<Badge variant={statutVariant} class="shrink-0 text-xs">{formation.statut}</Badge>
					<span class="text-muted-foreground text-sm shrink-0">#{formation.idInWorkspace ?? '—'}</span>
				</div>
				<div class="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
					<span class="flex items-center gap-1">
						<Users size={14} />
						{clientName}
					</span>
					<span class="flex items-center gap-1">
						<Book2 size={14} />
						{themeName}
					</span>
					{#if formation.duree != null}
						<span class="flex items-center gap-1">
							<Clock size={14} />
							{formation.duree}h
						</span>
					{/if}
					{#if formation.modalite}
						<span class="flex items-center gap-1">
							<MapPin size={14} />
							{formation.modalite}
						</span>
					{/if}
					{#if moduleCount > 0}
						<span>{moduleCount} module{moduleCount > 1 ? 's' : ''}</span>
					{/if}
				</div>
			</div>
		</div>
	{:else}
		<Card.Root
			class={cn(
				'w-full overflow-hidden border-l-4 hover:border-primary/50 transition-colors h-full flex flex-col',
				statutBorderClass
			)}
		>
			<Card.Header class="pb-2">
				<div class="flex items-start justify-between gap-2">
					<Card.Title class="text-base font-semibold leading-tight line-clamp-2">
						{formation.name ?? 'Sans nom'}
					</Card.Title>
					<span class="text-xs text-muted-foreground shrink-0">#{formation.idInWorkspace ?? '—'}</span>
				</div>
				<div class="flex flex-wrap gap-1.5 mt-1.5">
					<Badge variant={statutVariant} class="text-xs">{formation.statut}</Badge>
					{#if themeName !== '—'}
						<Badge variant="secondary" class="text-xs">{themeName}</Badge>
					{/if}
				</div>
			</Card.Header>
			<Card.Content class="flex-1 space-y-2 text-sm">
				<div class="flex items-center gap-2 text-muted-foreground">
					<Users size={16} class="shrink-0 text-muted-foreground/80" />
					<span class="truncate">{clientName}</span>
				</div>
				<div class="flex flex-wrap gap-x-4 gap-y-1">
					{#if formation.duree != null}
						<div class="flex items-center gap-1.5">
							<Clock size={16} class="shrink-0 text-muted-foreground/80" />
							<span>{formation.duree}h</span>
						</div>
					{/if}
					{#if formation.modalite}
						<div class="flex items-center gap-1.5">
							<MapPin size={16} class="shrink-0 text-muted-foreground/80" />
							<span>{formation.modalite}</span>
						</div>
					{/if}
					{#if moduleCount > 0}
						<div class="flex items-center gap-1.5">
							<Book2 size={16} class="shrink-0 text-muted-foreground/80" />
							<span>{moduleCount} module{moduleCount > 1 ? 's' : ''}</span>
						</div>
					{/if}
				</div>
				{#if formation.typeFinancement}
					<Badge variant="outline" class="text-xs font-normal">{formation.typeFinancement}</Badge>
				{/if}
			</Card.Content>
		</Card.Root>
	{/if}
</a>
