<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { cn } from '$lib/utils';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.header?.pageName ?? 'Créer un deal'}</title>
</svelte:head>

<div class="mx-auto max-w-xl space-y-6">
	<Card.Root>
		<Card.Header>
			<Card.Title>Nouveau deal</Card.Title>
			<Card.Description>Décrivez l'opportunité commerciale. Vous pourrez ajuster l'étape et créer une formation une fois le deal gagné.</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if !data.workspaceId}
				<p class="text-sm text-muted-foreground">Aucun centre assigné. Impossible de créer un deal.</p>
			{:else if !data.clients?.length}
				<p class="text-sm text-muted-foreground">
					Aucun client. <a href="/contacts" class="text-primary underline">Ajoutez des contacts</a> avant de créer un deal.
				</p>
			{:else}
				<form
					method="POST"
					use:enhance={() => {
						return async ({ result, update }) => {
							if (result.type === 'redirect') toast.success('Deal créé.');
							if (result.type === 'failure' && result.data && 'message' in result.data) toast.error(String(result.data.message));
							await update();
						};
					}}
					class="space-y-4"
				>
					<div class="space-y-2">
						<Label for="name">Nom du deal</Label>
						<Input id="name" name="name" required placeholder="Ex. Formation anglais B2B – Acme" />
					</div>
					<div class="space-y-2">
						<Label for="clientId">Client</Label>
						<select
							id="clientId"
							name="clientId"
							required
							class={cn(
								"flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs",
								"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							)}
						>
							<option value="">Choisir un client</option>
							{#each data.clients as c}
								<option value={c.id}>{c.legalName ?? c.id}</option>
							{/each}
						</select>
					</div>
					<div class="space-y-2">
						<Label for="stage">Étape</Label>
						<select
							id="stage"
							name="stage"
							class={cn(
								"flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs",
								"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							)}
						>
							<option value="Lead">Lead</option>
							<option value="Qualification">Qualification</option>
							<option value="Proposition">Proposition</option>
							<option value="Négociation">Négociation</option>
							<option value="Gagné">Gagné</option>
							<option value="Perdu">Perdu</option>
						</select>
					</div>
					<div class="space-y-2">
						<Label for="value">Montant (€)</Label>
						<Input id="value" name="value" type="number" min="0" step="0.01" placeholder="Ex. 3500" />
					</div>
					<div class="space-y-2">
						<Label for="description">Description (optionnel)</Label>
						<Textarea id="description" name="description" placeholder="Notes, contexte..." class="min-h-[80px]" />
					</div>
					<div class="flex gap-2 pt-2">
						<Button type="submit">Créer le deal</Button>
						<Button variant="outline" href="/deals">Annuler</Button>
					</div>
				</form>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
