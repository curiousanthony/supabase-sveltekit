<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = DialogPrimitive.TriggerProps & {
		ref?: HTMLElement | null;
		children?: Snippet;
	};

	let { ref = $bindable(null), children, ...restProps }: DialogPrimitive.TriggerProps = $props();
</script>

<DialogPrimitive.Trigger bind:ref data-slot="dialog-trigger" {...restProps}>
	{@render children?.()}
</DialogPrimitive.Trigger>
