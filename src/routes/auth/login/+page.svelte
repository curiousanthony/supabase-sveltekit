<script>
	import Button from '$lib/components/ui/button/button.svelte';
	import CardContent from '$lib/components/ui/card/card-content.svelte';
	import CardHeader from '$lib/components/ui/card/card-header.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
</script>

<Card>
	<CardHeader>Login to the site!</CardHeader>
	<CardContent>
		<Button href="/auth/login/github">Sign in with GitHub</Button>
	</CardContent>
</Card>
