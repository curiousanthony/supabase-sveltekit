<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import * as Select from '$lib/components/ui/select';
	import * as Card from '$lib/components/ui/card';
	import { superForm } from 'sveltekit-superforms/client';
	import { formationSchema } from './schema';
	import { toast } from 'svelte-sonner';
	import { Check, ChevronRight, ChevronLeft } from '@lucide/svelte';

	let { data } = $props();

	const form = superForm(data.form, {
		onSubmit: () => {
			console.log('Form submitting...', $formData);
		},
		onResult: ({ result }) => {
			console.log('Form result:', result);
		}
	});

	const { form: formData, enhance, validate, errors } = form;
	console.log('Form data:', $formData, 'Errors:', $errors);

	let currentStep = $state(1);
	const totalSteps = 3;

	const steps = [
		{ id: 1, title: "L'Essentiel", description: 'Identité de la formation' },
		{ id: 2, title: 'La Logistique', description: 'Modalités et durée' },
		{ id: 3, title: 'Le Cadre', description: 'Financement et certification' }
	];

	async function nextStep() {
		let valid = false;
		if (currentStep === 1) {
			const nameValid = await validate('name');
			// topicId is optional
			valid = !!nameValid; // validate returns errors array or undefined/null if valid? No, it returns result.
			// Actually validate returns Promise<string[] | undefined>. undefined means valid.
			valid = !nameValid;
		} else if (currentStep === 2) {
			// modalite and duree have defaults, so they should be valid, but let's check
			const modaliteValid = await validate('modalite');
			const dureeValid = await validate('duree');
			valid = !modaliteValid && !dureeValid;
		} else {
			valid = true;
		}

		if (valid) {
			currentStep = Math.min(currentStep + 1, totalSteps);
		}
	}

	function prevStep() {
		currentStep = Math.max(currentStep - 1, 1);
	}
</script>

<div class="mx-auto max-w-2xl py-8">
	<!-- Stepper -->
	<div class="mb-8">
		<div class="relative flex justify-between">
			{#each steps as step}
				<div class="relative z-10 flex flex-col items-center">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors duration-200
                        {currentStep > step.id
							? 'border-primary bg-primary text-primary-foreground'
							: currentStep === step.id
								? 'border-primary bg-background text-primary'
								: 'border-muted bg-background text-muted-foreground'}"
					>
						{#if currentStep > step.id}
							<Check class="h-6 w-6" />
						{:else}
							<span>{step.id}</span>
						{/if}
					</div>
					<div class="mt-2 text-center">
						<div
							class="text-sm font-medium {currentStep >= step.id
								? 'text-foreground'
								: 'text-muted-foreground'}"
						>
							{step.title}
						</div>
						<div class="hidden text-xs text-muted-foreground sm:block">
							{step.description}
						</div>
					</div>
				</div>
			{/each}
			<!-- Progress Bar Background -->
			<div class="absolute top-5 left-0 z-0 h-[2px] w-full bg-muted"></div>
			<!-- Progress Bar Active -->
			<div
				class="absolute top-5 left-0 z-0 h-[2px] bg-primary transition-all duration-300"
				style="width: {((currentStep - 1) / (totalSteps - 1)) * 100}%"
			></div>
		</div>
	</div>

	<Card.Root>
		<Card.Content class="p-6">
			<form
				method="POST"
				use:enhance={enhance}
				onsubmit={() => console.log('Form submit event fired')}
				class="space-y-6"
			>
				<!-- Step 1: L'Essentiel -->
				<div class={currentStep === 1 ? 'block' : 'hidden'}>
					<div class="mb-4">
						<h2 class="text-xl font-semibold">L'Essentiel</h2>
						<p class="text-muted-foreground">Commençons par le nom de votre formation.</p>
					</div>

					<div class="space-y-4">
						<div class="space-y-2">
							<label for="name" class="text-sm font-medium">Nom de la formation</label>
							<Input
								id="name"
								name="name"
								bind:value={$formData.name}
								placeholder="Ex: Excel Avancé"
							/>
							{#if $errors.name}
								<p class="text-sm text-destructive">{$errors.name}</p>
							{/if}
						</div>

						<div class="space-y-2">
							<label for="topicId" class="text-sm font-medium">Thématique (Optionnel)</label>
							<Select.Root type="single" bind:value={$formData.topicId} name="topicId">
								<Select.Trigger id="topicId">
									{data.thematiques.find((t) => t.id === $formData.topicId)?.name ??
										'Sélectionner une thématique'}
								</Select.Trigger>
								<Select.Content>
									{#each data.thematiques as theme}
										<Select.Item value={theme.id} label={theme.name}>{theme.name}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
							<input type="hidden" name="topicId" bind:value={$formData.topicId} />
						</div>
					</div>
				</div>

				<!-- Step 2: La Logistique -->
				<div class={currentStep === 2 ? 'block' : 'hidden'}>
					<div class="mb-4">
						<h2 class="text-xl font-semibold">La Logistique</h2>
						<p class="text-muted-foreground">Comment cette formation va-t-elle se dérouler ?</p>
					</div>

					<div class="space-y-4">
						<div class="space-y-2">
							<label for="modalite" class="text-sm font-medium">Modalité</label>
							<Select.Root type="single" bind:value={$formData.modalite} name="modalite">
								<Select.Trigger id="modalite">
									{$formData.modalite || 'Sélectionner une modalité'}
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="Distanciel" label="Distanciel" />
									<Select.Item value="Présentiel" label="Présentiel" />
									<Select.Item value="Hybride" label="Hybride" />
									<Select.Item value="E-Learning" label="E-Learning" />
								</Select.Content>
							</Select.Root>
							<input type="hidden" name="modalite" bind:value={$formData.modalite} />
							{#if $errors.modalite}
								<p class="text-sm text-destructive">{$errors.modalite}</p>
							{/if}
						</div>

						<div class="space-y-2">
							<label for="duree" class="text-sm font-medium">Durée (heures)</label>
							<Input id="duree" name="duree" type="number" bind:value={$formData.duree} min="0" />
							{#if $errors.duree}
								<p class="text-sm text-destructive">{$errors.duree}</p>
							{/if}
						</div>
					</div>
				</div>

				<!-- Step 3: Le Cadre -->
				<div class={currentStep === 3 ? 'block' : 'hidden'}>
					<div class="mb-4">
						<h2 class="text-xl font-semibold">Le Cadre</h2>
						<p class="text-muted-foreground">Quelques détails administratifs.</p>
					</div>

					<div class="space-y-4">
						<div class="space-y-2">
							<label for="typeFinancement" class="text-sm font-medium">Type de financement</label>
							<Select.Root
								type="single"
								bind:value={$formData.typeFinancement}
								name="typeFinancement"
							>
								<Select.Trigger id="typeFinancement">
									{$formData.typeFinancement || 'Sélectionner un type'}
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="OPCO" label="OPCO" />
									<Select.Item value="CPF" label="CPF" />
									<Select.Item value="Inter" label="Inter" />
									<Select.Item value="Intra" label="Intra" />
								</Select.Content>
							</Select.Root>
							{#if $errors.typeFinancement}
								<p class="text-sm text-destructive">{$errors.typeFinancement}</p>
							{/if}
						</div>

						<div class="space-y-2">
							<label for="codeRncp" class="text-sm font-medium">Code RNCP (Optionnel)</label>
							<Input
								id="codeRncp"
								name="codeRncp"
								bind:value={$formData.codeRncp}
								placeholder="Ex: RNCP34567"
							/>
							<p class="text-sm text-muted-foreground">Utile pour la conformité Qualiopi.</p>
							{#if $errors.codeRncp}
								<p class="text-sm text-destructive">{$errors.codeRncp}</p>
							{/if}
						</div>
					</div>
				</div>

				<!-- Navigation Buttons -->
				<div class="flex justify-between pt-4">
					<Button
						variant="outline"
						type="button"
						onclick={prevStep}
						disabled={currentStep === 1}
						class={currentStep === 1 ? 'invisible' : ''}
					>
						<ChevronLeft class="mr-2 h-4 w-4" />
						Précédent
					</Button>

					{#if currentStep < totalSteps}
						<Button type="button" onclick={nextStep}>
							Suivant
							<ChevronRight class="ml-2 h-4 w-4" />
						</Button>
					{:else}
						<Button type="submit" onclick={() => console.log('Submit button clicked')}
							>Créer la formation</Button
						>
					{/if}
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
