<script lang="ts">
	import type { PageProps } from './$types';
	import * as Card from '$lib/components/ui/card/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { enhance } from '$app/forms';
	import { cn } from '$lib/utils';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import GraduationCap from '@lucide/svelte/icons/graduation-cap';
	import Mail from '@lucide/svelte/icons/mail';
	import ExternalLink from '@lucide/svelte/icons/external-link';

	let { data }: PageProps = $props();

	const formation = $derived(data?.formation);
	const formateurs = $derived(
		(formation?.formationFormateurs ?? []).map((ff) => {
			const u = ff.formateur.user;
			const name = [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.email || 'Formateur';
			return {
				id: ff.formateur.id,
				joinId: ff.id,
				name,
				email: u?.email ?? '',
				avatarUrl: u?.avatarUrl ?? ''
			};
		})
	);

	function getInitials(name: string) {
		return name
			.split(' ')
			.map((p) => p[0])
			.join('')
			.slice(0, 2)
			.toUpperCase();
	}
</script>

<div class="space-y-6">
	<Card.Root>
		<Card.Header class="flex flex-row items-center justify-between">
			<Card.Title class="flex items-center gap-2">
				<GraduationCap class="size-5" />
				Formateurs assignés
				{#if formateurs.length > 0}
					<Badge variant="secondary" class="text-xs">{formateurs.length}</Badge>
				{/if}
			</Card.Title>
			<Button variant="outline" size="sm" class="cursor-pointer" href="/contacts/formateurs">
				<UserPlus class="size-4 mr-1.5" />
				Ajouter
			</Button>
		</Card.Header>
		<Card.Content>
			{#if formateurs.length === 0}
				<div class="py-8 text-center">
					<GraduationCap class="size-12 mx-auto text-muted-foreground/30 mb-3" />
					<p class="text-muted-foreground">Aucun formateur assigné à cette formation.</p>
					<p class="text-sm text-muted-foreground mt-1">
						Assignez un formateur depuis votre
						<a href="/contacts/formateurs" class="text-primary underline-offset-4 hover:underline">
							répertoire de formateurs
						</a>.
					</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each formateurs as f}
						<div class="flex items-center gap-3 rounded-lg border px-4 py-3">
							<Avatar.Root class="size-10 border-2 border-background shrink-0">
								{#if f.avatarUrl}
									<Avatar.Image src={f.avatarUrl} alt={f.name} />
								{/if}
								<Avatar.Fallback>{getInitials(f.name)}</Avatar.Fallback>
							</Avatar.Root>
							<div class="flex-1 min-w-0">
								<p class="font-medium text-foreground truncate">{f.name}</p>
								{#if f.email}
									<p class="text-sm text-muted-foreground truncate">{f.email}</p>
								{/if}
							</div>
							<div class="flex items-center gap-1 shrink-0">
								{#if f.email}
									<Button variant="ghost" size="icon" class="size-8 cursor-pointer" href="mailto:{f.email}" aria-label="Envoyer un email">
										<Mail class="size-4" />
									</Button>
								{/if}
								<form method="POST" action="?/removeFormateur" use:enhance>
									<input type="hidden" name="formateurId" value={f.id} />
									<Button variant="ghost" size="icon" class="size-8 cursor-pointer text-destructive hover:text-destructive" type="submit" aria-label="Retirer le formateur">
										<Trash2 class="size-4" />
									</Button>
								</form>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
