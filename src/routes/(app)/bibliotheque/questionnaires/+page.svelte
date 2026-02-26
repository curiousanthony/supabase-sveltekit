<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import Plus from '@lucide/svelte/icons/plus';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Copy from '@lucide/svelte/icons/copy';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';

	let { data }: PageProps = $props();
	let { questionnaires } = $derived(data);

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
								<DropdownMenu.Root>
									<DropdownMenu.Trigger>
										{#snippet child({ props })}
											<Button variant="ghost" size="icon" class="size-8" {...props}>
												<MoreHorizontal class="size-4" />
												<span class="sr-only">Actions pour {q.titre}</span>
											</Button>
										{/snippet}
									</DropdownMenu.Trigger>
									<DropdownMenu.Content align="end">
										<DropdownMenu.Item>
											{#snippet child({ props })}
												<a href="/bibliotheque/questionnaires/{q.id}" {...props}>
													<Pencil class="mr-2 size-4" />
													Modifier
												</a>
											{/snippet}
										</DropdownMenu.Item>
										{#if q.urlTest}
											{@const urlInfo = parseAndValidateUrl(q.urlTest)}
											{#if urlInfo?.safe}
												<DropdownMenu.Item>
													{#snippet child({ props })}
														<a
															href={urlInfo.href}
															target="_blank"
															rel="noopener noreferrer"
															{...props}
														>
															<ExternalLink class="mr-2 size-4" />
															Ouvrir le lien
														</a>
													{/snippet}
												</DropdownMenu.Item>
											{:else if urlInfo}
												<DropdownMenu.Item disabled>
													<ExternalLink class="mr-2 size-4" />
													Ouvrir le lien
													<span class="ml-1 text-muted-foreground">(non sécurisé)</span>
												</DropdownMenu.Item>
											{/if}
										{/if}
										<form method="POST" action="?/duplicate" use:enhance>
											<input type="hidden" name="id" value={q.id} />
											<DropdownMenu.Item>
												{#snippet child({ props })}
													<button type="submit" class="flex w-full items-center" {...props}>
														<Copy class="mr-2 size-4" />
														Dupliquer
													</button>
												{/snippet}
											</DropdownMenu.Item>
										</form>
										<DropdownMenu.Separator />
										<form
											method="POST"
											action="?/delete"
											use:enhance
											onsubmit={(e) => {
												const form = e.currentTarget as HTMLFormElement;
												if (form.dataset.confirmed !== '1') {
													e.preventDefault();
													if (!confirm('Supprimer ce questionnaire ? Cette action est irréversible.')) return;
													form.dataset.confirmed = '1';
													form.requestSubmit();
												}
											}}
										>
											<input type="hidden" name="id" value={q.id} />
											<DropdownMenu.Item class="text-destructive">
												{#snippet child({ props })}
													<button type="submit" class="flex w-full items-center" {...props}>
														<Trash2 class="mr-2 size-4" />
														Supprimer
													</button>
												{/snippet}
											</DropdownMenu.Item>
										</form>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>
