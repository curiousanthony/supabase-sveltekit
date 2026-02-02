import { writable } from 'svelte/store';

/** Open state for the Command Palette (Cmd/Ctrl+K). Sidebar "Chercher" triggers open. */
export const commandPaletteOpen = writable<boolean>(false);

export function openCommandPalette() {
	commandPaletteOpen.set(true);
}
