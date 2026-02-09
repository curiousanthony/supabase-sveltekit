<script lang="ts">
	import type { LayoutProps } from './$types';
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import LayoutGrid from '@lucide/svelte/icons/layout-grid';
	import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';
	import GraduationCap from '@lucide/svelte/icons/graduation-cap';
	import Calendar from '@lucide/svelte/icons/calendar';

	let { data, children }: LayoutProps = $props();

	const formationId = $derived(data?.formation?.id ?? '');

	const basePath = $derived(`/formations/${formationId}`);
	const pathname = $derived(page?.url?.pathname ?? '');

	const isApercu = $derived(
		pathname === basePath || pathname === basePath + '/' || pathname === `/formations/${formationId}`
	);
	const isSuivi = $derived(pathname.endsWith('/suivi'));
	const isFormateurs = $derived(pathname.endsWith('/formateurs'));
	const isSeances = $derived(pathname.endsWith('/seances'));

	const tabClass = (active: boolean) =>
		cn(
			'flex items-center gap-2 rounded-t-md border-b-2 px-4 py-2 text-sm font-medium transition-colors',
			active
				? 'border-primary text-primary'
				: 'border-transparent text-muted-foreground hover:text-foreground'
		);
</script>

<div class="flex w-full flex-col gap-4">
	<nav class="flex h-fit w-full overflow-x-auto" aria-label="Formation sections">
		<div class="flex gap-1">
			<a href={basePath} class={tabClass(isApercu)} aria-current={isApercu ? 'page' : undefined}>
				<LayoutGrid class="size-4 shrink-0" />
				Aperçu
			</a>
			<a
				href={basePath + '/suivi'}
				class={tabClass(isSuivi)}
				aria-current={isSuivi ? 'page' : undefined}
			>
				<ClipboardCheck class="size-4 shrink-0" />
				Suivi
			</a>
			<a
				href={basePath + '/formateurs'}
				class={tabClass(isFormateurs)}
				aria-current={isFormateurs ? 'page' : undefined}
			>
				<GraduationCap class="size-4 shrink-0" />
				Formateurs
			</a>
			<a
				href={basePath + '/seances'}
				class={tabClass(isSeances)}
				aria-current={isSeances ? 'page' : undefined}
			>
				<Calendar class="size-4 shrink-0" />
				Séances
			</a>
		</div>
	</nav>
	{@render children()}
</div>
