<script lang="ts">
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import type { WithoutChildren } from "$lib/utils.js";
	import type { ComponentProps } from "svelte";
	import type { Component } from "svelte";

	let {
		items,
		...restProps
	}: { items: { title: string; url: string; icon: Component }[] } & WithoutChildren<
		ComponentProps<typeof Sidebar.Group>
	> = $props();
</script>

<Sidebar.Group {...restProps}>
	<Sidebar.GroupContent>
		<Sidebar.Menu>
			{#each items as item (item.title)}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton tooltipContent={item.title}>
						{#snippet child({ props })}
							<a href={item.url} {...props}>
								{#if item.icon}
									<item.icon class="size-4 shrink-0" />
								{/if}
								<span>{item.title}</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
