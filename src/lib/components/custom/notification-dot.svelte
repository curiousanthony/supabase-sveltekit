<script lang="ts">
	import { cn } from "$lib/utils.js";

	interface Props {
		variant?: "default" | "warning" | "info";
		class?: string;
		pulse?: boolean;
	}

	let { variant = "default", class: className, pulse = false }: Props = $props();

	const variantClasses = $derived(
		variant === "default"
			? "bg-destructive"
			: variant === "warning"
				? "bg-amber-500"
				: "bg-blue-500",
	);
</script>

<span
	class={cn(
		"absolute inline-block size-[7px] rounded-full",
		variantClasses,
		pulse && "animate-notification-pulse",
		className,
	)}
	aria-hidden="true"
></span>

<style>
	@keyframes notification-pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.animate-notification-pulse {
		animation: notification-pulse 1.5s ease-in-out infinite;
	}

	@media (prefers-reduced-motion: reduce) {
		.animate-notification-pulse {
			animation: none;
		}
	}
</style>
