<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
	import type { Snippet } from "svelte";

	let {
		ref = $bindable(null),
		children,
		child,
		...restProps
	}: DropdownMenuPrimitive.TriggerProps & { children?: Snippet; child?: Snippet<[{ props: Record<string, unknown> }]> } = $props();
</script>

<DropdownMenuPrimitive.Trigger bind:ref data-slot="dropdown-menu-trigger" {child} {...restProps}>
	{@render children?.()}
</DropdownMenuPrimitive.Trigger>
