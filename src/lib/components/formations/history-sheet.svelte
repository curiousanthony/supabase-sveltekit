<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import type { AuditLogEntry } from '$lib/formations/audit-activity';
	import {
		formatRelativeTimeFr,
		getAuditEventDescription,
		getAuditEventIcon
	} from '$lib/formations/audit-activity';

	let {
		open = $bindable(false),
		auditLog = []
	}: {
		open?: boolean;
		auditLog?: AuditLogEntry[];
	} = $props();

	function actorLabel(user: AuditLogEntry['user']): string {
		if (!user) return 'Système';
		const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
		if (name) return name;
		return user.email ?? 'Utilisateur';
	}

	function actorInitials(user: AuditLogEntry['user']): string {
		const label = actorLabel(user);
		if (label === 'Système') return 'SY';
		return label
			.split(/\s+/)
			.filter(Boolean)
			.map((p) => p[0])
			.join('')
			.slice(0, 2)
			.toUpperCase();
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="flex h-full min-h-0 w-full flex-col gap-0 p-0 sm:max-w-md">
		<Sheet.Header class="border-b px-4 py-4 text-left">
			<Sheet.Title>Historique</Sheet.Title>
			<Sheet.Description class="sr-only">
				Journal des modifications et activités sur cette formation.
			</Sheet.Description>
		</Sheet.Header>
		<div class="min-h-0 flex-1 overflow-y-auto px-4 py-4">
			{#if auditLog.length === 0}
				<p class="text-center text-sm text-muted-foreground">Aucune activité enregistrée</p>
			{:else}
				<ul class="relative space-y-0 border-l border-border pl-6">
					{#each auditLog as event (event.id)}
						{@const Icon = getAuditEventIcon(event.actionType)}
						<li class="relative pb-8 last:pb-0">
							<span
								class="absolute -left-[25px] flex size-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm"
								aria-hidden="true"
							>
								<Icon class="size-3.5 shrink-0" />
							</span>
							<div class="flex flex-col gap-1.5">
								<div class="flex items-center gap-2">
									<Avatar.Root class="size-6 shrink-0 border border-border">
										{#if event.user?.avatarUrl}
											<Avatar.Image src={event.user.avatarUrl} alt="" />
										{/if}
										<Avatar.Fallback class="text-[10px]">{actorInitials(event.user)}</Avatar.Fallback>
									</Avatar.Root>
									<span class="text-sm font-medium text-foreground">{actorLabel(event.user)}</span>
								</div>
								<p class="text-sm text-muted-foreground">{getAuditEventDescription(event)}</p>
								<p class="text-xs text-muted-foreground">{formatRelativeTimeFr(event.createdAt)}</p>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</Sheet.Content>
</Sheet.Root>
