import { writable } from 'svelte/store';

/** Set to `true` to open the formation history sheet (e.g. from Aperçu). Site header consumes and resets. */
export const formationHistorySheetOpen = writable(false);

export function openFormationHistorySheet(): void {
	formationHistorySheetOpen.set(true);
}
