<script lang="ts">
	import type { PageProps } from './$types';
	import * as Table from '$lib/components/ui/table';
	import * as Button from '$lib/components/ui/button';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import StarRating from '$lib/components/custom/starRating.svelte';
	import { goto } from '$app/navigation';
	import { IconChalkboardTeacher, IconUserShare, IconUserSearch } from '@tabler/icons-svelte';

	let { data }: PageProps = $props();
	let { formateurs } = $derived(data);
</script>

{#if !formateurs || formateurs.length === 0}
	<Empty.Root>
		<Empty.Header>
			<Empty.Media variant="icon">
				<IconChalkboardTeacher />
			</Empty.Media>
			<Empty.Title>Aucun formateur ajouté</Empty.Title>
		</Empty.Header>
		<Empty.Content>
			<Button.Root href="/contacts/formateurs/inviter">
				<IconUserShare class="size-4" />
				Inviter un formateur
			</Button.Root>
			<Button.Root href="/contacts/formateurs/rechercher" variant="outline">
				<IconUserSearch class="size-4" />
				Trouver un formateur
			</Button.Root>
		</Empty.Content>
	</Empty.Root>
{:else}
	<!-- Desktop table -->
	<div class="hidden md:block overflow-auto rounded-xl border bg-card">
		<Table.Root>
			<Table.Header>
				<Table.Row class="hover:bg-transparent border-b">
					<Table.Head class="w-[220px]">Formateur</Table.Head>
					<Table.Head class="w-[120px]">Disponibilité</Table.Head>
					<Table.Head class="w-[140px]">Note</Table.Head>
					<Table.Head>Thématiques</Table.Head>
					<Table.Head class="w-[120px] text-right">Profil</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each formateurs as formateur (formateur.id)}
					{@const name = [formateur.user?.firstName, formateur.user?.lastName].filter(Boolean).join(' ') || '—'}
					<Table.Row
						class="cursor-pointer hover:bg-muted/40 transition-colors"
						tabindex={0}
						role="link"
						onclick={() => goto(`/contacts/formateurs/${formateur.id}`)}
						onkeydown={(e: KeyboardEvent) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								goto(`/contacts/formateurs/${formateur.id}`);
							}
						}}
					>
						<Table.Cell>
							<span class="font-medium text-sm">{name}</span>
						</Table.Cell>
						<Table.Cell>
							{#if formateur.disponible7J}
								<Badge variant="outline" class="text-xs gap-1.5">
									<span class="relative flex size-1.5">
										<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
										<span class="relative inline-flex size-1.5 rounded-full bg-green-500"></span>
									</span>
									Disponible
								</Badge>
							{:else}
								<Badge variant="outline" class="text-xs text-muted-foreground gap-1.5">
									<span class="relative inline-flex size-1.5 rounded-full bg-muted-foreground/50"></span>
									Indisponible
								</Badge>
							{/if}
						</Table.Cell>
						<Table.Cell>
							<StarRating ratingValue={Number(formateur.rating)} size={14} />
						</Table.Cell>
						<Table.Cell>
							<div class="flex flex-wrap gap-1">
								{#each formateur.formateursThematiques as ft}
									<Badge variant="secondary" class="text-xs">{ft.thematique.name}</Badge>
								{/each}
								{#if formateur.formateursThematiques.length === 0}
									<span class="text-muted-foreground text-sm">—</span>
								{/if}
							</div>
						</Table.Cell>
						<Table.Cell class="text-right">
							<Button.Root
								href="/contacts/formateurs/{formateur.id}"
								variant="ghost"
								size="sm"
								class="text-xs"
								onclick={(e: MouseEvent) => e.stopPropagation()}
							>
								Voir le profil
							</Button.Root>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>

	<!-- Mobile card list -->
	<div class="flex flex-col gap-2 md:hidden">
		{#each formateurs as formateur (formateur.id)}
			{@const name = [formateur.user?.firstName, formateur.user?.lastName].filter(Boolean).join(' ') || '—'}
			<button
				type="button"
				class="flex items-start gap-3 rounded-xl border bg-card p-4 text-left hover:bg-muted/40 transition-colors w-full"
				onclick={() => goto(`/contacts/formateurs/${formateur.id}`)}
			>
				<div class="min-w-0 flex-1">
					<div class="flex items-center justify-between gap-2 mb-1">
						<span class="font-medium text-sm truncate">{name}</span>
						{#if formateur.disponible7J}
							<span class="flex items-center gap-1 text-xs text-green-600 shrink-0">
								<span class="relative inline-flex size-1.5 rounded-full bg-green-500"></span>
								Disponible
							</span>
						{:else}
							<span class="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
								<span class="relative inline-flex size-1.5 rounded-full bg-muted-foreground/50"></span>
								Indisponible
							</span>
						{/if}
					</div>
					<StarRating ratingValue={Number(formateur.rating)} size={12} />
					{#if formateur.formateursThematiques.length > 0}
						<div class="mt-2 flex flex-wrap gap-1">
							{#each formateur.formateursThematiques as ft}
								<Badge variant="secondary" class="text-xs">{ft.thematique.name}</Badge>
							{/each}
						</div>
					{/if}
				</div>
			</button>
		{/each}
	</div>
{/if}
