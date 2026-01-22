<script lang="ts">
	import { Checkbox as CheckboxPrimitive } from 'bits-ui';
	import CheckIcon from '@lucide/svelte/icons/check';
	import { getContext } from 'svelte';
	import { cn, type WithoutChildrenOrChild } from '$lib/utils.js';
	import type { Component } from 'svelte';
	import {
		CARD_CHECKBOX_GROUP_CONTEXT,
		type CardCheckboxGroupContext
	} from './card-checkbox-group.svelte';

	let {
		ref = $bindable(null),
		checked = $bindable(false),
		class: className,
		title,
		subtitle,
		icon: Icon,
		value,
		...restProps
	}: WithoutChildrenOrChild<CheckboxPrimitive.RootProps> & {
		title: string;
		subtitle?: string;
		icon?: Component;
		value?: any;
	} = $props();

	const group = getContext<CardCheckboxGroupContext | undefined>(CARD_CHECKBOX_GROUP_CONTEXT);

	const isChecked = $derived(
		group && value !== undefined ? group.values().includes(value) : checked
	);

	function handleCheckedChange(v: boolean | 'indeterminate') {
		if (group && value !== undefined) {
			group.toggle(value);
		} else {
			checked = v === true;
		}
	}
</script>

<CheckboxPrimitive.Root
	bind:ref
	checked={isChecked}
	onCheckedChange={handleCheckedChange}
	{value}
	aria-label={title}
	class={cn(
		'group relative flex flex-col gap-4 rounded-xl border p-4 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
		'border-input bg-card text-card-foreground hover:border-accent-foreground/20',
		'data-[state=checked]:border-primary data-[state=checked]:bg-primary/5',
		className
	)}
	{...restProps}
>
	<div class="flex items-start justify-between">
		{#if Icon}
			<div
				class={cn(
					'flex size-10 items-center justify-center rounded-lg transition-colors',
					'bg-muted text-muted-foreground',
					'group-data-[state=checked]:bg-primary group-data-[state=checked]:text-primary-foreground'
				)}
			>
				<Icon class="size-5" />
			</div>
		{/if}

		<div
			class={cn(
				'ml-auto flex size-5 items-center justify-center rounded-full border transition-all',
				'border-muted-foreground/30',
				'group-data-[state=checked]:border-primary group-data-[state=checked]:bg-primary group-data-[state=checked]:text-primary-foreground'
			)}
		>
			{#if isChecked}
				<CheckIcon class="size-3" />
			{/if}
		</div>
	</div>

	<div class="flex flex-col gap-1">
		<span class="leading-none font-semibold tracking-tight">{title}</span>
		{#if subtitle}
			<span class="text-sm leading-snug text-muted-foreground">{subtitle}</span>
		{/if}
	</div>
</CheckboxPrimitive.Root>
