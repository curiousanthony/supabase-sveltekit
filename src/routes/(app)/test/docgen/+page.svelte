<script lang="ts">
	import type { PageProps } from './$types';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Button from '$lib/components/ui/button/index.js';
	import { IconFileDownload, IconEye } from '@tabler/icons-svelte';

	let { data }: PageProps = $props();
	const formationDocData = $derived(data.formationDocData);

	const conventionUrl = '/test/docgen/convention';
	const conventionDownloadUrl = `${conventionUrl}?download=1`;
</script>

<svelte:head>
	<title>Test Docgen – Convention de formation</title>
</svelte:head>

<div class="space-y-6 p-6">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">Génération de documents (test)</h1>
		<p class="text-muted-foreground mt-1">
			Page de test pour la génération de PDF à partir de modèles avec variables (ex. Convention de formation Qualiopi).
		</p>
	</div>

	<Card.Root class="max-w-2xl">
		<Card.Header>
			<Card.Title>Convention de formation</Card.Title>
			<Card.Description>
				Le document est généré à la volée à partir d’un modèle et de données de test. Aucun fichier n’est enregistré dans le stockage.
			</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div class="flex flex-wrap gap-2">
				<Button.Root href={conventionUrl} target="_blank" rel="noopener noreferrer">
					<IconEye class="size-4" />
					Ouvrir dans un nouvel onglet
				</Button.Root>
				<Button.Root variant="outline" href={conventionDownloadUrl}>
					<IconFileDownload class="size-4" />
					Télécharger le PDF
				</Button.Root>
			</div>
			<p class="text-muted-foreground text-sm">
				Aperçu ci‑dessous. Vous pouvez aussi ouvrir le PDF dans un nouvel onglet ou le télécharger.
			</p>
			<div class="rounded-md border bg-muted/30 overflow-hidden">
				<iframe
					title="Aperçu Convention de formation"
					src={conventionUrl}
					class="h-[480px] w-full"
				></iframe>
			</div>
		</Card.Content>
	</Card.Root>

	<Card.Root class="max-w-2xl">
		<Card.Header>
			<Card.Title>Données utilisées (dummy)</Card.Title>
			<Card.Description>
				Variables du modèle remplies pour ce test. Plus tard, ces valeurs viendront de la fiche Formation (+ Client + Organisme).
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<dl class="grid gap-2 text-sm sm:grid-cols-2">
				{#each Object.entries(formationDocData) as [key, value]}
					<div class="flex gap-2">
						<dt class="text-muted-foreground shrink-0 font-medium">{key}:</dt>
						<dd class="break-words">{value ?? '—'}</dd>
					</div>
				{/each}
			</dl>
		</Card.Content>
	</Card.Root>
</div>
