<script lang="ts">
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
	import Check from '@lucide/svelte/icons/check';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Clock from '@lucide/svelte/icons/clock';
	import Target from '@lucide/svelte/icons/target';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import School from '@lucide/svelte/icons/school';
	import Monitor from '@lucide/svelte/icons/monitor';
	import Shuffle from '@lucide/svelte/icons/shuffle';
	import GraduationCap from '@lucide/svelte/icons/graduation-cap';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import X from '@lucide/svelte/icons/x';
	import { headerTitleSnippet, headerTitleText } from '$lib/stores/header-store';
	import EditableTitle from '$lib/components/editable-title.svelte';
	import QualiopiAdvise from '$lib/components/qualiopi-advise.svelte';
	import CardCheckboxGroup from '$lib/components/ui/card-checkbox/card-checkbox-group.svelte';
	import CardCheckbox from '$lib/components/ui/card-checkbox/card-checkbox.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Textarea } from '$lib/components/ui/textarea';
	import { onMount } from 'svelte';
	import { cn } from '$lib/utils';
	import { Stepper } from '$lib/components/ui/stepper';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { useSidebar } from '$lib/components/ui/sidebar/context.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Progress } from '$lib/components/ui/progress';

	import type { FormationSchema } from './schema';

	let { data } = $props();

	const form = superForm<FormationSchema>(data.form as any, {
		validators: zodClient(formationSchema as any),
		dataType: 'json',
		onResult: ({ result }) => {
			if (result.type === 'redirect') {
				toast.success('Formation créée avec succès !');
			}
		}
	});

	const { form: formData, enhance, validate, errors, submitting } = form;
	const sidebar = useSidebar();

	let currentStep = $state(1);
	const steps = [
		{ id: 1, title: 'Bases', description: 'Informations de base' },
		{ id: 2, title: 'Programme', description: 'Modules et objectifs' },
		{ id: 3, title: 'Personnes', description: 'Formateurs et apprenants' },
		{ id: 4, title: 'Financement', description: 'Type et montant' }
	];

	// Header Title Sync and Cleanup
	// Important: keep effects idempotent to avoid invalidation loops.
	let lastAutoModule0Title = $state<string | null>(null);
	let module1WasManuallyEdited = $state(false);
	$effect(() => {
		headerTitleText.set($formData.name);
		
		// Requirement: Default first module title matches Formation title
		// Only auto-sync when it would not overwrite a user-edited title.
		if ($formData.modules.length > 0 && currentStep === 1 && !module1WasManuallyEdited) {
			const desired = ($formData.name ?? '').trim();
			const current = ($formData.modules[0]?.title ?? '').trim();
			const canAutoUpdate = current === '' || current === (lastAutoModule0Title ?? '') || current === 'Module 1' || current === 'Formation sans titre';

			if (desired && canAutoUpdate && current !== desired) {
				$formData.modules[0].title = desired;
				lastAutoModule0Title = desired;
			} else if (current === desired && desired) {
				// Keep in sync without re-writing.
				lastAutoModule0Title = desired;
			}
		}
	});

	onMount(() => {
		headerTitleSnippet.set(headerSnippet);
		// Hide sidebar for full-screen experience
		sidebar.setOpen(false);
		// Reset on unmount
		return () => {
			headerTitleSnippet.set(null);
			headerTitleText.set('');
			sidebar.setOpen(true);
		};
	});

	// Update browser tab title when formation title changes
	$effect(() => {
		const title = $formData.name && $formData.name !== 'Formation sans titre' 
			? $formData.name 
			: 'Créer une formation';
		document.title = title;
	});

	// Calculated Duration logic
	const totalModulesDuration = $derived(
		$formData.modules.reduce((acc: number, m: { durationHours: number }) => acc + (m.durationHours || 0), 0)
	);
	const remainingDuration = $derived($formData.duree - totalModulesDuration);

	// Modality handling (Sync local array with form string)
	let modalityArray = $state([$formData.modalite]);
	$effect(() => {
		const next = modalityArray[0];
		if (next && $formData.modalite !== next) $formData.modalite = next as any;
		if ((!next || modalityArray.length === 0) && $formData.modalite && modalityArray[0] !== $formData.modalite) {
			modalityArray = [$formData.modalite];
		}
	});

	async function nextStep() {
		let fieldsToValidate: string[] = [];
		if (currentStep === 1) {
			fieldsToValidate = ['name', 'clientId', 'duree', 'modalite'];
		} else if (currentStep === 2) {
			fieldsToValidate = ['modules'];
		}
		// Steps 3 (Personnes) and 4 (Financement) are optional — no validation

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

	// Company Combobox State (replaces legacy client combobox)
	let openClientPopover = $state(false);
	let clientSearchValue = $state('');
	const selectedCompany = $derived((data.companies ?? []).find((c: { id: string }) => c.id === ($formData as any).companyId));

	$effect(() => {
		if (!openClientPopover) clientSearchValue = '';
	});

	$effect(() => {
		if (!openTopicPopover) topicSearchValue = '';
	});
</script>

{#snippet headerSnippet()}
	<div class="flex items-center gap-3">
		<Badge variant="secondary" class="font-mono text-sm px-2">#1</Badge>
		<EditableTitle bind:value={$formData.name} />
	</div>
{/snippet}

<div class="flex flex-col min-h-[calc(100vh-var(--header-height))] bg-muted/20">
	<main class="flex-1 overflow-y-auto overflow-x-hidden py-4 px-4 pb-32">
		<div class="w-full max-w-5xl mx-auto">
			<Card.Root class="overflow-hidden border-none shadow-xl ring-1 ring-border/50 bg-card">
				<Card.Content class="p-6 pb-4">
					<form id="create-formation-form" method="POST" use:enhance class="space-y-8">
						<!-- Step 1: Informations de base -->
						{#if currentStep === 1}
							<div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
								<header>
									<h2 class="text-2xl font-bold tracking-tight">Commençons par les bases 📝</h2>
									<p class="text-muted-foreground mt-1 text-base">Identifions le cadre général de votre formation.</p>
								</header>

								<div class="grid gap-8">
									<!-- Row 1: Client and Thématique -->
									<div class="grid sm:grid-cols-2 gap-6">
										<!-- Searchable Thématique Selector -->
										<div class="space-y-3">
											<label for="topicId" class="text-sm font-bold flex items-center gap-2">
												Thématique
											</label>
											<Popover.Root bind:open={openTopicPopover}>
												<Popover.Trigger
													type="button"
													role="combobox"
													aria-expanded={openTopicPopover}
													class="inline-flex h-12 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-input bg-background px-4 py-2 text-left text-sm font-normal shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0"
												>
													<span class="truncate">
														{#if selectedTopic}
															{selectedTopic.name}
														{:else if $formData.customTopic}
															{$formData.customTopic} (Custom)
														{:else}
															Choisir une thématique...
														{/if}
													</span>
													<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
												</Popover.Trigger>
												<Popover.Content class="w-[--bits-popover-anchor-width] p-0" align="start">
													<Command.Root>
														<Command.Input placeholder="Chercher ou créer..." class="h-10" bind:value={topicSearchValue} />
														<Command.List>
															<Command.Empty class="p-0">
{#if topicSearchValue.trim()}
<button 
type="button"
class="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-accent transition-colors"
onclick={() => {
handleTopicSelect('custom', topicSearchValue);
openTopicPopover = false;
}}
>
<Plus class="size-4" /> Créer "{topicSearchValue}"
</button>
{:else}
<p class="px-3 py-6 text-center text-sm text-muted-foreground">Aucune thématique trouvée.</p>
{/if}
															</Command.Empty>
															<Command.Group>
																{#each data.topics as topic}
																	<Command.Item
																		value={topic.name}
																		class="cursor-pointer"
																		onSelect={() => {
																			handleTopicSelect(topic.id, topic.name);
																			openTopicPopover = false;
																		}}
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

										<!-- Searchable Company Selector -->
										<div class="space-y-3">
											<label for="companyId" class="text-sm font-bold flex items-center gap-2">
												Client (entreprise)
											</label>
											
											<Popover.Root bind:open={openClientPopover}>
												<Popover.Trigger
													type="button"
													role="combobox"
													aria-expanded={openClientPopover}
													class="inline-flex h-12 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-input bg-background px-4 py-2 text-left text-sm font-normal shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0"
												>
													<span class="truncate">{selectedCompany ? selectedCompany.name : "Rechercher une entreprise..."}</span>
													<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
												</Popover.Trigger>
												<Popover.Content class="w-[--bits-popover-anchor-width] p-0" align="start">
													<Command.Root>
														<Command.Input placeholder="Rechercher une entreprise..." class="h-10" bind:value={clientSearchValue} />
														<Command.List>
															<Command.Empty>Aucune entreprise trouvée.</Command.Empty>
															<Command.Group>
																{#each data.companies ?? [] as company}
																	<Command.Item
																		value={company.name}
																		class="cursor-pointer"
																		onSelect={() => {
																			($formData as any).companyId = company.id;
																			openClientPopover = false;
																		}}
																	>
																		<Check
																			class={cn(
																				"mr-2 h-4 w-4",
																				(($formData as any).companyId ?? '') !== company.id && "text-transparent"
																			)}
																		/>
																		{company.name}
																	</Command.Item>
																{/each}
															</Command.Group>
														</Command.List>
													</Command.Root>
												</Popover.Content>
											</Popover.Root>
											<input type="hidden" name="companyId" value={($formData as any).companyId ?? ''} />
										</div>
									</div>

									<!-- Row 2: Duration -->
									<div class="space-y-3">
										<label for="duree" class="text-sm font-bold flex items-center gap-2">
											Durée totale de la formation (heures) <span class="text-destructive">*</span>
										</label>
										<div class="flex flex-wrap items-center gap-2">
											<div class="relative inline-flex items-center">
											<Clock class="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
											<Stepper
												id="duree"
												name="duree"
												bind:value={$formData.duree}
												min={1}
												class="pl-8 h-12"
											/>
											</div>

											<ButtonGroup class="h-12">
												<Button type="button" variant="ghost" size="sm" class="h-12 px-6" onclick={() => ($formData.duree = 7)}>7h</Button>
												<Button type="button" variant="ghost" size="sm" class="h-12 px-6" onclick={() => ($formData.duree = 14)}>14h</Button>
												<Button type="button" variant="ghost" size="sm" class="h-12 px-6" onclick={() => ($formData.duree = 21)}>21h</Button>
												<Button type="button" variant="ghost" size="sm" class="h-12 px-6" onclick={() => ($formData.duree = 35)}>35h</Button>
												<Button type="button" variant="ghost" size="sm" class="h-12 px-6" onclick={() => ($formData.duree = 70)}>70h</Button>
											</ButtonGroup>
										</div>
										{#if $errors.duree}
											<p class="text-sm font-medium text-destructive">{$errors.duree}</p>
										{/if}
									</div>

									<!-- Row 3: Modality (New Line) -->
									<div class="space-y-3">
									<div class="text-sm font-bold flex items-center gap-2">
										Modalité <span class="text-destructive">*</span>
										<Tooltip.Root>
											<Tooltip.Trigger>
												<Badge variant="outline" class="text-[10px] uppercase font-bold text-primary border-primary/20 cursor-help ml-auto">
													Indicateur 3
												</Badge>
											</Tooltip.Trigger>
											<Tooltip.Content>
												<p class="max-w-xs">Indicateur 3 : La modalité de formation (présentiel, distanciel, hybride, e-learning) doit être clairement définie pour assurer la traçabilité et la conformité Qualiopi.</p>
											</Tooltip.Content>
										</Tooltip.Root>
									</div>
										<CardCheckboxGroup multiple={false} disallowEmpty={true} bind:value={modalityArray} class="grid-cols-2 sm:grid-cols-4 gap-4">
											<CardCheckbox value="Présentiel" title="Présentiel" subtitle="En salle" icon={School} />
											<CardCheckbox value="Distanciel" title="Distanciel" subtitle="En ligne" icon={Monitor} />
											<CardCheckbox value="Hybride" title="Hybride" subtitle="Mixte" icon={Shuffle} />
											<CardCheckbox value="E-Learning" title="E-Learning" subtitle="Autonome" icon={GraduationCap} />
										</CardCheckboxGroup>
									</div>

									<!-- Row 4: Public Cible -->
									<div class="space-y-3">
										<div class="text-sm font-bold flex items-center gap-2">
											<Target class="size-4" /> Public cible
											<Tooltip.Root>
												<Tooltip.Trigger>
													<Badge variant="outline" class="text-[10px] uppercase font-bold text-primary border-primary/20 cursor-help ml-auto">
														Indicateur 2
													</Badge>
												</Tooltip.Trigger>
												<Tooltip.Content>
													<p class="max-w-xs">Indicateur 2 : Définir précisément le public cible permet de vérifier que les stagiaires ont le profil adapté à la formation, un point clé pour la certification Qualiopi.</p>
												</Tooltip.Content>
											</Tooltip.Root>
										</div>
										<div class="flex flex-wrap gap-2">
											{#each data.targetPublics as tp}
												<button
													type="button"
													onclick={() => toggleTargetPublic(tp.id)}
													class={cn(
														"inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-medium transition-colors cursor-pointer hover:bg-accent/50",
														$formData.targetPublicIds.includes(tp.id)
															? "border-primary/30 bg-primary/5"
															: "border-input bg-background"
													)}
												>
													<div
														class={cn(
															"size-5 rounded border flex items-center justify-center transition-colors",
															$formData.targetPublicIds.includes(tp.id)
																? "bg-primary border-primary text-white"
																: "border-input bg-background"
														)}
													>
														{#if $formData.targetPublicIds.includes(tp.id)}<Check class="size-3.5" />{/if}
													</div>
													{tp.name}
												</button>
											{/each}
										</div>
									</div>

							<!-- List-style Prerequisites -->
							<div class="space-y-3">
								<div class="text-sm font-bold flex items-center gap-2">
									<ShieldCheck class="size-4" /> Prérequis
									<Tooltip.Root>
										<Tooltip.Trigger>
											<Badge variant="outline" class="text-[10px] uppercase font-bold text-primary border-primary/20 cursor-help ml-auto">
												Indicateur 2
											</Badge>
										</Tooltip.Trigger>
										<Tooltip.Content>
											<p class="max-w-xs">Indicateur 2 : Les prérequis garantissent que les stagiaires ont les compétences nécessaires pour suivre la formation, essentiel pour la conformité Qualiopi.</p>
										</Tooltip.Content>
									</Tooltip.Root>
								</div>
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
												<button
													type="button"
													onclick={() => removeCustomPrerequisite(i)}
													class="cursor-pointer text-muted-foreground hover:text-destructive"
												>
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
								<Badge variant={remainingDuration === 0 ? 'default' : remainingDuration < 0 ? 'destructive' : 'outline'} class={cn("text-lg px-3 py-1", remainingDuration === 0 && "bg-green-500 text-white border-green-600")}>
									{remainingDuration}h / {$formData.duree}h
								</Badge>
							</div>
						</header>

						<div class="space-y-6">
							{#each $formData.modules as module, i}
								<Card.Root class="relative border hover:shadow-md transition-shadow group overflow-hidden">
									<div class="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors"></div>
									<Card.Content class="p-6 pt-8 space-y-4">
										{#if i > 0}
											<button
												type="button"
												class="absolute top-2 right-2 p-2 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
												onclick={() => removeModule(i)}
											>
												<Trash2 class="size-4" />
											</button>
										{/if}

										<div class="grid sm:grid-cols-4 gap-4">
											<div class="sm:col-span-2 space-y-2">
												<label for={`module-title-${i}`} class="text-sm font-bold flex items-center gap-2">
													Titre du module <span class="text-destructive">*</span>
												</label>
												<Input 
													id={`module-title-${i}`} 
													bind:value={module.title} 
													placeholder="Ex: Introduction aux fondamentaux"
													oninput={() => {
														if (i === 0) {
															module1WasManuallyEdited = true;
														}
													}}
												/>
											</div>
											<div class="sm:col-span-2 space-y-2">
												<label for={`module-duration-${i}`} class="text-sm font-bold flex items-center gap-2">
													Durée (h) <span class="text-destructive">*</span>
												</label>
												<div class="flex flex-wrap items-center gap-2">
													<Stepper
														id={`module-duration-${i}`}
														bind:value={module.durationHours}
														min={0.5}
														class="h-10"
													/>
													<div class="flex gap-1">
														<Button
															type="button"
															variant="outline"
															size="sm"
															class="h-9"
															onclick={() => assignTime(i, 'half')}
															disabled={remainingDuration <= 0}
														>
															1/2 du temps restant
														</Button>
														<Button
															type="button"
															variant="outline"
															size="sm"
															class="h-9"
															onclick={() => assignTime(i, 'all')}
															disabled={remainingDuration <= 0}
														>
															Tout le temps restant
														</Button>
													</div>
												</div>
											</div>
										</div>

										<div class="space-y-2">
											<label for={`module-objectifs-${i}`} class="text-sm font-bold flex items-center gap-2">
												<span class="flex items-center gap-1">
													Objectifs pédagogiques <span class="text-destructive">*</span>
												</span>
												<Tooltip.Root>
													<Tooltip.Trigger>
														<Badge variant="outline" class="text-[10px] uppercase font-bold text-primary border-primary/20 cursor-help">
															Indicateur 6
														</Badge>
													</Tooltip.Trigger>
													<Tooltip.Content>
														<p class="max-w-xs">Indicateur 6 : Les objectifs pédagogiques doivent être mesurables et évaluables. Utilisez des verbes d'action (comprendre, appliquer, analyser) pour faciliter l'évaluation de fin de formation.</p>
													</Tooltip.Content>
												</Tooltip.Root>
											</label>
											<Textarea id={`module-objectifs-${i}`} bind:value={module.objectifs} placeholder="À la fin de ce module, l'apprenant sera capable de..." class="resize-none min-h-[80px]" />
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

				<!-- Step 3: Personnes -->
				{#if currentStep === 3}
					<div class="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
						<header>
							<h2 class="text-2xl font-bold tracking-tight">Personnes 👥</h2>
							<p class="text-muted-foreground mt-1 text-base">Formateurs et apprenants (optionnel).</p>
						</header>

						<div class="rounded-xl border bg-muted/30 p-6 text-center">
							<p class="text-muted-foreground">
								Vous pourrez ajouter des formateurs et des apprenants depuis la page de la formation.
							</p>
						</div>
					</div>
				{/if}

				<!-- Step 4: Financement -->
				{#if currentStep === 4}
					<div class="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
						<header>
							<h2 class="text-2xl font-bold tracking-tight">Financement 💰</h2>
							<p class="text-muted-foreground mt-1 text-base">Type et montant (optionnel).</p>
						</header>

						<div class="space-y-6">
							<div class="space-y-3">
								<label for="typeFinancement" class="text-sm font-bold flex items-center gap-2">
									Type de financement
								</label>
								<Select.Root
									type="single"
									value={$formData.typeFinancement ?? ''}
									onValueChange={(v) => {
										$formData.typeFinancement = v && v !== '' ? (v as 'CPF' | 'OPCO' | 'Inter' | 'Intra') : undefined;
									}}
								>
									<Select.Trigger id="typeFinancement" class="h-12 w-full">
										{$formData.typeFinancement || 'Non renseigné'}
									</Select.Trigger>
									<Select.Content>
										<Select.Item value="">Non renseigné</Select.Item>
										<Select.Item value="CPF">CPF</Select.Item>
										<Select.Item value="OPCO">OPCO</Select.Item>
										<Select.Item value="Inter">Inter</Select.Item>
										<Select.Item value="Intra">Intra</Select.Item>
									</Select.Content>
								</Select.Root>
							</div>

							<div class="space-y-3">
								<label for="montantAccorde" class="text-sm font-bold flex items-center gap-2">
									Montant accordé (€)
								</label>
								<Input
									id="montantAccorde"
									type="text"
									inputmode="decimal"
									placeholder="Ex: 1500"
									class="h-12"
									bind:value={$formData.montantAccorde}
								/>
							</div>

							<div class="flex items-center gap-3">
								<input
									type="checkbox"
									id="financementAccorde"
									bind:checked={$formData.financementAccorde}
									class="h-4 w-4 rounded border-input"
								/>
								<label for="financementAccorde" class="text-sm font-medium cursor-pointer">
									Financement accordé
								</label>
							</div>
						</div>
					</div>
				{/if}
				
			</form>
		</Card.Content>
	</Card.Root>

		</div>
	</main>

	<!-- Bottom Navigation with Progress (Fixed Footer) -->
	<footer class="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border/50 px-4 py-4 shadow-lg z-9">
		<div class="flex justify-between items-center w-full max-w-5xl mx-auto gap-8">
			<div class="shrink-0">
				{#if currentStep > 1}
					<Button
						variant="ghost"
						type="button"
						onclick={prevStep}
						disabled={$submitting}
					>
						<ChevronLeft class="mr-2 h-5 w-5" />
						Précédent
					</Button>
				{/if}
			</div>

			<!-- Progress Stepper (Centered) -->
			<div class="hidden md:flex flex-1 justify-center px-8">
				<div class="w-full max-w-lg space-y-3">
					<div class="relative">
						<Progress 
							value={steps.length <= 1 ? (currentStep >= steps.length ? 100 : 0) : ((currentStep - 1) / (steps.length - 1)) * 100} 
							max={100}
							class="h-2"
						/>
						<div class="absolute inset-0 flex items-center justify-between px-1">
							{#each steps as step}
								<div
									class={cn(
										"size-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 relative z-10",
										currentStep > step.id ? "bg-primary text-primary-foreground" : 
										currentStep === step.id ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2" : "bg-muted text-muted-foreground"
									)}
								>
									{#if currentStep > step.id}
										<Check class="size-3.5" />
									{:else}
										{step.id}
									{/if}
								</div>
							{/each}
						</div>
					</div>
					<div class="flex items-center justify-between px-1">
						{#each steps as step}
							<span class={cn(
								"text-xs font-bold uppercase tracking-wider transition-colors text-center flex-1",
								currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
							)}>
								{step.title}
							</span>
						{/each}
					</div>
				</div>
			</div>

			<div class="shrink-0">
				{#if currentStep < steps.length}
					<Button type="button" onclick={nextStep} class="px-8 h-12 text-base font-bold shadow-lg shadow-primary/20 transition-all hover:-translate-y-px active:translate-y-0">
						Continuer
						<ChevronRight class="ml-2 h-5 w-5" />
					</Button>
				{:else}
					<Button 
						type="submit"
						form="create-formation-form"
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
				<div class="flex justify-end animate-bounce mt-4">
					<Badge variant="destructive" class="px-4 py-2 gap-2">
						<Clock class="size-4" />
						{remainingDuration > 0 
							? `Il manque ${remainingDuration}h à affecter dans vos modules.` 
							: `Vos modules dépassent la durée totale de ${-remainingDuration}h.`}
					</Badge>
				</div>
			{/if}
		</footer>
</div>

<style>
	:global(.animate-in) {
		animation-fill-mode: forwards;
	}
</style>
