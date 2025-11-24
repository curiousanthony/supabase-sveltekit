<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { toast } from 'svelte-sonner';
	import { 
		IconChevronLeft, 
		IconChevronRight, 
		IconCheck,
		IconSchool,
		IconFolder,
		IconSettings
	} from '@tabler/icons-svelte';

	let { data }: { data: PageData } = $props();
	let { thematiques } = $derived(data);

	// Form state
	let currentStep = $state(1);
	let formData = $state({
		name: '',
		topicId: '',
		modalite: '',
		typeFinancement: '',
		duree: null as number | null
	});
	let isSubmitting = $state(false);

	// Validation state
	let nameError = $state('');

	// Step validation
	function canProceedFromStep(step: number): boolean {
		if (step === 1) {
			if (!formData.name.trim()) {
				nameError = 'Le nom de la formation est requis';
				return false;
			}
			nameError = '';
			return true;
		}
		return true;
	}

	// Navigation functions
	function nextStep() {
		if (canProceedFromStep(currentStep)) {
			currentStep = Math.min(currentStep + 1, 3);
		}
	}

	function prevStep() {
		currentStep = Math.max(currentStep - 1, 1);
	}

	// Get selected thématique label
	let selectedThematiqueLabel = $derived(
		thematiques.find(t => t.id === formData.topicId)?.name || 'Sélectionner une thématique'
	);
</script>

<svelte:head>
	<title>Créer une formation</title>
</svelte:head>

<div class="mx-auto max-w-2xl">
	<!-- Progress indicator -->
	<div class="mb-8">
		<div class="flex items-center justify-between">
			{#each [1, 2, 3] as step}
				<div class="flex flex-1 items-center">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors {currentStep >=
						step
							? 'border-primary bg-primary text-primary-foreground'
							: 'border-muted-foreground bg-background text-muted-foreground'}"
					>
						{#if currentStep > step}
							<IconCheck class="h-5 w-5" />
						{:else}
							<span class="text-sm font-semibold">{step}</span>
						{/if}
					</div>
					{#if step < 3}
						<div
							class="mx-2 h-0.5 flex-1 transition-colors {currentStep > step
								? 'bg-primary'
								: 'bg-muted'}"
						></div>
					{/if}
				</div>
			{/each}
		</div>
		<div class="mt-4 flex justify-between text-sm">
			<span class={currentStep >= 1 ? 'font-medium text-foreground' : 'text-muted-foreground'}
				>Nom</span
			>
			<span class={currentStep >= 2 ? 'font-medium text-foreground' : 'text-muted-foreground'}
				>Thématique</span
			>
			<span class={currentStep >= 3 ? 'font-medium text-foreground' : 'text-muted-foreground'}
				>Détails</span
			>
		</div>
	</div>

	<!-- Form -->
	<form
		method="POST"
		action="?/createFormation"
		use:enhance={() => {
			isSubmitting = true;
			return async ({ result, update }) => {
				isSubmitting = false;
				if (result.type === 'redirect') {
					toast.success('Formation créée avec succès ! ✨');
				} else if (result.type === 'failure') {
					toast.error(result.data?.message || 'Une erreur est survenue');
				}
				await update();
			};
		}}
	>
		<!-- Step 1: Formation Name -->
		{#if currentStep === 1}
			<Card.Root class="border-2">
				<Card.Header>
					<div class="flex items-center gap-3">
						<div class="rounded-lg bg-primary/10 p-3">
							<IconSchool class="h-6 w-6 text-primary" />
						</div>
						<div>
							<Card.Title>Nom de la formation</Card.Title>
							<Card.Description>Comment s'appelle cette nouvelle formation ?</Card.Description>
						</div>
					</div>
				</Card.Header>
				<Card.Content>
					<div class="space-y-2">
						<Label for="name">Nom de la formation *</Label>
						<Input
							id="name"
							name="name"
							type="text"
							bind:value={formData.name}
							placeholder="Ex: Formation Excel Avancé"
							class="text-base"
							aria-invalid={nameError ? 'true' : 'false'}
							autofocus
						/>
						{#if nameError}
							<p class="text-sm text-destructive">{nameError}</p>
						{/if}
					</div>
				</Card.Content>
				<Card.Footer class="flex justify-end">
					<Button type="button" onclick={nextStep}>
						Suivant
						<IconChevronRight class="ml-2 h-4 w-4" />
					</Button>
				</Card.Footer>
			</Card.Root>
		{/if}

		<!-- Step 2: Thématique -->
		{#if currentStep === 2}
			<Card.Root class="border-2">
				<Card.Header>
					<div class="flex items-center gap-3">
						<div class="rounded-lg bg-primary/10 p-3">
							<IconFolder class="h-6 w-6 text-primary" />
						</div>
						<div>
							<Card.Title>Thématique</Card.Title>
							<Card.Description>Catégorisez votre formation (optionnel)</Card.Description>
						</div>
					</div>
				</Card.Header>
				<Card.Content>
					<div class="space-y-2">
						<Label for="topicId">Thématique</Label>
						<Select.Root
							selected={{ value: formData.topicId, label: selectedThematiqueLabel }}
							onSelectedChange={(selected) => {
								formData.topicId = selected?.value || '';
							}}
						>
							<Select.Trigger id="topicId" class="text-base">
								<Select.Value placeholder="Sélectionner une thématique" />
							</Select.Trigger>
							<Select.Content>
								{#each thematiques as thematique}
									<Select.Item value={thematique.id}>{thematique.name}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
						<input type="hidden" name="topicId" value={formData.topicId} />
					</div>
				</Card.Content>
				<Card.Footer class="flex justify-between">
					<Button type="button" variant="outline" onclick={prevStep}>
						<IconChevronLeft class="mr-2 h-4 w-4" />
						Précédent
					</Button>
					<Button type="button" onclick={nextStep}>
						Suivant
						<IconChevronRight class="ml-2 h-4 w-4" />
					</Button>
				</Card.Footer>
			</Card.Root>
		{/if}

		<!-- Step 3: Practical Details -->
		{#if currentStep === 3}
			<Card.Root class="border-2">
				<Card.Header>
					<div class="flex items-center gap-3">
						<div class="rounded-lg bg-primary/10 p-3">
							<IconSettings class="h-6 w-6 text-primary" />
						</div>
						<div>
							<Card.Title>Détails pratiques</Card.Title>
							<Card.Description>Informations complémentaires (optionnel)</Card.Description>
						</div>
					</div>
				</Card.Header>
				<Card.Content class="space-y-6">
					<!-- Modalité -->
					<div class="space-y-3">
						<Label>Modalité</Label>
						<RadioGroup.Root bind:value={formData.modalite} name="modalite">
							<div class="grid grid-cols-2 gap-3">
								{#each ['Distanciel', 'Présentiel', 'Hybride', 'E-Learning'] as modalite}
									<div class="flex items-center space-x-2">
										<RadioGroup.Item value={modalite} id={`modalite-${modalite}`} />
										<Label for={`modalite-${modalite}`} class="cursor-pointer font-normal">
											{modalite}
										</Label>
									</div>
								{/each}
							</div>
						</RadioGroup.Root>
					</div>

					<!-- Type de financement -->
					<div class="space-y-2">
						<Label for="typeFinancement">Type de financement</Label>
						<Select.Root
							selected={{
								value: formData.typeFinancement,
								label: formData.typeFinancement || 'Sélectionner un type'
							}}
							onSelectedChange={(selected) => {
								formData.typeFinancement = selected?.value || '';
							}}
						>
							<Select.Trigger id="typeFinancement" class="text-base">
								<Select.Value placeholder="Sélectionner un type" />
							</Select.Trigger>
							<Select.Content>
								{#each ['CPF', 'OPCO', 'Inter', 'Intra'] as type}
									<Select.Item value={type}>{type}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
						<input type="hidden" name="typeFinancement" value={formData.typeFinancement} />
					</div>

					<!-- Durée -->
					<div class="space-y-2">
						<Label for="duree">Durée (heures)</Label>
						<Input
							id="duree"
							name="duree"
							type="number"
							bind:value={formData.duree}
							placeholder="Ex: 35"
							min="1"
							class="text-base"
						/>
					</div>
				</Card.Content>
				<Card.Footer class="flex justify-between">
					<Button type="button" variant="outline" onclick={prevStep}>
						<IconChevronLeft class="mr-2 h-4 w-4" />
						Précédent
					</Button>
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? 'Création...' : 'Créer la formation'}
					</Button>
				</Card.Footer>
			</Card.Root>
		{/if}
	</form>
</div>
