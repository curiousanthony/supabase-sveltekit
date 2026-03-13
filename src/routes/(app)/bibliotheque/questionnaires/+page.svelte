<script lang="ts">
	import type { PageProps } from './$types';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils.js';
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import QuestionnaireRowActions from './questionnaire-row-actions.svelte';
	import Plus from '@lucide/svelte/icons/plus';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';

	let { data }: PageProps = $props();
	let { questionnaires } = $derived(data);

	let deleteDialogOpen = $state(false);
	let pendingDeleteId = $state<string | null>(null);

	function openDeleteDialog(id: string) {
		pendingDeleteId = id;
		deleteDialogOpen = true;
	}

	function confirmDeleteQuestionnaire() {
		if (!pendingDeleteId) return;
		const form = document.getElementById(`delete-questionnaire-${pendingDeleteId}`);
		if (form instanceof HTMLFormElement) form.requestSubmit();
		deleteDialogOpen = false;
		pendingDeleteId = null;
	}

	const ALLOWED_URL_SCHEMES = ['http:', 'https:', 'mailto:'] as const;

	type SafeUrl =
		| { safe: true; href: string; display: string }
		| { safe: false; display: string };

	function parseAndValidateUrl(url: string | null): SafeUrl | null {
		if (!url || typeof url !== 'string') return null;
		const trimmed = url.trim();
		if (!trimmed) return null;
		try {
			const parsed = new URL(trimmed);
			const scheme = parsed.protocol;
			if (!(ALLOWED_URL_SCHEMES as readonly string[]).includes(scheme)) {
				console.warn(
					'[questionnaires] Blocked dangerous URL scheme:',
					scheme,
					trimmed.slice(0, 80)
				);
				return {
					safe: false,
					display: 'unsafe: ' + (trimmed.length > 50 ? trimmed.slice(0, 50) + '…' : trimmed)
				};
			}
			const display =
				scheme === 'mailto:'
					? (parsed.pathname || parsed.href)
					: (parsed.hostname || parsed.href);
			return { safe: true, href: parsed.href, display };
		} catch {
			return { safe: false, display: 'invalid URL' };
		}
	}
</script>

<svelte:head>
	<title>Questionnaires — Bibliothèque</title>
</svelte:head>

<div class="flex flex-col gap-4">
	{#if questionnaires.length === 0}
		<div
			class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16"
		>
			<ClipboardList class="size-10 text-muted-foreground" />
			<p class="text-sm text-muted-foreground">Aucun questionnaire pour le moment</p>
			<Button href="/bibliotheque/questionnaires/creer" size="sm" variant="outline">
				<Plus class="mr-1 size-4" />
				Nouveau questionnaire
			</Button>
		</div>
	{:else}
		<div class="rounded-md border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Titre</Table.Head>
						<Table.Head>Type</Table.Head>
						<Table.Head>Lien</Table.Head>
						<Table.Head class="w-10"></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each questionnaires as q (q.id)}
						<Table.Row>
							<Table.Cell>
								<a
									href="/bibliotheque/questionnaires/{q.id}"
									class="font-medium hover:underline"
								>
									{q.titre}
								</a>
							</Table.Cell>
							<Table.Cell>
								{#if q.type}
									<Badge variant="outline">{q.type}</Badge>
								{:else}
									<span class="text-muted-foreground">—</span>
								{/if}
							</Table.Cell>
							<Table.Cell>
								{#if q.urlTest}
									{@const urlInfo = parseAndValidateUrl(q.urlTest)}
									{#if urlInfo}
										{#if urlInfo.safe}
											<a
												href={urlInfo.href}
												target="_blank"
												rel="noopener noreferrer"
												class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
											>
												{urlInfo.display}
												<ExternalLink class="size-3" />
											</a>
										{:else}
											<span
												class="inline-flex items-center gap-1 text-sm text-muted-foreground"
												title={urlInfo.display}
											>
												{urlInfo.display}
											</span>
										{/if}
									{:else}
										<span class="text-muted-foreground">—</span>
									{/if}
								{:else}
									<span class="text-muted-foreground">—</span>
								{/if}
							</Table.Cell>
							<Table.Cell>
								<QuestionnaireRowActions
									id={q.id}
									urlTest={q.urlTest}
									onDeleteClick={openDeleteDialog}
									onDeleteComplete={() => {
										deleteDialogOpen = false;
										pendingDeleteId = null;
									}}
								/>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}

	<AlertDialog.Root bind:open={deleteDialogOpen}>
		<AlertDialog.Content interactOutsideBehavior="close">
			<AlertDialog.Header>
				<AlertDialog.Title>Supprimer ce questionnaire ?</AlertDialog.Title>
				<AlertDialog.Description>
					Cette action est irréversible. Le questionnaire sera définitivement supprimé.
				</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer>
				<AlertDialog.Cancel class={cn(buttonVariants({ variant: 'outline' }))}>
					Annuler
				</AlertDialog.Cancel>
				<AlertDialog.Action
					class={cn(buttonVariants({ variant: 'destructive' }))}
					onclick={confirmDeleteQuestionnaire}
				>
					Supprimer
				</AlertDialog.Action>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>
</div>
