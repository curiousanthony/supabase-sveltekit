<script lang="ts">
	import type { PageProps } from './$types';
	import * as Card from '$lib/components/ui/card/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import BackButton from '$lib/components/custom/backButton.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import {
		IconCalendarWeekFilled,
		IconChalkboardTeacher,
		IconFolder,
		IconFolderFilled,
		IconLayout,
		IconLayoutFilled,
		IconSettings,
		IconSettingsFilled
	} from '@tabler/icons-svelte';
	import InfoCircleFilled from '@tabler/icons-svelte/icons/info-circle-filled';
	import InfoCircle from '@tabler/icons-svelte/icons/info-circle';

	let { data }: PageProps = $props();
	let { formation } = $derived(data);
</script>

<!-- <BackButton /> -->

<!-- Page de la formation : {data.formation.name} -->
<!-- Page de la formation (devra avoir data.formation.name ou id) -->

<Tabs.Root value="apercu" class="w-full">
	<Tabs.List
		class="flex h-fit w-full overflow-y-scroll *:flex *:cursor-pointer *:flex-col *:data-[state=active]:text-primary"
	>
		<Tabs.Trigger value="apercu">
			<IconLayout />
			Aperçu
		</Tabs.Trigger>
		<Tabs.Trigger value="Informations">
			<InfoCircle />
			Informations
		</Tabs.Trigger>
		<Tabs.Trigger value="Documents">
			<IconFolder />
			Documents
		</Tabs.Trigger>
		<Tabs.Trigger value="Formateurs">
			<IconChalkboardTeacher />
			Formateurs</Tabs.Trigger
		>
		<Tabs.Trigger value="Séances">
			<IconCalendarWeekFilled />
			Séances</Tabs.Trigger
		>
		<Tabs.Trigger value="Paramètres">
			<IconSettings />
			Paramètres
		</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="apercu">
		{@render apercuContent()}
	</Tabs.Content>
	<Tabs.Content value="Informations">Informations générales de la formation.</Tabs.Content>
	<Tabs.Content value="Documents">Documents de la formation.</Tabs.Content>
	<Tabs.Content value="Formateurs">Formateurs de la formation.</Tabs.Content>
	<Tabs.Content value="Séances">Séances de la formation.</Tabs.Content>
	<Tabs.Content value="Paramètres">Paramètres de la formation.</Tabs.Content>
</Tabs.Root>

{#snippet apercuContent()}
	Aperçu de la formation.
	<Card.Root>
		<Card.Header>
			<Card.Title>{formation?.name}</Card.Title>
			<Badge class="" variant="secondary">{formation?.thematique?.name}</Badge>
			<Card.Description>{formation?.description}</Card.Description>
			<Card.Action class="text-muted-foreground">#{formation?.idInWorkspace}</Card.Action>
		</Card.Header>
		<Card.Content>
			<p>Durée : {formation?.duree} heures</p>
			<p>Modalité : {formation?.modalite}</p>
			<p>Thématique : {formation?.thematique?.name}</p>
			<p>Statut : {formation?.statut}</p>
			{#if (formation?.modules ?? []).length > 0}
				Liste de modules from "formation.modules"
				<ul>
					{#each formation?.modules as module}
						<li>{module.name}</li>
					{/each}
				</ul>
			{/if}
		</Card.Content>
		<!-- <Card.Footer>
		<p>Card Footer</p>
	</Card.Footer> -->
	</Card.Root>
{/snippet}
