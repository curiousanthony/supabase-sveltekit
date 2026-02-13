<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import * as Card from '$lib/components/ui/card';
	import CardCheckboxGroup from '$lib/components/ui/card-checkbox/card-checkbox-group.svelte';
	import CardCheckbox from '$lib/components/ui/card-checkbox/card-checkbox.svelte';
	import School from '@lucide/svelte/icons/school';
	import Monitor from '@lucide/svelte/icons/monitor';
	import Shuffle from '@lucide/svelte/icons/shuffle';
	import GraduationCap from '@lucide/svelte/icons/graduation-cap';
	import { cn } from '$lib/utils';

	const MODALITES = [
		{ value: 'Présentiel', title: 'Présentiel', subtitle: 'En salle', icon: School },
		{ value: 'Distanciel', title: 'Distanciel', subtitle: 'En ligne', icon: Monitor },
		{ value: 'Hybride', title: 'Hybride', subtitle: 'Mixte', icon: Shuffle },
		{ value: 'E-Learning', title: 'E-Learning', subtitle: 'Autonome', icon: GraduationCap }
	];

	let { data, form }: PageProps = $props();
	let programme = $derived(data?.libraryProgramme);
	let topics = $derived(data?.topics ?? []);
	let targetPublicsList = $derived(data?.targetPublics ?? []);
	let prerequisitesList = $derived(data?.prerequisites ?? []);
	let libraryModulesList = $derived(data?.libraryModules ?? []);

	let titre = $state('');
	let duree = $state(14);
	let topicId = $state<string>('');
	let modaliteArray = $state<string[]>(['Présentiel']);
	let objectifs = $state('');
	let selectedTargetPublicIds = $state<string[]>([]);
	let selectedPrerequisiteIds = $state<string[]>([]);
	let selectedModuleIds = $state<string[]>([]);

	$effect(() => {
		if (programme) {
			titre = programme.titre;
			duree = programme.duree;
			topicId = programme.topicId ?? '';
			modaliteArray = [programme.modalite];
			objectifs = programme.objectifs ?? '';
			selectedTargetPublicIds = (programme.targetPublics ?? []).map((t: { targetPublicId: string }) => t.targetPublicId);
			selectedPrerequisiteIds = (programme.prerequisites ?? []).map((p: { prerequisiteId: string }) => p.prerequisiteId);
			selectedModuleIds = (programme.libraryProgrammeModules ?? []).map((m: { libraryModuleId: string }) => m.libraryModuleId);
		}
	});

	function toggleTargetPublic(id: string) {
		selectedTargetPublicIds = selectedTargetPublicIds.includes(id)
			? selectedTargetPublicIds.filter((x) => x !== id)
			: [...selectedTargetPublicIds, id];
	}
	function togglePrerequisite(id: string) {
		selectedPrerequisiteIds = selectedPrerequisiteIds.includes(id)
			? selectedPrerequisiteIds.filter((x) => x !== id)
			: [...selectedPrerequisiteIds, id];
	}
	function toggleModule(id: string) {
		selectedModuleIds = selectedModuleIds.includes(id)
			? selectedModuleIds.filter((x) => x !== id)
			: [...selectedModuleIds, id];
	}
</script>

<svelte:head>
	<title>Bibliothèque – Modifier le programme</title>
</svelte:head>

{#if !programme}
	<p class="text-muted-foreground">Programme introuvable.</p>
{:else}
	<div class="max-w-2xl space-y-6">
		<h1 class="text-2xl font-bold tracking-tight">Modifier le programme</h1>

		<Card.Root>
			<Card.Content class="pt-6">
				<form method="POST" use:enhance class="space-y-6">
					<div class="space-y-2">
						<label for="titre" class="text-sm font-medium">Intitulé / Titre <span class="text-destructive">*</span></label>
						<Input id="titre" name="titre" required bind:value={titre} />
					</div>
					<div class="space-y-2">
						<label for="duree" class="text-sm font-medium">Durée (heures) <span class="text-destructive">*</span></label>
						<Input id="duree" name="duree" type="number" min="1" required bind:value={duree} />
					</div>
					<div class="space-y-2">
						<label for="topicId" class="text-sm font-medium">Thématique</label>
						<Select.Root type="single" bind:value={topicId}>
							<Select.Trigger id="topicId" class="w-full">
								<span class="truncate">{topics.find((t) => t.id === topicId)?.name ?? 'Choisir une thématique'}</span>
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="">Aucune</Select.Item>
								{#each topics as t}
									<Select.Item value={t.id}>{t.name}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
						<input type="hidden" name="topicId" value={topicId} />
					</div>
					<div class="space-y-2">
						<label class="text-sm font-medium">Modalité <span class="text-destructive">*</span></label>
						<CardCheckboxGroup multiple={false} disallowEmpty={true} bind:value={modaliteArray} class="grid-cols-2 sm:grid-cols-4 gap-4">
							{#each MODALITES as m}
								<CardCheckbox value={m.value} title={m.title} subtitle={m.subtitle} icon={m.icon} />
							{/each}
						</CardCheckboxGroup>
						<input type="hidden" name="modalite" value={modaliteArray[0] ?? 'Présentiel'} />
					</div>
					<div class="space-y-2">
						<label for="objectifs" class="text-sm font-medium">Objectifs du programme</label>
						<Textarea id="objectifs" name="objectifs" bind:value={objectifs} class="min-h-[100px]" />
					</div>
					<div class="space-y-2">
						<label class="text-sm font-medium">Public cible</label>
						<div class="flex flex-wrap gap-2">
							{#each targetPublicsList as tp}
								<button
									type="button"
									onclick={() => toggleTargetPublic(tp.id)}
									class={cn(
										'rounded-full border px-3 py-1.5 text-sm transition-colors',
										selectedTargetPublicIds.includes(tp.id) ? 'border-primary bg-primary/10 text-primary' : 'border-input bg-background'
									)}
								>
									{tp.name}
								</button>
							{/each}
						</div>
						<input type="hidden" name="targetPublicIds" value={selectedTargetPublicIds.join(',')} />
					</div>
					<div class="space-y-2">
						<label class="text-sm font-medium">Pré-requis</label>
						<div class="flex flex-wrap gap-2">
							{#each prerequisitesList as p}
								<button
									type="button"
									onclick={() => togglePrerequisite(p.id)}
									class={cn(
										'rounded-full border px-3 py-1.5 text-sm transition-colors',
										selectedPrerequisiteIds.includes(p.id) ? 'border-primary bg-primary/10 text-primary' : 'border-input bg-background'
									)}
								>
									{p.name}
								</button>
							{/each}
						</div>
						<input type="hidden" name="prerequisiteIds" value={selectedPrerequisiteIds.join(',')} />
					</div>
					<div class="space-y-2">
						<label class="text-sm font-medium">Modules</label>
						<div class="flex flex-wrap gap-2">
							{#each libraryModulesList as m}
								<button
									type="button"
									onclick={() => toggleModule(m.id)}
									class={cn(
										'rounded-md border px-3 py-2 text-left text-sm transition-colors',
										selectedModuleIds.includes(m.id) ? 'border-primary bg-primary/10 text-primary' : 'border-input bg-background'
									)}
								>
									{m.titre} ({m.dureeHours}h)
								</button>
							{/each}
						</div>
						<input type="hidden" name="moduleIds" value={selectedModuleIds.join(',')} />
					</div>
					{#if form?.message}
						<p class="text-sm text-destructive">{form.message}</p>
					{/if}
					<div class="flex gap-2">
						<Button type="submit">Enregistrer</Button>
						<Button type="button" variant="outline" href="/bibliotheque/programmes">Annuler</Button>
					</div>
				</form>
			</Card.Content>
		</Card.Root>
	</div>
{/if}
