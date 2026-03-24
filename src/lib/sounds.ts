/**
 * 3-tier sound system using Web Audio API.
 * All sounds are procedural (no audio files), designed to remain non-annoying after 100+ plays.
 */

const STORAGE_KEY = "sounds-enabled";

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
	if (typeof globalThis.AudioContext === "undefined") return null;
	if (!audioContext) {
		audioContext = new AudioContext();
	}
	if (audioContext.state === "suspended") {
		audioContext.resume().catch(() => {});
	}
	return audioContext;
}

function getSoundsEnabled(): boolean {
	if (typeof window === "undefined") return false;
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored === null ? true : stored === "true";
	} catch {
		return true;
	}
}

export function areSoundsEnabled(): boolean {
	return getSoundsEnabled();
}

export function setSoundsEnabled(enabled: boolean): void {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(STORAGE_KEY, String(enabled));
	} catch {
		// ignore
	}
}

/**
 * Micro sound: very subtle tick for sub-action checks.
 * Barely perceptible, short click-like.
 */
export function playMicroSound(): void {
	if (!getSoundsEnabled()) return;

	const ctx = getAudioContext();
	if (!ctx) return;
	const now = ctx.currentTime;

	const osc = ctx.createOscillator();
	osc.type = "sine";
	osc.frequency.setValueAtTime(1200, now);
	osc.frequency.exponentialRampToValueAtTime(800, now + 0.03);

	const gain = ctx.createGain();
	gain.gain.setValueAtTime(0.03, now);
	gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

	osc.connect(gain);
	gain.connect(ctx.destination);
	osc.start(now);
	osc.stop(now + 0.05);
}

/**
 * Medium sound: satisfying two-note chime for quest completion.
 * Clean, short, rewarding.
 */
export function playMediumSound(): void {
	if (!getSoundsEnabled()) return;

	const ctx = getAudioContext();
	if (!ctx) return;
	const now = ctx.currentTime;

	const playNote = (freq: number, start: number, duration: number, vol: number) => {
		const osc = ctx.createOscillator();
		osc.type = "sine";
		osc.frequency.setValueAtTime(freq, start);

		const gain = ctx.createGain();
		gain.gain.setValueAtTime(0, start);
		gain.gain.linearRampToValueAtTime(vol, start + 0.01);
		gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start(start);
		osc.stop(start + duration);
	};

	playNote(523.25, now, 0.12, 0.08); // C5
	playNote(659.25, now + 0.08, 0.2, 0.06); // E5
}

/**
 * Macro sound: level-up fanfare for phase completion.
 * Short (1–1.5s), ascending arpeggio, triumphant but not cartoonish.
 */
export function playMacroSound(): void {
	if (!getSoundsEnabled()) return;

	const ctx = getAudioContext();
	if (!ctx) return;
	const now = ctx.currentTime;

	// Ascending arpeggio: C5, E5, G5, C6
	const freqs = [523.25, 659.25, 783.99, 1046.5];
	const stepDuration = 0.2;
	const noteDuration = 0.25;

	freqs.forEach((freq, i) => {
		const start = now + i * stepDuration;
		const osc = ctx.createOscillator();
		osc.type = "sine";
		osc.frequency.setValueAtTime(freq, start);

		const gain = ctx.createGain();
		gain.gain.setValueAtTime(0, start);
		gain.gain.linearRampToValueAtTime(0.06, start + 0.02);
		gain.gain.exponentialRampToValueAtTime(0.001, start + noteDuration);

		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start(start);
		osc.stop(start + noteDuration);
	});
}
