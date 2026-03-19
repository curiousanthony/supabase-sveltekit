<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';

	import Button from '$lib/components/ui/button/button.svelte';

	import Check from '@lucide/svelte/icons/check';
	import Eraser from '@lucide/svelte/icons/eraser';
	import PenLine from '@lucide/svelte/icons/pen-line';

	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form?: ActionData } = $props();

	let canvas: HTMLCanvasElement | undefined = $state();
	let isDrawing = $state(false);
	let hasDrawn = $state(false);
	let submitSuccess = $state(false);

	const showSuccess = $derived(submitSuccess || form?.success === true);

	function formatDate(iso: string) {
		if (!iso) return '—';
		const d = new Date(iso);
		return new Intl.DateTimeFormat('fr-FR', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		}).format(d);
	}

	function formatTime(iso: string) {
		if (!iso) return '—';
		const d = new Date(iso);
		return new Intl.DateTimeFormat('fr-FR', {
			hour: '2-digit',
			minute: '2-digit'
		}).format(d);
	}

	function initCanvas() {
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		ctx.fillStyle = '#fff';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.lineWidth = 2;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.strokeStyle = '#000';
	}

	onMount(() => {
		let attempts = 0;
		const setup = () => {
			attempts += 1;
			if (!canvas || attempts > 40) return;
			const dpr = window.devicePixelRatio || 1;
			const rect = canvas.getBoundingClientRect();
			if (rect.width < 2 || rect.height < 2) {
				requestAnimationFrame(setup);
				return;
			}
			canvas.width = Math.max(1, Math.floor(rect.width * dpr));
			canvas.height = Math.max(1, Math.floor(rect.height * dpr));
			const ctx = canvas.getContext('2d');
			if (ctx) ctx.scale(dpr, dpr);
			initCanvas();
		};
		requestAnimationFrame(() => requestAnimationFrame(setup));
	});

	function getPos(e: MouseEvent | TouchEvent) {
		if (!canvas) return { x: 0, y: 0 };
		const rect = canvas.getBoundingClientRect();
		if ('touches' in e && e.touches.length > 0) {
			return {
				x: e.touches[0].clientX - rect.left,
				y: e.touches[0].clientY - rect.top
			};
		}
		if ('clientX' in e) {
			return { x: e.clientX - rect.left, y: e.clientY - rect.top };
		}
		return { x: 0, y: 0 };
	}

	function startDraw(e: MouseEvent | TouchEvent) {
		if (!canvas) return;
		isDrawing = true;
		hasDrawn = true;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		const pos = getPos(e);
		ctx.beginPath();
		ctx.moveTo(pos.x, pos.y);
	}

	function draw(e: MouseEvent | TouchEvent) {
		if (!isDrawing || !canvas) return;
		e.preventDefault();
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		const pos = getPos(e);
		ctx.lineTo(pos.x, pos.y);
		ctx.stroke();
	}

	function endDraw() {
		isDrawing = false;
	}

	function clearCanvas() {
		hasDrawn = false;
		initCanvas();
	}

	function getSignatureData() {
		return canvas?.toDataURL('image/png') ?? '';
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
	<div class="w-full max-w-md space-y-6 rounded-xl bg-white p-6 shadow-lg">
		<div class="space-y-2 text-center">
			<h1 class="text-xl font-bold text-gray-900">{data.formationName}</h1>
			<p class="text-sm text-gray-500">Session du {formatDate(data.sessionDate)}</p>
			<p class="text-sm text-gray-500">
				{formatTime(data.sessionStartTime)} – {formatTime(data.sessionEndTime)}
			</p>
			<p class="text-lg font-medium text-gray-800">{data.learnerName}</p>
		</div>

		{#if showSuccess}
			<div class="flex flex-col items-center gap-4 py-6">
				<div
					class="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600"
				>
					<Check class="h-9 w-9" strokeWidth={2.5} />
				</div>
				<p class="text-center text-base text-gray-700">
					Merci, votre émargement a été enregistré.
				</p>
			</div>
		{:else if data.alreadySigned}
			<div class="space-y-4 py-2">
				<p class="text-center text-gray-700">Vous avez déjà signé pour cette session.</p>
				{#if data.signatureImageUrl}
					<div class="overflow-hidden rounded-lg border border-gray-200 bg-white">
						<img
							src={data.signatureImageUrl}
							alt="Signature enregistrée"
							class="mx-auto max-h-48 w-full object-contain"
						/>
					</div>
				{/if}
			</div>
		{:else}
			<form
				method="POST"
				class="space-y-4"
				use:enhance={({ formData, cancel }) => {
					if (!hasDrawn) {
						cancel();
						return;
					}
					formData.set('signatureData', getSignatureData());
					return async ({ result }) => {
						if (result.type === 'success' && result.data?.success) {
							submitSuccess = true;
						}
					};
				}}
			>
				<div class="space-y-2">
					<div class="flex items-center gap-2 text-sm font-medium text-gray-700">
						<PenLine class="h-4 w-4 shrink-0 text-gray-500" />
						<span>Signature</span>
					</div>
					<div class="relative rounded-lg border border-gray-300 bg-white">
						<canvas
							bind:this={canvas}
							class="h-48 w-full touch-none cursor-crosshair rounded-lg"
							onmousedown={startDraw}
							onmousemove={draw}
							onmouseup={endDraw}
							onmouseleave={endDraw}
							ontouchstart={startDraw}
							ontouchmove={draw}
							ontouchend={endDraw}
							ontouchcancel={endDraw}
						></canvas>
					</div>
					<div class="flex flex-wrap items-center justify-between gap-2">
						<Button type="button" variant="outline" size="sm" onclick={clearCanvas}>
							<Eraser class="mr-1.5 h-4 w-4" />
							Effacer
						</Button>
					</div>
				</div>

				{#if form?.message}
					<p class="text-center text-sm text-red-600" role="alert">{form.message}</p>
				{/if}

				<Button type="submit" class="w-full" size="lg" disabled={!hasDrawn}>
					Signer
				</Button>
			</form>
		{/if}
	</div>
</div>
