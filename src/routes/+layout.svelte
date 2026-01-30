<script lang="ts">
	import '../app.css';

	import type { LayoutProps } from './$types';

	import favicon from '$lib/assets/favicon.png';

	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data, children }: LayoutProps = $props();
	let { user, supabase } = $derived(data);

	onMount(() => {
		const { data } = supabase.auth.onAuthStateChange((_, newSession) => {
			if (newSession?.user?.id !== user?.id) {
				invalidate('supabase:auth');
			}
		});

		return () => data.subscription.unsubscribe();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
