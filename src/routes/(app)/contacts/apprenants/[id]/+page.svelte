<script lang="ts">
	import type { PageProps } from './$types';
	import * as Card from '$lib/components/ui/card/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import MessageCircle from '@lucide/svelte/icons/message-circle';
	import Phone from '@lucide/svelte/icons/phone';
	import Mail from '@lucide/svelte/icons/mail';

	let { data }: PageProps = $props();
	const apprenant = $derived(data?.apprenant);
</script>

<svelte:head>
	<title>{apprenant?.fullName ?? 'Apprenant'}</title>
</svelte:head>

<div class="space-y-6">
	<Card.Root>
		<Card.Header>
			<Card.Title>{apprenant?.fullName ?? '—'}</Card.Title>
			<Card.Description>Fiche apprenant – toutes les infos et actions (démo).</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			{#if apprenant?.email}
				<div class="flex items-center gap-2">
					<Mail class="size-4 text-muted-foreground" />
					<a href="mailto:{apprenant.email}" class="text-primary underline-offset-4 hover:underline cursor-pointer">{apprenant.email}</a>
				</div>
			{/if}
			{#if apprenant?.company}
				<p class="text-sm text-muted-foreground">Entreprise : <span class="text-foreground">{apprenant.company}</span></p>
			{/if}
			<div class="flex gap-2 pt-2">
				<Button class="cursor-pointer" href="/messagerie">
					<MessageCircle class="size-4" />
					Envoyer un message
				</Button>
				<Button variant="outline" class="cursor-pointer">
					<Phone class="size-4" />
					Appeler
				</Button>
			</div>
		</Card.Content>
	</Card.Root>
</div>
