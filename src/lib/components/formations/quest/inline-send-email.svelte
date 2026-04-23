<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Send from '@lucide/svelte/icons/send';
	import Check from '@lucide/svelte/icons/check';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import AlertCircle from '@lucide/svelte/icons/alert-circle';
	import Mail from '@lucide/svelte/icons/mail';

	interface Props {
		completed: boolean;
		emailType: string;
		recipientType: string;
		subActionId: string;
		recipients: { email: string; name: string }[];
		onSend: (
			emailType: string,
			recipientType: string,
			recipientEmail: string,
			recipientName: string,
			subActionId: string
		) => Promise<void>;
	}

	let { completed, emailType, recipientType, subActionId, recipients, onSend }: Props = $props();

	let sending = $state(false);
	let error = $state<string | null>(null);

	const recipientHint = $derived.by(() => {
		switch (recipientType) {
			case 'apprenant':
			case 'apprenants':
				return "Ajoutez des apprenants dans l'onglet Apprenants";
			case 'formateur':
			case 'formateurs':
				return "Ajoutez un formateur dans l'onglet Détails";
			case 'entreprise':
			case 'entreprises':
				return "Ajoutez une entreprise dans l'onglet Détails";
			default:
				return `Ajoutez des destinataires (${recipientType})`;
		}
	});

	const summary = $derived.by(() => {
		if (recipients.length === 0) return null;
		const first = recipients[0];
		const display = first.name || first.email;
		if (recipients.length === 1) return display;
		return `${display} (+${recipients.length - 1})`;
	});

	const buttonLabel = $derived(
		recipients.length === 1 ? 'Envoyer' : `Envoyer à ${recipients.length} personnes`
	);

	async function handleSend() {
		sending = true;
		error = null;
		try {
			for (const recipient of recipients) {
				await onSend(emailType, recipientType, recipient.email, recipient.name, subActionId);
			}
		} catch (e) {
			error = e instanceof Error ? e.message : "Erreur lors de l'envoi";
		} finally {
			sending = false;
		}
	}
</script>

{#if completed}
	<button
		type="button"
		class="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 transition-colors cursor-default"
	>
		<Check class="size-4" />
		<span>Envoyé</span>
	</button>
{:else if recipients.length === 0}
	<div class="flex items-center gap-1.5 text-sm text-muted-foreground">
		<Mail class="size-3.5" />
		<span>Aucun destinataire disponible</span>
		<span class="text-xs italic">— {recipientHint}</span>
	</div>
{:else}
	<div class="flex items-center gap-3 flex-wrap">
		<div class="flex items-center gap-1.5 text-sm text-muted-foreground">
			<Mail class="size-3.5" />
			<span>{summary}</span>
		</div>

		{#if error}
			<div class="flex items-center gap-1.5 text-sm text-destructive">
				<AlertCircle class="size-3.5" />
				<span>{error}</span>
			</div>
			<Button variant="outline" size="sm" onclick={handleSend}>
				<Send class="size-3.5 mr-1.5" />
				Réessayer
			</Button>
		{:else if sending}
			<Button variant="outline" size="sm" disabled>
				<Loader2 class="size-3.5 mr-1.5 animate-spin" />
				Envoi…
			</Button>
		{:else}
			<Button variant="outline" size="sm" onclick={handleSend}>
				<Send class="size-3.5 mr-1.5" />
				{buttonLabel}
			</Button>
		{/if}
	</div>
{/if}
