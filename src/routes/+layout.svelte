<script lang="ts">
	import '../app.css';

	import type { LayoutProps } from './$types';

	import favicon from '$lib/assets/favicon.png';

	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data, children }: LayoutProps = $props();
	let { session, supabase } = $derived(data);

	onMount(() => {
		const { data } = supabase.auth.onAuthStateChange((_, newSession) => {
			if (newSession?.expires_at !== session?.expires_at) {
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
