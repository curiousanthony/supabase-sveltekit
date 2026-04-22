<script lang="ts">
	import type { PageProps } from './$types';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Label } from '$lib/components/ui/label';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import GraduationCap from '@lucide/svelte/icons/graduation-cap';
	import Mail from '@lucide/svelte/icons/mail';
	import Search from '@lucide/svelte/icons/search';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import CircleX from '@lucide/svelte/icons/circle-x';
	import Euro from '@lucide/svelte/icons/euro';
	import X from '@lucide/svelte/icons/x';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import QuestGuideBanner from '$lib/components/formations/quest-guide-banner.svelte';
	import CityCombobox from '$lib/components/crm/CityCombobox.svelte';
	import ThematiquesCombobox from '$lib/components/crm/ThematiquesCombobox.svelte';

	let { data }: PageProps = $props();

	let dialogOpen = $state(false);
	let searchQuery = $state('');
	let showCreateForm = $state(false);
	let submitting = $state(false);

	let newFirstName = $state('');
	let newLastName = $state('');
	let newEmail = $state('');
	let newVille = $state('');
	let newDepartement = $state('');
	let selectedThematiqueIds = $state<string[]>([]);
	let selectedSousthematiqueIds = $state<string[]>([]);

	function resetDialog() {
		searchQuery = '';
		showCreateForm = false;
		submitting = false;
		newFirstName = '';
		newLastName = '';
		newEmail = '';
		newVille = '';
		newDepartement = '';
		selectedThematiqueIds = [];
		selectedSousthematiqueIds = [];
	}

	const formation = $derived(data.formation);
	const allFormateurs = $derived(data.allFormateurs ?? []);
	const assignedFormateurIds = $derived(
		new Set((formation?.formationFormateurs ?? []).map((ff) => ff.formateurId))
	);

	const showTravelCosts = $derived(
		formation?.modalite === 'Présentiel' || formation?.modalite === 'Hybride'
	);

	const assignedFormateurs = $derived(
		(formation?.formationFormateurs ?? []).map((ff) => {
			const u = ff.formateur.user;
			const name =
				[u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.email || 'Formateur';
			const tjm = parseFloat(ff.tjm ?? '0') || 0;
			const days = parseFloat(ff.numberOfDays ?? '0') || 0;
			const deplacement = parseFloat(ff.deplacementCost ?? '0') || 0;
			const hebergement = parseFloat(ff.hebergementCost ?? '0') || 0;
			const subtotal = tjm * days;
			const grandTotal = subtotal + (showTravelCosts ? deplacement + hebergement : 0);

			return {
				id: ff.formateur.id,
				joinId: ff.id,
				name,
				email: u?.email ?? '',
				avatarUrl: u?.avatarUrl ?? '',
				tjm: ff.tjm ?? '',
				numberOfDays: ff.numberOfDays ?? '',
				deplacementCost: ff.deplacementCost ?? '',
				hebergementCost: ff.hebergementCost ?? '',
				subtotal,
				grandTotal
			};
		})
	);

	const totalCost = $derived(assignedFormateurs.reduce((sum, f) => sum + f.grandTotal, 0));

	const docAction = $derived(
		(formation?.actions ?? []).find((a) => a.questKey === 'documents_formateur')
	);
	const docSubActions = $derived(docAction?.subActions ?? []);

	const formationSeances = $derived(formation?.seances ?? []);
	const formationModules = $derived(formation?.modules ?? []);

	function modulesForFormateur(formateurId: string) {
		return formationModules.filter((m) => m.formateurId === formateurId);
	}

	function seancesForFormateur(formateurId: string) {
		return formationSeances.filter((s) => s.formateurId === formateurId);
	}

	function unassignedSeances() {
		return formationSeances.filter((s) => !s.formateurId);
	}

	const filteredFormateurs = $derived.by(() => {
		const q = searchQuery.toLowerCase().trim();
		if (!q) return allFormateurs.filter((f) => !assignedFormateurIds.has(f.id));
		return allFormateurs.filter((f) => {
			if (assignedFormateurIds.has(f.id)) return false;
			const name = [f.user?.firstName, f.user?.lastName].filter(Boolean).join(' ').toLowerCase();
			const email = (f.user?.email ?? '').toLowerCase();
			return name.includes(q) || email.includes(q);
		});
	});

	function getInitials(name: string) {
		return name
			.split(' ')
			.map((p) => p[0])
			.join('')
			.slice(0, 2)
			.toUpperCase();
	}

	function formatName(f: { user?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null }) {
		return (
			[f.user?.firstName, f.user?.lastName].filter(Boolean).join(' ') ||
			f.user?.email ||
			'Formateur'
		);
	}

	function formatDate(dateStr: string | null | undefined) {
		if (!dateStr) return '';
		const d = new Date(dateStr);
		return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
	}

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('fr-FR', {
			style: 'currency',
			currency: 'EUR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 2
		}).format(amount);
	}
</script>

<div class="space-y-6">
	<QuestGuideBanner />
	<!-- Summary Card -->
	{#if assignedFormateurs.length > 0}
		<Card.Root class="border-primary/20 bg-primary/5">
			<Card.Content class="flex items-center justify-between py-4">
				<div class="flex items-center gap-3">
					<div class="flex items-center justify-center rounded-lg bg-primary/10 p-2">
						<Euro class="size-5 text-primary" />
					</div>
					<div>
						<p class="text-sm text-muted-foreground">Coût total formateurs</p>
						<p class="text-2xl font-bold text-primary">{formatCurrency(totalCost)}</p>
					</div>
				</div>
				<div class="text-right">
					<p class="text-sm text-muted-foreground">
						{assignedFormateurs.length} formateur{assignedFormateurs.length > 1 ? 's' : ''}
					</p>
				</div>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Main Card -->
	<Card.Root>
		<Card.Header class="flex flex-row items-center justify-between">
			<Card.Title class="flex items-center gap-2">
				<GraduationCap class="size-5" />
				Formateurs assignés
				{#if assignedFormateurs.length > 0}
					<Badge variant="secondary" class="text-xs">{assignedFormateurs.length}</Badge>
				{/if}
			</Card.Title>
		<Dialog.Root bind:open={dialogOpen} onOpenChange={(open) => { if (!open) resetDialog(); }}>
			<Dialog.Trigger>
				{#snippet child({ props })}
					<Button {...props} variant="outline" size="sm" class="cursor-pointer">
						<UserPlus class="size-4 mr-1.5" />
						Ajouter
					</Button>
				{/snippet}
			</Dialog.Trigger>
			<Dialog.Content class="max-h-[85vh] overflow-y-auto sm:max-w-lg">
				<Dialog.Header>
					<Dialog.Title>{showCreateForm ? 'Nouveau formateur' : 'Ajouter un formateur'}</Dialog.Title>
					<Dialog.Description>
						{showCreateForm
							? 'Renseignez les informations du formateur à créer et assigner.'
							: 'Recherchez un formateur existant ou créez-en un nouveau.'}
					</Dialog.Description>
				</Dialog.Header>

				{#if !showCreateForm}
					<div class="space-y-4">
						<div class="relative">
							<Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder="Rechercher par nom ou email..."
								class="pl-9"
								bind:value={searchQuery}
							/>
						</div>

						<div class="max-h-64 space-y-2 overflow-y-auto">
							{#each filteredFormateurs as f (f.id)}
								{@const name = formatName(f)}
								<div class="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50">
									<Avatar.Root class="size-9 shrink-0">
										{#if f.user?.avatarUrl}
											<Avatar.Image src={f.user.avatarUrl} alt={name} />
										{/if}
										<Avatar.Fallback class="text-xs">{getInitials(name)}</Avatar.Fallback>
									</Avatar.Root>
									<div class="min-w-0 flex-1">
										<p class="text-sm font-medium truncate">{name}</p>
										{#if f.user?.email}
											<p class="text-xs text-muted-foreground truncate">{f.user.email}</p>
										{/if}
									</div>
									<form method="POST" action="?/addFormateur" use:enhance={() => {
										return async ({ update }) => {
											await update();
											searchQuery = '';
											dialogOpen = false;
										};
									}}>
										<input type="hidden" name="formateurId" value={f.id} />
										<Button variant="secondary" size="sm" class="cursor-pointer shrink-0" type="submit">
											Ajouter
										</Button>
									</form>
								</div>
							{:else}
								<div class="py-6 text-center text-sm text-muted-foreground">
									Aucun formateur trouvé
								</div>
							{/each}
						</div>

						<button
							type="button"
							class="flex w-full items-center gap-2 rounded-md border border-dashed px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							onclick={() => {
							selectedThematiqueIds = data.formation?.topicId ? [data.formation.topicId] : [];
							selectedSousthematiqueIds = data.formation?.subtopicsIds ? [data.formation.subtopicsIds] : [];
							showCreateForm = true;
						}}
						>
							<UserPlus class="size-4" />
							Créer un nouveau formateur
						</button>

						<Separator />

						<!-- Marketplace teaser -->
						<div class="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
							<div class="flex items-center gap-2">
								<Sparkles class="size-4 text-primary/60" />
								<p class="text-sm text-muted-foreground">
									<span class="font-medium text-foreground/80">Bientôt</span> : trouvez le formateur idéal dans le
									<span class="font-medium text-primary/80">Marketplace Mentore</span>
								</p>
							</div>
						</div>
					</div>
				{:else}
					<form
						method="POST"
						action="?/createFormateurAndAssign"
						use:enhance={() => {
							submitting = true;
							return async ({ result, update }) => {
								submitting = false;
								if (result.type === 'success') {
									toast.success('Formateur créé et assigné');
									dialogOpen = false;
									resetDialog();
									await update();
								} else if (result.type === 'failure') {
									toast.error((result.data as { message?: string })?.message ?? 'Erreur');
								}
							};
						}}
					>
						<div class="space-y-4">
							<div class="grid grid-cols-2 gap-3">
								<div class="space-y-1.5">
									<Label for="new-first-name">Prénom</Label>
									<Input id="new-first-name" name="firstName" bind:value={newFirstName} autocomplete="off" />
								</div>
								<div class="space-y-1.5">
									<Label for="new-last-name">Nom</Label>
									<Input id="new-last-name" name="lastName" bind:value={newLastName} required autocomplete="off" />
								</div>
							</div>
							<div class="space-y-1.5">
								<Label for="new-email">Email</Label>
								<Input id="new-email" name="email" type="email" bind:value={newEmail} autocomplete="off" />
							</div>
							<div class="space-y-1.5">
								<Label>Ville / Département</Label>
								<CityCombobox
									city={newVille}
									departement={newDepartement}
									secondaryField="departement"
									onSelect={(c, _region, _code, dept) => { newVille = c; newDepartement = dept ?? ''; }}
								/>
								<input type="hidden" name="ville" value={newVille} />
								<input type="hidden" name="departement" value={newDepartement} />
							</div>

							{#if (data.allThematiques ?? []).length > 0}
								<div class="space-y-1.5">
									<ThematiquesCombobox
										thematiques={data.allThematiques ?? []}
										sousthematiques={data.allSousthematiques ?? []}
										bind:selectedThematiqueIds
										bind:selectedSousthematiqueIds
									/>
									{#each selectedThematiqueIds as id (id)}
										<input type="hidden" name="thematiqueIds[]" value={id} />
									{/each}
									{#each selectedSousthematiqueIds as id (id)}
										<input type="hidden" name="sousthematiqueIds[]" value={id} />
									{/each}
								</div>
							{/if}

							<p class="text-xs text-muted-foreground">
								Vous pourrez compléter son profil (tarif, disponibilité, description…) depuis sa fiche dans le CRM.
							</p>
						</div>

						<Dialog.Footer class="mt-4">
							<Button
								variant="outline"
								type="button"
								class="cursor-pointer"
								onclick={() => { showCreateForm = false; }}
							>
								Retour
							</Button>
							<Button type="submit" class="cursor-pointer" disabled={submitting || (!newFirstName.trim() && !newLastName.trim())}>
								{submitting ? 'Création...' : 'Créer et assigner'}
							</Button>
						</Dialog.Footer>
					</form>
				{/if}
			</Dialog.Content>
		</Dialog.Root>
		</Card.Header>

		<Card.Content>
			{#if assignedFormateurs.length === 0}
				<div class="py-8 text-center">
					<GraduationCap class="mx-auto mb-3 size-12 text-muted-foreground/30" />
					<p class="text-muted-foreground">Aucun formateur assigné à cette formation.</p>
					<p class="mt-1 text-sm text-muted-foreground">
						Cliquez sur « Ajouter » pour assigner un formateur.
					</p>
				</div>
			{:else}
				<div class="space-y-4">
					{#each assignedFormateurs as f (f.joinId)}
						<div class="rounded-lg border">
							<!-- Row 1: Identity -->
							<div class="flex items-center gap-3 px-4 py-3">
								<Avatar.Root class="size-10 shrink-0 border-2 border-background">
									{#if f.avatarUrl}
										<Avatar.Image src={f.avatarUrl} alt={f.name} />
									{/if}
									<Avatar.Fallback>{getInitials(f.name)}</Avatar.Fallback>
								</Avatar.Root>
								<div class="min-w-0 flex-1">
									<p class="font-medium text-foreground truncate">{f.name}</p>
									{#if f.email}
										<p class="text-sm text-muted-foreground truncate">{f.email}</p>
									{/if}
								</div>
								<div class="flex items-center gap-1 shrink-0">
									{#if f.email}
										<Button
											variant="ghost"
											size="icon"
											class="size-8 cursor-pointer"
											href="mailto:{f.email}"
											aria-label="Envoyer un email"
										>
											<Mail class="size-4" />
										</Button>
									{/if}
									<form method="POST" action="?/removeFormateur" use:enhance>
										<input type="hidden" name="formateurId" value={f.id} />
										<Button
											variant="ghost"
											size="icon"
											class="size-8 cursor-pointer text-destructive hover:text-destructive"
											type="submit"
											aria-label="Retirer le formateur"
										>
											<Trash2 class="size-4" />
										</Button>
									</form>
								</div>
							</div>

							<Separator />

							<!-- Row 2: Cost Tracking -->
							<form
								method="POST"
								action="?/updateFormateurCosts"
								class="px-4 py-3"
								use:enhance={() => {
									return async ({ update }) => {
										await update({ reset: false });
									};
								}}
							>
								<input type="hidden" name="formateurId" value={f.id} />
								<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
									<div>
										<label for="tjm-{f.joinId}" class="mb-1 block text-xs font-medium text-muted-foreground">TJM (€/jour)</label>
										<Input
											id="tjm-{f.joinId}"
											name="tjm"
											type="number"
											step="0.01"
											min="0"
											placeholder="0"
											value={f.tjm}
											onblur={(e) => e.currentTarget.form?.requestSubmit()}
											class="h-8 text-sm"
										/>
									</div>
									<div>
										<label for="days-{f.joinId}" class="mb-1 block text-xs font-medium text-muted-foreground">Nb. jours</label>
										<Input
											id="days-{f.joinId}"
											name="numberOfDays"
											type="number"
											step="0.5"
											min="0"
											placeholder="0"
											value={f.numberOfDays}
											onblur={(e) => e.currentTarget.form?.requestSubmit()}
											class="h-8 text-sm"
										/>
									</div>
									<div>
										<span class="mb-1 block text-xs font-medium text-muted-foreground">Sous-total</span>
										<div class="flex h-8 items-center rounded-md bg-muted/50 px-3 text-sm font-medium">
											{formatCurrency(f.subtotal)}
										</div>
									</div>
									{#if showTravelCosts}
										<div>
											<label for="dep-{f.joinId}" class="mb-1 block text-xs font-medium text-muted-foreground">Déplacement (€)</label>
											<Input
												id="dep-{f.joinId}"
												name="deplacementCost"
												type="number"
												step="0.01"
												min="0"
												placeholder="0"
												value={f.deplacementCost}
												onblur={(e) => e.currentTarget.form?.requestSubmit()}
												class="h-8 text-sm"
											/>
										</div>
										<div>
											<label for="heb-{f.joinId}" class="mb-1 block text-xs font-medium text-muted-foreground">Hébergement (€)</label>
											<Input
												id="heb-{f.joinId}"
												name="hebergementCost"
												type="number"
												step="0.01"
												min="0"
												placeholder="0"
												value={f.hebergementCost}
												onblur={(e) => e.currentTarget.form?.requestSubmit()}
												class="h-8 text-sm"
											/>
										</div>
									{/if}
									<div>
										<span class="mb-1 block text-xs font-medium text-muted-foreground">Total formateur</span>
										<div class="flex h-8 items-center rounded-md bg-primary/10 px-3 text-sm font-bold text-primary">
											{formatCurrency(f.grandTotal)}
										</div>
									</div>
								</div>
							</form>

							<!-- Row 3: Document Badges -->
							{#if docSubActions.length > 0}
								<Separator />
								<div class="flex flex-wrap items-center gap-2 px-4 py-3">
									<span class="text-xs font-medium text-muted-foreground mr-1">Documents :</span>
									{#each docSubActions as sa (sa.id)}
										{#if sa.completed}
											<Badge variant="outline" class="gap-1 border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
												<CircleCheck class="size-3" />
												{sa.title}
											</Badge>
										{:else}
											<Badge variant="outline" class="gap-1 border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
												<CircleX class="size-3" />
												{sa.title}
											</Badge>
										{/if}
									{/each}
								</div>
							{/if}

						<!-- Row 4: Module Assignments (read-only) -->
						{#if modulesForFormateur(f.id).length > 0}
							<Separator />
							<div class="px-4 py-3">
								<div class="mb-2 flex items-center gap-2">
									<BookOpen class="size-4 text-muted-foreground" />
									<span class="text-xs font-medium text-muted-foreground">Modules assignés</span>
								</div>
								<div class="flex flex-wrap gap-1.5">
									{#each modulesForFormateur(f.id) as mod (mod.id)}
										<Badge variant="outline" class="gap-1 text-xs">
											{mod.name}
											{#if mod.durationHours}
												<span class="text-muted-foreground">({mod.durationHours}h)</span>
											{/if}
										</Badge>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Row 5: Sessions -->
						<Separator />
						<div class="px-4 py-3">
							<div class="mb-2 flex items-center gap-2">
								<CalendarDays class="size-4 text-muted-foreground" />
								<span class="text-xs font-medium text-muted-foreground">Séances assignées</span>
							</div>

								{#if seancesForFormateur(f.id).length > 0}
									<div class="mb-2 space-y-1">
										{#each seancesForFormateur(f.id) as s (s.id)}
											<div class="flex items-center justify-between rounded-md bg-muted/50 px-3 py-1.5 text-sm">
												<span>
													{formatDate(s.startAt)}
													{#if s.module?.name}
														<span class="text-muted-foreground"> — {s.module.name}</span>
													{/if}
												</span>
												<form method="POST" action="?/removeFormateurFromSession" use:enhance>
													<input type="hidden" name="seanceId" value={s.id} />
													<Button variant="ghost" size="icon" class="size-6 cursor-pointer text-muted-foreground hover:text-destructive" type="submit" aria-label="Retirer de la séance">
														<X class="size-3" />
													</Button>
												</form>
											</div>
										{/each}
									</div>
								{/if}

								{#if unassignedSeances().length > 0}
									<form method="POST" action="?/assignFormateurToSession" use:enhance>
										<input type="hidden" name="formateurId" value={f.id} />
										<div class="flex items-center gap-2">
											<Select.Root name="seanceId" type="single">
												<Select.Trigger class="h-8 flex-1 text-xs cursor-pointer">
													<span class="text-muted-foreground">Assigner à une séance...</span>
												</Select.Trigger>
												<Select.Content>
													{#each unassignedSeances() as s (s.id)}
														<Select.Item value={s.id} label="{formatDate(s.startAt)}{s.module?.name ? ` — ${s.module.name}` : ''}">
															{formatDate(s.startAt)}
															{#if s.module?.name}
																<span class="text-muted-foreground"> — {s.module.name}</span>
															{/if}
														</Select.Item>
													{/each}
												</Select.Content>
											</Select.Root>
											<Button variant="secondary" size="sm" class="h-8 cursor-pointer" type="submit">
												Assigner
											</Button>
										</div>
									</form>
								{:else if formationSeances.length === 0}
									<p class="text-xs text-muted-foreground">
										Aucune séance planifiée.
										<a href="../seances" class="text-primary underline-offset-4 hover:underline">Planifier des séances</a>
									</p>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
