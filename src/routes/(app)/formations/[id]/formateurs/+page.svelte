<script lang="ts">
	import type { PageProps } from './$types';
	import * as Button from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';

	let { data }: PageProps = $props();
	let { modules, formateurs, formationName } = $derived(data);
</script>

<div class="mx-auto max-w-3xl p-4 md:p-6">
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-base">Équipe pédagogique</Card.Title>
			<Card.Description>Formateurs assignés aux modules — {formationName}</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div>
				<h4 class="mb-3 text-sm font-medium">Par module</h4>
				<div class="space-y-2">
					{#each modules as module}
						<div class="rounded-lg border p-3">
							<p class="font-medium">{module.name}</p>
							{#if module.formateurId || module.formateurName}
								<p class="text-sm text-muted-foreground">{module.formateurName || 'Assigné'}</p>
								<Button.Root variant="link" size="sm" class="mt-1 h-auto p-0 text-xs">
									Modifier
								</Button.Root>
							{:else}
								<p class="text-sm text-amber-600 dark:text-amber-400">Aucun formateur assigné</p>
								<Button.Root variant="link" size="sm" class="mt-1 h-auto p-0 text-xs font-medium">
									Trouver sur le Marketplace →
								</Button.Root>
							{/if}
						</div>
					{/each}
				</div>
			</div>
			{#if formateurs.length > 0}
				<div>
					<h4 class="mb-3 text-sm font-medium">Formateurs de votre base</h4>
					<div class="space-y-2">
						{#each formateurs as formateur}
							<div class="rounded-lg border p-3">
								<p class="font-medium">{formateur.name}</p>
								{#if (formateur as { specialite?: string }).specialite}
									<p class="text-xs text-muted-foreground">{(formateur as { specialite?: string }).specialite}</p>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
