<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import Button from '$lib/components/ui/button/button.svelte';
	import CardContent from '$lib/components/ui/card/card-content.svelte';
	import CardHeader from '$lib/components/ui/card/card-header.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';

	const { data } = $props();
	const { user } = $derived(data);

	//const { userProfile } = $derived(data);

	// $inspect(data.user);
	// $inspect(user);

	// let firstName = $state('');
	// let lastName = $state('');
	// let email = $state('');

	// $effect(() => {
	// 	if (userProfile) {
	// 		firstName = userProfile.firstName;
	// 		lastName = userProfile.lastName;
	// 		email = userProfile.email;
	// 	}
	// });
</script>

{#if user}
	<!-- <span>You are logged in {user.user_metadata.name}!</span> -->
	<h3>User data: {JSON.stringify(user, null, 2)}</h3>
	<Card>
		<CardHeader>
			<h1 class="text-2xl font-bold">Hello</h1>
		</CardHeader>
		<CardContent>
			<p class="text-muted-foreground">You are logged in!</p>
		</CardContent>
	</Card>

	<!-- <Card>
		<CardHeader>
			<h3>Manage your profile</h3>
		</CardHeader>
		<CardContent>
			<form
				method="post"
				use:enhance={({ formData }) => {
					formData.set('firstName', firstName);
					formData.set('lastName', lastName);
					formData.set('email', email);
					// ^ Before submit
					// ↓ After submit
					return ({ result }) => {
						if (result.type === 'success') {
							invalidate('/');
							alert('UPDATED!');
							// console.log(result.data)
						} else {
							alert('ERROR!');
						}
					};
				}}
			>
				<div>
					<Label for="first_name">First Name</Label>
					<Input type="text" name="first_name" id="first_name" bind:value={firstName} />
				</div>
				<div>
					<Label for="last_name">First Name</Label>
					<Input type="text" name="last_name" id="last_name" bind:value={lastName} />
				</div>
				<div>
					<Label for="email">Email</Label>
					<Input type="text" name="email" id="email" bind:value={email} />
				</div>
				<Button type="submit">Submit</Button>
			</form>
		</CardContent>
	</Card> -->

	<Card>
		<CardHeader>
			<h3>Logout</h3>
		</CardHeader>
		<CardContent>
			<Button href="/auth/logout">Logout</Button>
		</CardContent>
	</Card>
{:else}
	<Button href="/auth/login">Login to the site</Button>
{/if}
