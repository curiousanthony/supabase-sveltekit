<script lang="ts" module>
	export const CARD_CHECKBOX_GROUP_CONTEXT = Symbol('CARD_CHECKBOX_GROUP_CONTEXT');

	export type CardCheckboxGroupContext = {
		values: () => (string | number)[];
		toggle: (value: string | number) => void;
		multiple: () => boolean;
	};
</script>

<script lang="ts">
	import { setContext } from 'svelte';
	import { cn } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		value = $bindable([]),
		multiple = true,
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		value?: (string | number)[];
		multiple?: boolean;
	} = $props();

	setContext<CardCheckboxGroupContext>(CARD_CHECKBOX_GROUP_CONTEXT, {
		values: () => value,
		multiple: () => multiple,
		toggle: (v) => {
			if (multiple) {
				if (value.includes(v)) {
					value = value.filter((i) => i !== v);
				} else {
					value = [...value, v];
				}
			} else {
				if (value.includes(v)) {
					value = [];
				} else {
					value = [v];
				}
			}
		}
	});
</script>

<div bind:this={ref} class={cn('grid gap-4', className)} {...restProps}>
	{@render children?.()}
</div>
