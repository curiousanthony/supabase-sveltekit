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
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import MessageCircle from '@lucide/svelte/icons/message-circle';
	import FileSignature from '@lucide/svelte/icons/file-signature';
	import Smartphone from '@lucide/svelte/icons/smartphone';
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

	let currentStep = $state(1);
	const steps = [
		{ id: 1, title: 'Bases', description: 'Client et modalités' },
		{ id: 2, title: 'Programme', description: 'Modules et objectifs' },
		{ id: 3, title: 'Qualiopi', description: 'Conformité et suivi' }
	];

	// Header Title Sync and Cleanup
	// Important: keep effects idempotent to avoid invalidation loops.
	let lastAutoModule0Title = $state<string | null>(null);
	$effect(() => {
		headerTitleText.set($formData.name);
		
		// Requirement: Default first module title matches Formation title
		// Only auto-sync when it would not overwrite a user-edited title.
		if ($formData.modules.length > 0 && currentStep === 1) {
			const desired = ($formData.name ?? '').trim();
			const current = ($formData.modules[0]?.title ?? '').trim();
			const canAutoUpdate = current === '' || current === (lastAutoModule0Title ?? '');

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
		const next = modalityArray[0];
		if (next && $formData.modalite !== next) $formData.modalite = next as any;
		if ((!next || modalityArray.length === 0) && $formData.modalite && modalityArray[0] !== $formData.modalite) {
			modalityArray = [$formData.modalite];
		}
	});

	// Step 3 state sync (Evaluation and Attendance)
	let evaluationArray = $state([$formData.evaluationMode]);
	$effect(() => {
		const next = evaluationArray[0];
		if (next && $formData.evaluationMode !== next) $formData.evaluationMode = next as any;
		if ((!next || evaluationArray.length === 0) && $formData.evaluationMode && evaluationArray[0] !== $formData.evaluationMode) {
			evaluationArray = [$formData.evaluationMode];
		}
	});

	let suiviArray = $state([$formData.suiviAssiduite]);
	$effect(() => {
		const next = suiviArray[0];
		if (next && $formData.suiviAssiduite !== next) $formData.suiviAssiduite = next as any;
		if ((!next || suiviArray.length === 0) && $formData.suiviAssiduite && suiviArray[0] !== $formData.suiviAssiduite) {
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

										<!-- Searchable Client Selector -->
										<div class="space-y-3">
											<label for="clientId" class="text-sm font-bold flex items-center gap-2">
												Client <span class="text-destructive">*</span>
											</label>
											
											<Popover.Root bind:open={openClientPopover}>
												<Popover.Trigger
													type="button"
													role="combobox"
													aria-expanded={openClientPopover}
													class="inline-flex h-12 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-input bg-background px-4 py-2 text-left text-sm font-normal shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0"
												>
													<span class="truncate">{selectedClient ? selectedClient.legalName : "Choisir un client..."}</span>
													<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
																		class="cursor-pointer"
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
												<Button type="button" variant="ghost" size="sm" class="h-12 px-3" onclick={() => ($formData.duree = 7)}>7h</Button>
												<Button type="button" variant="ghost" size="sm" class="h-12 px-3" onclick={() => ($formData.duree = 14)}>14h</Button>
												<Button type="button" variant="ghost" size="sm" class="h-12 px-3" onclick={() => ($formData.duree = 21)}>21h</Button>
												<Button type="button" variant="ghost" size="sm" class="h-12 px-3" onclick={() => ($formData.duree = 35)}>35h</Button>
												<Button type="button" variant="ghost" size="sm" class="h-12 px-3" onclick={() => ($formData.duree = 70)}>70h</Button>
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
												<Input id={`module-title-${i}`} bind:value={module.title} placeholder="Ex: Introduction aux fondamentaux" />
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
											<label for={`module-objectifs-${i}`} class="text-sm font-bold flex items-center justify-between">
												<span class="flex items-center gap-1">
													Objectifs pédagogiques <span class="text-destructive">*</span>
												</span>
												<Badge variant="outline" class="text-[10px] uppercase font-bold text-primary border-primary/20">Requis Qualiopi</Badge>
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
									<div class="text-sm font-bold flex items-center gap-2">
										Comment évaluez-vous les acquis ? <span class="text-destructive">*</span>
									</div>
									<p class="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Indicateur 11</p>
								</div>
								
								<CardCheckboxGroup multiple={false} disallowEmpty={true} bind:value={evaluationArray} class="grid-cols-1 sm:grid-cols-2 gap-4">
									<CardCheckbox value="QCM de fin de formation" title="QCM" subtitle="Vérification rapide des connaissances" icon={ClipboardList} />
									<CardCheckbox value="Mise en situation pratique" title="Pratique" subtitle="Mise en œuvre réelle ou simulée" icon={Target} />
									<CardCheckbox value="Étude de cas complexe" title="Étude de cas" subtitle="Analyse de situations concrètes" icon={BookOpen} />
									<CardCheckbox value="Entretien avec le formateur" title="Entretien" subtitle="Dialogue direct de validation" icon={MessageCircle} />
								</CardCheckboxGroup>
							</div>

							<!-- Attendance Tracking -->
							<div class="space-y-4">
								<div class="text-sm font-bold flex items-center gap-2">
									Suivi de l'assiduité <span class="text-destructive">*</span>
								</div>
								<CardCheckboxGroup multiple={false} disallowEmpty={true} bind:value={suiviArray} class="grid-cols-1 sm:grid-cols-3 gap-4">
									<CardCheckbox value="Feuille d'émargement signée par demi-journée" title="Papier" subtitle="Émargement classique" icon={FileSignature} />
									<CardCheckbox value="Émargement numérique via l'application" title="Numérique" subtitle="Signature sur tablette ou mobile" icon={Smartphone} />
									<CardCheckbox value="Logs de connexion (pour distanciel)" title="Logs" subtitle="Suivi automatique en ligne" icon={Monitor} />
								</CardCheckboxGroup>
							</div>

							<div class="space-y-3">
								<label for="description" class="text-sm font-bold">
									Description synthétique (Optionnel)
								</label>
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
				
			</form>
		</Card.Content>
	</Card.Root>

		</div>
	</main>

	<!-- Bottom Navigation with Progress (Fixed Footer) -->
	<footer class="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border/50 px-4 py-4 shadow-lg z-50">
		<div class="flex justify-between items-center w-full max-w-5xl mx-auto gap-8">
					{#if currentStep > 1}
						<Button
							variant="ghost"
							type="button"
							onclick={prevStep}
							disabled={$submitting}
							class="shrink-0"
						>
							<ChevronLeft class="mr-2 h-5 w-5" />
							Précédent
						</Button>
					{/if}

					<!-- Progress Stepper (Moved to Footer) -->
					<div class="hidden md:flex grow justify-center px-8">
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

					<div class="flex gap-3 shrink-0">
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
