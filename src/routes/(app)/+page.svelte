<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import Button from '$lib/components/ui/button/button.svelte';
	import CardContent from '$lib/components/ui/card/card-content.svelte';
	import CardHeader from '$lib/components/ui/card/card-header.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';

	const { data } = $props();
	const { user, pageName } = $derived(data);

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

	const debug = false;
</script>

<svelte:head>
	<title>{pageName}</title>
</svelte:head>

{#if user}
	<!-- <span>You are logged in {user.user_metadata.name}!</span> -->
	<!-- <Button href="/dashboard">Tableau de bord</Button>
	<Button href="/auth/login">Connexion</Button> -->
	<Button href="/playground/crud">Playground CRUD</Button>

	<Card>
		<CardHeader>
			<h1 class="text-2xl font-bold">Hello {user.user_metadata.name}</h1>
		</CardHeader>
		<CardContent>
			{#if user.user_metadata.avatar_url}
				<Avatar.Root>
					<Avatar.Image src={user.user_metadata.avatar_url} alt="Profile image" />
					<Avatar.Fallback>N/A</Avatar.Fallback>
				</Avatar.Root>
			{/if}
			<p class="text-muted-foreground">
				You are logged in with <span class="font-semibold capitalize"
					>{user.app_metadata.provider}</span
				>
				as
				<span>{user.email}</span>
			</p>
			<Button href="/auth/logout" class="mt-4" variant="secondary">Se déconnecter</Button>
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

	{#if debug}
		<pre>auth/index.ts → User data ↓
{JSON.stringify(user, null, 2)}
		</pre>
	{/if}

	<!-- User data: { "id": "0b774ea9-3293-4828-988d-2f03e01cb8c2", "aud": "authenticated", "role": "authenticated", "email": "anthonyrussoformations@gmail.com", "email_confirmed_at": "2025-10-21T17:36:05.026011Z", "phone": "", "confirmed_at": "2025-10-21T17:36:05.026011Z", "last_sign_in_at": "2025-10-22T07:56:04.270892Z", "app_metadata": { "provider": "google", "providers": [ "google" ] }, "user_metadata": { "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKwatAq-JEW8EgHGnyjk9tMI7r_09lUAn68stGa3oGVj7QTnm8=s96-c", "email": "anthonyrussoformations@gmail.com", "email_verified": true, "full_name": "Anthony Russo", "iss": "https://accounts.google.com", "name": "Anthony Russo", "phone_verified": false, "picture": "https://lh3.googleusercontent.com/a/ACg8ocKwatAq-JEW8EgHGnyjk9tMI7r_09lUAn68stGa3oGVj7QTnm8=s96-c", "provider_id": "100916954159363465082", "sub": "100916954159363465082" }, "identities": [ { "identity_id": "1a1773e7-75d2-419a-bd42-f3403fec88c0", "id": "100916954159363465082", "user_id": "0b774ea9-3293-4828-988d-2f03e01cb8c2", "identity_data": { "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKwatAq-JEW8EgHGnyjk9tMI7r_09lUAn68stGa3oGVj7QTnm8=s96-c", "email": "anthonyrussoformations@gmail.com", "email_verified": true, "full_name": "Anthony Russo", "iss": "https://accounts.google.com", "name": "Anthony Russo", "phone_verified": false, "picture": "https://lh3.googleusercontent.com/a/ACg8ocKwatAq-JEW8EgHGnyjk9tMI7r_09lUAn68stGa3oGVj7QTnm8=s96-c", "provider_id": "100916954159363465082", "sub": "100916954159363465082" }, "provider": "google", "last_sign_in_at": "2025-10-21T17:36:04.999462Z", "created_at": "2025-10-21T17:36:04.999524Z", "updated_at": "2025-10-22T07:56:04.103895Z", "email": "anthonyrussoformations@gmail.com" } ], "created_at": "2025-10-21T17:36:04.961278Z", "updated_at": "2025-10-22T07:56:04.273537Z", "is_anonymous": false } -->
{:else}
	<Button href="/auth/login">Se connecter</Button>
{/if}
