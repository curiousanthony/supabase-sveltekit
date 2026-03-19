<script lang="ts">
	import type { PageProps } from './$types';
	import * as Card from '$lib/components/ui/card/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Users from '@lucide/svelte/icons/users';

	let { data }: PageProps = $props();

	const apprenants = $derived(
		(data?.formation?.formationApprenants ?? []).map((fa: { contact: { id: string; firstName: string | null; lastName: string | null; email: string | null; phone: string | null; contactCompanies?: { company?: { name: string | null } | null }[] } }) => ({
			id: fa.contact.id,
			fullName: [fa.contact.firstName, fa.contact.lastName].filter(Boolean).join(' ') || 'Sans nom',
			email: fa.contact.email,
			phone: fa.contact.phone,
			company: fa.contact.contactCompanies?.[0]?.company?.name ?? null
		}))
	);
</script>

<div class="space-y-4">
	<Card.Root>
		<Card.Header class="flex flex-row items-center justify-between">
			<Card.Title class="flex items-center gap-2">
				<Users class="size-4" />
				Apprenants
				{#if apprenants.length > 0}
					<Badge variant="secondary" class="text-xs">{apprenants.length}</Badge>
				{/if}
			</Card.Title>
		</Card.Header>
		<Card.Content>
			{#if apprenants.length === 0}
				<p class="py-4 text-center text-sm text-muted-foreground">
					Aucun apprenant inscrit à cette formation.
				</p>
			{:else}
				<ul class="divide-y">
					{#each apprenants as learner}
						<li class="flex items-center justify-between py-3">
							<div>
								<a href="/contacts/{learner.id}" class="font-medium text-foreground hover:underline">
									{learner.fullName}
								</a>
								{#if learner.company}
									<p class="text-sm text-muted-foreground">{learner.company}</p>
								{/if}
							</div>
							<div class="flex items-center gap-2 text-sm text-muted-foreground">
								{#if learner.email}
									<span>{learner.email}</span>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
