<script lang="ts">
	import type { LayoutData } from './$types';
	import { page } from '$app/state';
	import { cn } from '$lib/utils';

	let { data, children }: { data: LayoutData; children: any } = $props();

	const pathname = $derived(page?.url?.pathname ?? '');
	const base = '/bibliotheque';
	const isModules = $derived(pathname.startsWith(base + '/modules') || pathname === base + '/modules');
	const isProgrammes = $derived(pathname.startsWith(base + '/programmes'));
</script>

<div class="space-y-6">
	<nav class="flex gap-2 border-b border-border pb-2" aria-label="Bibliothèque">
		<a
			href="/bibliotheque/modules"
			class={cn(
				'rounded-md px-4 py-2 text-sm font-medium transition-colors',
				isModules
					? 'bg-primary text-primary-foreground'
					: 'text-muted-foreground hover:bg-muted hover:text-foreground'
			)}
		>
			Modules
		</a>
		<a
			href="/bibliotheque/programmes"
			class={cn(
				'rounded-md px-4 py-2 text-sm font-medium transition-colors',
				isProgrammes
					? 'bg-primary text-primary-foreground'
					: 'text-muted-foreground hover:bg-muted hover:text-foreground'
			)}
		>
			Programmes de formation
		</a>
	</nav>
	{@render children()}
</div>
