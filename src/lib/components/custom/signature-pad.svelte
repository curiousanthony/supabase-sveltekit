<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Eraser from '@lucide/svelte/icons/eraser';
	import Check from '@lucide/svelte/icons/check';

	let {
		onSign,
		disabled = false,
		existingSignatureUrl = null
	}: {
		onSign?: (dataUrl: string) => void;
		disabled?: boolean;
		existingSignatureUrl?: string | null;
	} = $props();

	let canvas = $state<HTMLCanvasElement>();
	let isDrawing = $state(false);
	let hasContent = $state(false);

	function getCtx() {
		const ctx = canvas!.getContext('2d');
		if (!ctx) throw new Error('Canvas 2d context unavailable');
		return ctx;
	}

	function resizeCanvas() {
		const rect = canvas!.getBoundingClientRect();
		const dpr = window.devicePixelRatio || 1;
		canvas!.width = rect.width * dpr;
		canvas!.height = rect.height * dpr;
		const ctx = getCtx();
		ctx.scale(dpr, dpr);
		ctx.lineWidth = 2;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.strokeStyle = '#1a1a1a';
		hasContent = false;
	}

	$effect(() => {
		if (!canvas) return;
		resizeCanvas();
		const observer = new ResizeObserver(() => resizeCanvas());
		observer.observe(canvas);
		return () => observer.disconnect();
	});

	function getPosition(e: MouseEvent | TouchEvent): { x: number; y: number } {
		const rect = canvas!.getBoundingClientRect();
		if ('touches' in e) {
			const touch = e.touches[0];
			return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
		}
		return { x: e.clientX - rect.left, y: e.clientY - rect.top };
	}

	function startDrawing(e: MouseEvent | TouchEvent) {
		if (disabled) return;
		isDrawing = true;
		const ctx = getCtx();
		const pos = getPosition(e);
		ctx.beginPath();
		ctx.moveTo(pos.x, pos.y);
	}

	function draw(e: MouseEvent | TouchEvent) {
		if (!isDrawing || disabled) return;
		const ctx = getCtx();
		const pos = getPosition(e);
		ctx.lineTo(pos.x, pos.y);
		ctx.stroke();
		hasContent = true;
	}

	function stopDrawing() {
		isDrawing = false;
	}

	function clear() {
		const ctx = getCtx();
		ctx.clearRect(0, 0, canvas!.width, canvas!.height);
		hasContent = false;
	}

	function sign() {
		if (!hasContent) return;
		const dataUrl = canvas!.toDataURL('image/png');
		onSign?.(dataUrl);
	}

	function preventTouch(e: TouchEvent) {
		e.preventDefault();
	}
</script>

{#if existingSignatureUrl}
	<div class="flex flex-col items-center gap-2 rounded-md border border-border bg-muted/30 p-4">
		<img src={existingSignatureUrl} alt="Signature" class="h-[200px] w-full object-contain" />
		<p class="text-sm text-muted-foreground">Déjà signé</p>
	</div>
{:else}
	<div class="flex flex-col gap-2">
		<canvas
			bind:this={canvas}
			class="h-[200px] w-full cursor-crosshair rounded-md border border-border bg-gray-50 dark:bg-gray-900"
			onmousedown={startDrawing}
			onmousemove={draw}
			onmouseup={stopDrawing}
			onmouseleave={stopDrawing}
			ontouchstart={(e) => {
				preventTouch(e);
				startDrawing(e);
			}}
			ontouchmove={(e) => {
				preventTouch(e);
				draw(e);
			}}
			ontouchend={(e) => {
				preventTouch(e);
				stopDrawing();
			}}
			aria-label="Zone de signature"
		></canvas>
		<div class="flex justify-end gap-2">
			<Button variant="outline" size="sm" onclick={clear} {disabled}>
				<Eraser />
				Effacer
			</Button>
			<Button size="sm" onclick={sign} disabled={disabled || !hasContent}>
				<Check />
				Signer
			</Button>
		</div>
	</div>
{/if}
