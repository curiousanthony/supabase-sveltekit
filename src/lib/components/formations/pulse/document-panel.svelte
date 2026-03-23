<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import CircleHalfIcon from '@lucide/svelte/icons/circle-dot';
	import CircleIcon from '@lucide/svelte/icons/circle';
	import SearchIcon from '@lucide/svelte/icons/search';
	import UploadIcon from '@lucide/svelte/icons/upload';

	interface Props {
		open: boolean;
		formationName: string;
	}

	let { open = $bindable(), formationName }: Props = $props();

	let searchQuery = $state('');

	type DocStatus = 'done' | 'pending' | 'partial' | 'not-started';

	interface Document {
		name: string;
		status: string;
		date?: string;
		amount?: string;
		state: DocStatus;
	}

	interface Category {
		label: string;
		documents: Document[];
	}

	const categories: Category[] = [
		{
			label: 'Contractuels',
			documents: [
				{ name: 'Convention de formation', status: 'Signée', date: '18 mars', state: 'done' },
				{ name: 'Devis #D-2026-015', status: 'Accepté', date: '10 mars', state: 'done' }
			]
		},
		{
			label: 'Pédagogiques',
			documents: [
				{ name: 'Programme de formation', status: 'Validé', state: 'done' },
				{ name: 'Test de positionnement', status: 'Envoyé', date: '22 mars', state: 'pending' }
			]
		},
		{
			label: 'Suivi',
			documents: [
				{
					name: 'Convocation (4 apprenants)',
					status: 'Envoyée',
					date: '20 mars',
					state: 'done'
				},
				{
					name: 'Émargement — Séance 1',
					status: '3/4 signatures',
					state: 'partial'
				},
				{
					name: 'Émargement — Séance 2',
					status: 'Pas encore généré',
					state: 'not-started'
				}
			]
		},
		{
			label: 'Financiers',
			documents: [
				{
					name: 'Facture #F-2026-042',
					status: 'Payée',
					date: '25 mars',
					amount: '5 200 €',
					state: 'done'
				},
				{
					name: 'Certificat de réalisation (×4)',
					status: 'Générés',
					date: '20 mars',
					state: 'done'
				}
			]
		}
	];

	let totalDocuments = $derived(categories.reduce((sum, cat) => sum + cat.documents.length, 0));

	let filteredCategories = $derived(
		searchQuery.trim() === ''
			? categories
			: categories
					.map((cat) => ({
						...cat,
						documents: cat.documents.filter((doc) =>
							doc.name.toLowerCase().includes(searchQuery.toLowerCase())
						)
					}))
					.filter((cat) => cat.documents.length > 0)
	);

	const stateConfig: Record<DocStatus, { icon: typeof CheckIcon; color: string }> = {
		done: { icon: CheckIcon, color: 'text-green-500' },
		pending: { icon: ClockIcon, color: 'text-amber-500' },
		partial: { icon: CircleHalfIcon, color: 'text-amber-500' },
		'not-started': { icon: CircleIcon, color: 'text-muted-foreground/50' }
	};
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-[400px] sm:w-[440px] sm:max-w-[440px]">
		<Sheet.Header>
			<Sheet.Title class="flex items-center gap-2">
				Documents
				<Badge variant="secondary" class="text-xs tabular-nums">{totalDocuments}</Badge>
			</Sheet.Title>
			<Sheet.Description class="sr-only">
				Documents associés à {formationName}
			</Sheet.Description>
		</Sheet.Header>

		<div class="px-4">
			<div class="relative">
				<SearchIcon class="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
				<input
					type="text"
					placeholder="Rechercher..."
					bind:value={searchQuery}
					class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring h-9 w-full rounded-md border py-2 pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
				/>
			</div>
		</div>

		<div class="flex-1 overflow-y-auto px-4 pb-4">
			{#each filteredCategories as category, catIdx}
				<div class={catIdx > 0 ? 'mt-5' : 'mt-2'}>
					<h3 class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						{category.label}
					</h3>

					{#each category.documents as doc}
						{@const config = stateConfig[doc.state]}
						{@const Icon = config.icon}
						<button
							type="button"
							class="flex w-full items-start gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted/50"
							onclick={() => console.log('Open document:', doc.name)}
						>
							<Icon class="mt-0.5 size-4 shrink-0 {config.color}" />
							<div class="min-w-0">
								<p class="text-sm font-medium">{doc.name}</p>
								<p class="text-xs text-muted-foreground">
									{doc.status}{#if doc.date} · {doc.date}{/if}{#if doc.amount} · {doc.amount}{/if}
								</p>
							</div>
						</button>
					{/each}
				</div>
			{/each}

			{#if filteredCategories.length === 0}
				<p class="py-8 text-center text-sm text-muted-foreground">Aucun document trouvé</p>
			{/if}
		</div>

		<Sheet.Footer class="border-t px-4 py-3">
			<button
				type="button"
				class="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<UploadIcon class="size-4" />
				Téléverser un document
			</button>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
