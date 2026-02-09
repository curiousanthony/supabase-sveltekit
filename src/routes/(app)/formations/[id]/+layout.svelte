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
	<nav
		class="sticky z-40 -mx-4 flex h-fit w-[calc(100%+2rem)] max-w-[calc(100%+2rem)] overflow-visible border-b bg-background px-4 before:absolute before:bottom-full before:left-0 before:right-0 before:z-0 before:block before:h-4 before:bg-background before:content-['']"
		style="top: calc(var(--header-height) + var(--spacing) * 4)"
		aria-label="Formation sections"
	>
		<div class="relative z-10 min-w-0 flex-1 overflow-x-auto">
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
		</div>
	</nav>
	{@render children()}
</div>
