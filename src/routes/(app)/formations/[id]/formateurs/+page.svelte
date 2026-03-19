<script lang="ts">
	import type { PageProps } from './$types';
	import * as Card from '$lib/components/ui/card/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import GraduationCap from '@lucide/svelte/icons/graduation-cap';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Mail from '@lucide/svelte/icons/mail';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Search from '@lucide/svelte/icons/search';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Calendar from '@lucide/svelte/icons/calendar';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import UserMinus from '@lucide/svelte/icons/user-minus';

	let { data }: PageProps = $props();

	const formation = $derived(data?.formation);
	const allFormateurs = $derived(data?.allFormateurs ?? []);
	const modalite = $derived(formation?.modalite ?? '');
	const showTravelHotels = $derived(modalite === 'Présentiel' || modalite === 'Hybride');

	const assignedFormateurIds = $derived(
		new Set((formation?.formationFormateurs ?? []).map((r) => r.formateur.id))
	);

	const unassignedSessionsList = $derived(
		(formation?.seances ?? []).filter((s) => s.formateurId == null)
	);

	const formateurCards = $derived.by(() => {
		const seancesList = formation?.seances ?? [];
		return (formation?.formationFormateurs ?? []).map((ff) => {
			const u = ff.formateur.user;
			const name =
				[u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.email || 'Formateur';
			const mineSessions = seancesList.filter((s) => s.formateurId === ff.formateur.id);
			return {
				joinId: ff.id,
				formateurId: ff.formateur.id,
				name,
				email: u?.email ?? '',
				avatarUrl: u?.avatarUrl ?? '',
				ff,
				mineSessions
			};
		});
	});

	type DraftRow = {
		tjm: string;
		numberOfDays: string;
		deplacement: string;
		hebergement: string;
	};

	let drafts = $state<Record<string, DraftRow>>({});

	$effect(() => {
		const ffs = formation?.formationFormateurs ?? [];
		const next: Record<string, DraftRow> = {};
		for (const ff of ffs) {
			next[ff.id] = {
				tjm: ff.tjm != null ? String(ff.tjm) : '',
				numberOfDays: ff.numberOfDays != null ? String(ff.numberOfDays) : '',
				deplacement: ff.deplacementCost != null ? String(ff.deplacementCost) : '',
				hebergement: ff.hebergementCost != null ? String(ff.hebergementCost) : ''
			};
		}
		drafts = next;
	});

	let addOpen = $state(false);
	let contactSearch = $state('');

	let removeOpen = $state(false);
	let removeTarget = $state<{ formateurId: string; name: string } | null>(null);

	const euroFmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

	function formatEuro(n: number) {
		return euroFmt.format(n);
	}

	function parseLocaleNumber(raw: string): number {
		const n = parseFloat(raw.replace(',', '.'));
		return Number.isFinite(n) ? n : 0;
	}

	function subtotalForDraft(d: DraftRow): number {
		const tjm = parseLocaleNumber(d.tjm);
		const days = parseLocaleNumber(d.numberOfDays);
		return tjm * days;
	}

	function grandTotalForDraft(d: DraftRow, travel: boolean): number {
		let t = subtotalForDraft(d);
		if (travel) {
			t += parseLocaleNumber(d.deplacement);
			t += parseLocaleNumber(d.hebergement);
		}
		return t;
	}

	const searchableFormateurs = $derived.by(() => {
		return allFormateurs.filter((f) => !assignedFormateurIds.has(f.id));
	});

	const filteredSearch = $derived.by(() => {
		const q = contactSearch.trim().toLowerCase();
		if (!q) return searchableFormateurs;
		return searchableFormateurs.filter((f) => {
			const u = f.user;
			const name = `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.toLowerCase();
			const mail = (u?.email ?? '').toLowerCase();
			return name.includes(q) || mail.includes(q);
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

	function formatSessionRange(startAt: string, endAt: string) {
		const opts: Intl.DateTimeFormatOptions = {
			weekday: 'short',
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		};
		const a = new Date(startAt).toLocaleString('fr-FR', opts);
		const b = new Date(endAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
		return `${a} — ${b}`;
	}

	function enhanceCost() {
		return () => {
			return async ({
				result,
				update
			}: {
				result: { type: string; data?: { message?: string } };
				update: () => Promise<void>;
			}) => {
				if (result.type === 'success') {
					toast.success('Coûts enregistrés');
					await invalidateAll();
				} else if (result.type === 'failure') {
					toast.error(result.data?.message ?? 'Impossible d’enregistrer');
				}
				await update();
			};
		};
	}

	function enhanceAction(successMsg: string, onOk?: () => void) {
		return () => {
			return async ({
				result,
				update
			}: {
				result: { type: string; data?: { message?: string } };
				update: () => Promise<void>;
			}) => {
				if (result.type === 'success') {
					onOk?.();
					toast.success(successMsg);
					await invalidateAll();
				} else if (result.type === 'failure') {
					toast.error(result.data?.message ?? 'Une erreur est survenue');
				}
				await update();
			};
		};
	}

	function openRemove(f: { formateurId: string; name: string }) {
		removeTarget = f;
		removeOpen = true;
	}

	function blurSubmit(e: FocusEvent & { currentTarget: HTMLInputElement }) {
		const form = e.currentTarget.form;
		if (form) form.requestSubmit();
	}
</script>

<div class="space-y-6">
	<Card.Root>
		<Card.Header class="flex flex-row flex-wrap items-center justify-between gap-3">
			<Card.Title class="flex items-center gap-2">
				<GraduationCap class="size-5" />
				Formateurs assignés
				{#if formateurCards.length > 0}
					<Badge variant="secondary" class="text-xs">{formateurCards.length}</Badge>
				{/if}
			</Card.Title>
			<Popover.Root bind:open={addOpen}>
				<Popover.Trigger>
					{#snippet child({ props })}
						<Button
							{...props}
							variant="default"
							size="sm"
							class="cursor-pointer"
							type="button"
						>
							<UserPlus class="size-4 mr-1.5" />
							Ajouter
						</Button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content class="w-[min(100vw-2rem,420px)] p-0" align="end">
					<div class="border-b p-3">
						<div class="relative">
							<Search
								class="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2"
							/>
							<Input
								type="search"
								placeholder="Rechercher par nom ou e-mail…"
								class="pl-9"
								bind:value={contactSearch}
								autocomplete="off"
							/>
						</div>
					</div>
					<div class="max-h-72 space-y-2 overflow-y-auto p-3">
						{#if filteredSearch.length === 0}
							<p class="text-muted-foreground py-6 text-center text-sm">Aucun formateur disponible.</p>
						{:else}
							{#each filteredSearch as f (f.id)}
								{@const u = f.user}
								{@const name =
									[u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.email || 'Formateur'}
								<div
									class="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 shadow-sm"
								>
									<Avatar.Root class="size-10 border-2 border-background shrink-0">
										{#if u?.avatarUrl}
											<Avatar.Image src={u.avatarUrl} alt={name} />
										{/if}
										<Avatar.Fallback>{getInitials(name)}</Avatar.Fallback>
									</Avatar.Root>
									<div class="min-w-0 flex-1">
										<p class="truncate text-sm font-medium">{name}</p>
										{#if u?.email}
											<p class="text-muted-foreground truncate text-xs">{u.email}</p>
										{/if}
									</div>
									<form
										method="POST"
										action="?/addFormateur"
										use:enhance={enhanceAction('Formateur ajouté', () => {
											addOpen = false;
											contactSearch = '';
										})}
									>
										<input type="hidden" name="formateurId" value={f.id} />
										<Button type="submit" size="sm" variant="secondary" class="cursor-pointer shrink-0">
											Ajouter
										</Button>
									</form>
								</div>
							{/each}
						{/if}
					</div>
					<div
						class="text-muted-foreground flex items-center gap-2 border-t px-3 py-2.5 text-xs leading-snug"
					>
						<Sparkles class="size-3.5 shrink-0 opacity-70" />
						<span>Bientôt : trouvez le formateur idéal dans le Marketplace Mentore</span>
					</div>
				</Popover.Content>
			</Popover.Root>
		</Card.Header>
		<Card.Content>
			{#if formateurCards.length === 0}
				<div class="py-8 text-center">
					<GraduationCap class="text-muted-foreground/30 mx-auto mb-3 size-12" />
					<p class="text-muted-foreground">Aucun formateur assigné à cette formation.</p>
					<p class="text-muted-foreground mt-1 text-sm">Utilisez « Ajouter » pour choisir un formateur du workspace.</p>
				</div>
			{:else}
				<div class="space-y-4">
					{#each formateurCards as row (row.joinId)}
						{@const d = drafts[row.joinId]}
						{@const travel = showTravelHotels}
						<div class="bg-card rounded-xl border shadow-sm">
							<div class="flex flex-wrap items-start gap-4 border-b px-4 py-4">
								<Avatar.Root class="size-12 shrink-0 border-2 border-background">
									{#if row.avatarUrl}
										<Avatar.Image src={row.avatarUrl} alt={row.name} />
									{/if}
									<Avatar.Fallback>{getInitials(row.name)}</Avatar.Fallback>
								</Avatar.Root>
								<div class="min-w-0 flex-1 space-y-1">
									<div class="flex flex-wrap items-center gap-2">
										<p class="text-base font-semibold leading-tight">{row.name}</p>
										<a
											href={resolve('/contacts/formateurs/[id]', { id: row.formateurId })}
											class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium underline-offset-4 hover:underline"
										>
											Fiche formateur
											<ExternalLink class="size-3" />
										</a>
									</div>
									{#if row.email}
										<a
											href="mailto:{row.email}"
											class="text-muted-foreground hover:text-foreground block truncate text-sm underline-offset-4 hover:underline"
										>
											{row.email}
										</a>
									{/if}
								</div>
								<div class="flex shrink-0 items-center gap-1">
									{#if row.email}
										<Button
											variant="ghost"
											size="icon"
											class="size-9 cursor-pointer"
											href="mailto:{row.email}"
											aria-label="Envoyer un e-mail"
										>
											<Mail class="size-4" />
										</Button>
									{/if}
									<Button
										variant="ghost"
										size="icon"
										class="text-destructive hover:text-destructive size-9 cursor-pointer"
										type="button"
										aria-label="Retirer le formateur"
										onclick={() => openRemove({ formateurId: row.formateurId, name: row.name })}
									>
										<Trash2 class="size-4" />
									</Button>
								</div>
							</div>

							{#if d}
								<div class="space-y-4 px-4 py-4">
									<div>
										<h4 class="mb-3 text-sm font-medium">Coûts</h4>
										<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
											<div class="space-y-1.5">
												<Label class="text-xs">TJM</Label>
												<form
													method="POST"
													action="?/updateFormateurCosts"
													use:enhance={enhanceCost()}
													class="space-y-1"
												>
													<input type="hidden" name="formateurId" value={row.formateurId} />
													<Input
														name="tjm"
														type="number"
														min="0"
														step="0.01"
														placeholder="TJM / jour"
														class="tabular-nums"
														bind:value={drafts[row.joinId].tjm}
														onblur={blurSubmit}
														onkeydown={(e) => {
															if (e.key === 'Enter') {
																e.preventDefault();
																(e.currentTarget.form as HTMLFormElement)?.requestSubmit();
															}
														}}
													/>
												</form>
											</div>
											<div class="space-y-1.5">
												<Label class="text-xs">Nb jours</Label>
												<form
													method="POST"
													action="?/updateFormateurCosts"
													use:enhance={enhanceCost()}
													class="space-y-1"
												>
													<input type="hidden" name="formateurId" value={row.formateurId} />
													<Input
														name="numberOfDays"
														type="number"
														min="0"
														step="0.5"
														placeholder="0"
														class="tabular-nums"
														bind:value={drafts[row.joinId].numberOfDays}
														onblur={blurSubmit}
														onkeydown={(e) => {
															if (e.key === 'Enter') {
																e.preventDefault();
																(e.currentTarget.form as HTMLFormElement)?.requestSubmit();
															}
														}}
													/>
												</form>
											</div>
											{#if travel}
												<div class="space-y-1.5">
													<Label class="text-xs">Déplacement</Label>
													<form
														method="POST"
														action="?/updateFormateurCosts"
														use:enhance={enhanceCost()}
														class="space-y-1"
													>
														<input type="hidden" name="formateurId" value={row.formateurId} />
														<Input
															name="deplacementCost"
															type="number"
															min="0"
															step="0.01"
															placeholder="0"
															class="tabular-nums"
															bind:value={drafts[row.joinId].deplacement}
															onblur={blurSubmit}
															onkeydown={(e) => {
																if (e.key === 'Enter') {
																	e.preventDefault();
																	(e.currentTarget.form as HTMLFormElement)?.requestSubmit();
																}
															}}
														/>
													</form>
												</div>
												<div class="space-y-1.5">
													<Label class="text-xs">Hébergement</Label>
													<form
														method="POST"
														action="?/updateFormateurCosts"
														use:enhance={enhanceCost()}
														class="space-y-1"
													>
														<input type="hidden" name="formateurId" value={row.formateurId} />
														<Input
															name="hebergementCost"
															type="number"
															min="0"
															step="0.01"
															placeholder="0"
															class="tabular-nums"
															bind:value={drafts[row.joinId].hebergement}
															onblur={blurSubmit}
															onkeydown={(e) => {
																if (e.key === 'Enter') {
																	e.preventDefault();
																	(e.currentTarget.form as HTMLFormElement)?.requestSubmit();
																}
															}}
														/>
													</form>
												</div>
											{/if}
										</div>
										<div
											class="bg-muted/40 mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm"
										>
											<span class="text-muted-foreground">
												Sous-total (TJM × jours) :
												<span class="text-foreground font-medium">{formatEuro(subtotalForDraft(d))}</span>
											</span>
											<span class="font-semibold">
												Total : {formatEuro(grandTotalForDraft(d, travel))}
											</span>
										</div>
									</div>

									<div>
										<h4 class="mb-2 flex items-center gap-2 text-sm font-medium">
											<Calendar class="size-4" />
											Séances assignées
										</h4>
										{#if row.mineSessions.length === 0}
											<p class="text-muted-foreground text-sm">Aucune séance pour ce formateur.</p>
										{:else}
											<ul class="space-y-2">
												{#each row.mineSessions as s (s.id)}
													<li
														class="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
													>
														<div class="min-w-0">
															<p class="font-medium leading-tight">
																{s.module?.name ?? 'Séance'}
															</p>
															<p class="text-muted-foreground text-xs">
																{formatSessionRange(s.startAt, s.endAt)}
															</p>
														</div>
														<form
															method="POST"
															action="?/removeFormateurFromSession"
															use:enhance={enhanceAction('Assignation retirée')}
															class="shrink-0"
														>
															<input type="hidden" name="sessionId" value={s.id} />
															<input type="hidden" name="formateurId" value={row.formateurId} />
															<Button
																type="submit"
																variant="ghost"
																size="sm"
																class="text-muted-foreground h-8 cursor-pointer gap-1 px-2"
																aria-label="Retirer de la séance"
															>
																<UserMinus class="size-3.5" />
																Retirer
															</Button>
														</form>
													</li>
												{/each}
											</ul>
										{/if}

										{#if unassignedSessionsList.length > 0}
											<div class="mt-3">
												<DropdownMenu.Root>
													<DropdownMenu.Trigger>
														{#snippet child({ props })}
															<Button
																{...props}
																type="button"
																variant="outline"
																size="sm"
																class="cursor-pointer gap-1"
															>
																Assigner à une séance
																<ChevronDown class="size-3.5 opacity-60" />
															</Button>
														{/snippet}
													</DropdownMenu.Trigger>
													<DropdownMenu.Content class="max-h-64 w-[min(100vw-2rem,320px)] overflow-y-auto" align="start">
														<DropdownMenu.Label class="text-xs">Séances sans formateur</DropdownMenu.Label>
														<DropdownMenu.Separator />
														{#each unassignedSessionsList as s (s.id)}
															<DropdownMenu.Item class="p-0">
																<form
																	method="POST"
																	action="?/assignFormateurToSession"
																	use:enhance={enhanceAction('Séance assignée')}
																	class="w-full"
																>
																	<input type="hidden" name="formateurId" value={row.formateurId} />
																	<input type="hidden" name="sessionId" value={s.id} />
																	<button
																		type="submit"
																		class="hover:bg-accent flex w-full flex-col gap-0.5 px-2 py-2 text-left text-sm"
																	>
																		<span class="font-medium">{s.module?.name ?? 'Séance'}</span>
																		<span class="text-muted-foreground text-xs">
																			{formatSessionRange(s.startAt, s.endAt)}
																		</span>
																	</button>
																</form>
															</DropdownMenu.Item>
														{/each}
													</DropdownMenu.Content>
												</DropdownMenu.Root>
											</div>
										{/if}
									</div>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>

<AlertDialog.Root bind:open={removeOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Retirer ce formateur ?</AlertDialog.Title>
			<AlertDialog.Description>
				{#if removeTarget}
					{removeTarget.name} sera retiré de cette formation. Les coûts associés seront supprimés.
				{/if}
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer class="gap-2 sm:gap-3">
			<AlertDialog.Cancel type="button" class="cursor-pointer">Annuler</AlertDialog.Cancel>
			{#if removeTarget}
				<form
					method="POST"
					action="?/removeFormateur"
					use:enhance={enhanceAction('Formateur retiré', () => {
						removeOpen = false;
						removeTarget = null;
					})}
					class="inline"
				>
					<input type="hidden" name="formateurId" value={removeTarget.formateurId} />
					<Button type="submit" variant="destructive" class="cursor-pointer">Retirer</Button>
				</form>
			{/if}
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
