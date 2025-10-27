<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Progress from '$lib/components/ui/progress/progress.svelte';
	import Hourglass from '@tabler/icons-svelte/icons/hourglass';
	import HourglassFilled from '@tabler/icons-svelte/icons/hourglass-filled';
	import HourglassEmpty from '@tabler/icons-svelte/icons/hourglass-empty';
	import UserFilled from '@tabler/icons-svelte/icons/user-filled';
	import MapPinFilled from '@tabler/icons-svelte/icons/map-pin-filled';
	import { IconCardsFilled, IconHourglassFilled, IconManFilled } from '@tabler/icons-svelte';
	import CardsFilled from '@tabler/icons-svelte/icons/cards-filled';

	let { formation } = $props();
</script>

<a href="/formations/{formation.id}" class="">
	<Card.Root class="w-full max-w-sm hover:border-primary">
		<Card.Header>
			<Card.Title class="text-lg font-semibold">{formation.name}</Card.Title>
			<Card.Description>
				<Badge class="" variant="secondary">{formation?.thematique?.name}</Badge>
				<!-- {formation.description} -->
			</Card.Description>
			<Card.Action>
				<!-- <Button variant="secondary">...</Button> -->
				<span class="text-xs text-muted-foreground">#{formation.idInWorkspace}</span>
			</Card.Action>
		</Card.Header>
		<Card.Content>
			<div class="flex flex-col gap-2">
				<div class="flex justify-between">
					<div class="text-md flex items-center gap-1">
						<IconHourglassFilled size={16} stroke={2} />
						<span>{formation.duree} heures</span>
					</div>
					<div class="text-md flex items-center gap-1">
						<MapPinFilled size={16} stroke={2} />
						<span>{formation.modalite}</span>
					</div>
				</div>
				<div class="flex justify-between">
					<div class="text-md flex items-center gap-1">
						<UserFilled size={16} stroke={2} />
						<span>Acme Inc.</span>
					</div>
					<div class="text-md flex items-center gap-1">
						<!-- <IconCardsFilled size={16} stroke={2} /> -->
						<IconManFilled size={16} stroke={2} />
						<span>1 formateur</span>
					</div>
				</div>
			</div>
		</Card.Content>
		<Card.Footer class="flex-col gap-1">
			<!-- <Button type="submit" class="w-full">Login</Button>
            <Button variant="outline" class="w-full">Login with Google</Button> -->
			<!-- <Label for="progress">Progres</Label> -->
			<div class="flex w-full justify-between text-sm font-semibold">
				<span>2/7 tâches</span>
				<span>20%</span>
			</div>
			<Progress value={2} max={7} />
		</Card.Footer>
	</Card.Root>
</a>
