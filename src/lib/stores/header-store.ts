import { writable } from 'svelte/store';
import type { Snippet } from 'svelte';

export const headerTitleSnippet = writable<Snippet | null>(null);
export const headerTitleText = writable<string>('');
