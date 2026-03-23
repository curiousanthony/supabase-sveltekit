<script lang="ts">
	import type { LayoutProps } from './$types';
	import Button from '$lib/components/ui/button/button.svelte';
	import DocumentPanel from '$lib/components/formations/pulse/document-panel.svelte';
	import HistoryPanel from '$lib/components/formations/pulse/history-panel.svelte';
	import FileText from '@lucide/svelte/icons/file-text';
	import History from '@lucide/svelte/icons/history';

	let { data, children }: LayoutProps = $props();

	const formation = $derived(data?.formation);
	const formationName = $derived(formation?.name ?? 'Formation');
	const auditLogEntries = $derived(formation?.auditLog ?? []);

	let documentsOpen = $state(false);
	let historyOpen = $state(false);
</script>

<div class="flex min-h-0 w-full flex-1 flex-col gap-4">
	<div class="flex items-center justify-end gap-1">
		<Button
			variant="ghost"
			size="sm"
			class="gap-1.5 text-muted-foreground hover:text-foreground"
			onclick={() => (documentsOpen = true)}
		>
			<FileText class="size-4" />
			<span class="hidden sm:inline">Documents</span>
		</Button>
		<Button
			variant="ghost"
			size="sm"
			class="gap-1.5 text-muted-foreground hover:text-foreground"
			onclick={() => (historyOpen = true)}
		>
			<History class="size-4" />
			<span class="hidden sm:inline">Historique</span>
		</Button>
	</div>

	{@render children()}

	<DocumentPanel bind:open={documentsOpen} {formationName} />
	<HistoryPanel bind:open={historyOpen} {formationName} entries={auditLogEntries} />
</div>
