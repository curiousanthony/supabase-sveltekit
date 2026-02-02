<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Button from '$lib/components/ui/button/index.js';
	import * as Input from '$lib/components/ui/input/index.js';
	import * as Label from '$lib/components/ui/label/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { ROLE_LABELS } from '$lib/i18n/roles';
	import type { WorkspaceRole } from '$lib/i18n/roles';
	import TrashIcon from '@tabler/icons-svelte/icons/trash';
	import UploadIcon from '@tabler/icons-svelte/icons/upload';
	import XIcon from '@tabler/icons-svelte/icons/x';
	import UserPlusIcon from '@tabler/icons-svelte/icons/user-plus';
	import EyeIcon from '@tabler/icons-svelte/icons/eye';

	interface Member {
		userId: string;
		role: string;
		roleLabel: string;
		email: string | null;
		firstName: string | null;
		lastName: string | null;
		avatarUrl: string | null;
	}

	interface PendingInvite {
		id: string;
		email: string;
		role: string;
		roleLabel: string;
		expiresAt: string;
		createdAt: string;
	}

	let { data } = $props();

	const workspace = $derived(data?.workspace);
	const members = $derived((data?.members ?? []) as Member[]);
	const pendingInvites = $derived((data?.pendingInvites ?? []) as PendingInvite[]);
	const canManage = $derived(data?.canManage ?? false);
	const isOwner = $derived(data?.role === 'owner');

	let inviteDialogOpen = $state(false);
	let inviteEmail = $state('');
	let inviteRole = $state<WorkspaceRole>('sales');
	let inviteSubmitting = $state(false);

	let roleChangeDialogOpen = $state(false);
	let roleChangeUserId = $state<string | null>(null);
	let roleChangeNewRole = $state<WorkspaceRole>('sales');
	let roleChangeSubmitting = $state(false);

	let removeMemberDialogOpen = $state(false);
	let removeMemberUserId = $state<string | null>(null);
	let removeMemberSubmitting = $state(false);

	let logoUploading = $state(false);
	let logoFileInput: HTMLInputElement | null = $state(null);

	function getInitials(m: Member) {
		const first = m.firstName?.charAt(0) ?? '';
		const last = m.lastName?.charAt(0) ?? '';
		if (first || last) return (first + last).toUpperCase();
		return m.email?.charAt(0)?.toUpperCase() ?? '?';
	}

	function getDisplayName(m: Member) {
		if (m.firstName || m.lastName) {
			return [m.firstName, m.lastName].filter(Boolean).join(' ');
		}
		return m.email ?? 'Utilisateur';
	}

	async function handleLogoUpload() {
		const file = logoFileInput?.files?.[0];
		if (!file) return;

		logoUploading = true;
		try {
			const formData = new FormData();
			formData.append('file', file);

			const res = await fetch('/parametres/workspace/upload-logo', {
				method: 'POST',
				body: formData
			});

			if (res.ok) {
				await invalidateAll();
			} else {
				const error = await res.json();
				alert(error.message || 'Erreur lors du téléversement');
			}
		} catch (e) {
			console.error('Upload error:', e);
			alert('Erreur lors du téléversement');
		} finally {
			logoUploading = false;
			if (logoFileInput) logoFileInput.value = '';
		}
	}

	async function handleLogoRemove() {
		if (!confirm('Supprimer le logo ?')) return;

		try {
			const res = await fetch('/parametres/workspace/upload-logo', {
				method: 'DELETE'
			});

			if (res.ok) {
				await invalidateAll();
			}
		} catch (e) {
			console.error('Remove error:', e);
			alert('Erreur lors de la suppression');
		}
	}

	function openRoleChangeDialog(member: Member) {
		roleChangeUserId = member.userId;
		roleChangeNewRole = member.role as WorkspaceRole;
		roleChangeDialogOpen = true;
	}

	function openRemoveMemberDialog(member: Member) {
		removeMemberUserId = member.userId;
		removeMemberDialogOpen = true;
	}

	async function handleSeeAs(member: Member) {
		if (!workspace?.id) return;
		// Set cookie with see_as data
		const cookieValue = JSON.stringify({ workspaceId: workspace.id, userId: member.userId, role: member.role });
		document.cookie = `see_as=${encodeURIComponent(cookieValue)}; path=/; max-age=86400`; // 24h
		await invalidateAll();
		window.location.reload();
	}
</script>

<svelte:head>
	<title>Paramètres de l'espace</title>
</svelte:head>

<div class="space-y-6">
	<Tabs.Root value="general" class="w-full">
		<Tabs.List>
			<Tabs.Trigger value="general">Général</Tabs.Trigger>
			<Tabs.Trigger value="team">Équipe</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="general">
			<Card.Root>
				<Card.Header>
					<Card.Title>Informations générales</Card.Title>
					<Card.Description>Gérez les informations de votre centre de formation</Card.Description>
				</Card.Header>
				<Card.Content>
					<form
						method="POST"
						action="?/saveSettings"
						use:enhance={() => {
							return async ({ update }) => {
								await update();
								await invalidateAll();
							};
						}}
						class="space-y-6"
					>
						<div class="space-y-2">
							<Label.Root for="name">Nom de l'espace</Label.Root>
							<Input.Root
								id="name"
								name="name"
								type="text"
								value={workspace?.name ?? ''}
								placeholder="Mon espace de travail"
							/>
						</div>

						<div class="space-y-2">
							<Label.Root for="legalName">Nom légal (Raison sociale)</Label.Root>
							<Input.Root
								id="legalName"
								name="legalName"
								type="text"
								value={workspace?.legalName ?? ''}
								placeholder="Nom officiel du centre de formation"
							/>
						</div>

						<div class="space-y-2">
							<Label.Root for="siret">SIRET</Label.Root>
							<Input.Root
								id="siret"
								name="siret"
								type="text"
								value={workspace?.siret ?? ''}
								placeholder="12345678901234"
								maxlength="14"
							/>
						</div>

						<div class="space-y-2">
							<Label.Root>Logo</Label.Root>
							<div class="flex items-center gap-4">
								{#if workspace?.logoUrl}
									<div class="relative">
										<img src={workspace.logoUrl} alt="Logo" class="size-24 rounded-lg object-cover" />
										<Button.Root
											type="button"
											variant="destructive"
											size="sm"
											class="absolute -right-2 -top-2 size-6 rounded-full p-0"
											onclick={handleLogoRemove}
										>
											<XIcon class="size-3" />
										</Button.Root>
									</div>
								{:else}
									<div class="flex size-24 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25">
										<span class="text-xs text-muted-foreground">Aucun logo</span>
									</div>
								{/if}
								<div class="flex flex-col gap-2">
									<input
										bind:this={logoFileInput}
										type="file"
										accept="image/jpeg,image/png,image/webp,image/svg+xml"
										class="hidden"
										onchange={handleLogoUpload}
									/>
									<Button.Root
										type="button"
										variant="outline"
										size="sm"
										disabled={logoUploading}
										onclick={() => logoFileInput?.click()}
									>
										<UploadIcon class="size-4" />
										{logoUploading ? 'Téléversement...' : workspace?.logoUrl ? 'Remplacer' : 'Téléverser'}
									</Button.Root>
									<p class="text-xs text-muted-foreground">JPEG, PNG, WebP ou SVG (max 5MB)</p>
								</div>
							</div>
						</div>

						{#if canManage}
							<Button.Root type="submit">Enregistrer</Button.Root>
						{/if}
					</form>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="team">
			<Card.Root>
				<Card.Header>
					<Card.Title>Équipe</Card.Title>
					<Card.Description>
						{workspace?.name ?? 'Espace'} – {members.length} membre{members.length !== 1 ? 's' : ''}
					</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-6">
					{#if canManage}
						<div class="flex items-center justify-between">
							<div>
								<h3 class="font-medium">Invitations en attente</h3>
								<p class="text-sm text-muted-foreground">
									{pendingInvites.length} invitation{pendingInvites.length !== 1 ? 's' : ''} en attente
								</p>
							</div>
							<Button.Root onclick={() => (inviteDialogOpen = true)}>
								<UserPlusIcon class="size-4" />
								Inviter un membre
							</Button.Root>
						</div>

						{#if pendingInvites.length > 0}
							<div class="rounded-lg border">
								<Table.Root>
									<Table.Header>
										<Table.Row>
											<Table.Head>Email</Table.Head>
											<Table.Head>Rôle</Table.Head>
											<Table.Head>Expire le</Table.Head>
											<Table.Head class="text-right">Actions</Table.Head>
										</Table.Row>
									</Table.Header>
									<Table.Body>
										{#each pendingInvites as invite (invite.id)}
											<Table.Row>
												<Table.Cell>{invite.email}</Table.Cell>
												<Table.Cell>{invite.roleLabel}</Table.Cell>
												<Table.Cell>
													{new Date(invite.expiresAt).toLocaleDateString('fr-FR')}
												</Table.Cell>
												<Table.Cell class="text-right">
													<form
														method="POST"
														action="?/cancelInvite"
														use:enhance={() => {
															return async ({ update }) => {
																await update();
																await invalidateAll();
															};
														}}
													>
														<input type="hidden" name="inviteId" value={invite.id} />
														<Button.Root type="submit" variant="ghost" size="sm">
															<XIcon class="size-4" />
														</Button.Root>
													</form>
												</Table.Cell>
											</Table.Row>
										{/each}
									</Table.Body>
								</Table.Root>
							</div>
						{/if}
					{/if}

					<div>
						<h3 class="mb-4 font-medium">Membres</h3>
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>Membre</Table.Head>
									<Table.Head>Email</Table.Head>
									<Table.Head>Rôle</Table.Head>
									{#if canManage}
										<Table.Head class="text-right">Actions</Table.Head>
									{/if}
									{#if isOwner}
										<Table.Head class="text-right">Voir en tant que</Table.Head>
									{/if}
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each members as member (member.userId)}
									<Table.Row>
										<Table.Cell>
											<div class="flex items-center gap-2">
												<Avatar.Root class="size-8">
													<Avatar.Image src={member.avatarUrl ?? undefined} alt={getDisplayName(member)} />
													<Avatar.Fallback>{getInitials(member)}</Avatar.Fallback>
												</Avatar.Root>
												<span>{getDisplayName(member)}</span>
											</div>
										</Table.Cell>
										<Table.Cell class="text-muted-foreground">{member.email ?? '—'}</Table.Cell>
										<Table.Cell>{member.roleLabel}</Table.Cell>
										{#if canManage}
											<Table.Cell class="text-right">
												<div class="flex items-center justify-end gap-2">
													<Button.Root
														variant="ghost"
														size="sm"
														onclick={() => openRoleChangeDialog(member)}
													>
														Modifier le rôle
													</Button.Root>
													{#if member.userId !== data?.userId}
														<Button.Root
															variant="ghost"
															size="sm"
															onclick={() => openRemoveMemberDialog(member)}
														>
															<TrashIcon class="size-4" />
														</Button.Root>
													{/if}
												</div>
											</Table.Cell>
										{/if}
										{#if isOwner}
											<Table.Cell class="text-right">
												{#if member.userId !== data?.userId}
													<Button.Root variant="ghost" size="sm" onclick={() => handleSeeAs(member)}>
														<EyeIcon class="size-4" />
														Voir en tant que
													</Button.Root>
												{/if}
											</Table.Cell>
										{/if}
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>
	</Tabs.Root>
</div>

<!-- Invite Dialog -->
<Dialog.Root bind:open={inviteDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Inviter un membre</Dialog.Title>
			<Dialog.Description>Envoyez une invitation par email pour ajouter un membre à l'équipe</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/createInvite"
			use:enhance={() => {
				return async ({ update }) => {
					await update();
					inviteDialogOpen = false;
					inviteEmail = '';
					inviteRole = 'sales';
					await invalidateAll();
				};
			}}
			class="space-y-4"
		>
			<div class="space-y-2">
				<Label.Root for="invite-email">Email</Label.Root>
				<Input.Root
					id="invite-email"
					name="email"
					type="email"
					bind:value={inviteEmail}
					required
					placeholder="membre@example.com"
				/>
			</div>
			<div class="space-y-2">
				<Label.Root for="invite-role">Rôle</Label.Root>
				<Select.Root
					selected={{ value: inviteRole, label: ROLE_LABELS[inviteRole] }}
					onSelectedChange={(selected) => {
						if (selected) inviteRole = selected.value as WorkspaceRole;
					}}
				>
					<Select.Trigger id="invite-role">
						<Select.Value placeholder="Sélectionner un rôle" />
					</Select.Trigger>
					<Select.Content>
						{#each Object.entries(ROLE_LABELS) as [role, label]}
							<Select.Item value={role}>{label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
				<input type="hidden" name="role" value={inviteRole} />
			</div>
			<Dialog.Footer>
				<Button.Root type="button" variant="outline" onclick={() => (inviteDialogOpen = false)}>
					Annuler
				</Button.Root>
				<Button.Root type="submit" disabled={inviteSubmitting}>
					Envoyer l'invitation
				</Button.Root>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Change Role Dialog -->
<Dialog.Root bind:open={roleChangeDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Modifier le rôle</Dialog.Title>
			<Dialog.Description>Changer le rôle de ce membre dans l'espace</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/changeRole"
			use:enhance={() => {
				return async ({ update }) => {
					await update();
					roleChangeDialogOpen = false;
					await invalidateAll();
				};
			}}
			class="space-y-4"
		>
			<input type="hidden" name="userId" value={roleChangeUserId ?? ''} />
			<div class="space-y-2">
				<Label.Root for="role-change">Rôle</Label.Root>
				<Select.Root
					selected={{ value: roleChangeNewRole, label: ROLE_LABELS[roleChangeNewRole] }}
					onSelectedChange={(selected) => {
						if (selected) roleChangeNewRole = selected.value as WorkspaceRole;
					}}
				>
					<Select.Trigger id="role-change">
						<Select.Value placeholder="Sélectionner un rôle" />
					</Select.Trigger>
					<Select.Content>
						{#each Object.entries(ROLE_LABELS) as [role, label]}
							<Select.Item value={role}>{label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
				<input type="hidden" name="role" value={roleChangeNewRole} />
			</div>
			<Dialog.Footer>
				<Button.Root type="button" variant="outline" onclick={() => (roleChangeDialogOpen = false)}>
					Annuler
				</Button.Root>
				<Button.Root type="submit" disabled={roleChangeSubmitting}>
					Enregistrer
				</Button.Root>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Remove Member Dialog -->
<Dialog.Root bind:open={removeMemberDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Retirer le membre</Dialog.Title>
			<Dialog.Description>
				Êtes-vous sûr de vouloir retirer ce membre de l'espace ? Cette action est irréversible.
			</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/removeMember"
			use:enhance={() => {
				return async ({ update }) => {
					await update();
					removeMemberDialogOpen = false;
					await invalidateAll();
				};
			}}
		>
			<input type="hidden" name="userId" value={removeMemberUserId ?? ''} />
			<Dialog.Footer>
				<Button.Root type="button" variant="outline" onclick={() => (removeMemberDialogOpen = false)}>
					Annuler
				</Button.Root>
				<Button.Root type="submit" variant="destructive" disabled={removeMemberSubmitting}>
					Retirer
				</Button.Root>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
