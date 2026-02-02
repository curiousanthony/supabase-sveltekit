<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';

	interface Member {
		userId: string;
		role: string;
		roleLabel: string;
		email: string | null;
		firstName: string | null;
		lastName: string | null;
		avatarUrl: string | null;
	}

	let { data } = $props();

	const workspace = $derived(data?.workspace);
	const members = $derived((data?.members ?? []) as Member[]);
	const canManage = $derived(data?.canManage ?? false);

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
</script>

<svelte:head>
	<title>Paramètres de l'espace</title>
</svelte:head>

<div class="space-y-6">
	<Card.Root>
		<Card.Header>
			<Card.Title>Équipe</Card.Title>
			<Card.Description>
				{workspace?.name ?? 'Espace'} – {members.length} membre{members.length !== 1 ? 's' : ''}
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Membre</Table.Head>
						<Table.Head>Email</Table.Head>
						<Table.Head>Rôle</Table.Head>
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
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
			{#if canManage}
				<p class="mt-4 text-sm text-muted-foreground">Fonctionnalité d'invitation à venir.</p>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
