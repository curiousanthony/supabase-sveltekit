<script lang="ts">
	import { onDestroy, onMount } from "svelte";
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import {
		SIDEBAR_COOKIE_MAX_AGE,
		SIDEBAR_COOKIE_NAME,
		SIDEBAR_WIDTH,
		SIDEBAR_WIDTH_ICON,
	} from "./constants.js";
	import { setSidebar } from "./context.svelte.js";

	let {
		ref = $bindable(null),
		open = $bindable(true),
		onOpenChange = () => {},
		class: className,
		style,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
	} = $props();

	let allowToggle = $state(false);
	let initialized = $state(false);

	const sidebar = setSidebar({
		open: () => open,
		setOpen: (value: boolean) => {
			if (!initialized) {
				open = value;
				return;
			}
			if (!allowToggle && value === false) return;
			open = value;
			onOpenChange(value);
			document.cookie = `${SIDEBAR_COOKIE_NAME}=${open}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
		},
	});

	function getSidebarStateFromCookie(): boolean | null {
		if (typeof document === "undefined") return null;
		const match = document.cookie
			.split("; ")
			.find((row) => row.startsWith(`${SIDEBAR_COOKIE_NAME}=`));
		if (!match) return null;
		const value = match.slice(SIDEBAR_COOKIE_NAME.length + 1);
		if (value === "true") return true;
		if (value === "false") return false;
		return null;
	}

	let mountTimeoutId: ReturnType<typeof setTimeout> | undefined;
	onMount(() => {
		const saved = getSidebarStateFromCookie();
		if (saved !== null) open = saved;
		// Force expanded on first paint only when no saved preference and currently closed
		if (saved === null && !open) sidebar.setOpen(true);
		mountTimeoutId = setTimeout(() => {
			allowToggle = true;
			initialized = true;
		}, 400);
	});
	onDestroy(() => {
		if (mountTimeoutId !== undefined) clearTimeout(mountTimeoutId);
	});
</script>

<svelte:window onkeydown={sidebar.handleShortcutKeydown} />

<Tooltip.Provider delayDuration={0}>
	<div
		data-slot="sidebar-wrapper"
		style="--sidebar-width: {SIDEBAR_WIDTH}; --sidebar-width-icon: {SIDEBAR_WIDTH_ICON}; {style}"
		class={cn(
			"group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full",
			className
		)}
		bind:this={ref}
		{...restProps}
	>
		{@render children?.()}
	</div>
</Tooltip.Provider>
