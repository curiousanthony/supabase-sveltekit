<script lang="ts">
	import type { PageProps } from './$types';
	import * as Card from '$lib/components/ui/card/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Progress from '$lib/components/ui/progress/progress.svelte';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import QualiopiAdvise from '$lib/components/qualiopi-advise.svelte';
	import IconCheck from '@tabler/icons-svelte/icons/check';
	import IconBook2 from '@tabler/icons-svelte/icons/book-2';
	import IconChevronDown from '@tabler/icons-svelte/icons/chevron-down';
	import IconInfoCircle from '@tabler/icons-svelte/icons/info-circle';

	let { data }: PageProps = $props();
	let formationsToComplete = $derived(data.conformity?.formationsToComplete ?? []);
	let openCriteres = $state<Record<number, boolean>>({
		1: true,
		2: true,
		3: false,
		4: false,
		5: false,
		6: false,
		7: false
	});

	const criteres = [
		{
			id: 1,
			title: "Conditions d'information du public",
			indicateurs: 3,
			description:
				"Transparence et exhaustivité sur les prestations proposées, les délais d'accès et les résultats obtenus.",
			actions: "Communiquez clairement sur vos formations (objectifs, durée, modalités). Utilisez les fiches formation et la Bibliothèque pour les documents publics."
		},
		{
			id: 2,
			title: "Objectifs et adaptation aux publics",
			indicateurs: 5,
			redhibitoires: 4,
			description:
				"Identification précise des objectifs, adaptation des prestations aux bénéficiaires lors de la conception.",
			actions:
				"Pour chaque formation : renseignez nom, description, durée, modalité, public cible et prérequis. Créez des modules avec objectifs pédagogiques dans l'onglet Formation."
		},
		{
			id: 3,
			title: "Accueil, accompagnement, suivi et évaluation",
			indicateurs: 8,
			redhibitoires: 5,
			description:
				"Adaptation des modalités d'accueil, accompagnement des bénéficiaires, suivi et évaluation.",
			actions:
				"Renseignez le mode d'évaluation et le suivi d'assiduité pour chaque formation. Complétez les informations dans chaque fiche formation (étape Qualiopi à la création)."
		},
		{
			id: 4,
			title: "Moyens pédagogiques, techniques et d'encadrement",
			indicateurs: 4,
			description: "Adéquation des ressources humaines et matérielles à l'accompagnement des bénéficiaires.",
			actions: "Documentez les moyens (formateurs, supports, locaux) dans vos formations et dans la Bibliothèque."
		},
		{
			id: 5,
			title: "Qualification et développement des personnels",
			indicateurs: 2,
			redhibitoires: 2,
			description: "Compétences des formateurs et du personnel en charge de la mise en œuvre.",
			actions: "Gérez les formateurs et leurs thématiques dans Contacts → Formateurs. Tenez à jour les compétences et certifications."
		},
		{
			id: 6,
			title: "Inscription dans l'environnement professionnel",
			indicateurs: 7,
			redhibitoires: 3,
			description: "Prise en compte des évolutions (réglementation, technologies, métiers) et partenariats.",
			actions: "Actualisez régulièrement vos formations et documents. Utilisez la Bibliothèque pour les référentiels et veille."
		},
		{
			id: 7,
			title: "Appréciations et réclamations des parties prenantes",
			indicateurs: 3,
			description: "Recueil et traitement des retours pour l'amélioration continue.",
			actions: "Mettez en place des enquêtes de satisfaction et un dispositif de réclamation. Tracez les retours (Outils, Historique)."
		}
	];
</script>

<svelte:head>
	<title>Gestion qualité – Qualiopi</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<!-- Intro -->
	<div class="space-y-2">
		<h1 class="text-2xl font-bold tracking-tight">Gestion qualité</h1>
		<p class="max-w-2xl text-muted-foreground">
			Cette page vous guide pour atteindre une conformité maximale au référentiel Qualiopi (7 critères, 32 indicateurs). Utilisez vos <strong>Formations</strong>, la <strong>Bibliothèque</strong> et les informations renseignées pour couvrir les indicateurs.
		</p>
	</div>

	<!-- Conformity overview -->
	<div class="grid gap-4 md:grid-cols-2">
		<Card.Root class="border-emerald-200 dark:border-emerald-800">
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-base font-medium">Conformité des formations</Card.Title>
				{#if data.conformity}
					<Badge variant={data.conformity.conformityPercent === 100 ? 'default' : 'secondary'}>
						{data.conformity.conformCount}/{data.conformity.totalFormations} conformes
					</Badge>
				{/if}
			</Card.Header>
			<Card.Content>
				{#if data.conformity?.totalFormations === 0}
					<p class="text-sm text-muted-foreground">
						Aucune formation pour l'instant. Créez des formations et complétez les champs Qualiopi (modalité, évaluation, assiduité) pour suivre la conformité ici.
					</p>
					<a
						href="/formations/creer"
						class="mt-2 inline-flex items-center text-sm font-medium text-primary hover:underline"
					>
						<IconBook2 class="mr-1 size-4" />
						Créer une formation
					</a>
				{:else}
					<Progress
						value={data.conformity?.conformityPercent ?? 0}
						class="h-2"
					/>
					<p class="mt-2 text-xs text-muted-foreground">
						Formations avec nom, description, durée, modalité, mode d'évaluation et suivi d'assiduité renseignés (critères 2 & 3).
					</p>
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-base font-medium">Formations à compléter</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if formationsToComplete?.length === 0 && (data.conformity?.totalFormations ?? 0) > 0}
					<div class="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
						<IconCheck class="size-4" />
						Toutes vos formations ont les champs Qualiopi essentiels renseignés.
					</div>
				{:else if formationsToComplete?.length > 0}
					<ul class="space-y-2 text-sm">
						{#each formationsToComplete as item (item.id)}
							<li>
								<a
									href="/formations/{item.id}"
									class="flex items-center justify-between rounded-md p-2 hover:bg-accent"
								>
									<span class="font-medium">{item.name || 'Sans nom'}</span>
									<Badge variant="outline" class="text-xs">
										{item.missing?.join(', ')}
									</Badge>
								</a>
							</li>
						{/each}
					</ul>
					<a
						href="/formations"
						class="mt-2 inline-flex items-center text-sm font-medium text-primary hover:underline"
					>
						Voir toutes les formations
					</a>
				{:else}
					<p class="text-sm text-muted-foreground">Aucune formation à afficher.</p>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>

	<QualiopiAdvise
		title="Référentiel Qualiopi"
		message="Au moins 22 indicateurs sur 32 doivent être satisfaits ; 17 indicateurs sont rédhibitoires (non-conformité majeure en cas de manquement). Le guide officiel est disponible sur travail-emploi.gouv.fr."
		variant="info"
	/>

	<!-- 7 critères -->
	<div class="space-y-2">
		<h2 class="text-lg font-semibold">Les 7 critères Qualiopi</h2>
		<p class="text-sm text-muted-foreground">
			Cliquez sur chaque critère pour voir les indicateurs et les actions à mener dans Mentore Manager.
		</p>
	</div>

	<div class="space-y-2">
		{#each criteres as critere (critere.id)}
			<Collapsible.Root
				bind:open={openCriteres[critere.id]}
				class="rounded-lg border bg-card"
			>
				<Collapsible.Trigger
					class="flex w-full items-center justify-between p-4 text-left font-medium hover:bg-accent/50 [&[data-state=open]_svg]:rotate-180"
				>
					<div class="flex items-center gap-3">
						<span class="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
							{critere.id}
						</span>
						<div>
							<span>{critere.title}</span>
							<span class="ml-2 text-xs font-normal text-muted-foreground">
								{critere.indicateurs} indicateur{critere.indicateurs > 1 ? 's' : ''}
								{#if critere.redhibitoires}
									(dont {critere.redhibitoires} rédhibitoires)
								{/if}
							</span>
						</div>
					</div>
					<IconChevronDown class="size-5 shrink-0 transition-transform" aria-hidden="true" />
				</Collapsible.Trigger>
				<Collapsible.Content>
					<div class="border-t px-4 pb-4 pt-2">
						<p class="text-sm text-muted-foreground">{critere.description}</p>
						<div class="mt-3 flex items-start gap-2 rounded-md bg-muted/50 p-3 text-sm">
							<IconInfoCircle class="mt-0.5 size-4 shrink-0 text-primary" />
							<div>
								<span class="font-medium">Dans Mentore :</span>
								{critere.actions}
							</div>
						</div>
						{#if critere.id === 2 || critere.id === 3}
							<a
								href="/formations"
								class="mt-2 inline-flex items-center text-sm text-primary hover:underline"
							>
								<IconBook2 class="mr-1 size-4" />
								Aller aux Formations
							</a>
						{/if}
					</div>
				</Collapsible.Content>
			</Collapsible.Root>
		{/each}
	</div>
</div>
