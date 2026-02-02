<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Progress } from '$lib/components/ui/progress';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { onboardingSchema } from './schema';
	import { toast } from 'svelte-sonner';
	import Check from '@lucide/svelte/icons/check';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Building2 from '@lucide/svelte/icons/building-2';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Rocket from '@lucide/svelte/icons/rocket';
	import { cn } from '$lib/utils';

	let { data } = $props();

	const form = superForm(data.form, {
		validators: zodClient(onboardingSchema),
		onResult: ({ result }) => {
			if (result.type === 'redirect') {
				toast.success('Votre espace a été créé avec succès !');
			} else if (result.type === 'failure') {
				toast.error(
					(result.data as { message?: string })?.message ||
						'Une erreur est survenue. Veuillez réessayer.'
				);
			}
		}
	});

	const { form: formData, enhance, errors, submitting } = form;

	let currentStep = $state(1);
	const totalSteps = 2;

	const steps = [
		{ id: 1, title: 'Bienvenue', description: 'Votre centre de formation' },
		{ id: 2, title: 'Création', description: 'Configuration en cours' }
	];

	// Check if we can proceed to the next step
	const canProceed = $derived($formData.workspaceName.trim().length >= 2);

	function proceedToCreate() {
		if (canProceed) {
			currentStep = 2;
		} else {
			toast.error('Veuillez entrer un nom pour votre centre de formation.');
		}
	}

	function goBack() {
		currentStep = 1;
	}
</script>

<svelte:head>
	<title>Bienvenue sur Mentore Manager</title>
</svelte:head>

<div
	class="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4 py-8"
>
	<div class="w-full max-w-lg">
		<!-- Logo/Brand -->
		<div class="mb-8 text-center">
			<div
				class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"
			>
				<Sparkles class="h-8 w-8 text-primary" />
			</div>
			<h1 class="text-2xl font-bold tracking-tight">Mentore Manager</h1>
			<p class="text-muted-foreground">Simplifiez la gestion de votre centre de formation</p>
		</div>

		<!-- Progress indicator -->
		<div class="mb-6">
			<div class="mb-2 flex items-center justify-between px-1 text-sm">
				{#each steps as step}
					<span
						class={cn(
							'transition-colors',
							currentStep >= step.id ? 'text-foreground font-medium' : 'text-muted-foreground'
						)}
					>
						{step.title}
					</span>
				{/each}
			</div>
			<Progress value={((currentStep - 1) / (totalSteps - 1)) * 100} class="h-2" />
		</div>

		<Card.Root class="border-none shadow-xl ring-1 ring-border/50">
			<form method="POST" use:enhance>
				<!-- Hidden input to preserve workspaceName across steps -->
				<input type="hidden" name="workspaceName" value={$formData.workspaceName} />

				<!-- Step 1: Welcome + Workspace Name -->
				{#if currentStep === 1}
					<Card.Header class="space-y-1 pb-4">
						<Card.Title class="text-xl">
							{#if data.userName}
								Bonjour {data.userName} !
							{:else}
								Bienvenue !
							{/if}
						</Card.Title>
						<Card.Description class="text-base">
							Créons ensemble l'espace de travail de votre centre de formation.
						</Card.Description>
					</Card.Header>

					<Card.Content class="space-y-6">
						<div class="rounded-lg bg-primary/5 p-4">
							<div class="flex items-start gap-3">
								<div
									class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10"
								>
									<Building2 class="h-5 w-5 text-primary" />
								</div>
								<div class="space-y-1">
									<p class="text-sm font-medium">Votre centre de formation</p>
									<p class="text-sm text-muted-foreground">
										Ce nom sera affiché dans votre espace de travail et sur vos documents. Vous
										pourrez le modifier plus tard dans les paramètres.
									</p>
								</div>
							</div>
						</div>

						<div class="space-y-2">
							<Label for="workspaceName" class="text-sm font-medium">
								Nom de votre centre de formation <span class="text-destructive">*</span>
							</Label>
							<Input
								id="workspaceName"
								type="text"
								placeholder="Ex: Formation Excellence, Institut ABC..."
								bind:value={$formData.workspaceName}
								class="h-12 text-base"
								autofocus
							/>
							{#if $errors.workspaceName}
								<p class="text-sm font-medium text-destructive">{$errors.workspaceName}</p>
							{/if}
						</div>
					</Card.Content>

					<Card.Footer class="flex-col gap-3 pt-2">
						<Button
							type="button"
							onclick={proceedToCreate}
							disabled={!canProceed}
							class="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:-translate-y-px active:translate-y-0"
						>
							Continuer
							<ChevronRight class="ml-2 h-5 w-5" />
						</Button>
						<a
							href="/auth/logout"
							class="text-sm text-muted-foreground hover:text-foreground transition-colors"
						>
							Se déconnecter
						</a>
					</Card.Footer>
				{/if}

				<!-- Step 2: Creating workspace -->
				{#if currentStep === 2}
					<Card.Header class="space-y-1 pb-4">
						<Card.Title class="text-xl">Prêt à démarrer !</Card.Title>
						<Card.Description class="text-base">
							Votre espace « <span class="font-medium text-foreground"
								>{$formData.workspaceName}</span
							> » est prêt à être créé.
						</Card.Description>
					</Card.Header>

					<Card.Content class="space-y-6">
						<div class="space-y-4">
							<div class="flex items-center gap-3 rounded-lg border p-4">
								<div
									class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10"
								>
									<Check class="h-5 w-5 text-green-600" />
								</div>
								<div>
									<p class="font-medium">Espace de travail personnalisé</p>
									<p class="text-sm text-muted-foreground">
										Vos données restent privées et sécurisées
									</p>
								</div>
							</div>

							<div class="flex items-center gap-3 rounded-lg border p-4">
								<div
									class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10"
								>
									<Check class="h-5 w-5 text-green-600" />
								</div>
								<div>
									<p class="font-medium">Exemples de données</p>
									<p class="text-sm text-muted-foreground">
										Des deals et clients exemples pour découvrir l'interface
									</p>
								</div>
							</div>

							<div class="flex items-center gap-3 rounded-lg border p-4">
								<div
									class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10"
								>
									<Check class="h-5 w-5 text-green-600" />
								</div>
								<div>
									<p class="font-medium">Conformité Qualiopi</p>
									<p class="text-sm text-muted-foreground">
										Outils pensés pour simplifier votre certification
									</p>
								</div>
							</div>
						</div>

						<div class="rounded-lg bg-muted/50 p-4 text-center">
							<Rocket class="mx-auto mb-2 h-8 w-8 text-primary" />
							<p class="text-sm text-muted-foreground">
								Vous pourrez ajouter votre logo et personnaliser vos informations légales dans les
								paramètres de l'espace.
							</p>
						</div>
					</Card.Content>

					<Card.Footer class="flex-col gap-3 pt-2">
						<Button
							type="submit"
							disabled={$submitting}
							class="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:-translate-y-px active:translate-y-0"
						>
							{#if $submitting}
								<span class="flex items-center gap-2">
									<span
										class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
									></span>
									Création en cours...
								</span>
							{:else}
								Créer mon espace
								<Rocket class="ml-2 h-5 w-5" />
							{/if}
						</Button>
						<button
							type="button"
							onclick={goBack}
							disabled={$submitting}
							class="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
						>
							Modifier le nom
						</button>
					</Card.Footer>
				{/if}
			</form>
		</Card.Root>

		<!-- Footer -->
		<p class="mt-6 text-center text-sm text-muted-foreground">
			En créant votre espace, vous acceptez nos{' '}
			<a href="/legal/terms" class="underline hover:text-foreground">conditions d'utilisation</a>.
		</p>
	</div>
</div>
