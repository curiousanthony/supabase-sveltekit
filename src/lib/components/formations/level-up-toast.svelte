<script lang="ts">
	import { fly } from "svelte/transition";
	import Trophy from "@lucide/svelte/icons/trophy";
	import { cn } from "$lib/utils.js";

	interface Props {
		phaseName: string;
		show: boolean;
		onClose?: () => void;
	}

	let { phaseName, show, onClose }: Props = $props();

	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		if (!show) return;
		timeoutId = setTimeout(() => {
			onClose?.();
		}, 5000);
		return () => {
			if (timeoutId) clearTimeout(timeoutId);
		};
	});

	function handleClose() {
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
		onClose?.();
	}
</script>

{#if show}
	<div
		class="fixed right-4 top-4 z-50"
		role="status"
		aria-live="polite"
		aria-label="Phase terminée : {phaseName}"
	>
		<div
			class={cn(
				"flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg",
				"bg-linear-to-br from-background via-background to-primary/5",
				"border-primary/30",
				"ring-1 ring-primary/20",
				"animate-shimmer-border",
			)}
			in:fly={{ x: 100, duration: 300 }}
			out:fly={{ x: 100, duration: 200 }}
		>
			<div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
				<Trophy class="size-5" />
			</div>
			<div class="min-w-0">
				<p class="font-semibold text-foreground">Phase terminée !</p>
				<p class="text-sm text-muted-foreground">{phaseName}</p>
			</div>
			<button
				type="button"
				onclick={handleClose}
				class="ml-2 shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				aria-label="Fermer"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M18 6 6 18" />
					<path d="m6 6 12 12" />
				</svg>
			</button>
		</div>
	</div>
{/if}

<style>
	@keyframes shimmer-border {
		0%,
		100% {
			box-shadow: 0 0 0 1px color-mix(in oklch, var(--primary) 20%, transparent);
		}
		50% {
			box-shadow: 0 0 12px 2px color-mix(in oklch, var(--primary) 15%, transparent);
		}
	}

	.animate-shimmer-border {
		animation: shimmer-border 2s ease-in-out infinite;
	}
</style>
