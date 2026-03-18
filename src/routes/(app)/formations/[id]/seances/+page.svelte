<script lang="ts">
	import type { PageProps } from './$types';
	import * as Card from '$lib/components/ui/card/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { cn } from '$lib/utils';
	import { enhance } from '$app/forms';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Clock from '@lucide/svelte/icons/clock';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Plus from '@lucide/svelte/icons/plus';
	import FileSignature from '@lucide/svelte/icons/file-signature';
	import Check from '@lucide/svelte/icons/check';
	import User from '@lucide/svelte/icons/user';

	let { data }: PageProps = $props();

	const formation = $derived(data?.formation);
	const seances = $derived(formation?.seances ?? []);
	const apprenants = $derived(
		(formation?.formationApprenants ?? []).map((fa) => ({
			contactId: fa.contact.id,
			name: [fa.contact.firstName, fa.contact.lastName].filter(Boolean).join(' ') || 'Sans nom'
		}))
	);

	const todayStr = $derived(new Date().toISOString().slice(0, 10));

	function sessionStatus(startAt: string): 'past' | 'today' | 'future' {
		const dateKey = startAt.slice(0, 10);
		if (dateKey < todayStr) return 'past';
		if (dateKey === todayStr) return 'today';
		return 'future';
	}

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('fr-FR', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	function formatTime(iso: string) {
		return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
	}

	function durationHours(start: string, end: string) {
		const diff = (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60);
		return Math.round(diff * 10) / 10;
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h2 class="text-lg font-semibold flex items-center gap-2">
			<Calendar class="size-5" />
			Séances
			{#if seances.length > 0}
				<Badge variant="secondary" class="text-xs">{seances.length}</Badge>
			{/if}
		</h2>
	</div>

	{#if seances.length === 0}
		<Card.Root>
			<Card.Content class="py-12 text-center">
				<Calendar class="size-12 mx-auto text-muted-foreground/30 mb-3" />
				<p class="text-muted-foreground">Aucune séance planifiée pour cette formation.</p>
				<p class="text-sm text-muted-foreground mt-1">
					Créez des séances pour planifier les sessions de formation et suivre les émargements.
				</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="space-y-4">
			{#each seances as seance, i}
				{@const status = sessionStatus(seance.startAt)}
				{@const signed = seance.emargements?.filter((e) => e.signedAt).length ?? 0}
				{@const totalEmargements = seance.emargements?.length ?? 0}
				{@const allSigned = totalEmargements > 0 && signed === totalEmargements}
				<Card.Root
					class={cn(
						'transition-colors',
						status === 'today' && 'ring-2 ring-primary/30',
						status === 'past' && 'opacity-75'
					)}
				>
					<Card.Content class="pt-6">
						<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
							<div class="flex-1 space-y-2">
								<div class="flex items-center gap-2 flex-wrap">
									<h3 class="text-base font-semibold">{formatDate(seance.startAt)}</h3>
									<Badge
										variant={status === 'today' ? 'default' : 'outline'}
										class="text-xs"
									>
										{#if status === 'past'}Passée{:else if status === 'today'}Aujourd'hui{:else}À venir{/if}
									</Badge>
								</div>

								<div class="flex flex-wrap gap-4 text-sm text-muted-foreground">
									<span class="flex items-center gap-1.5">
										<Clock class="size-4 shrink-0" />
										{formatTime(seance.startAt)} – {formatTime(seance.endAt)}
										<span class="text-xs">({durationHours(seance.startAt, seance.endAt)}h)</span>
									</span>
									{#if seance.location}
										<span class="flex items-center gap-1.5">
											<MapPin class="size-4 shrink-0" />
											{seance.location}
										</span>
									{/if}
								</div>

								{#if seance.module}
									<p class="text-sm">
										<span class="font-medium">{seance.module.name}</span>
									</p>
								{/if}

								{#if seance.formateur?.user}
									<p class="text-sm flex items-center gap-1.5">
										<User class="size-4 text-muted-foreground shrink-0" />
										{seance.formateur.user.rawUserMetaData?.full_name ?? 'Formateur'}
									</p>
								{/if}
							</div>

							<!-- Émargement section -->
							<div class="sm:text-right space-y-2">
								<div class="flex items-center gap-2 sm:justify-end">
									<FileSignature class="size-4 text-muted-foreground" />
									<span class="text-sm font-medium">
										Émargement {signed}/{totalEmargements}
									</span>
									{#if allSigned && totalEmargements > 0}
										<Badge variant="default" class="text-xs">
											<Check class="size-3 mr-0.5" />Complet
										</Badge>
									{/if}
								</div>
								{#if totalEmargements > 0}
									<div class="flex gap-0.5 sm:justify-end">
										{#each Array(totalEmargements) as _, idx}
											<span
												class={cn(
													'h-2.5 w-3 rounded-sm',
													idx < signed ? 'bg-green-500' : 'bg-muted'
												)}
											></span>
										{/each}
									</div>
								{/if}
							</div>
						</div>

						<!-- Émargement detail per apprenant -->
						{#if totalEmargements > 0 && (status === 'today' || status === 'past')}
							<div class="mt-4 border-t pt-3">
								<p class="text-xs font-medium text-muted-foreground mb-2">Détail des émargements</p>
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
									{#each seance.emargements ?? [] as emargement}
										{@const apprenant = apprenants.find((a) => a.contactId === emargement.contactId)}
										<div class="flex items-center gap-2 text-sm rounded-md px-2 py-1.5 bg-muted/30">
											{#if emargement.signedAt}
												<Check class="size-3.5 text-green-500 shrink-0" />
											{:else}
												<div class="size-3.5 rounded-full border border-muted-foreground/30 shrink-0"></div>
											{/if}
											<span class={cn(!emargement.signedAt && 'text-muted-foreground')}>
												{apprenant?.name ?? 'Participant'}
											</span>
											{#if emargement.signedAt}
												<span class="text-xs text-muted-foreground ml-auto">
													{new Date(emargement.signedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
												</span>
											{/if}
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{/if}
</div>
