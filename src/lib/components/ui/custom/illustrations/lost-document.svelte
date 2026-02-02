<script lang="ts">
	/**
	 * LostDocument - A playful illustration of a confused/lost document
	 * Used for 404 pages with a training center metaphor
	 */
	let { class: className = '' } = $props();
</script>

<div class="lost-document-container {className}">
	<svg
		viewBox="0 0 200 200"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		class="h-full w-full"
		aria-hidden="true"
	>
		<!-- Background circle with subtle pulse -->
		<circle cx="100" cy="100" r="80" class="fill-muted/50 animate-pulse-slow" />

		<!-- Document/clipboard body -->
		<g class="document-float">
			<!-- Clipboard back -->
			<rect
				x="55"
				y="50"
				width="90"
				height="110"
				rx="8"
				class="fill-card stroke-border"
				stroke-width="2"
			/>

			<!-- Clipboard clip -->
			<rect x="75" y="42" width="50" height="16" rx="4" class="fill-muted-foreground/20" />
			<rect x="85" y="38" width="30" height="12" rx="3" class="fill-primary/80" />

			<!-- Document lines (content) - faded to show "missing" -->
			<rect x="70" y="70" width="60" height="6" rx="2" class="fill-muted-foreground/15" />
			<rect x="70" y="85" width="45" height="6" rx="2" class="fill-muted-foreground/15" />
			<rect x="70" y="100" width="55" height="6" rx="2" class="fill-muted-foreground/15" />
			<rect x="70" y="115" width="35" height="6" rx="2" class="fill-muted-foreground/15" />

			<!-- Confused face on document -->
			<g class="face">
				<!-- Left eye -->
				<circle cx="85" cy="130" r="4" class="fill-muted-foreground/40" />
				<!-- Right eye -->
				<circle cx="115" cy="130" r="4" class="fill-muted-foreground/40" />
				<!-- Confused mouth (wavy line) -->
				<path
					d="M82 145 Q90 142, 100 145 Q110 148, 118 145"
					stroke-width="3"
					stroke-linecap="round"
					class="stroke-muted-foreground/40"
					fill="none"
				/>
			</g>
		</g>

		<!-- Question marks floating around -->
		<g class="question-marks">
			<text x="40" y="60" class="fill-primary/60 text-2xl font-bold floating-1">?</text>
			<text x="155" y="80" class="fill-primary/40 text-xl font-bold floating-2">?</text>
			<text x="150" y="150" class="fill-primary/30 text-lg font-bold floating-3">?</text>
		</g>

		<!-- Decorative dots -->
		<circle cx="45" cy="120" r="3" class="fill-primary/20 floating-2" />
		<circle cx="160" cy="110" r="4" class="fill-primary/15 floating-1" />
		<circle cx="50" cy="160" r="2" class="fill-primary/25 floating-3" />
	</svg>
</div>

<style>
	.lost-document-container {
		--float-duration: 3s;
		--float-distance: 8px;
	}

	.document-float {
		animation: float var(--float-duration) ease-in-out infinite;
		transform-origin: center;
	}

	.floating-1 {
		animation: float-alt 2.5s ease-in-out infinite;
	}

	.floating-2 {
		animation: float 3.5s ease-in-out infinite 0.5s;
	}

	.floating-3 {
		animation: float-alt 4s ease-in-out infinite 1s;
	}

	@keyframes float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(calc(-1 * var(--float-distance)));
		}
	}

	@keyframes float-alt {
		0%,
		100% {
			transform: translateY(0) rotate(0deg);
		}
		50% {
			transform: translateY(calc(-1 * var(--float-distance) * 0.7)) rotate(5deg);
		}
	}

	:global(.animate-pulse-slow) {
		animation: pulse-slow 4s ease-in-out infinite;
	}

	@keyframes pulse-slow {
		0%,
		100% {
			opacity: 0.5;
		}
		50% {
			opacity: 0.3;
		}
	}
</style>
