<script lang="ts">
	import { cn } from '$lib/utils';
	import { AnimatedShinyText } from '$lib/components/ui/magic/animated-shiny-text';
</script>

<svelte:head>
	<title>Animated Shiny Text Demo</title>
</svelte:head>

<div class="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
	<h1 class="text-4xl font-bold">Animated Shiny Text Demo</h1>

	<!-- Example 1: Basic Usage -->
	<div class="w-full max-w-2xl space-y-4 rounded-lg border p-6">
		<h2 class="text-2xl font-semibold">Basic Usage</h2>
		<AnimatedShinyText>Shimmer Animation</AnimatedShinyText>
	</div>

	<!-- Example 2: Custom Text -->
	<div class="w-full max-w-2xl space-y-4 rounded-lg border p-6">
		<h2 class="text-2xl font-semibold">Custom Text</h2>
		<AnimatedShinyText>✨ Introducing Magic UI</AnimatedShinyText>
	</div>

	<!-- Example 3: With Custom Shimmer Width -->
	<div class="w-full max-w-2xl space-y-4 rounded-lg border p-6">
		<h2 class="text-2xl font-semibold">Custom Shimmer Width</h2>
		<AnimatedShinyText shimmerWidth={200}>Wider Shimmer Effect</AnimatedShinyText>
	</div>

	<!-- Example 4: In a Button-like Container (from the original example) -->
	<div class="w-full max-w-2xl space-y-4 rounded-lg border p-6">
		<h2 class="text-2xl font-semibold">In a Button Container</h2>
		<div class="z-10 flex items-center justify-center">
			<div
				class={cn(
					'group rounded-full border border-black/5 bg-neutral-100 text-base text-white transition-all ease-in hover:cursor-pointer hover:bg-neutral-200 dark:border-white/5 dark:bg-neutral-900 dark:hover:bg-neutral-800'
				)}
			>
				<AnimatedShinyText
					class="inline-flex items-center justify-center px-4 py-1 transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400"
				>
					<span>✨ Introducing Magic UI</span>

					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5"
					>
						<path d="M5 12h14" />
						<path d="m12 5 7 7-7 7" />
					</svg>
				</AnimatedShinyText>
			</div>
		</div>
	</div>

	<!-- Example 5: Multiple with Different Styles -->
	<div class="w-full max-w-2xl space-y-4 rounded-lg border p-6">
		<h2 class="text-2xl font-semibold">Multiple Instances</h2>
		<div class="space-y-4">
			<AnimatedShinyText class="text-3xl font-bold">Large Text</AnimatedShinyText>
			<AnimatedShinyText class="text-sm">Small Text</AnimatedShinyText>
			<AnimatedShinyText class="text-xl text-blue-500 dark:text-blue-400">
				Colored Text
			</AnimatedShinyText>
		</div>
	</div>

	<!-- Component Code Example -->
	<div class="w-full max-w-2xl space-y-4 rounded-lg border bg-muted p-6">
		<h2 class="text-2xl font-semibold">Usage Example</h2>
		<pre class="overflow-x-auto rounded bg-background p-4"><code
				>{`<script>
  import { AnimatedShinyText } from '$lib/components/ui/magic/animated-shiny-text';
</script>

<AnimatedShinyText>
  Your shiny text here
</AnimatedShinyText>

<!-- With custom shimmer width -->
<AnimatedShinyText shimmerWidth={200}>
  Custom shimmer width
</AnimatedShinyText>`}</code
			></pre>
	</div>

	<div class="text-center text-sm text-muted-foreground">
		<p>Component imported from animation-svelte library</p>
		<p class="mt-2">
			<a
				href="https://animation-svelte.vercel.app/magic/animated-shiny-text"
				target="_blank"
				rel="noopener noreferrer"
				class="text-primary underline"
			>
				View original documentation
			</a>
		</p>
	</div>
</div>
