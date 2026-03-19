<script lang="ts">
	import type { PageProps } from './$types';
	import * as Card from '$lib/components/ui/card/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import * as Progress from '$lib/components/ui/progress/index.js';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import Users from '@lucide/svelte/icons/users';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import { tick } from 'svelte';

	let { data }: PageProps = $props();

	const formation = $derived(data?.formation);
	const availableContacts = $derived(data?.availableContacts ?? []);

	const futureSessions = $derived.by(() => {
		const now = Date.now();
		const list = formation?.seances ?? [];
		return list
			.filter((s) => new Date(s.startAt).getTime() > now)
			.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
	});

	type LearnerRow = {
		contactId: string;
		fullName: string;
		email: string | null;
		phone: string | null;
		company: string | null;
		signed: number;
		total: number;
		rate: number;
	};

	const learners = $derived.by((): LearnerRow[] => {
		const rows: LearnerRow[] = [];
		const seances = formation?.seances ?? [];
		for (const fa of formation?.formationApprenants ?? []) {
			const c = fa.contact;
			const contactId = c.id;
			let signed = 0;
			let total = 0;
			for (const s of seances) {
				const em = (s.emargements ?? []).find((e) => e.contactId === contactId);
				if (em) {
					total++;
					if (em.signedAt != null) signed++;
				}
			}
			const rate = total === 0 ? 0 : signed / total;
			const fullName =
				[c.firstName, c.lastName].filter(Boolean).join(' ') || 'Sans nom';
			rows.push({
				contactId,
				fullName,
				email: c.email,
				phone: c.phone,
				company: c.contactCompanies?.[0]?.company?.name ?? null,
				signed,
				total,
				rate
			});
		}
		return rows;
	});

	let addOpen = $state(false);
	let createOpen = $state(false);
	let removeOpen = $state(false);
	let contactSearch = $state('');
	let addStep = $state<1 | 2>(1);
	let pendingContactId = $state<string | null>(null);
	let sessionPick = $state<Record<string, boolean>>({});
	let removeTarget = $state<{ id: string; name: string } | null>(null);

	let createFirst = $state('');
	let createLast = $state('');
	let createEmail = $state('');
	let createPhone = $state('');
	let createSessionPick = $state<Record<string, boolean>>({});

	const filteredAvailable = $derived.by(() => {
		const q = contactSearch.trim().toLowerCase();
		if (!q) return availableContacts;
		return availableContacts.filter((c) => {
			const name = `${c.firstName ?? ''} ${c.lastName ?? ''}`.toLowerCase();
			const mail = (c.email ?? '').toLowerCase();
			const phone = (c.phone ?? '').toLowerCase();
			return name.includes(q) || mail.includes(q) || phone.includes(q);
		});
	});

	function initSessionPick(allTrue: boolean) {
		const next: Record<string, boolean> = {};
		for (const s of futureSessions) {
			next[s.id] = allTrue;
		}
		sessionPick = next;
	}

	function initCreateSessionPick() {
		const next: Record<string, boolean> = {};
		for (const s of futureSessions) {
			next[s.id] = true;
		}
		createSessionPick = next;
	}

	function resetAddDialog() {
		addStep = 1;
		contactSearch = '';
		pendingContactId = null;
		sessionPick = {};
	}

	function openAdd() {
		resetAddDialog();
		addOpen = true;
	}

	function sessionJsonFromPick(pick: Record<string, boolean>): string {
		return JSON.stringify(
			Object.entries(pick)
				.filter(([, on]) => on)
				.map(([id]) => id)
		);
	}

	function selectContactForAdd(contactId: string) {
		pendingContactId = contactId;
		if (futureSessions.length > 0) {
			initSessionPick(true);
			addStep = 2;
		} else {
			tick().then(() => {
				const el = document.getElementById(`add-learner-instant-${contactId}`) as HTMLFormElement | null;
				el?.requestSubmit();
			});
		}
	}

	function openCreateFromAdd() {
		addOpen = false;
		resetAddDialog();
		createFirst = '';
		createLast = '';
		createEmail = '';
		createPhone = '';
		initCreateSessionPick();
		createOpen = true;
	}

	function formatSessionRange(startAt: string, endAt: string) {
		const opts: Intl.DateTimeFormatOptions = {
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

	function enhanceSuccess(close: () => void) {
		return () => {
			return async ({
				result,
				update
			}: {
				result: { type: string; data?: { message?: string } };
				update: () => Promise<void>;
			}) => {
				if (result.type === 'success') {
					close();
					toast.success('Enregistré');
					await invalidateAll();
				} else if (result.type === 'failure') {
					toast.error(result.data?.message ?? 'Une erreur est survenue');
				}
				await update();
			};
		};
	}
</script>

<div class="space-y-6">
	<Card.Root>
		<Card.Header class="flex flex-row flex-wrap items-center justify-between gap-3">
			<Card.Title class="flex items-center gap-2">
				<Users class="size-5" />
				Apprenants
				{#if learners.length > 0}
					<Badge variant="secondary" class="text-xs">{learners.length}</Badge>
				{/if}
			</Card.Title>
			<Button variant="default" size="sm" class="cursor-pointer" onclick={openAdd}>
				<UserPlus class="size-4 mr-1.5" />
				Ajouter
			</Button>
		</Card.Header>
		<Card.Content>
			{#if learners.length === 0}
				<div class="py-8 text-center">
					<Users class="size-12 mx-auto text-muted-foreground/30 mb-3" />
					<p class="text-muted-foreground">Aucun apprenant inscrit à cette formation.</p>
					<Button variant="outline" size="sm" class="mt-4 cursor-pointer" onclick={openAdd}>
						<UserPlus class="size-4 mr-1.5" />
						Ajouter un apprenant
					</Button>
				</div>
			{:else}
				<div class="space-y-3">
					{#each learners as learner (learner.contactId)}
						<div
							class="flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
						>
							<div class="min-w-0 flex-1 space-y-1">
								<div class="flex flex-wrap items-center gap-2">
									<a
										href="/contacts/{learner.contactId}"
										class="font-medium text-foreground hover:underline"
									>
										{learner.fullName}
									</a>
									<Button
										variant="ghost"
										size="icon"
										class="size-8 shrink-0 text-destructive hover:text-destructive"
										aria-label="Retirer l'apprenant"
										onclick={() => {
											removeTarget = { id: learner.contactId, name: learner.fullName };
											removeOpen = true;
										}}
									>
										<Trash2 class="size-4" />
									</Button>
								</div>
								{#if learner.email}
									<p class="text-sm text-muted-foreground break-all">{learner.email}</p>
								{/if}
								{#if learner.company}
									<p class="text-sm text-muted-foreground">{learner.company}</p>
								{/if}
							</div>
							<div class="w-full shrink-0 space-y-1.5 sm:max-w-[240px]">
								<div class="flex justify-between text-xs text-muted-foreground">
									<span>Présence</span>
									<span>
										{learner.signed}/{learner.total}
										{#if learner.total > 0}
											({Math.round(learner.rate * 100)}%)
										{/if}
									</span>
								</div>
								<Progress.Root
									value={learner.total === 0 ? 0 : Math.round(learner.rate * 100)}
									max={100}
									class="h-2"
								/>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>

<!-- Hidden instant-add forms (no future sessions) -->
{#each availableContacts as c (c.id)}
	{#if futureSessions.length === 0}
		<form
			id="add-learner-instant-{c.id}"
			method="POST"
			action="?/addLearner"
			use:enhance={enhanceSuccess(() => {
				addOpen = false;
			})}
			class="hidden"
		>
			<input type="hidden" name="contactId" value={c.id} />
			<input type="hidden" name="futureSessions" value="[]" />
		</form>
	{/if}
{/each}

<Dialog.Root
	bind:open={addOpen}
	onOpenChange={(o) => {
		if (!o) resetAddDialog();
	}}
>
	<Dialog.Content class="sm:max-w-lg">
		{#if addStep === 1}
			<Dialog.Header>
				<Dialog.Title>Ajouter un apprenant</Dialog.Title>
				<Dialog.Description>
					Choisissez un contact du workspace ou créez-en un nouveau.
				</Dialog.Description>
			</Dialog.Header>
			<Command.Root shouldFilter={false} class="rounded-lg border">
				<Command.Input placeholder="Rechercher un contact…" bind:value={contactSearch} />
				<Command.List class="max-h-64">
					<Command.Empty>Aucun contact disponible.</Command.Empty>
					{#each filteredAvailable as c (c.id)}
						<Command.Item
							value={c.id}
							class="cursor-pointer"
							onSelect={() => selectContactForAdd(c.id)}
						>
							<div class="flex flex-col gap-0.5">
								<span class="font-medium">
									{[c.firstName, c.lastName].filter(Boolean).join(' ') || 'Sans nom'}
								</span>
								{#if c.email}
									<span class="text-xs text-muted-foreground">{c.email}</span>
								{/if}
							</div>
						</Command.Item>
					{/each}
				</Command.List>
			</Command.Root>
			<div class="border-t pt-3">
				<Button variant="outline" class="w-full cursor-pointer" type="button" onclick={openCreateFromAdd}>
					Créer un nouveau contact
				</Button>
			</div>
			<Dialog.Footer>
				<Button variant="outline" type="button" class="cursor-pointer" onclick={() => (addOpen = false)}>
					Fermer
				</Button>
			</Dialog.Footer>
		{:else}
			<Dialog.Header>
				<Dialog.Title>Ajouter aux séances à venir ?</Dialog.Title>
				<Dialog.Description>
					Des émargements seront créés pour les séances cochées. Vous pourrez les modifier plus tard.
				</Dialog.Description>
			</Dialog.Header>
			<form
				method="POST"
				action="?/addLearner"
				use:enhance={enhanceSuccess(() => {
					addOpen = false;
				})}
				class="space-y-4"
			>
				<input type="hidden" name="contactId" value={pendingContactId ?? ''} />
				<input type="hidden" name="futureSessions" value={sessionJsonFromPick(sessionPick)} />
				<div class="max-h-56 space-y-3 overflow-y-auto pr-1">
					{#each futureSessions as s (s.id)}
						<label class="flex cursor-pointer items-start gap-3 rounded-md border p-3">
							<Checkbox
								checked={sessionPick[s.id] ?? false}
								onCheckedChange={(v) => {
									sessionPick = { ...sessionPick, [s.id]: v === true };
								}}
								class="mt-0.5"
							/>
							<span class="text-sm leading-snug">
								{formatSessionRange(s.startAt, s.endAt)}
							</span>
						</label>
					{/each}
				</div>
				<Dialog.Footer class="flex-col gap-2 sm:flex-row sm:justify-between">
					<Button
						variant="ghost"
						type="button"
						class="cursor-pointer"
						onclick={() => {
							addStep = 1;
							pendingContactId = null;
						}}
					>
						<ChevronLeft class="size-4 mr-1" />
						Retour
					</Button>
					<Button type="submit" class="cursor-pointer">Confirmer</Button>
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root
	bind:open={createOpen}
	onOpenChange={(o) => {
		if (!o) {
			createFirst = '';
			createLast = '';
			createEmail = '';
			createPhone = '';
		}
	}}
>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Nouveau contact</Dialog.Title>
			<Dialog.Description>
				Le contact sera créé et ajouté à cette formation.
			</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/createContact"
			use:enhance={enhanceSuccess(() => {
				createOpen = false;
			})}
			class="space-y-4"
		>
			<input type="hidden" name="futureSessions" value={sessionJsonFromPick(createSessionPick)} />
			<div class="grid gap-2">
				<Label for="create-first">Prénom *</Label>
				<Input id="create-first" name="firstName" bind:value={createFirst} required autocomplete="given-name" />
			</div>
			<div class="grid gap-2">
				<Label for="create-last">Nom *</Label>
				<Input id="create-last" name="lastName" bind:value={createLast} required autocomplete="family-name" />
			</div>
			<div class="grid gap-2">
				<Label for="create-email">Email</Label>
				<Input
					id="create-email"
					name="email"
					type="email"
					bind:value={createEmail}
					autocomplete="email"
				/>
			</div>
			<div class="grid gap-2">
				<Label for="create-phone">Téléphone</Label>
				<Input id="create-phone" name="phone" type="tel" bind:value={createPhone} autocomplete="tel" />
			</div>
			{#if futureSessions.length > 0}
				<div class="space-y-2">
					<p class="text-sm font-medium">Séances à venir</p>
					<p class="text-xs text-muted-foreground">
						Cochez les séances pour lesquelles créer un émargement.
					</p>
					<div class="max-h-40 space-y-2 overflow-y-auto">
						{#each futureSessions as s (s.id)}
							<label class="flex cursor-pointer items-start gap-3 rounded-md border p-2">
								<Checkbox
									checked={createSessionPick[s.id] ?? false}
									onCheckedChange={(v) => {
										createSessionPick = { ...createSessionPick, [s.id]: v === true };
									}}
									class="mt-0.5"
								/>
								<span class="text-xs leading-snug">
									{formatSessionRange(s.startAt, s.endAt)}
								</span>
							</label>
						{/each}
					</div>
				</div>
			{/if}
			<Dialog.Footer>
				<Button
					variant="outline"
					type="button"
					class="cursor-pointer"
					onclick={() => (createOpen = false)}
				>
					Annuler
				</Button>
				<Button type="submit" class="cursor-pointer">Créer et ajouter</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<AlertDialog.Root bind:open={removeOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Retirer cet apprenant ?</AlertDialog.Title>
			<AlertDialog.Description>
				{#if removeTarget}
					Retirer <strong>{removeTarget.name}</strong> de cette formation ? Ses émargements passés seront
					conservés.
				{/if}
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel class="cursor-pointer">Annuler</AlertDialog.Cancel>
			<form
				method="POST"
				action="?/removeLearner"
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === 'success') {
							removeOpen = false;
							removeTarget = null;
							toast.success('Apprenant retiré');
							await invalidateAll();
						} else if (result.type === 'failure') {
							toast.error(
								(result as { data?: { message?: string } }).data?.message ??
									"Impossible de retirer l'apprenant"
							);
						}
						await update();
					};
				}}
			>
				{#if removeTarget}
					<input type="hidden" name="contactId" value={removeTarget.id} />
				{/if}
				<Button type="submit" variant="destructive" class="cursor-pointer">Retirer</Button>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
