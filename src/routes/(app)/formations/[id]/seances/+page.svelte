<script lang="ts">
	import type { PageProps } from './$types';
	import * as Button from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { IconCalendar } from '@tabler/icons-svelte';

	let { data }: PageProps = $props();
	let { seances, formationName } = $derived(data);

	let viewMode = $state<'list' | 'calendar'>('list');
</script>

<div class="mx-auto max-w-3xl p-4 md:p-6">
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-base">Séances ({seances.length})</Card.Title>
			<Card.Description>Planning des sessions — {formationName}</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="mb-4 flex gap-2">
				<Button.Root
					variant={viewMode === 'list' ? 'secondary' : 'ghost'}
					size="sm"
					onclick={() => (viewMode = 'list')}
				>
					Liste
				</Button.Root>
				<Button.Root
					variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
					size="sm"
					onclick={() => (viewMode = 'calendar')}
				>
					Calendrier
				</Button.Root>
			</div>
			{#if viewMode === 'list'}
				<div class="space-y-3">
					{#each seances as seance}
						<div class="rounded-lg border p-4">
							<div class="mb-2 flex items-start justify-between gap-2">
								<div class="flex items-center gap-2">
									<IconCalendar class="h-4 w-4 shrink-0 text-muted-foreground" />
									<span class="font-medium">{seance.date}</span>
								</div>
								{#if seance.emargementTotal != null}
									<Badge variant={seance.emargementSigned === seance.emargementTotal ? 'default' : 'outline'} class="text-xs">
										{seance.emargementSigned}/{seance.emargementTotal} émargé{seance.emargementSigned === seance.emargementTotal ? 's' : ''}
									</Badge>
								{/if}
							</div>
							<p class="text-sm text-muted-foreground">{seance.startTime} → {seance.endTime}</p>
							{#if seance.moduleName}
								<p class="mt-1 text-sm font-medium">{seance.moduleName}</p>
							{/if}
							{#if seance.formateurName}
								<p class="text-xs text-muted-foreground">Formateur : {seance.formateurName}</p>
							{:else}
								<p class="text-xs text-amber-600 dark:text-amber-400">Formateur non assigné</p>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<div class="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
					<IconCalendar class="mx-auto mb-2 h-10 w-10 opacity-50 text-muted-foreground" />
					<p>Vue calendrier à venir</p>
				</div>
			{/if}
			<Button.Root variant="outline" class="mt-4 w-full">
				Ajouter une séance
			</Button.Root>
		</Card.Content>
	</Card.Root>
</div>
