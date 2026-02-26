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
		<!-- Soft amber glow backdrop -->
		<circle cx="110" cy="115" r="82" class="backdrop-outer" />
		<circle cx="110" cy="115" r="58" class="backdrop-inner" />

		<!-- Shadow -->
		<ellipse cx="110" cy="184" rx="42" ry="7" class="ground-shadow" />

		<!-- Server body — floats gently -->
		<g class="server-float">
			<!-- Server chassis -->
			<rect x="58" y="58" width="104" height="112" rx="12" class="fill-card" />
			<rect x="58" y="58" width="104" height="112" rx="12" class="stroke-border" stroke-width="1.5" fill="none" />

			<!-- Server rack slots -->
			<rect x="70" y="72" width="80" height="16" rx="4" class="fill-muted/60" />
			<rect x="70" y="95" width="80" height="16" rx="4" class="fill-muted/60" />
			<rect x="70" y="118" width="80" height="16" rx="4" class="fill-muted/60" />

			<!-- LED indicators -->
			<circle cx="80" cy="80" r="3" class="fill-muted-foreground/30" />
			<circle cx="80" cy="103" r="3" class="led-blink" />
			<circle cx="80" cy="126" r="3" class="fill-muted-foreground/30" />

			<!-- Coffee cup on top -->
			<path d="M96 52 L104 58 L116 58 L124 52 Z" fill="rgb(254 215 170 / 0.8)" />
			<rect x="96" y="40" width="28" height="14" rx="3" class="cup-body stroke-border" stroke-width="1" />
			<!-- Coffee liquid -->
			<rect x="98" y="42" width="24" height="6" rx="2" fill="rgb(120 53 15 / 0.6)" />
			<!-- Cup handle -->
			<path d="M124 43 Q131 43, 131 49 Q131 55, 124 55" class="stroke-border" stroke-width="1.5" fill="none" />

			<!-- X X eyes (crashed/sleeping) -->
			<path d="M86 146 Q90 142, 94 146" stroke-width="2.5" stroke-linecap="round" class="stroke-muted-foreground/55" fill="none" />
			<path d="M86 146 Q90 150, 94 146" stroke-width="2.5" stroke-linecap="round" class="stroke-muted-foreground/55" fill="none" />
			<path d="M108 146 Q112 142, 116 146" stroke-width="2.5" stroke-linecap="round" class="stroke-muted-foreground/55" fill="none" />
			<path d="M108 146 Q112 150, 116 146" stroke-width="2.5" stroke-linecap="round" class="stroke-muted-foreground/55" fill="none" />

			<!-- Open sleeping mouth -->
			<ellipse cx="100" cy="158" rx="7" ry="4" class="fill-muted-foreground/20" />
		</g>

		<!-- Zzz floating up (each with own animation delay for staggered rise) -->
		<text x="132" y="100" font-size="20" font-weight="800" class="zzz-1 fill-foreground/40">Z</text>
		<text x="148" y="76" font-size="15" font-weight="800" class="zzz-2 fill-foreground/28">z</text>
		<text x="160" y="57" font-size="11" font-weight="800" class="zzz-3 fill-foreground/18">z</text>

		<!-- Steam from coffee cup -->
		<path d="M104 38 Q106 32, 104 26" stroke-width="1.5" stroke-linecap="round" class="steam-1 stroke-muted-foreground/35" fill="none" />
		<path d="M110 38 Q112 30, 110 22" stroke-width="1.5" stroke-linecap="round" class="steam-2 stroke-muted-foreground/28" fill="none" />
		<path d="M116 38 Q118 32, 116 26" stroke-width="1.5" stroke-linecap="round" class="steam-3 stroke-muted-foreground/22" fill="none" />

		<!-- Decorative dots -->
		<circle cx="44" cy="120" r="3" class="dot-slow" style="fill: hsl(var(--primary) / 0.3)" />
		<circle cx="178" cy="130" r="4" class="dot-mid" style="fill: hsl(var(--primary) / 0.2)" />
		<circle cx="48" cy="165" r="2.5" class="dot-fast" style="fill: hsl(var(--primary) / 0.25)" />
	</svg>
</div>

<style>
	.illustration-root {
		display: block;
	}

	/* Glow backdrops */
	.backdrop-outer {
		fill: rgb(245 158 11 / 0.08);
		animation: sn-breathe 5s ease-in-out infinite;
	}

	.backdrop-inner {
		fill: rgb(251 191 36 / 0.05);
		animation: sn-breathe 5s ease-in-out infinite 1.2s;
	}

	/* Ground shadow */
	.ground-shadow {
		fill: hsl(var(--foreground) / 0.08);
		animation: sn-shadow 4s ease-in-out infinite;
	}

	/* Server floats */
	.server-float {
		animation: sn-float 4s ease-in-out infinite;
		transform-origin: 110px 115px;
	}

	/* Coffee cup tilts with the server */
	.cup-body {
		fill: rgb(254 243 199 / 0.7);
	}

	/* Blinking LED */
	.led-blink {
		fill: rgb(251 191 36 / 0.7);
		animation: sn-led 2s step-start infinite;
	}

	/* Zzz rising up and fading */
	.zzz-1 { animation: sn-zzz 3s ease-in-out infinite; }
	.zzz-2 { animation: sn-zzz 3s ease-in-out infinite 1s; }
	.zzz-3 { animation: sn-zzz 3s ease-in-out infinite 2s; }

	/* Steam waving */
	.steam-1 { animation: sn-steam 2.5s ease-in-out infinite; }
	.steam-2 { animation: sn-steam 2.5s ease-in-out infinite 0.5s; }
	.steam-3 { animation: sn-steam 2.5s ease-in-out infinite 1s; }

	/* Decorative dots */
	.dot-slow { animation: sn-dot 4.5s ease-in-out infinite; }
	.dot-mid  { animation: sn-dot 3.6s ease-in-out infinite 0.8s; }
	.dot-fast { animation: sn-dot 3s ease-in-out infinite 1.5s; }

	@keyframes sn-breathe {
		0%, 100% { opacity: 0.7; transform: scale(1); }
		50% { opacity: 0.25; transform: scale(1.05); }
	}

	@keyframes sn-shadow {
		0%, 100% { transform: scaleX(1); opacity: 0.7; }
		50% { transform: scaleX(0.8); opacity: 0.3; }
	}

	@keyframes sn-float {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-7px); }
	}

	@keyframes sn-led {
		0%, 49% { opacity: 1; }
		50%, 100% { opacity: 0.15; }
	}

	@keyframes sn-zzz {
		0% { transform: translateY(0); opacity: 0; }
		15% { opacity: 1; }
		85% { opacity: 0.6; }
		100% { transform: translateY(-20px); opacity: 0; }
	}

	@keyframes sn-steam {
		0%, 100% { opacity: 0.3; transform: scaleX(1) translateY(0); }
		50% { opacity: 0.75; transform: scaleX(1.35) translateY(-4px); }
	}

	@keyframes sn-dot {
		0%, 100% { transform: translateY(0) scale(1); }
		50% { transform: translateY(-6px) scale(1.1); }
	}
</style>
