<script lang="ts">
	import type { PageProps } from './$types';
	import * as Table from '$lib/components/ui/table';
	import * as Button from '$lib/components/ui/button';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Label from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import StarRating from '$lib/components/custom/starRating.svelte';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { IconChalkboardTeacher, IconUserPlus } from '@tabler/icons-svelte';

	let { data }: PageProps = $props();
	let { formateurs } = $derived(data);

	let createDialogOpen = $state(false);
	let creating = $state(false);

	$effect(() => {
		if (data.openNewModal) {
			createDialogOpen = true;
			// Clean ?new from URL without navigating
			const url = new URL(window.location.href);
			url.searchParams.delete('new');
			goto(url.pathname + (url.search ? url.search : ''), { replaceState: true, noScroll: true });
		}
	});
</script>

<!-- Create formateur dialog -->
<Dialog.Root bind:open={createDialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Nouveau formateur</Dialog.Title>
			<Dialog.Description>
				Renseignez les informations du formateur. Vous pourrez compléter son profil après création.
			</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/createFormateur"
			use:enhance={() => {
				creating = true;
				return async ({ result }) => {
					creating = false;
					if (result.type === 'failure') {
						toast.error((result.data as { message?: string })?.message ?? 'Erreur');
					} else if (result.type === 'error') {
						toast.error('Erreur serveur. Veuillez réessayer.');
					} else if (result.type === 'redirect') {
						createDialogOpen = false;
						toast.success('Formateur créé');
						goto(result.location);
					}
				};
			}}
		>
			<div class="flex flex-col gap-4 py-2">
				<div class="grid grid-cols-2 gap-3">
					<div class="flex flex-col gap-1.5">
						<Label.Root for="firstName">Prénom</Label.Root>
						<Input id="firstName" name="firstName" placeholder="Jean" autocomplete="off" />
					</div>
					<div class="flex flex-col gap-1.5">
						<Label.Root for="lastName">Nom <span class="text-destructive">*</span></Label.Root>
						<Input id="lastName" name="lastName" placeholder="Dupont" required autocomplete="off" />
					</div>
				</div>
				<div class="flex flex-col gap-1.5">
					<Label.Root for="email">Email</Label.Root>
					<Input
						id="email"
						name="email"
						type="email"
						placeholder="jean.dupont@email.com"
						autocomplete="off"
					/>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div class="flex flex-col gap-1.5">
						<Label.Root for="ville">Ville</Label.Root>
						<Input id="ville" name="ville" placeholder="Paris" autocomplete="off" />
					</div>
					<div class="flex flex-col gap-1.5">
						<Label.Root for="departement">Département</Label.Root>
						<Input id="departement" name="departement" placeholder="75" autocomplete="off" />
					</div>
				</div>
			</div>
			<Dialog.Footer class="pt-2">
				<Dialog.Close>
					<Button.Root type="button" variant="outline">Annuler</Button.Root>
				</Dialog.Close>
				<Button.Root type="submit" disabled={creating}>
					{creating ? 'Création...' : 'Créer le formateur'}
				</Button.Root>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

{#if !formateurs || formateurs.length === 0}
	<Empty.Root>
		<Empty.Header>
			<Empty.Media variant="icon">
				<IconChalkboardTeacher />
			</Empty.Media>
			<Empty.Title>Aucun formateur ajouté</Empty.Title>
		</Empty.Header>
		<Empty.Content>
			<Button.Root onclick={() => (createDialogOpen = true)}>
				<IconUserPlus class="size-4" />
				Nouveau formateur
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
					{@const name =
						[formateur.user?.firstName, formateur.user?.lastName].filter(Boolean).join(' ') || '—'}
					<Table.Row
						class="cursor-pointer hover:bg-muted/40 transition-colors"
						tabindex={0}
						role="row"
						onclick={() => goto(`/contacts/formateurs/${formateur.id}`)}
						onkeydown={(e: KeyboardEvent) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								goto(`/contacts/formateurs/${formateur.id}`);
							}
						}}
					>
						<Table.Cell>
							<a
								href="/contacts/formateurs/{formateur.id}"
								class="font-medium text-sm hover:underline focus:outline-none focus:underline"
								onclick={(e: MouseEvent) => e.stopPropagation()}
							>
								{name}
							</a>
						</Table.Cell>
						<Table.Cell>
							{#if formateur.disponible7J}
								<Badge variant="outline" class="text-xs gap-1.5">
									<span class="relative flex size-1.5">
										<span
											class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"
										></span>
										<span class="relative inline-flex size-1.5 rounded-full bg-green-500"></span>
									</span>
									Disponible
								</Badge>
							{:else}
								<Badge variant="outline" class="text-xs text-muted-foreground gap-1.5">
									<span
										class="relative inline-flex size-1.5 rounded-full bg-muted-foreground/50"
									></span>
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
			{@const name =
				[formateur.user?.firstName, formateur.user?.lastName].filter(Boolean).join(' ') || '—'}
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
