<script lang="ts">
	let { class: className = '' } = $props();
</script>

<div class="illustration-root {className}" aria-hidden="true">
	<svg
		viewBox="0 0 220 220"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		class="h-full w-full"
	>
		<!-- Soft glow backdrop -->
		<circle cx="110" cy="115" r="82" class="backdrop-circle-outer" />
		<circle cx="110" cy="115" r="60" class="backdrop-circle-inner" />

		<!-- Shadow on ground -->
		<ellipse cx="110" cy="182" rx="38" ry="7" class="ground-shadow" />

		<!-- Document body — floats up and down -->
		<g class="document-float">
			<!-- Paper back -->
			<rect x="62" y="44" width="96" height="122" rx="9" class="fill-card" />
			<!-- Paper border -->
			<rect x="62" y="44" width="96" height="122" rx="9" class="stroke-border" stroke-width="1.5" fill="none" />

			<!-- Fold corner top-right -->
			<path d="M140 44 L158 62 L140 62 Z" class="fill-muted/70" />
			<path d="M140 44 L158 62" class="stroke-border" stroke-width="1" />

			<!-- Document lines (faded content) -->
			<rect x="76" y="72" width="62" height="5" rx="2.5" class="fill-muted-foreground/20" />
			<rect x="76" y="85" width="50" height="5" rx="2.5" class="fill-muted-foreground/15" />
			<rect x="76" y="98" width="58" height="5" rx="2.5" class="fill-muted-foreground/20" />
			<rect x="76" y="111" width="42" height="5" rx="2.5" class="fill-muted-foreground/15" />

			<!-- Left eye -->
			<circle cx="93" cy="140" r="5.5" class="fill-muted-foreground/25" />
			<circle cx="91.5" cy="138.5" r="2" class="fill-muted-foreground/50" />

			<!-- Right eye -->
			<circle cx="119" cy="140" r="5.5" class="fill-muted-foreground/25" />
			<circle cx="120.5" cy="138.5" r="2" class="fill-muted-foreground/50" />

			<!-- Confused wavy mouth -->
			<path
				d="M88 155 Q96 151, 106 155 Q116 159, 124 155"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="stroke-muted-foreground/45"
				fill="none"
			/>

			<!-- Sweat drop -->
			<path d="M131 128 Q133 123, 136 128 Q136 133, 131 128 Z" fill="rgb(56 189 248 / 0.6)" />
		</g>

		<!-- Floating question marks -->
		<text x="36" y="72" font-size="22" font-weight="700" class="question-1 fill-primary/55">?</text>
		<text x="168" y="90" font-size="18" font-weight="700" class="question-2 fill-primary/35">?</text>
		<text x="162" y="158" font-size="14" font-weight="700" class="question-3 fill-primary/25">?</text>

		<!-- Decorative dots -->
		<circle cx="46" cy="130" r="3.5" class="dot-mid fill-primary/25" />
		<circle cx="174" cy="118" r="4.5" class="dot-slow fill-primary/15" />
		<circle cx="52" cy="170" r="2.5" class="dot-fast fill-primary/30" />
		<circle cx="178" cy="160" r="3" class="dot-mid fill-primary/20" />
	</svg>
</div>

<style>
	.illustration-root {
		display: block;
	}

	/* Glow backdrop */
	.backdrop-circle-outer {
		fill: hsl(var(--primary) / 0.08);
		animation: ld-breathe 5s ease-in-out infinite;
	}

	.backdrop-circle-inner {
		fill: hsl(var(--primary) / 0.05);
		animation: ld-breathe 5s ease-in-out infinite 1.2s;
	}

	/* Ground shadow */
	.ground-shadow {
		fill: hsl(var(--foreground) / 0.08);
		animation: ld-shadow 3.2s ease-in-out infinite;
	}

	/* Document floats up and down */
	.document-float {
		animation: ld-float 3.2s ease-in-out infinite;
		transform-origin: 110px 110px;
	}

	/* Question marks spin + float */
	.question-1 { animation: ld-spin 4s ease-in-out infinite; }
	.question-2 { animation: ld-spin 3.4s ease-in-out infinite 0.6s; }
	.question-3 { animation: ld-spin 2.8s ease-in-out infinite 1.2s; }

	/* Decorative dots bounce */
	.dot-slow { animation: ld-dot 4.5s ease-in-out infinite; }
	.dot-mid  { animation: ld-dot 3.6s ease-in-out infinite 0.8s; }
	.dot-fast { animation: ld-dot 3s ease-in-out infinite 1.5s; }

	@keyframes ld-breathe {
		0%, 100% { opacity: 0.7; transform: scale(1); }
		50% { opacity: 0.3; transform: scale(1.04); }
	}

	@keyframes ld-shadow {
		0%, 100% { transform: scaleX(1); opacity: 0.8; }
		50% { transform: scaleX(0.82); opacity: 0.35; }
	}

	@keyframes ld-float {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-9px); }
	}

	@keyframes ld-spin {
		0%, 100% { transform: translateY(0) rotate(0deg); }
		50% { transform: translateY(-5px) rotate(8deg); }
	}

	@keyframes ld-dot {
		0%, 100% { transform: translateY(0) scale(1); }
		50% { transform: translateY(-6px) scale(1.1); }
	}
</style>
