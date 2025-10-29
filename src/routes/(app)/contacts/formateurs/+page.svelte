<script lang="ts">
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let { formateurs } = $derived(data);

	console.log('depuis formateurs/+page.svelte → formateurs: ', formateurs);
</script>

<h1 class="text-2xl font-bold">Mes formateurs</h1>

<!-- {#if data.formateurs}
	{#each data.formateurs as formateur}
		<p>{formateur.description}</p>
	{/each}
{/if} -->

<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
	{#if formateurs && formateurs.length > 0}
		{#each formateurs as formateur}
			<Card.Root class="h-full w-full max-w-sm gap-1">
				<Card.Header class="mb-1">
					<Card.Title>{formateur.user?.firstName ?? ''} {formateur.user?.lastName ?? ''}</Card.Title
					>
					<Card.Action>
						<Tooltip.Provider>
							<Tooltip.Root>
								<Tooltip.Trigger>
									<Badge variant="outline">
										{#if formateur.disponible7J}
											<span>Disponible</span>

											<span class="relative flex size-2">
												<span
													class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"
												></span>
												<span class="relative inline-flex size-2 rounded-full bg-green-500"></span>
											</span>
										{:else}
											<span>Indisponible</span>

											<span class="relative flex size-2">
												<span
													class="absolute inline-flex h-full w-full rounded-full bg-gray-400 opacity-75"
												></span>
												<span class="relative inline-flex size-2 rounded-full bg-gray-500"></span>
											</span>
										{/if}
									</Badge>
								</Tooltip.Trigger>
								<Tooltip.Content>
									{#if formateur.disponible7J}
										<p>
											{formateur.user.firstName} a confirmé être disponible ces 7 derniers jours.
										</p>
									{:else}
										<p>
											{formateur.user.firstName} n'a pas confirmé être disponible ces 7 derniers jours.
										</p>
									{/if}
								</Tooltip.Content>
							</Tooltip.Root>
						</Tooltip.Provider>
					</Card.Action>
				</Card.Header>
				<Card.Content class="flex grow flex-col gap-4">
					<Card.Description>{formateur.description}</Card.Description>

					<div class="flex items-center gap-2">
						{#each formateur.formateursThematiques as formateurThematique}
							<Badge variant="secondary">{formateurThematique.thematique.name}</Badge>
						{/each}
					</div>
				</Card.Content>
				<Card.Footer class="mt-4">
					<Button class="w-full" href="/contacts/formateurs/{formateur.id}" disabled
						>Consulter le profil</Button
					>
				</Card.Footer>
			</Card.Root>
		{/each}
	{:else}
		<p>Aucun formateur dans la base. Trouve ton premier formateur !</p>
	{/if}
</div>

<!-- <pre>
    {JSON.stringify(formateurs, null, 2)}
</pre> -->
