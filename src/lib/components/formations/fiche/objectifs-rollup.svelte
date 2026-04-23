<script lang="ts">
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Target from '@lucide/svelte/icons/target';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';

	interface ModuleLite {
		id: string;
		name: string | null;
		objectifs: string | null;
		orderIndex: number | null;
	}

	interface Props {
		modules: ModuleLite[];
		programmeHref: string;
	}

	let { modules, programmeHref }: Props = $props();

	const withObjectifs = $derived(
		modules
			.filter((m) => m.objectifs != null && m.objectifs.trim().length > 0)
			.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
	);

	const preview = $derived(withObjectifs.slice(0, 3));
	const remainder = $derived(Math.max(0, withObjectifs.length - preview.length));

	function firstLine(text: string): string {
		const trimmed = text.trim().split(/\r?\n/)[0] ?? '';
		return trimmed.length > 140 ? trimmed.slice(0, 137) + '…' : trimmed;
	}
</script>

<div class="flex flex-col gap-3">
	<div class="flex items-center justify-between gap-2">
		<div class="flex items-center gap-2">
			<Target class="size-4 text-muted-foreground" />
			<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
				Objectifs pédagogiques
			</span>
			{#if withObjectifs.length > 0}
				<Badge variant="secondary" class="text-[10px]">
					{withObjectifs.length} défini{withObjectifs.length > 1 ? 's' : ''} dans le Programme
				</Badge>
			{/if}
		</div>
		<a
			href={programmeHref}
			class="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
		>
			Modifier dans Programme
			<ArrowRight class="size-3" />
		</a>
	</div>

	{#if modules.length === 0}
		<div class="rounded-md border border-dashed bg-muted/30 px-3 py-4 text-sm text-muted-foreground">
			Aucun module dans cette formation. Ajoutez vos modules dans l'onglet
			<a href={programmeHref} class="font-medium text-primary hover:underline">Programme</a>
			pour définir les objectifs pédagogiques.
		</div>
	{:else if withObjectifs.length === 0}
		<div class="rounded-md border border-dashed bg-muted/30 px-3 py-4 text-sm text-muted-foreground">
			Aucun objectif renseigné sur les modules. Les objectifs alimentent la convention et le
			programme PDF —
			<a href={programmeHref} class="font-medium text-primary hover:underline">
				ajoutez-les dans Programme
			</a>.
		</div>
	{:else}
		<ul class="flex flex-col gap-1.5 text-sm">
			{#each preview as m (m.id)}
				<li class="flex gap-2 text-muted-foreground">
					<span class="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/60"></span>
					<span class="text-foreground/90">
						{firstLine(m.objectifs ?? '')}
						{#if m.name}
							<span class="ml-1 text-xs text-muted-foreground">— {m.name}</span>
						{/if}
					</span>
				</li>
			{/each}
		</ul>
		{#if remainder > 0}
			<p class="text-xs text-muted-foreground">
				+{remainder} autre{remainder > 1 ? 's' : ''} objectif{remainder > 1 ? 's' : ''} —
				<a href={programmeHref} class="font-medium text-primary hover:underline">voir tout</a>
			</p>
		{/if}
	{/if}
</div>
