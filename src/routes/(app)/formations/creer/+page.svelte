<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import * as Select from '$lib/components/ui/select';
	import * as Card from '$lib/components/ui/card';
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { formationSchema } from './schema';
	import { toast } from 'svelte-sonner';
	import { 
		Check, ChevronRight, ChevronLeft, Plus, Trash2, Clock, Target, 
		ShieldCheck, School, Monitor, Shuffle, GraduationCap, ChevronsUpDown,
		Search, X, Sparkles
	} from '@lucide/svelte';
	import { headerTitleSnippet, headerTitleText } from '$lib/stores/header-store';
	import EditableTitle from '$lib/components/editable-title.svelte';
	import QualiopiAdvise from '$lib/components/qualiopi-advise.svelte';
	import CardCheckboxGroup from '$lib/components/ui/card-checkbox/card-checkbox-group.svelte';
	import CardCheckbox from '$lib/components/ui/card-checkbox/card-checkbox.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Textarea } from '$lib/components/ui/textarea';
	import { onMount, tick } from 'svelte';
	import { cn } from '$lib/utils';

	import type { FormationSchema } from './schema';

	let { data } = $props();

	const form = superForm<FormationSchema>(data.form as any, {
		validators: zodClient(formationSchema),
		dataType: 'json',
		onResult: ({ result }) => {
			if (result.type === 'redirect') {
				toast.success('Formation créée avec succès !');
			}
		}
	});

	const { form: formData, enhance, validate, errors, submitting } = form;

	let currentStep = $state(1);
	const steps = [
		{ id: 1, title: 'Bases', description: 'Client et modalités' },
		{ id: 2, title: 'Programme', description: 'Modules et objectifs' },
		{ id: 3, title: 'Qualiopi', description: 'Conformité et suivi' }
	];

	// Header Title Sync and Cleanup
	$effect(() => {
		headerTitleText.set($formData.name);
		
		// Requirement: Default first module title matches Formation title
		if ($formData.modules.length > 0 && currentStep === 1) {
			$formData.modules[0].title = $formData.name;
		}
	});

	onMount(() => {
		headerTitleSnippet.set(headerSnippet);
		// Reset on unmount
		return () => {
			headerTitleSnippet.set(null);
			headerTitleText.set('');
		};
	});

	// Calculated Duration logic
	const totalModulesDuration = $derived(
		$formData.modules.reduce((acc: number, m: { durationHours: number }) => acc + (m.durationHours || 0), 0)
	);
	const remainingDuration = $derived($formData.duree - totalModulesDuration);

	// Modality handling (Sync local array with form string)
	let modalityArray = $state([$formData.modalite]);
	$effect(() => {
		if (modalityArray.length > 0) {
			$formData.modalite = modalityArray[0] as any;
		} else {
			modalityArray = [$formData.modalite];
		}
	});

	// Step 3 state sync (Evaluation and Attendance)
	let evaluationArray = $state([$formData.evaluationMode]);
	$effect(() => {
		if (evaluationArray.length > 0) {
			$formData.evaluationMode = evaluationArray[0] as any;
		} else {
			evaluationArray = [$formData.evaluationMode];
		}
	});

	let suiviArray = $state([$formData.suiviAssiduite]);
	$effect(() => {
		if (suiviArray.length > 0) {
			$formData.suiviAssiduite = suiviArray[0] as any;
		} else {
			suiviArray = [$formData.suiviAssiduite];
		}
	});

	async function nextStep() {
		let fieldsToValidate: string[] = [];
		if (currentStep === 1) {
			fieldsToValidate = ['name', 'clientId', 'duree', 'modalite'];
		} else if (currentStep === 2) {
			fieldsToValidate = ['modules'];
		}

		for (const field of fieldsToValidate) {
			await validate(field as any);
		}
		
		const hasErrors = fieldsToValidate.some(field => {
			const error = ($errors as any)[field];
			return error && (Array.isArray(error) ? error.length > 0 : !!error);
		});

		if (!hasErrors) {
			currentStep = Math.min(currentStep + 1, steps.length);
			window.scrollTo({ top: 0, behavior: 'smooth' });
		} else {
			toast.error('Veuillez remplir correctement tous les champs obligatoires.');
		}
	}

	function prevStep() {
		currentStep = Math.max(currentStep - 1, 1);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	// Module Management
	function addModule() {
		$formData.modules = [
			...$formData.modules,
			{ title: `Module ${$formData.modules.length + 1}`, durationHours: 0, objectifs: '' }
		];
	}

	function removeModule(index: number) {
		if ($formData.modules.length > 1) {
			$formData.modules = $formData.modules.filter((_, i) => i !== index);
		}
	}
	
	function assignTime(index: number, type: 'half' | 'all') {
		const currentModuleDuration = $formData.modules[index].durationHours || 0;
		const available = remainingDuration + currentModuleDuration;
		
		if (type === 'half') {
			$formData.modules[index].durationHours = Math.max(0, available / 2);
		} else {
			$formData.modules[index].durationHours = Math.max(0, available);
		}
	}

	// Thématique Searchable Logic
	let openTopicPopover = $state(false);
	let topicSearchValue = $state('');
	const selectedTopic = $derived(data.topics.find(t => t.id === $formData.topicId));
	
	// Create custom topic if no match
	function handleTopicSelect(id: string, name: string) {
		$formData.topicId = id;
		if (id === 'custom') {
			$formData.customTopic = name;
		} else {
			$formData.customTopic = '';
		}
		openTopicPopover = false;
	}

	// Prerequisites Logic
	let newCustomPrerequisite = $state('');
	function addCustomPrerequisite() {
		if (newCustomPrerequisite.trim()) {
			$formData.customPrerequisites = [...$formData.customPrerequisites, newCustomPrerequisite.trim()];
			newCustomPrerequisite = '';
		}
	}
	function removeCustomPrerequisite(index: number) {
		$formData.customPrerequisites = $formData.customPrerequisites.filter((_, i) => i !== index);
	}

	function togglePrerequisite(id: string) {
		if ($formData.prerequisiteIds.includes(id)) {
			$formData.prerequisiteIds = $formData.prerequisiteIds.filter(p => p !== id);
		} else {
			$formData.prerequisiteIds = [...$formData.prerequisiteIds, id];
		}
	}

	function toggleTargetPublic(id: string) {
		if ($formData.targetPublicIds.includes(id)) {
			$formData.targetPublicIds = $formData.targetPublicIds.filter(p => p !== id);
		} else {
			$formData.targetPublicIds = [...$formData.targetPublicIds, id];
		}
	}

	// Client Combobox State
	let openClientPopover = $state(false);
	let clientSearchValue = $state('');
	const selectedClient = $derived(data.clients.find(c => c.id === $formData.clientId));
</script>

{#snippet headerSnippet()}
	<div class="flex items-center gap-3">
		<Badge variant="secondary" class="font-mono text-sm px-2">#1</Badge>
		<EditableTitle bind:value={$formData.name} />
	</div>
{/snippet}

<div class="flex flex-col min-h-[calc(100vh-var(--header-height))] bg-muted/20">
	<div class="flex-grow flex items-center justify-center p-4 py-8">
		<div class="w-full max-w-3xl">
			<Card.Root class="overflow-hidden border-none shadow-xl ring-1 ring-border/50 bg-card">
				<Card.Content class="p-8">
					<form method="POST" use:enhance class="space-y-8">
						<!-- Step 1: Informations de base -->
						{#if currentStep === 1}
							<div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
								<header>
									<h2 class="text-2xl font-bold tracking-tight">Commençons par les bases 📝</h2>
									<p class="text-muted-foreground mt-1 text-base">Identifions le cadre général de votre formation.</p>
								</header>

								<div class="grid gap-8">
									<!-- Row 1: Client and Thématique -->
									<div class="grid sm:grid-cols-2 gap-8">
										<!-- Searchable Client Selector -->
										<div class="space-y-3">
											<label for="clientId" class="text-sm font-bold flex items-center gap-2">
												Client <span class="text-destructive">*</span>
											</label>
											
											<Popover.Root bind:open={openClientPopover}>
												<Popover.Trigger class="w-full h-12">
													<Button
														variant="outline"
														role="combobox"
														aria-expanded={openClientPopover}
														class="w-full justify-between h-12 text-left font-normal"
													>
														{selectedClient ? selectedClient.legalName : "Choisir un client..."}
														<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
													</Button>
												</Popover.Trigger>
												<Popover.Content class="w-[--bits-popover-anchor-width] p-0" align="start">
													<Command.Root>
														<Command.Input placeholder="Rechercher un client..." class="h-10" bind:value={clientSearchValue} />
														<Command.List>
															<Command.Empty>Aucun client trouvé.</Command.Empty>
															<Command.Group>
																{#each data.clients as client}
																	<Command.Item
																		value={client.legalName}
																		onSelect={() => {
																			$formData.clientId = client.id;
																			openClientPopover = false;
																		}}
																	>
																		<Check
																			class={cn(
																				"mr-2 h-4 w-4",
																				$formData.clientId !== client.id && "text-transparent"
																			)}
																		/>
																		{client.legalName}
																	</Command.Item>
																{/each}
															</Command.Group>
														</Command.List>
													</Command.Root>
												</Popover.Content>
											</Popover.Root>
											<input type="hidden" name="clientId" bind:value={$formData.clientId} />
											{#if $errors.clientId}
												<p class="text-sm font-medium text-destructive">{$errors.clientId}</p>
											{/if}
										</div>

										<!-- Searchable Thématique Selector -->
										<div class="space-y-3">
											<label for="topicId" class="text-sm font-bold">Thématique</label>
											<Popover.Root bind:open={openTopicPopover}>
												<Popover.Trigger class="w-full h-12">
													<Button
														variant="outline"
														role="combobox"
														aria-expanded={openTopicPopover}
														class="w-full justify-between h-12 text-left font-normal"
													>
														{#if selectedTopic}
															{selectedTopic.name}
														{:else if $formData.customTopic}
															{$formData.customTopic} (Custom)
														{:else}
															Choisir une thématique...
														{/if}
														<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
													</Button>
												</Popover.Trigger>
												<Popover.Content class="w-[--bits-popover-anchor-width] p-0" align="start">
													<Command.Root>
														<Command.Input placeholder="Chercher ou créer..." class="h-10" bind:value={topicSearchValue} />
														<Command.List>
															<Command.Empty class="p-0">
																<button 
																	type="button"
																	class="flex w-full items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-accent transition-colors"
																	onclick={() => handleTopicSelect('custom', topicSearchValue)}
																>
																	<Plus class="size-4" /> Créer "{topicSearchValue}"
																</button>
															</Command.Empty>
															<Command.Group>
																{#each data.topics as topic}
																	<Command.Item
																		value={topic.name}
																		onSelect={() => handleTopicSelect(topic.id, topic.name)}
																	>
																		<Check
																			class={cn(
																				"mr-2 h-4 w-4",
																				$formData.topicId !== topic.id && "text-transparent"
																			)}
																		/>
																		{topic.name}
																	</Command.Item>
																{/each}
															</Command.Group>
														</Command.List>
													</Command.Root>
												</Popover.Content>
											</Popover.Root>
											<input type="hidden" name="topicId" bind:value={$formData.topicId} />
											<input type="hidden" name="customTopic" bind:value={$formData.customTopic} />
										</div>
									</div>

									<!-- Row 2: Duration -->
									<div class="space-y-3">
										<label for="duree" class="text-sm font-bold flex items-center gap-2">
											Durée totale de la formation (heures) <span class="text-destructive">*</span>
										</label>
										<div class="relative">
											<Clock class="absolute left-3 top-3.5 size-5 text-muted-foreground" />
											<Input id="duree" name="duree" type="number" bind:value={$formData.duree} class="h-12 pl-10 text-lg font-mono" min="1" />
										</div>
										{#if $errors.duree}
											<p class="text-sm font-medium text-destructive">{$errors.duree}</p>
										{/if}
									</div>

									<!-- Row 3: Modality (New Line) -->
									<div class="space-y-3">
										<label class="text-sm font-bold flex items-center gap-2">
											Modalité <span class="text-destructive">*</span>
										</label>
										<CardCheckboxGroup multiple={false} disallowEmpty={true} bind:value={modalityArray} class="grid-cols-2 sm:grid-cols-4 gap-4">
											<CardCheckbox value="Présentiel" title="Présentiel" subtitle="En salle" icon={School} />
											<CardCheckbox value="Distanciel" title="Distanciel" subtitle="En ligne" icon={Monitor} />
											<CardCheckbox value="Hybride" title="Hybride" subtitle="Mixte" icon={Shuffle} />
											<CardCheckbox value="E-Learning" title="E-Learning" subtitle="Autonome" icon={GraduationCap} />
										</CardCheckboxGroup>
									</div>

									<!-- Row 4: Public Cible -->
									<div class="space-y-3">
										<label class="text-sm font-bold flex items-center gap-2">
											<Target class="size-4" /> Public cible
										</label>
										<div class="flex flex-wrap gap-2">
											{#each data.targetPublics as tp}
												<button
													type="button"
													onclick={() => toggleTargetPublic(tp.id)}
													class="rounded-full px-4 py-1.5 text-sm font-medium transition-all
													{$formData.targetPublicIds.includes(tp.id)
														? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20'
														: 'bg-muted hover:bg-muted/80'}"
												>
													{tp.name}
												</button>
											{/each}
										</div>
									</div>

							<!-- List-style Prerequisites -->
							<div class="space-y-3">
								<label class="text-sm font-bold flex items-center gap-2">
									<ShieldCheck class="size-4" /> Prérequis
								</label>
								<div class="space-y-4">
									<div class="divide-y rounded-xl border bg-muted/30 overflow-hidden">
										{#each data.prerequisites as p}
											<button
												type="button"
												onclick={() => togglePrerequisite(p.id)}
												class="flex w-full items-center justify-between p-4 transition-colors hover:bg-accent/50 cursor-pointer text-left"
											>
												<div class="flex items-center gap-3">
													<div class={cn(
														"size-5 rounded border flex items-center justify-center transition-colors",
														$formData.prerequisiteIds.includes(p.id) ? "bg-primary border-primary text-white" : "border-input bg-background"
													)}>
														{#if $formData.prerequisiteIds.includes(p.id)}<Check class="size-3.5" />{/if}
													</div>
													<span class="text-sm font-medium">{p.name}</span>
												</div>
											</button>
										{/each}
										
										{#each $formData.customPrerequisites as cp, i}
											<div class="flex items-center justify-between p-4 bg-primary/5">
												<div class="flex items-center gap-3">
													<div class="size-5 rounded bg-primary flex items-center justify-center text-white">
														<Check class="size-3.5" />
													</div>
													<span class="text-sm font-medium">{cp}</span>
												</div>
												<button type="button" onclick={() => removeCustomPrerequisite(i)} class="text-muted-foreground hover:text-destructive">
													<X class="size-4" />
												</button>
											</div>
										{/each}
									</div>

									<div class="flex gap-2">
										<Input 
											bind:value={newCustomPrerequisite} 
											placeholder="Ajouter un autre prérequis..." 
											class="h-11"
											onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomPrerequisite())}
										/>
										<Button type="button" variant="secondary" class="h-11" onclick={addCustomPrerequisite}>
											<Plus class="size-4 mr-2" /> Ajouter
										</Button>
									</div>
								</div>
								
								<QualiopiAdvise 
									variant="info"
									message="Indicateur 2 : Vérifiez que vos stagiaires ont le profil adapté. C'est un point clé de votre certification !"
								/>
							</div>
						</div>
					</div>
				{/if}

				<!-- Step 2: Modules -->
				{#if currentStep === 2}
					<div class="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
						<header class="flex justify-between items-end">
							<div>
								<h2 class="text-2xl font-bold tracking-tight">Le cœur de la formation 🏗️</h2>
								<p class="text-muted-foreground mt-1 text-base">Structurez votre programme en modules cohérents.</p>
							</div>
							<div class="text-right">
								<div class="text-sm font-bold mb-1">Temps à affecter</div>
								<Badge variant={remainingDuration === 0 ? 'secondary' : remainingDuration < 0 ? 'destructive' : 'outline'} class="text-lg px-3 py-1">
									{remainingDuration}h / {$formData.duree}h
								</Badge>
							</div>
						</header>

						<div class="space-y-6">
							{#each $formData.modules as module, i}
								<Card.Root class="relative border hover:shadow-md transition-shadow group overflow-hidden">
									<div class="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors"></div>
									<Card.Content class="p-6 pt-8 space-y-4">
										<button 
											type="button" 
											class="absolute top-2 right-2 p-2 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
											onclick={() => removeModule(i)}
											disabled={$formData.modules.length <= 1}
										>
											<Trash2 class="size-4" />
										</button>

										<div class="grid sm:grid-cols-4 gap-4">
											<div class="sm:col-span-2 space-y-2">
												<label class="text-sm font-bold">Titre du module</label>
												<Input bind:value={module.title} placeholder="Ex: Introduction aux fondamentaux" />
											</div>
											<div class="sm:col-span-2 space-y-2">
												<label class="text-sm font-bold">Durée (h)</label>
												<div class="flex gap-2">
													<Input type="number" bind:value={module.durationHours} min="0.5" step="0.5" class="w-24 font-mono" />
													<Button 
														variant="outline" 
														size="sm" 
														class="text-[10px] px-2 h-10 border-dashed"
														onclick={() => assignTime(i, 'half')}
														disabled={remainingDuration <= 0}
													>
														1/2 Reste
													</Button>
													<Button 
														variant="outline" 
														size="sm" 
														class="text-[10px] px-2 h-10 border-dashed"
														onclick={() => assignTime(i, 'all')}
														disabled={remainingDuration <= 0}
													>
														Tout
													</Button>
												</div>
											</div>
										</div>

										<div class="space-y-2">
											<label class="text-sm font-bold flex items-center justify-between">
												Objectifs pédagogiques
												<Badge variant="outline" class="text-[10px] uppercase font-bold text-primary border-primary/20">Requis Qualiopi</Badge>
											</label>
											<Textarea bind:value={module.objectifs} placeholder="À la fin de ce module, l'apprenant sera capable de..." class="resize-none min-h-[80px]" />
										</div>
									</Card.Content>
								</Card.Root>
							{/each}

							<Button type="button" variant="outline" class="w-full border-dashed border-2 h-16 text-muted-foreground hover:text-primary hover:border-primary transition-all bg-muted/20" onclick={addModule}>
								<Plus class="mr-2 size-5" /> Ajouter un module
							</Button>
						</div>

						<QualiopiAdvise 
							variant="playful"
							title="Astuce Pédagogique 💡"
							message="Indicateur 6 : Utilisez des verbes d'action mesurables. Cela facilite l'évaluation de fin de formation !"
						/>
					</div>
				{/if}

				<!-- Step 3: Qualiopi Compliance -->
				{#if currentStep === 3}
					<div class="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
						<header>
							<h2 class="text-2xl font-bold tracking-tight">Finitions Qualiopi ✨</h2>
							<p class="text-muted-foreground mt-1 text-base">Assurons-nous que tout est prêt pour la certification.</p>
						</header>

						<div class="space-y-10">
							<!-- Evaluation Mode -->
							<div class="space-y-4">
								<div class="flex items-center justify-between">
									<label class="text-sm font-bold">Comment évaluez-vous les acquis ?</label>
									<p class="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Indicateur 11</p>
								</div>
								
								<CardCheckboxGroup multiple={false} disallowEmpty={true} bind:value={evaluationArray} class="grid-cols-1 sm:grid-cols-2 gap-4">
									<CardCheckbox value="QCM de fin de formation" title="QCM" subtitle="Vérification rapide des connaissances" icon={X} />
									<CardCheckbox value="Mise en situation pratique" title="Pratique" subtitle="Mise en œuvre réelle ou simulée" icon={ShieldCheck} />
									<CardCheckbox value="Étude de cas complexe" title="Étude de cas" subtitle="Analyse de situations concrètes" icon={Search} />
									<CardCheckbox value="Entretien avec le formateur" title="Entretien" subtitle="Dialogue direct de validation" icon={Monitor} />
								</CardCheckboxGroup>
							</div>

							<!-- Attendance Tracking -->
							<div class="space-y-4">
								<label class="text-sm font-bold">Suivi de l'assiduité</label>
								<CardCheckboxGroup multiple={false} disallowEmpty={true} bind:value={suiviArray} class="grid-cols-1 sm:grid-cols-3 gap-4">
									<CardCheckbox value="Feuille d'émargement signée par demi-journée" title="Papier" subtitle="Émargement classique" icon={School} />
									<CardCheckbox value="Émargement numérique via l'application" title="Numérique" subtitle="Signature sur tablette ou mobile" icon={Monitor} />
									<CardCheckbox value="Logs de connexion (pour distanciel)" title="Logs" subtitle="Suivi automatique en ligne" icon={Shuffle} />
								</CardCheckboxGroup>
							</div>

							<div class="space-y-3">
								<label for="description" class="text-sm font-bold">Description synthétique (Optionnel)</label>
								<Textarea bind:value={$formData.description} placeholder="Une brève introduction pour vos catalogues ou devis..." class="min-h-[120px]" />
							</div>

							<div class="rounded-xl bg-primary/5 p-6 border border-primary/10 flex gap-4">
								<div class="size-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
									<Sparkles class="size-5 text-primary" />
								</div>
								<div>
									<p class="font-bold text-primary mb-1">Bravo ! Vous êtes en règle.</p>
									<p class="text-sm text-primary/80">En complétant ces sections, vous validez les exigences clés de Qualiopi pour la conception.</p>
								</div>
							</div>
						</div>
					</div>
				{/if}
				
				<!-- Bottom Navigation with Progress -->
				<div class="pt-8 border-t flex flex-col gap-8">
					<div class="flex justify-between items-center w-full">
						<Button
							variant="ghost"
							type="button"
							onclick={prevStep}
							disabled={currentStep === 1 || $submitting}
							class={cn("flex-shrink-0 transition-opacity", currentStep === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100')}
						>
							<ChevronLeft class="mr-2 h-5 w-5" />
							Précédent
						</Button>

						<!-- Progress Stepper (Moved to Footer) -->
						<div class="hidden md:flex flex-grow justify-center px-8">
							<div class="flex items-center gap-10">
								{#each steps as step}
									<div class="flex items-center gap-3">
										<div
											class={cn(
												"size-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500",
												currentStep > step.id ? "bg-primary text-primary-foreground" : 
												currentStep === step.id ? "bg-primary/20 text-primary ring-2 ring-primary" : "bg-muted text-muted-foreground"
											)}
										>
											{#if currentStep > step.id}
												<Check class="size-4" />
											{:else}
												{step.id}
											{/if}
										</div>
										<span class={cn(
											"text-xs font-bold uppercase tracking-widest transition-colors",
											currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
										)}>
											{step.title}
										</span>
										{#if step.id < steps.length}
											<div class="w-8 h-px bg-muted ml-3"></div>
										{/if}
									</div>
								{/each}
							</div>
						</div>

						<div class="flex gap-3 flex-shrink-0">
							{#if currentStep < steps.length}
								<Button type="button" onclick={nextStep} class="px-8 h-12 text-base font-bold shadow-lg shadow-primary/20 transition-all hover:-translate-y-px active:translate-y-0">
									Continuer
									<ChevronRight class="ml-2 h-5 w-5" />
								</Button>
							{:else}
								<Button 
									type="submit" 
									disabled={$submitting || remainingDuration !== 0} 
									class="px-10 h-12 text-base font-bold shadow-lg shadow-primary/30 transition-all hover:-translate-y-px active:translate-y-0"
								>
									{#if $submitting}
										Enregistrement...
									{:else}
										Créer la formation 🚀
									{/if}
								</Button>
							{/if}
						</div>
					</div>

					{#if currentStep === steps.length && remainingDuration !== 0}
						<div class="flex justify-end animate-bounce">
							<Badge variant="destructive" class="px-4 py-2 gap-2">
								<Clock class="size-4" />
								{remainingDuration > 0 
									? `Il manque ${remainingDuration}h à affecter dans vos modules.` 
									: `Vos modules dépassent la durée totale de ${-remainingDuration}h.`}
							</Badge>
						</div>
					{/if}
				</div>
			</form>
		</Card.Content>
	</Card.Root>
		</div>
	</div>
</div>

<style>
	:global(.animate-in) {
		animation-fill-mode: forwards;
	}
</style>
