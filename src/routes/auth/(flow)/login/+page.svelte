<script lang="ts">
	import { page } from '$app/state';
	import LoginForm from '$lib/components/auth/login-form.svelte';
	import GalleryVerticalEndIcon from '@lucide/svelte/icons/gallery-vertical-end';
	import { appInfo } from '$lib/settings/config';
	import Logo from '$lib/components/ui/custom/brand/logo.svelte';
	const sessionError = $derived(page.url.searchParams.get('error') === 'session');
	const redirectTo = $derived(page.url.searchParams.get('redirectTo') ?? '');
</script>

<div class="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
	<div class="flex w-full max-w-sm flex-col gap-6">
		{#if sessionError}
			<p class="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
				Votre session a expiré ou une erreur s'est produite. Veuillez vous reconnecter.
			</p>
		{/if}
		<Logo />
		<!-- <a href="/" class="flex items-center gap-2 self-center font-medium">
			<div
				class="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground"
			>
				<GalleryVerticalEndIcon class="size-4" />
			</div>
			{appInfo.name}
		</a> -->
		<LoginForm {redirectTo} />
	</div>
</div>
