<script lang="ts">
	import type { PageProps } from './$types';
	import * as Card from '$lib/components/ui/card/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { cn } from '$lib/utils';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Clock from '@lucide/svelte/icons/clock';
	import Target from '@lucide/svelte/icons/target';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import Library from '@lucide/svelte/icons/library';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';

	let { data }: PageProps = $props();

	const formation = $derived(data?.formation);
	const modules = $derived(formation?.modules ?? []);
	const programme = $derived(formation?.programmeSource);
	const totalHours = $derived(
		modules.reduce((sum, m) => sum + (m.durationHours ? Number(m.durationHours) : 0), 0)
	);
</script>

<div class="space-y-6">
	<!-- Programme source info -->
	{#if programme}
		<Card.Root class="bg-primary/5 border-primary/20">
			<Card.Content class="pt-6">
				<div class="flex items-start justify-between gap-4">
					<div class="flex items-start gap-3">
						<Library class="size-5 text-primary mt-0.5 shrink-0" />
						<div>
							<p class="text-sm text-muted-foreground">Programme source (Bibliothèque)</p>
							<h3 class="font-semibold text-foreground">{programme.titre}</h3>
							{#if programme.dureeHeures}
								<p class="text-sm text-muted-foreground mt-1">
									{programme.dureeHeures}h · {programme.modalite ?? '—'}
								</p>
							{/if}
						</div>
					</div>
					<Button variant="outline" size="sm" class="cursor-pointer shrink-0" href="/bibliotheque/programmes">
						Changer
					</Button>
				</div>
			</Card.Content>
		</Card.Root>
	{:else}
		<Card.Root>
			<Card.Content class="pt-6">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<Library class="size-5 text-muted-foreground shrink-0" />
						<div>
							<p class="text-sm text-muted-foreground">Aucun programme source</p>
							<p class="text-xs text-muted-foreground mt-0.5">
								Associez un programme de la bibliothèque ou assemblez un programme personnalisé.
							</p>
						</div>
					</div>
					<Button variant="outline" size="sm" class="cursor-pointer shrink-0" href="/bibliotheque/programmes">
						<BookOpen class="size-4 mr-1.5" />
						Choisir
					</Button>
				</div>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Modules list -->
	<div class="space-y-2">
		<div class="flex items-center justify-between">
			<h2 class="text-lg font-semibold flex items-center gap-2">
				<BookOpen class="size-5" />
				Modules
				{#if modules.length > 0}
					<Badge variant="secondary" class="text-xs">{modules.length}</Badge>
				{/if}
			</h2>
			{#if totalHours > 0}
				<span class="text-sm text-muted-foreground flex items-center gap-1.5">
					<Clock class="size-4" />
					{totalHours}h au total
				</span>
			{/if}
		</div>

		{#if modules.length === 0}
			<Card.Root>
				<Card.Content class="py-12 text-center">
					<BookOpen class="size-12 mx-auto text-muted-foreground/30 mb-3" />
					<p class="text-muted-foreground">Aucun module dans cette formation.</p>
					<p class="text-sm text-muted-foreground mt-1">
						Les modules définissent le contenu pédagogique de la formation.
					</p>
				</Card.Content>
			</Card.Root>
		{:else}
			<div class="space-y-2">
				{#each modules as mod, i}
					<Card.Root class="hover:border-primary/30 transition-colors">
						<Card.Content class="pt-4 pb-4">
							<div class="flex items-start gap-3">
								<div class="flex items-center gap-1 shrink-0 mt-0.5">
									<GripVertical class="size-4 text-muted-foreground/40" />
									<span class="text-xs font-medium text-muted-foreground tabular-nums w-5 text-center">
										{i + 1}
									</span>
								</div>
								<div class="flex-1 min-w-0">
									<h4 class="font-medium text-foreground">{mod.name}</h4>
									{#if mod.durationHours}
										<div class="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
											<Clock class="size-3.5 shrink-0" />
											<span>{mod.durationHours}h</span>
										</div>
									{/if}
								</div>
							</div>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		{/if}
	</div>

	{#if modules.length > 0 && !programme}
		<div class="flex justify-end">
			<!-- TODO: wire to a save action that persists modules as a reusable programme -->
			<Button variant="outline" size="sm" class="cursor-pointer" disabled>
				<Library class="size-4 mr-1.5" />
				Sauvegarder comme programme (bientôt)
			</Button>
		</div>
	{/if}
</div>
